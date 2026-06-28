from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from pathlib import Path

VIDEO_ID = "uZs78TPm7ws"
WATCH_URL = f"https://www.youtube.com/watch?v={VIDEO_ID}&hl=ko"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "Chrome/126 Safari/537.36"
)
OUTPUT = Path("research")
OUTPUT.mkdir(exist_ok=True)


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read().decode(errors="ignore")


def find(pattern: str, text: str) -> str:
    match = re.search(pattern, text)
    return match.group(1) if match else ""


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
client_version = find(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', page)
visitor_data = find(r'"VISITOR_DATA":"([^"]+)"', page)
params = find(r'"getTranscriptEndpoint":\{"params":"([^"]+)"', page)
click_tracking = find(
    r'"clickTrackingParams":"([^"]+)"[^{}]{0,800}'
    r'"getTranscriptEndpoint":\{"params":"' + re.escape(params) + r'"',
    page,
)

metadata = {
    "videoId": VIDEO_ID,
    "apiKeyPresent": bool(api_key),
    "clientVersion": client_version,
    "visitorDataPresent": bool(visitor_data),
    "paramsPresent": bool(params),
    "clickTrackingPresent": bool(click_tracking),
}

body = {
    "context": {
        "client": {
            "clientName": "WEB",
            "clientVersion": client_version,
            "hl": "ko",
            "gl": "KR",
            "visitorData": visitor_data,
            "originalUrl": WATCH_URL,
        },
        "request": {"useSsl": True},
        "clickTracking": {"clickTrackingParams": click_tracking},
    },
    "params": params,
}
headers = {
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
    "Origin": "https://www.youtube.com",
    "Referer": WATCH_URL,
    "X-YouTube-Client-Name": "1",
    "X-YouTube-Client-Version": client_version,
    "X-Goog-Visitor-Id": visitor_data,
}
request = urllib.request.Request(
    f"https://www.youtube.com/youtubei/v1/get_transcript"
    f"?key={api_key}&prettyPrint=false",
    data=json.dumps(body).encode(),
    headers=headers,
    method="POST",
)

try:
    with urllib.request.urlopen(request, timeout=40) as response:
        raw = response.read()
        metadata["httpStatus"] = response.status
    payload = json.loads(raw)
    (OUTPUT / "transcript-response.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2)
    )
    segments: list[dict[str, object]] = []
    collect_segments(payload, segments)
    metadata["segmentCount"] = len(segments)
    (OUTPUT / "transcript.json").write_text(
        json.dumps(segments, ensure_ascii=False, indent=2)
    )
    (OUTPUT / "transcript.txt").write_text(
        "\n".join(
            f"{segment['startMs']}\t{segment['text']}" for segment in segments
        )
    )
except urllib.error.HTTPError as error:
    metadata["httpStatus"] = error.code
    metadata["errorBody"] = error.read().decode(errors="ignore")
except Exception as error:
    metadata["error"] = repr(error)

(OUTPUT / "metadata.json").write_text(
    json.dumps(metadata, ensure_ascii=False, indent=2)
)
