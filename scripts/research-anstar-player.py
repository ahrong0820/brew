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
OUTPUT = Path("research/player")
OUTPUT.mkdir(parents=True, exist_ok=True)

cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))


def open_bytes(request: urllib.request.Request) -> bytes:
    with opener.open(request, timeout=60) as response:
        return response.read()


def fetch_page() -> str:
    request = urllib.request.Request(WATCH_URL, headers={"User-Agent": USER_AGENT})
    return open_bytes(request).decode(errors="ignore")


def find(pattern: str, text: str, default: str = "") -> str:
    match = re.search(pattern, text)
    return match.group(1) if match else default


page = fetch_page()
api_key = find(r'"INNERTUBE_API_KEY":"([^"]+)"', page)
visitor_data = find(r'"VISITOR_DATA":"([^"]+)"', page)
web_version = find(
    r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"',
    page,
    "2.20260626.01.00",
)

clients = {
    "web": {
        "clientName": "WEB",
        "clientVersion": web_version,
        "hl": "ko",
        "gl": "KR",
        "visitorData": visitor_data,
    },
    "web-embedded": {
        "clientName": "WEB_EMBEDDED_PLAYER",
        "clientVersion": web_version,
        "hl": "ko",
        "gl": "KR",
        "clientScreen": "EMBED",
    },
    "android": {
        "clientName": "ANDROID",
        "clientVersion": "20.10.38",
        "androidSdkVersion": 30,
        "hl": "ko",
        "gl": "KR",
        "userAgent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
    },
    "android-testsuite": {
        "clientName": "ANDROID_TESTSUITE",
        "clientVersion": "1.9",
        "androidSdkVersion": 30,
        "hl": "ko",
        "gl": "KR",
    },
    "android-vr": {
        "clientName": "ANDROID_VR",
        "clientVersion": "1.60.19",
        "androidSdkVersion": 30,
        "hl": "ko",
        "gl": "KR",
    },
    "ios": {
        "clientName": "IOS",
        "clientVersion": "20.10.4",
        "deviceMake": "Apple",
        "deviceModel": "iPhone16,2",
        "osName": "iPhone",
        "osVersion": "18.1.0.22B83",
        "hl": "ko",
        "gl": "KR",
    },
    "tv": {
        "clientName": "TVHTML5",
        "clientVersion": "7.20250130.18.00",
        "hl": "ko",
        "gl": "KR",
    },
    "tv-embedded": {
        "clientName": "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
        "clientVersion": "2.0",
        "hl": "ko",
        "gl": "KR",
    },
}

summary: dict[str, object] = {"videoId": VIDEO_ID, "clients": {}}
media_downloaded = False

for label, client in clients.items():
    body: dict[str, object] = {
        "context": {"client": client},
        "videoId": VIDEO_ID,
        "contentCheckOk": True,
        "racyCheckOk": True,
    }
    if label in {"web-embedded", "tv-embedded"}:
        body["context"]["thirdParty"] = {
            "embedUrl": f"https://www.youtube.com/embed/{VIDEO_ID}"
        }
    headers = {
        "Content-Type": "application/json",
        "User-Agent": str(client.get("userAgent", USER_AGENT)),
        "Origin": "https://www.youtube.com",
        "Referer": WATCH_URL,
        "X-YouTube-Client-Version": str(client.get("clientVersion", "")),
    }
    if visitor_data:
        headers["X-Goog-Visitor-Id"] = visitor_data
    request = urllib.request.Request(
        f"https://www.youtube.com/youtubei/v1/player"
        f"?key={api_key}&prettyPrint=false",
        data=json.dumps(body).encode(),
        headers=headers,
        method="POST",
    )
    result: dict[str, object] = {}
    try:
        payload = json.loads(open_bytes(request))
        (OUTPUT / f"{label}.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2)
        )
        status = payload.get("playabilityStatus", {})
        details = payload.get("videoDetails", {})
        tracks = (
            payload.get("captions", {})
            .get("playerCaptionsTracklistRenderer", {})
            .get("captionTracks", [])
        )
        streaming = payload.get("streamingData", {})
        formats = list(streaming.get("formats", []))
        adaptive = list(streaming.get("adaptiveFormats", []))
        storyboards = payload.get("storyboards", {})
        result.update(
            {
                "playability": status.get("status"),
                "reason": status.get("reason"),
                "title": details.get("title"),
                "author": details.get("author"),
                "lengthSeconds": details.get("lengthSeconds"),
                "captionTracks": len(tracks),
                "formats": len(formats),
                "adaptiveFormats": len(adaptive),
                "storyboards": bool(storyboards),
            }
        )
        for index, track in enumerate(tracks):
            url = track.get("baseUrl")
            if not url:
                continue
            try:
                caption_request = urllib.request.Request(
                    url + "&fmt=json3",
                    headers={"User-Agent": USER_AGENT, "Referer": WATCH_URL},
                )
                raw = open_bytes(caption_request)
                (OUTPUT / f"{label}-caption-{index}.json").write_bytes(raw)
                result[f"captionBytes{index}"] = len(raw)
            except Exception as error:
                result[f"captionError{index}"] = repr(error)
        if not media_downloaded:
            candidates = [
                item
                for item in formats + adaptive
                if item.get("url")
                and str(item.get("mimeType", "")).startswith("video/")
            ]
            candidates.sort(
                key=lambda item: (
                    int(item.get("height") or 10000),
                    int(item.get("bitrate") or 1000000000),
                )
            )
            if candidates:
                selected = candidates[0]
                media_request = urllib.request.Request(
                    selected["url"],
                    headers={"User-Agent": USER_AGENT},
                )
                media = open_bytes(media_request)
                (OUTPUT / "video.mp4").write_bytes(media)
                (OUTPUT / "video-source.json").write_text(
                    json.dumps(selected, ensure_ascii=False, indent=2)
                )
                result["downloadedMediaBytes"] = len(media)
                media_downloaded = True
    except urllib.error.HTTPError as error:
        result["httpStatus"] = error.code
        result["errorBody"] = error.read().decode(errors="ignore")
    except Exception as error:
        result["error"] = repr(error)
    summary["clients"][label] = result

(OUTPUT / "summary.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2)
)
