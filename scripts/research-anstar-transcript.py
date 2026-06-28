from __future__ import annotations

import copy
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

VIDEO_ID = "uZs78TPm7ws"
WATCH_URL = f"https://www.youtube.com/watch?v={VIDEO_ID}&hl=ko"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "Chrome/126 Safari/537.36"
)
OUTPUT = Path("research")
VARIANTS = OUTPUT / "variants"
OUTPUT.mkdir(exist_ok=True)
VARIANTS.mkdir(exist_ok=True)


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read().decode(errors="ignore")


def find(pattern: str, text: str) -> str:
    match = re.search(pattern, text)
    return match.group(1) if match else ""


def extract_json_after(page: str, marker: str) -> dict[str, object]:
    marker_index = page.find(marker)
    if marker_index < 0:
        return {}
    start = marker_index + len(marker)
    while start < len(page) and page[start].isspace():
        start += 1
    if start >= len(page) or page[start] != "{":
        return {}
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(page)):
        character = page[index]
        if in_string:
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == '"':
                in_string = False
            continue
        if character == '"':
            in_string = True
        elif character == "{":
            depth += 1
        elif character == "}":
            depth -= 1
            if depth == 0:
                return json.loads(page[start : index + 1])
    return {}


def find_transcript_endpoint(value: object) -> dict[str, object] | None:
    if isinstance(value, dict):
        if isinstance(value.get("getTranscriptEndpoint"), dict):
            return value
        for child in value.values():
            found = find_transcript_endpoint(child)
            if found is not None:
                return found
    elif isinstance(value, list):
        for child in value:
            found = find_transcript_endpoint(child)
            if found is not None:
                return found
    return None


def collect_segments(value: object, output: list[dict[str, object]]) -> None:
    if isinstance(value, dict):
        renderer = value.get("transcriptSegmentRenderer")
        if isinstance(renderer, dict):
            runs = renderer.get("snippet", {}).get("runs", [])
            text = "".join(
                run.get("text", "") for run in runs if isinstance(run, dict)
            )
            output.append(
                {
                    "startMs": renderer.get("startMs"),
                    "endMs": renderer.get("endMs"),
                    "text": text,
                }
            )
        for child in value.values():
            collect_segments(child, output)
    elif isinstance(value, list):
        for child in value:
            collect_segments(child, output)


page = fetch_text(WATCH_URL)
(OUTPUT / "watch.html").write_text(page)

api_key = find(r'"INNERTUBE_API_KEY":"([^"]+)"', page)
initial_data = extract_json_after(page, "var ytInitialData = ")
continuation = find_transcript_endpoint(initial_data) or {}
endpoint = continuation.get("getTranscriptEndpoint", {})
params = endpoint.get("params", "") if isinstance(endpoint, dict) else ""
continuation_click = continuation.get("clickTrackingParams", "")
context = extract_json_after(page, '"INNERTUBE_CONTEXT":')
client = context.get("client", {}) if isinstance(context, dict) else {}
client_version = client.get("clientVersion", "") if isinstance(client, dict) else ""
visitor_data = client.get("visitorData", "") if isinstance(client, dict) else ""
global_click = ""
if isinstance(context, dict):
    click = context.get("clickTracking", {})
    if isinstance(click, dict):
        global_click = click.get("clickTrackingParams", "")

metadata: dict[str, object] = {
    "videoId": VIDEO_ID,
    "apiKeyPresent": bool(api_key),
    "exactContextPresent": bool(context),
    "clientVersion": client_version,
    "visitorDataPresent": bool(visitor_data),
    "paramsPresent": bool(params),
    "continuationClickPresent": bool(continuation_click),
    "globalClickPresent": bool(global_click),
    "variants": {},
}

param_variants = {
    "raw": params,
    "decoded": urllib.parse.unquote(params),
    "decodedTwice": urllib.parse.unquote(urllib.parse.unquote(params)),
}
click_variants = {
    "continuation": continuation_click,
    "global": global_click,
    "none": None,
}
headers = {
    "Content-Type": "application/json",
    "User-Agent": str(client.get("userAgent", USER_AGENT)).replace(",gzip(gfe)", ""),
    "Origin": "https://www.youtube.com",
    "X-Origin": "https://www.youtube.com",
    "Referer": WATCH_URL,
    "X-YouTube-Client-Name": "1",
    "X-YouTube-Client-Version": str(client_version),
    "X-Goog-Visitor-Id": str(visitor_data),
    "X-Youtube-Bootstrap-Logged-In": "false",
    "X-Goog-AuthUser": "0",
}

for param_label, param_value in param_variants.items():
    for click_label, click_value in click_variants.items():
        label = f"{param_label}-{click_label}"
        request_context = copy.deepcopy(context)
        if click_value is None:
            request_context.pop("clickTracking", None)
        else:
            request_context["clickTracking"] = {
                "clickTrackingParams": click_value,
            }
        body = {"context": request_context, "params": param_value}
        request = urllib.request.Request(
            f"https://www.youtube.com/youtubei/v1/get_transcript"
            f"?key={api_key}&prettyPrint=false",
            data=json.dumps(body).encode(),
            headers=headers,
            method="POST",
        )
        result: dict[str, object] = {}
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                raw = response.read()
                result["httpStatus"] = response.status
            payload = json.loads(raw)
            (VARIANTS / f"{label}.json").write_text(
                json.dumps(payload, ensure_ascii=False, indent=2)
            )
            segments: list[dict[str, object]] = []
            collect_segments(payload, segments)
            result["segmentCount"] = len(segments)
            if segments:
                (OUTPUT / "transcript.json").write_text(
                    json.dumps(segments, ensure_ascii=False, indent=2)
                )
                (OUTPUT / "transcript.txt").write_text(
                    "\n".join(
                        f"{segment['startMs']}\t{segment['text']}"
                        for segment in segments
                    )
                )
                result["selected"] = True
        except urllib.error.HTTPError as error:
            result["httpStatus"] = error.code
            result["errorBody"] = error.read().decode(errors="ignore")
        except Exception as error:
            result["error"] = repr(error)
        metadata["variants"][label] = result

(OUTPUT / "metadata.json").write_text(
    json.dumps(metadata, ensure_ascii=False, indent=2)
)
