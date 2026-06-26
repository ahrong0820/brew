import type { EvidenceObservation } from "@/lib/types/evidence";
import type { EvidenceQualityIssue } from "@/lib/evidence/quality";

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function checkObservationTextQuality(
  observations: readonly EvidenceObservation[],
): EvidenceQualityIssue[] {
  const issues: EvidenceQualityIssue[] = [];

  observations.forEach((observation, index) => {
    const path = `observations[${index}]`;

    if (!observation.excerpt.paraphrase.trim()) {
      issues.push({
        level: "error",
        code: "empty-paraphrase",
        path: `${path}.excerpt.paraphrase`,
        message: "관찰값에는 원문을 복제하지 않은 요약이 필요합니다.",
      });
    }

    if (
      observation.excerpt.shortQuote &&
      wordCount(observation.excerpt.shortQuote) > 25
    ) {
      issues.push({
        level: "error",
        code: "quote-too-long",
        path: `${path}.excerpt.shortQuote`,
        message: "짧은 원문 인용은 25단어를 초과할 수 없습니다.",
      });
    }

    if (
      observation.reviewStatus === "reviewed" &&
      (!observation.assessment.reviewedBy ||
        !observation.assessment.reviewedAt)
    ) {
      issues.push({
        level: "error",
        code: "review-metadata-missing",
        path: `${path}.assessment`,
        message: "검수 완료 관찰값에는 검수자와 검수일이 필요합니다.",
      });
    }
  });

  return issues;
}
