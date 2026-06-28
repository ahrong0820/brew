from __future__ import annotations

import http.cookiejar
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
OUTPUT = Path("research/comments")
OUTPUT.mkdir(parents=True, exist_ok=True)

cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))


def open_json(request: urllib.request.Request) -> dict[str, object]:
    with opener.open(request, timeout=50) as response:
        return json.loads(response.read())


def fetch_page() -> str:
    request = urllib.request.Request(WATCH_URL, headers={"User-Agent": USER_AGENT})
    with opener.open(request, timeout=50) as response:
        return response.read().decode(errors="ignore")


def find(pattern: str, text: str, default: str = "") -> str:
    match = re.search(pattern, text)
    return match.group(1) if match else default


def extract_json_after(page: str, marker: str) -> dict[str, object]:
    marker_index = page.find(marker)
    if marker_index < 0:
        return {}
    start = marker_index + len(marker)
    while start < len(page) and page[start].isspace():
        start += 1
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


def find_comment_token(value: object) -> str:
    if isinstance(value, dict):
        command = value.get("continuationCommand")
        if isinstance(command, dict):
            token = command.get("token")
            if isinstance(token, str) and "comments" in json.dumps(value):
                return token
        for child in value.values():
            token = find_comment_token(child)
            if token:
                return token
    elif isinstance(value, list):
        for child in value:
            token = find_comment_token(child)
            if token:
                return token
    return ""


def collect_comment_texts(value: object, output: list[str]) -> None:
    if isinstance(value, dict):
        for key in ("contentText", "content"):
            content = value.get(key)
            if isinstance(content, dict):
                runs = content.get("runs", [])
                text = "".join(
                    run.get("text", "") for run in runs if isinstance(run, dict)
                ).strip()
                if text and text not in output:
                    output.append(text)
            elif isinstance(content, str) and content not in output:
                output.append(content)
        for child in value.values():
            collect_comment_texts(child, output)
    elif isinstance(value, list):
        for child in value:
            collect_comment_texts(child, output)


page = fetch_page()
api_key = find(r'"INNERTUBE_API_KEY":"([^"]+)"', page)
context = extract_json_after(page, '"INNERTUBE_CONTEXT":')
initial_data = extract_json_after(page, "var ytInitialData = ")
token = find_comment_token(initial_data)
client = context.get("client", {}) if isinstance(context, dict) else {}
headers = {
    "Content-Type": "application/json",
    "User-Agent": str(client.get("userAgent", USER_AGENT)).replace(",gzip(gfe)", ""),
    "Origin": "https://www.youtube.com",
    "Referer": WATCH_URL,
    "X-YouTube-Client-Name": "1",
    "X-YouTube-Client-Version": str(client.get("clientVersion", "")),
    "X-Goog-Visitor-Id": str(client.get("visitorData", "")),
}

summary: dict[str, object] = {
    "videoId": VIDEO_ID,
    "tokenPresent": bool(token),
    "pages": [],
}
all_texts: list[str] = []

for page_number in range(3):
    if not token:
        break
    request = urllib.request.Request(
        f"https://www.youtube.com/youtubei/v1/next"
        f"?key={api_key}&prettyPrint=false",
        data=json.dumps({"context": context, "continuation": token}).encode(),
        headers=headers,
        method="POST",
    )
    page_result: dict[str, object] = {"page": page_number + 1}
    try:
        payload = open_json(request)
        (OUTPUT / f"page-{page_number + 1}.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2)
        )
        before = len(all_texts)
        collect_comment_texts(payload, all_texts)
        page_result["newTexts"] = len(all_texts) - before
        token = find_comment_token(payload)
        page_result["nextTokenPresent"] = bool(token)
    except urllib.error.HTTPError as error:
        page_result["httpStatus"] = error.code
        page_result["errorBody"] = error.read().decode(errors="ignore")
        token = ""
    except Exception as error:
        page_result["error"] = repr(error)
        token = ""
    summary["pages"].append(page_result)

keywords = (
    "레시피",
    "그램",
    "g",
    "온도",
    "도씨",
    "분쇄",
    "푸어",
    "뜸",
    "2인분",
    "4인분",
)
relevant = [text for text in all_texts if any(keyword in text for keyword in keywords)]
(OUTPUT / "all-comments.txt").write_text("\n\n---\n\n".join(all_texts))
(OUTPUT / "relevant-comments.txt").write_text("\n\n---\n\n".join(relevant))
summary["allTextCount"] = len(all_texts)
summary["relevantTextCount"] = len(relevant)
(OUTPUT / "summary.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2)
)
