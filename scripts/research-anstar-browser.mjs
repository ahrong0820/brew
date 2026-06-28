import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const videoId = "uZs78TPm7ws";
const outputDir = "research/browser";
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: "ko-KR" });
const page = await context.newPage();
const captured = [];

page.on("response", async (response) => {
  if (!response.url().includes("/youtubei/v1/get_transcript")) return;
  try {
    captured.push({
      url: response.url(),
      status: response.status(),
      body: await response.text(),
    });
  } catch (error) {
    captured.push({ url: response.url(), error: String(error) });
  }
});

await page.goto(`https://www.youtube.com/watch?v=${videoId}&hl=ko`, {
  waitUntil: "domcontentloaded",
  timeout: 90_000,
});
await page.waitForTimeout(4_000);
await page.screenshot({ path: `${outputDir}/watch.png`, fullPage: false });

const direct = await page.evaluate(async () => {
  function findEndpoint(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
      for (const child of value) {
        const found = findEndpoint(child);
        if (found) return found;
      }
      return null;
    }
    if (typeof value === "object") {
      if (value.getTranscriptEndpoint) return value;
      for (const child of Object.values(value)) {
        const found = findEndpoint(child);
        if (found) return found;
      }
    }
    return null;
  }

  const endpoint = findEndpoint(globalThis.ytInitialData);
  const config = globalThis.ytcfg;
  if (!endpoint || !config) {
    return { error: "missing ytInitialData or ytcfg" };
  }
  const clientName = String(config.get("INNERTUBE_CONTEXT_CLIENT_NAME") ?? 1);
  const clientVersion = String(config.get("INNERTUBE_CONTEXT_CLIENT_VERSION") ?? "");
  const apiKey = String(config.get("INNERTUBE_API_KEY") ?? "");
  const requestContext = structuredClone(config.get("INNERTUBE_CONTEXT"));
  requestContext.clickTracking = {
    clickTrackingParams: endpoint.clickTrackingParams,
  };
  const response = await fetch(
    `/youtubei/v1/get_transcript?key=${apiKey}&prettyPrint=false`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        "x-youtube-client-name": clientName,
        "x-youtube-client-version": clientVersion,
      },
      body: JSON.stringify({
        context: requestContext,
        params: endpoint.getTranscriptEndpoint.params,
      }),
    },
  );
  return {
    status: response.status,
    text: await response.text(),
    endpoint,
  };
});

await writeFile(`${outputDir}/direct.json`, JSON.stringify(direct, null, 2));

try {
  const transcriptText = page.getByText("스크립트", { exact: true }).last();
  if (await transcriptText.count()) {
    await transcriptText.click({ force: true });
    await page.waitForTimeout(5_000);
  }
} catch (error) {
  await writeFile(`${outputDir}/click-error.txt`, String(error));
}

await writeFile(`${outputDir}/captured.json`, JSON.stringify(captured, null, 2));
await page.screenshot({ path: `${outputDir}/after.png`, fullPage: true });
await browser.close();
