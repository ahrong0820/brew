import { setTimeout as sleep } from "node:timers/promises";
import { assertRecipeManifest } from "./recipe-manifest.mjs";
import { extractDeploymentSha } from "./validate-static-export.mjs";

function normalizedBaseUrl(value) {
  if (!value) throw new Error("A deployed page URL is required");
  const url = new URL(value);
  url.pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  url.search = "";
  url.hash = "";
  return url;
}

async function fetchText(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, max-age=0",
      Pragma: "no-cache",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${url} did not return valid JSON: ${error instanceof Error ? error.message : error}`);
  }
}

function extractAssetUrls(html, pageUrl) {
  const matches = html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/gi);
  return [...new Set([...matches].map((match) => new URL(match[1], pageUrl).href))].sort();
}

async function assertAssets(assetUrls) {
  if (assetUrls.length === 0) throw new Error("No JavaScript or CSS assets were found in deployed HTML");
  await Promise.all(
    assetUrls.map(async (assetUrl) => {
      const response = await fetch(assetUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`${assetUrl} returned HTTP ${response.status}`);
    }),
  );
}

async function verifyRound(baseUrl, expectedSha, attempt) {
  const token = `${expectedSha}-${Date.now()}-${attempt}`;
  const immutableUrl = new URL(`deployments/${expectedSha}.json?verify=${token}`, baseUrl);
  const latestUrl = new URL(`deployment.json?verify=${token}`, baseUrl);
  const manifestUrl = new URL(`recipe-manifest.json?verify=${token}`, baseUrl);
  const pageUrls = [
    new URL(baseUrl),
    new URL(`?verify=${token}`, baseUrl),
    new URL(`index.html?verify=${token}-index`, baseUrl),
  ];

  const [immutable, latest, manifest, ...htmlDocuments] = await Promise.all([
    fetchJson(immutableUrl),
    fetchJson(latestUrl),
    fetchJson(manifestUrl),
    ...pageUrls.map((url) => fetchText(url)),
  ]);

  if (immutable.sha !== expectedSha) {
    throw new Error(`Immutable deployment marker SHA mismatch: ${immutable.sha || "missing"}`);
  }
  if (latest.sha !== expectedSha) {
    throw new Error(`Latest deployment marker SHA mismatch: ${latest.sha || "missing"}`);
  }
  assertRecipeManifest(manifest, expectedSha, manifestUrl.href);

  const assetSets = [];
  for (let index = 0; index < htmlDocuments.length; index += 1) {
    const html = htmlDocuments[index];
    const pageUrl = pageUrls[index];
    const htmlSha = extractDeploymentSha(html);
    if (htmlSha !== expectedSha) {
      throw new Error(`${pageUrl.href} HTML SHA mismatch: expected ${expectedSha}, received ${htmlSha}`);
    }
    assetSets.push(extractAssetUrls(html, pageUrl));
  }

  const firstAssetSet = JSON.stringify(assetSets[0]);
  if (assetSets.some((assets) => JSON.stringify(assets) !== firstAssetSet)) {
    throw new Error("Bare, cache-busted, and index.html responses reference different asset sets");
  }
  await assertAssets(assetSets[0]);

  return { assetCount: assetSets[0].length, latest, immutable };
}

export async function validateLiveDeployment(pageUrl, expectedSha, options = {}) {
  if (!/^[0-9a-f]{40}$/i.test(expectedSha || "")) {
    throw new Error(`Expected a full 40-character commit SHA, received: ${expectedSha || "missing"}`);
  }

  const baseUrl = normalizedBaseUrl(pageUrl);
  const attempts = options.attempts ?? Number(process.env.LIVE_VERIFY_ATTEMPTS || 24);
  const intervalMs = options.intervalMs ?? Number(process.env.LIVE_VERIFY_INTERVAL_MS || 5000);
  const requiredStableRounds = options.requiredStableRounds ?? 2;
  let stableRounds = 0;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await verifyRound(baseUrl, expectedSha, attempt);
      stableRounds += 1;
      console.log(
        `Live deployment verification round ${stableRounds}/${requiredStableRounds} passed with ${result.assetCount} assets`,
      );
      if (stableRounds >= requiredStableRounds) return result;
    } catch (error) {
      stableRounds = 0;
      lastError = error;
      console.warn(
        `Live deployment verification attempt ${attempt}/${attempts} failed: ${error instanceof Error ? error.message : error}`,
      );
    }

    if (attempt < attempts) await sleep(intervalMs);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Deployment ${expectedSha} did not become stable at ${baseUrl.href}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateLiveDeployment(process.argv[2], process.argv[3] || process.env.GITHUB_SHA)
    .then(() => console.log(`Verified stable live deployment ${process.argv[3] || process.env.GITHUB_SHA}`))
    .catch((error) => {
      console.error(error instanceof Error ? error.stack || error.message : error);
      process.exitCode = 1;
    });
}
