export interface GrindPresentationInput {
  original: string;
  start?: string;
  unit?: string;
  calibration: string;
  source?: string;
  safeRange?: string;
  representativeMicrons?: number;
}

export function formatGrindPresentation(input: GrindPresentationInput) {
  const values = [
    `원본 표현: ${input.original}`,
    `변환 시작값: ${input.start ? `${input.start} ${input.unit ?? ""}`.trim() : "숫자 변환 안 함"}`,
    `영점 기준: ${input.calibration}`,
  ];
  if (input.source) values.push(`적용 근거: ${input.source}`);
  if (input.representativeMicrons !== undefined) {
    values.push(`대표 입도: 약 ${Math.round(input.representativeMicrons)}μm`);
  }
  values.push(`안전 범위: ${input.safeRange ?? "미확인"}`);
  return values.join(" · ");
}

const categoryLabels = [
  "맛 목표",
  "원두 적합",
  "용량 적합",
  "향미 연결",
  "개인 성공",
  "난이도",
  "분쇄 변환",
] as const;

export type RecommendationReasonCategory =
  | (typeof categoryLabels)[number]
  | "기타";

export function recommendationReasonCategory(reason: string) {
  return (
    categoryLabels.find((label) => reason.startsWith(`[${label}]`)) ?? "기타"
  );
}
