import { readFile } from "node:fs/promises";

export const requiredRecipeTexts = [
  "안스타 6888",
  "정인성 국룰 Ver 2.0 HOT",
  "정인성 484 15g (2026)",
  "정인성 클레버 1:11",
  "테츠 카스야 THE NEO BREW 2026",
];

export const removedRecipeTexts = [
  "시그니쳐 로스터스 콘 필터",
  "딥블루레이크 V60 HOT",
  "정인성 4666 오리지널",
  "정인성 클레버 1:12",
];

function assertRecipeContent(content, sourceLabel) {
  const missing = requiredRecipeTexts.filter((text) => !content.includes(text));
  const stale = removedRecipeTexts.filter((text) => content.includes(text));

  if (missing.length > 0 || stale.length > 0) {
    const parts = [];
    if (missing.length > 0) {
      parts.push(`missing required recipe text: ${missing.join(", ")}`);
    }
    if (stale.length > 0) {
      parts.push(`stale removed recipe text still present: ${stale.join(", ")}`);
    }
    throw new Error(`Recipe content smoke check failed for ${sourceLabel}: ${parts.join("; ")}`);
  }
}

async function fetchWithRetries(url, attempts = 12) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function validateRecipeContent(target) {
  if (!target) {
    throw new Error("Recipe content target is required");
  }

  const content = /^https?:\/\//i.test(target)
    ? await fetchWithRetries(target)
    : await readFile(target, "utf8");

  assertRecipeContent(content, target);
  return {
    target,
    required: requiredRecipeTexts.length,
    removed: removedRecipeTexts.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateRecipeContent(process.argv[2])
    .then(({ target, required, removed }) => {
      console.log(
        `Validated recipe content for ${target}: ${required} required present, ${removed} stale absent`,
      );
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
