import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function assertFile(filePath) {
  const fileStat = await stat(filePath).catch(() => null);

  if (!fileStat?.isFile()) {
    throw new Error(`Required file is missing: ${filePath}`);
  }
}

async function assertDirectory(directoryPath) {
  const directoryStat = await stat(directoryPath).catch(() => null);

  if (!directoryStat?.isDirectory()) {
    throw new Error(`Required directory is missing: ${directoryPath}`);
  }
}

function parseDeploymentMetadata(rawMetadata, filePath) {
  try {
    return JSON.parse(rawMetadata);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid deployment metadata in ${filePath}: ${message}`);
  }
}

export function extractDeploymentSha(html) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const deploymentTag = metaTags.find((tag) =>
    /\bname\s*=\s*(["'])deployment-sha\1/i.test(tag),
  );

  if (!deploymentTag) {
    throw new Error('Missing <meta name="deployment-sha"> in out/index.html');
  }

  const contentMatch = deploymentTag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i);

  if (!contentMatch?.[2]) {
    throw new Error('The deployment-sha meta tag has no content value');
  }

  return contentMatch[2];
}

export async function validateStaticExport(outputDirectory, expectedSha) {
  const normalizedSha = expectedSha?.trim();

  if (!normalizedSha) {
    throw new Error("Expected deployment SHA is required");
  }

  if (!/^[0-9a-f]{40}$/i.test(normalizedSha)) {
    throw new Error(`Expected a full 40-character commit SHA, received: ${normalizedSha}`);
  }

  const outputRoot = path.resolve(outputDirectory || "out");
  const indexPath = path.join(outputRoot, "index.html");
  const nextDirectory = path.join(outputRoot, "_next");
  const latestMarkerPath = path.join(outputRoot, "deployment.json");
  const immutableMarkerPath = path.join(
    outputRoot,
    "deployments",
    `${normalizedSha}.json`,
  );

  await Promise.all([
    assertFile(indexPath),
    assertDirectory(nextDirectory),
    assertFile(latestMarkerPath),
    assertFile(immutableMarkerPath),
  ]);

  const [html, latestRaw, immutableRaw] = await Promise.all([
    readFile(indexPath, "utf8"),
    readFile(latestMarkerPath, "utf8"),
    readFile(immutableMarkerPath, "utf8"),
  ]);

  if (latestRaw !== immutableRaw) {
    throw new Error("deployment.json and the immutable deployment marker differ");
  }

  const latestMetadata = parseDeploymentMetadata(latestRaw, latestMarkerPath);
  const immutableMetadata = parseDeploymentMetadata(
    immutableRaw,
    immutableMarkerPath,
  );

  if (latestMetadata.sha !== normalizedSha) {
    throw new Error(
      `deployment.json SHA mismatch: expected ${normalizedSha}, received ${latestMetadata.sha ?? "missing"}`,
    );
  }

  if (immutableMetadata.sha !== normalizedSha) {
    throw new Error(
      `Immutable deployment marker SHA mismatch: expected ${normalizedSha}, received ${immutableMetadata.sha ?? "missing"}`,
    );
  }

  const htmlSha = extractDeploymentSha(html);

  if (htmlSha !== normalizedSha) {
    throw new Error(
      `HTML deployment SHA mismatch: expected ${normalizedSha}, received ${htmlSha}`,
    );
  }

  return {
    outputDirectory: outputRoot,
    sha: normalizedSha,
  };
}

function isDirectExecution() {
  if (!process.argv[1]) {
    return false;
  }

  return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isDirectExecution()) {
  const [outputDirectory = "out", expectedSha = process.env.GITHUB_SHA] =
    process.argv.slice(2);

  validateStaticExport(outputDirectory, expectedSha)
    .then(({ outputDirectory: validatedDirectory, sha }) => {
      console.log(`Validated static export ${validatedDirectory} for ${sha}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
