import {
  defaultRecipeCatalogEntries,
  defaultRecipeCatalogVersion,
  removedDefaultRecipeIds,
  removedDefaultRecipeNames,
} from "../lib/recipes/defaultRecipeCatalog.ts";

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

export function buildRecipeManifest({ deploymentSha, generatedAt = new Date().toISOString() }) {
  if (!/^[0-9a-f]{40}$/i.test(deploymentSha || "")) {
    throw new Error(`A full deployment SHA is required, received: ${deploymentSha || "missing"}`);
  }

  return {
    schemaVersion: 1,
    catalogVersion: defaultRecipeCatalogVersion,
    deploymentSha,
    generatedAt,
    recipeCount: defaultRecipeCatalogEntries.length,
    recipeIds: defaultRecipeCatalogEntries.map((entry) => entry.id),
    recipes: defaultRecipeCatalogEntries.map((entry) => ({ ...entry })),
    removedRecipeIds: [...removedDefaultRecipeIds],
    removedRecipeNames: [...removedDefaultRecipeNames],
  };
}

export function assertRecipeManifest(value, expectedSha, sourceLabel = "recipe manifest") {
  if (!isRecord(value)) {
    throw new Error(`${sourceLabel} is not a JSON object`);
  }

  const expected = buildRecipeManifest({
    deploymentSha: expectedSha,
    generatedAt: typeof value.generatedAt === "string" ? value.generatedAt : "",
  });
  const fields = [
    "schemaVersion",
    "catalogVersion",
    "deploymentSha",
    "recipeCount",
    "recipeIds",
    "recipes",
    "removedRecipeIds",
    "removedRecipeNames",
  ];

  for (const field of fields) {
    if (JSON.stringify(value[field]) !== JSON.stringify(expected[field])) {
      throw new Error(
        `${sourceLabel} field ${field} mismatch: expected ${JSON.stringify(expected[field])}, received ${JSON.stringify(value[field])}`,
      );
    }
  }

  if (typeof value.generatedAt !== "string" || Number.isNaN(Date.parse(value.generatedAt))) {
    throw new Error(`${sourceLabel} generatedAt is missing or invalid`);
  }

  return value;
}
