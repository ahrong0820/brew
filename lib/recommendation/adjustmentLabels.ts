import type { PersonalizationStage } from "@/lib/recommendation/adjustmentContext";
import type {
  BrewPaceAssessment,
  TastingResult,
} from "@/lib/types/coffee";

const tastingLabels: Record<TastingResult, string> = {
  good: "좋음",
  "too-sour": "시고 덜 추출됨",
  "not-sweet-enough": "단맛 부족",
  "bitter-astringent": "쓰고 떫음",
  "too-weak": "너무 연함",
  "too-strong": "너무 진함",
  "aroma-muted": "향이 답답함",
};

const paceLabels: Record<BrewPaceAssessment, string> = {
  fast: "빠름",
  "in-range": "적정",
  slow: "느림",
};

export function tastingResultLabel(result: TastingResult | undefined) {
  return result ? tastingLabels[result] : "미평가";
}

export function brewPaceAssessmentLabel(
  assessment: BrewPaceAssessment | undefined,
) {
  return assessment ? paceLabels[assessment] : "미평가";
}

export function personalizationStageLabel(stage: PersonalizationStage) {
  if (stage === "stable") return "안정 설정";
  if (stage === "provisional") return "잠정 설정";
  return "시험 중";
}

export function personalizationStageMessage(
  stage: PersonalizationStage,
  successCount: number,
) {
  if (stage === "stable") {
    return `같은 원두·장비·레시피 조건에서 좋음 평가가 ${successCount}회 재현되었습니다.`;
  }
  if (stage === "provisional") {
    return "좋음 평가가 1회 있습니다. 같은 조건에서 한 번 더 재현하면 안정 설정이 됩니다.";
  }
  return "아직 좋음 평가가 없습니다. 조정 후 결과를 기록해 개인 시작점을 만드세요.";
}
