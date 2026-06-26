import type { EvidenceSource } from "@/lib/types/evidence";
import type { EvidenceQualityIssue } from "@/lib/evidence/quality";

function requiresCanonicalUrl(source: EvidenceSource) {
  return (
    source.type === "paper" ||
    source.type === "competition" ||
    source.type === "expert" ||
    source.type === "manufacturer"
  );
}

export function checkEvidenceSourceQuality(
  sources: readonly EvidenceSource[],
): EvidenceQualityIssue[] {
  const issues: EvidenceQualityIssue[] = [];

  sources.forEach((source, index) => {
    if (requiresCanonicalUrl(source) && !source.canonicalUrl) {
      issues.push({
        level: "warning",
        code: "missing-canonical-url",
        path: `sources[${index}].canonicalUrl`,
        message: `${source.id}에 원본 URL이 없습니다. 검수 전에 보강해야 합니다.`,
      });
    }
  });

  return issues;
}
