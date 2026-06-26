import { readFile, writeFile } from "node:fs/promises";

async function patch(path, replacements) {
  let source = await readFile(path, "utf8");

  for (const [label, search, replacement] of replacements) {
    const count = source.split(search).length - 1;
    if (count !== 1) {
      throw new Error(`${path} ${label}: expected one match, found ${count}`);
    }
    source = source.replace(search, replacement);
  }

  await writeFile(path, source);
}

await writeFile(
  "lib/recommendation/recommendationTrace.ts",
  Buffer.from("aW1wb3J0IHR5cGUgeyBCcmV3UmVjb21tZW5kYXRpb24gfSBmcm9tICJAL2xpYi90eXBlcy9yZWNvbW1lbmRhdGlvbiI7CmltcG9ydCB0eXBlIHsgUmVjb21tZW5kYXRpb25UcmFjZVNuYXBzaG90IH0gZnJvbSAiQC9saWIvdHlwZXMvcmVjb21tZW5kYXRpb25UcmFjZSI7CgpleHBvcnQgZnVuY3Rpb24gYnVpbGRSZWNvbW1lbmRhdGlvblRyYWNlKAogIHJlY29tbWVuZGF0aW9uOiBCcmV3UmVjb21tZW5kYXRpb24sCiAgZ2VuZXJhdGVkQXQ6IHN0cmluZywKICBlbmdpbmVWZXJzaW9uOiBzdHJpbmcsCiAgcnVsZVJlZ2lzdHJ5VmVyc2lvbjogc3RyaW5nLAogIGV2aWRlbmNlUmVnaXN0cnlWZXJzaW9uOiBzdHJpbmcsCik6IFJlY29tbWVuZGF0aW9uVHJhY2VTbmFwc2hvdCB7CiAgcmV0dXJuIHsKICAgIGVuZ2luZVZlcnNpb24sCiAgICBydWxlUmVnaXN0cnlWZXJzaW9uLAogICAgZXZpZGVuY2VSZWdpc3RyeVZlcnNpb24sCiAgICBnZW5lcmF0ZWRBdCwKICAgIGFwcGxpZWRSdWxlczogKHJlY29tbWVuZGF0aW9uLmFwcGxpZWRSdWxlcyA/PyBbXSkubWFwKChydWxlKSA9PiAoewogICAgICBydWxlSWQ6IHJ1bGUuaWQsCiAgICAgIHJ1bGVWZXJzaW9uOiBydWxlLnZlcnNpb24sCiAgICAgIHBhcmFtZXRlcjogcnVsZS5wYXJhbWV0ZXIsCiAgICAgIGV2aWRlbmNlUmVmczogcnVsZS5ldmlkZW5jZS5tYXAoKGV2aWRlbmNlKSA9PiAoewogICAgICAgIHNvdXJjZUlkOiBldmlkZW5jZS5zb3VyY2VJZCwKICAgICAgICBvYnNlcnZhdGlvbklkOiBldmlkZW5jZS5vYnNlcnZhdGlvbklkLAogICAgICAgIHJvbGU6IGV2aWRlbmNlLnJvbGUsCiAgICAgICAgYXBwbGljYWJpbGl0eTogZXZpZGVuY2UuYXBwbGljYWJpbGl0eSwKICAgICAgfSkpLAogICAgfSkpLAogIH07Cn0K", "base64"),
);
await writeFile(
  "test/recommendation-trace.test.mjs",
  Buffer.from("aW1wb3J0IGFzc2VydCBmcm9tICJub2RlOmFzc2VydC9zdHJpY3QiOwppbXBvcnQgdGVzdCBmcm9tICJub2RlOnRlc3QiOwoKaW1wb3J0IHsgYnVpbGRSZWNvbW1lbmRhdGlvblRyYWNlIH0gZnJvbSAiLi4vbGliL3JlY29tbWVuZGF0aW9uL3JlY29tbWVuZGF0aW9uVHJhY2UudHMiOwppbXBvcnQgeyBpc0NvbXBhdGlibGVCcmV3U2Vzc2lvbiB9IGZyb20gIi4uL2xpYi9zdG9yYWdlL2JyZXdTZXNzaW9uR3VhcmQudHMiOwoKY29uc3QgcmVjb21tZW5kYXRpb24gPSB7CiAgdGVtcGxhdGVOYW1lOiAidGVzdCIsCiAgZG9zZUdyYW1zOiAxNSwKICB3YXRlckdyYW1zOiAyNDAsCiAgcmF0aW86IDE2LAogIHRlbXBlcmF0dXJlQ2Vsc2l1czogOTIsCiAgdGFyZ2V0VGltZU1pblNlY29uZHM6IDE1MCwKICB0YXJnZXRUaW1lTWF4U2Vjb25kczogMTk1LAogIGdyaW5kZXI6IHsKICAgIGRpc3BsYXlWYWx1ZTogIjcuMCIsCiAgICBkaXNwbGF5UmFuZ2U6ICI2Ljh+Ny4yIiwKICAgIGNvbW1vbkRlc2NyaXB0aW9uOiAibWVkaXVtIiwKICAgIGNhbGlicmF0aW9uTGFiZWw6ICJ6ZXJvIiwKICAgIGlzTnVtZXJpYzogdHJ1ZSwKICAgIG5vdGU6ICJ0ZXN0IiwKICB9LAogIHN0ZXBzOiBbXSwKICByZWFzb25zOiBbXSwKICBjb25maWRlbmNlOiAibWVkaXVtIiwKICBjb25maWRlbmNlUmVhc29uOiAidGVzdCIsCiAgYXBwbGllZFJ1bGVzOiBbCiAgICB7CiAgICAgIGlkOiAicmF0aW8udGFzdGUtZ29hbC52MSIsCiAgICAgIHZlcnNpb246IDEsCiAgICAgIHBhcmFtZXRlcjogInJhdGlvIiwKICAgICAgZGVzY3JpcHRpb246ICJyYXRpbyIsCiAgICAgIGV2aWRlbmNlOiBbCiAgICAgICAgewogICAgICAgICAga2luZDogImhldXJpc3RpYyIsCiAgICAgICAgICBzb3VyY2VJZDogImludGVybmFsOmluaXRpYWwtcnVsZS1zZXQ6djEiLAogICAgICAgICAgb2JzZXJ2YXRpb25JZDogIm9iczppbnRlcm5hbDppbml0aWFsLXJ1bGUtc2V0OmJhc2VsaW5lLXYxIiwKICAgICAgICAgIHJvbGU6ICJjb250ZXh0IiwKICAgICAgICAgIGFwcGxpY2FiaWxpdHk6ICJkaXJlY3QiLAogICAgICAgIH0sCiAgICAgIF0sCiAgICB9LAogIF0sCn07Cgp0ZXN0KCJ0cmFjZSBzbmFwc2hvdCBwcmVzZXJ2ZXMgcnVsZSB2ZXJzaW9ucyBhbmQgZXZpZGVuY2UgcmVmZXJlbmNlcyIsICgpID0+IHsKICBjb25zdCB0cmFjZSA9IGJ1aWxkUmVjb21tZW5kYXRpb25UcmFjZSgKICAgIHJlY29tbWVuZGF0aW9uLAogICAgIjIwMjYtMDYtMjZUMDA6MDA6MDBaIiwKICAgICIxLjAuMCIsCiAgICAiMS4wLjAiLAogICAgIjEuMC4wIiwKICApOwoKICBhc3NlcnQuZXF1YWwodHJhY2UuYXBwbGllZFJ1bGVzLmxlbmd0aCwgMSk7CiAgYXNzZXJ0LmVxdWFsKHRyYWNlLmFwcGxpZWRSdWxlc1swXS5ydWxlSWQsICJyYXRpby50YXN0ZS1nb2FsLnYxIik7CiAgYXNzZXJ0LmVxdWFsKHRyYWNlLmFwcGxpZWRSdWxlc1swXS5ydWxlVmVyc2lvbiwgMSk7CiAgYXNzZXJ0LmVxdWFsKAogICAgdHJhY2UuYXBwbGllZFJ1bGVzWzBdLmV2aWRlbmNlUmVmc1swXS5vYnNlcnZhdGlvbklkLAogICAgIm9iczppbnRlcm5hbDppbml0aWFsLXJ1bGUtc2V0OmJhc2VsaW5lLXYxIiwKICApOwp9KTsKCmZ1bmN0aW9uIHNlc3Npb25XaXRoVHJhY2UocmVjb21tZW5kYXRpb25UcmFjZSkgewogIHJldHVybiB7CiAgICBpZDogInNlc3Npb24tMSIsCiAgICBiZWFuSWQ6ICJiZWFuLTEiLAogICAgcHJvZmlsZUlkOiAicHJvZmlsZS0xIiwKICAgIGRyaW5rU3R5bGU6ICJob3QiLAogICAgdGFzdGVHb2FsOiAiYmFsYW5jZWQiLAogICAgcmVjb21tZW5kYXRpb25Db25maWRlbmNlOiAibWVkaXVtIiwKICAgIHJlY2lwZVNuYXBzaG90OiB7CiAgICAgIHNvdXJjZVRlbXBsYXRlSWQ6ICJyZWNvbW1lbmRhdGlvbi1ob3QtdjYwLWJhbGFuY2VkIiwKICAgICAgc291cmNlVGVtcGxhdGVOYW1lOiAidGVzdCIsCiAgICAgIGJyZXdlclR5cGU6ICJ2NjAiLAogICAgICBkcmluawpTdHlsZTogImhvdCIsCiAgICAgIGRvc2VHcmFtczogMTUsCiAgICAgIHdhdGVyR3JhbXM6IDI0MCwKICAgICAgcmF0aW86IDE2LAogICAgICB0ZW1wZXJhdHVyZUNlbHNpdXM6IDkyLAogICAgICBncmluZExldmVsOiA3LAogICAgICBncmluZGVyRGlzcGxheVZhbHVlOiAiNy4wIiwKICAgICAgdG90YWxUaW1lU2Vjb25kczogMTk1LAogICAgICB0YXJnZXRUaW1lTWluU2Vjb25kczogMTUwLAogICAgICB0YXJnZXRUaW1lTWF4U2Vjb25kczogMTk1LAogICAgICByZWNvbW1lbmRhdGlvblRyYWNlLAogICAgICBzdGVwczogW10sCiAgICB9LAogICAgc3RhdHVzOiAidHJpYWwiLAogICAgY3JlYXRlZEF0OiAiMjAyNi0wNi0yNlQwMDowMDowMFoiLAogICAgdXBkYXRlZEF0OiAiMjAyNi0wNi0yNlQwMDowMDowMFoiLAogIH07Cn0KCnRlc3QoImxlZ2FjeSBzZXNzaW9ucyB3aXRob3V0IHRyYWNlIHJlbWFpbiBjb21wYXRpYmxlIiwgKCkgPT4gewogIGNvbnN0IHNlc3Npb24gPSBzZXNzaW9uV2l0aFRyYWNlKHVuZGVmaW5lZCk7CiAgYXNzZXJ0LmVxdWFsKGlzQ29tcGF0aWJsZUJyZXdTZXNzaW9uKHNlc3Npb24pLCB0cnVlKTsKfSk7Cgp0ZXN0KCJpbnZhbGlkIHRyYWNlIGlzIHJlbW92ZWQgd2l0aG91dCBkaXNjYXJkaW5nIHRoZSBzZXNzaW9uIiwgKCkgPT4gewogIGNvbnN0IHNlc3Npb24gPSBzZXNzaW9uV2l0aFRyYWNlKHsgYXBwbGllZFJ1bGVzOiAiaW52YWxpZCIgfSk7CiAgYXNzZXJ0LmVxdWFsKGlzQ29tcGF0aWJsZUJyZXdTZXNzaW9uKHNlc3Npb24pLCB0cnVlKTsKICBhc3NlcnQuZXF1YWwoc2Vzc2lvbi5yZWNpcGVTbmFwc2hvdC5yZWNvbW1lbmRhdGlvblRyYWNlLCB1bmRlZmluZWQpOwp9KTsK", "base64"),
);

await patch("lib/recommendation/brewLaunch.ts", [
  [
    "trace imports",
    `import { estimateMicronsForSetting } from "@/lib/grinder/micronReference";
import {
  beanBrewProfileStore,`,
    `import { evidenceRegistryVersion } from "@/lib/evidence/registry";
import { estimateMicronsForSetting } from "@/lib/grinder/micronReference";
import { buildRecommendationTrace } from "@/lib/recommendation/recommendationTrace";
import { recommendationRuleRegistryVersion } from "@/lib/recommendation/ruleRegistry";
import { recommendationEngineVersion } from "@/lib/recommendation/version";
import {
  beanBrewProfileStore,`,
  ],
  [
    "snapshot timestamp",
    `function buildSnapshot(
  input: PrepareRecommendationBrewInput,
  totalTime: number,
  timerSteps: TimerBrewStep[],
): RecipeSnapshot {`,
    `function buildSnapshot(
  input: PrepareRecommendationBrewInput,
  totalTime: number,
  timerSteps: TimerBrewStep[],
  timestamp: string,
): RecipeSnapshot {`,
  ],
  [
    "snapshot trace",
    `    targetTimeMaxSeconds: input.recommendation.targetTimeMaxSeconds,
    steps: timerSteps.map((step) => ({`,
    `    targetTimeMaxSeconds: input.recommendation.targetTimeMaxSeconds,
    recommendationTrace: buildRecommendationTrace(
      input.recommendation,
      timestamp,
      recommendationEngineVersion,
      recommendationRuleRegistryVersion,
      evidenceRegistryVersion,
    ),
    steps: timerSteps.map((step) => ({`,
  ],
  [
    "snapshot call",
    `  const snapshot = buildSnapshot(input, totalTime, steps);`,
    `  const snapshot = buildSnapshot(input, totalTime, steps, timestamp);`,
  ],
]);

const strictTraceValidators = `const recommendationTraceParameters = [
  "dose",
  "water",
  "ratio",
  "temperature",
  "grind",
  "time",
  "pour",
  "confidence",
  "personalization",
] as const;

const recommendationTraceRoles = [
  "supports",
  "limits",
  "contradicts",
  "context",
  "calibrates",
] as const;

const recommendationTraceApplicabilities = [
  "direct",
  "partial",
  "extrapolated",
] as const;

function isRecommendationTraceEvidenceRef(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.sourceId) &&
    (value.observationId === undefined || isString(value.observationId)) &&
    (value.role === undefined || isOneOf(value.role, recommendationTraceRoles)) &&
    (value.applicability === undefined ||
      isOneOf(value.applicability, recommendationTraceApplicabilities))
  );
}

function isAppliedRuleTrace(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.ruleId) &&
    (value.ruleVersion === undefined ||
      (isFiniteNumber(value.ruleVersion) &&
        Number.isInteger(value.ruleVersion) &&
        value.ruleVersion >= 1)) &&
    isOneOf(value.parameter, recommendationTraceParameters) &&
    Array.isArray(value.evidenceRefs) &&
    value.evidenceRefs.every(isRecommendationTraceEvidenceRef)
  );
}

function isRecommendationTrace(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.engineVersion) &&
    isString(value.ruleRegistryVersion) &&
    isString(value.evidenceRegistryVersion) &&
    isString(value.generatedAt) &&
    Array.isArray(value.appliedRules) &&
    value.appliedRules.every(isAppliedRuleTrace)
  );
}

`;

await patch("lib/storage/guards.ts", [
  [
    "trace validators",
    `function isRecipeStepSnapshot(value: unknown) {`,
    `${strictTraceValidators}function isRecipeStepSnapshot(value: unknown) {`,
  ],
  [
    "trace condition",
    `    isFiniteNumber(value.targetTimeMaxSeconds) &&
    Array.isArray(value.steps) &&`,
    `    isFiniteNumber(value.targetTimeMaxSeconds) &&
    (value.recommendationTrace === undefined ||
      isRecommendationTrace(value.recommendationTrace)) &&
    Array.isArray(value.steps) &&`,
  ],
]);

const compatibleTraceValidators = `const recommendationTraceParameters = [
  "dose",
  "water",
  "ratio",
  "temperature",
  "grind",
  "time",
  "pour",
  "confidence",
  "personalization",
];

const recommendationTraceRoles = [
  "supports",
  "limits",
  "contradicts",
  "context",
  "calibrates",
];

const recommendationTraceApplicabilities = [
  "direct",
  "partial",
  "extrapolated",
];

function isRecommendationTraceEvidenceRef(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.sourceId) &&
    isOptionalString(value.observationId) &&
    (value.role === undefined ||
      recommendationTraceRoles.includes(String(value.role))) &&
    (value.applicability === undefined ||
      recommendationTraceApplicabilities.includes(String(value.applicability)))
  );
}

function isAppliedRuleTrace(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.ruleId) &&
    (value.ruleVersion === undefined ||
      (isFiniteNumber(value.ruleVersion) &&
        Number.isInteger(value.ruleVersion) &&
        value.ruleVersion >= 1)) &&
    recommendationTraceParameters.includes(String(value.parameter)) &&
    Array.isArray(value.evidenceRefs) &&
    value.evidenceRefs.every(isRecommendationTraceEvidenceRef)
  );
}

function isRecommendationTrace(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.engineVersion) &&
    isString(value.ruleRegistryVersion) &&
    isString(value.evidenceRegistryVersion) &&
    isString(value.generatedAt) &&
    Array.isArray(value.appliedRules) &&
    value.appliedRules.every(isAppliedRuleTrace)
  );
}

`;

await patch("lib/storage/brewSessionGuard.ts", [
  [
    "trace validators",
    `function isRecipeSnapshot(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }
`,
    `${compatibleTraceValidators}function isRecipeSnapshot(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.recommendationTrace !== undefined &&
    !isRecommendationTrace(value.recommendationTrace)
  ) {
    delete value.recommendationTrace;
  }
`,
  ],
  [
    "trace condition",
    `    isFiniteNumber(value.targetTimeMaxSeconds) &&
    Array.isArray(value.steps) &&`,
    `    isFiniteNumber(value.targetTimeMaxSeconds) &&
    (value.recommendationTrace === undefined ||
      isRecommendationTrace(value.recommendationTrace)) &&
    Array.isArray(value.steps) &&`,
  ],
]);
