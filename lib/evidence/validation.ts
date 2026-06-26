import type {
  EvidenceObservation,
  EvidenceRegistry,
  EvidenceSource,
  EvidenceValue,
  NumericRange,
} from "@/lib/types/evidence";

export type EvidenceValidationCode =
  | "duplicate-source-id"
  | "duplicate-observation-id"
  | "missing-source"
  | "empty-identifier"
  | "invalid-range"
  | "missing-unit"
  | "invalid-locator"
  | "invalid-review-state";

export interface EvidenceValidationIssue {
  code: EvidenceValidationCode;
  path: string;
  message: string;
}

function duplicateIds<T extends { id: string }>(items: readonly T[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    }
    seen.add(item.id);
  }

  return [...duplicates];
}

function validateRange(
  range: NumericRange,
  path: string,
  issues: EvidenceValidationIssue[],
) {
  if (!range.unit.trim()) {
    issues.push({
      code: "missing-unit",
      path: `${path}.unit`,
      message: "수치 범위에는 단위가 필요합니다.",
    });
  }

  if (
    range.min !== undefined &&
    range.max !== undefined &&
    range.min > range.max
  ) {
    issues.push({
      code: "invalid-range",
      path,
      message: `최솟값 ${range.min}이 최댓값 ${range.max}보다 큽니다.`,
    });
  }
}

function validateValue(
  value: EvidenceValue,
  path: string,
  issues: EvidenceValidationIssue[],
) {
  if (value.kind === "number") {
    if (!value.unit.trim()) {
      issues.push({
        code: "missing-unit",
        path: `${path}.unit`,
        message: "수치 관찰값에는 단위가 필요합니다.",
      });
    }
    return;
  }

  if (value.kind === "range") {
    validateRange(value, path, issues);
  }
}

function validateSource(
  source: EvidenceSource,
  index: number,
  issues: EvidenceValidationIssue[],
) {
  source.identifiers.forEach((identifier, identifierIndex) => {
    if (!identifier.value.trim()) {
      issues.push({
        code: "empty-identifier",
        path: `sources[${index}].identifiers[${identifierIndex}].value`,
        message: "출처 식별자는 비어 있을 수 없습니다.",
      });
    }
  });
}

function contextRanges(observation: EvidenceObservation) {
  const { context } = observation;
  return [
    ["bean.altitudeMeters", context.bean?.altitudeMeters],
    ["bean.roastAgeDays", context.bean?.roastAgeDays],
    ["brew.doseGrams", context.brew?.doseGrams],
    ["brew.ratio", context.brew?.ratio],
    ["brew.waterGrams", context.brew?.waterGrams],
    ["brew.temperatureCelsius", context.brew?.temperatureCelsius],
    ["brew.targetTimeSeconds", context.brew?.targetTimeSeconds],
    ["grinder.settingRange", context.grinder?.settingRange],
    ["grinder.representativeMicrons", context.grinder?.representativeMicrons],
    ["water.tdsPpm", context.water?.tdsPpm],
    ["water.hardnessPpmAsCaCO3", context.water?.hardnessPpmAsCaCO3],
    ["water.alkalinityPpmAsCaCO3", context.water?.alkalinityPpmAsCaCO3],
    ["water.ph", context.water?.ph],
    [
      "environment.roomTemperatureCelsius",
      context.environment?.roomTemperatureCelsius,
    ],
    ["environment.humidityPercent", context.environment?.humidityPercent],
  ] as const;
}

function validateObservation(
  observation: EvidenceObservation,
  index: number,
  sourcesById: ReadonlyMap<string, EvidenceSource>,
  issues: EvidenceValidationIssue[],
) {
  const path = `observations[${index}]`;
  const source = sourcesById.get(observation.sourceId);

  if (!source) {
    issues.push({
      code: "missing-source",
      path: `${path}.sourceId`,
      message: `존재하지 않는 출처 ${observation.sourceId}를 참조합니다.`,
    });
  }

  if (
    source?.status === "retracted" &&
    observation.reviewStatus === "reviewed"
  ) {
    issues.push({
      code: "invalid-review-state",
      path: `${path}.reviewStatus`,
      message: "철회된 출처의 관찰값은 reviewed 상태일 수 없습니다.",
    });
  }

  const locator = observation.excerpt.locator;
  if (
    locator.timestampStartSeconds !== undefined &&
    locator.timestampEndSeconds !== undefined &&
    locator.timestampStartSeconds > locator.timestampEndSeconds
  ) {
    issues.push({
      code: "invalid-locator",
      path: `${path}.excerpt.locator`,
      message: "영상 시작 시점이 종료 시점보다 늦습니다.",
    });
  }

  contextRanges(observation).forEach(([rangePath, range]) => {
    if (range) {
      validateRange(range, `${path}.context.${rangePath}`, issues);
    }
  });

  observation.variables.forEach((variable, variableIndex) => {
    validateValue(
      variable.value,
      `${path}.variables[${variableIndex}].value`,
      issues,
    );
  });

  if (observation.outcome?.value) {
    validateValue(observation.outcome.value, `${path}.outcome.value`, issues);
  }
}

export function validateEvidenceRegistry(
  registry: EvidenceRegistry,
): EvidenceValidationIssue[] {
  const issues: EvidenceValidationIssue[] = [];

  duplicateIds(registry.sources).forEach((id) => {
    issues.push({
      code: "duplicate-source-id",
      path: "sources",
      message: `출처 ID ${id}가 중복됐습니다.`,
    });
  });

  duplicateIds(registry.observations).forEach((id) => {
    issues.push({
      code: "duplicate-observation-id",
      path: "observations",
      message: `관찰 ID ${id}가 중복됐습니다.`,
    });
  });

  registry.sources.forEach((source, index) =>
    validateSource(source, index, issues),
  );

  const sourcesById = new Map(
    registry.sources.map((source) => [source.id, source] as const),
  );
  registry.observations.forEach((observation, index) =>
    validateObservation(observation, index, sourcesById, issues),
  );

  return issues;
}

export function assertValidEvidenceRegistry(registry: EvidenceRegistry) {
  const issues = validateEvidenceRegistry(registry);
  if (issues.length === 0) {
    return;
  }

  const details = issues
    .map((issue) => `${issue.code} ${issue.path}: ${issue.message}`)
    .join("\n");
  throw new Error(`Evidence registry validation failed:\n${details}`);
}
