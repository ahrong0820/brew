import type {
  BrewerType,
  GrinderModel,
  TasteGoal,
} from "@/lib/types/coffee";
import type {
  RecommendationRuleDefinition,
  RuleEvidenceLink,
} from "@/lib/types/recommendationRule";

const introducedAt = "2026-06-26";
const heuristicObservationId = "obs:internal:initial-rule-set:baseline-v1";
const heuristicSourceId = "internal:initial-rule-set:v1";
const personalSourceId = "local:user-brew-history";
const e80SourceId = "manufacturer:holzklotz-e80-micron-reference";
const e80ObservationId = "obs:manufacturer:holzklotz-e80:step-micron-table-v1";

const heuristicEvidence: readonly RuleEvidenceLink[] = [
  {
    sourceId: heuristicSourceId,
    observationId: heuristicObservationId,
    role: "context",
    applicability: "direct",
    note: "현재 운영 중인 초기 휴리스틱의 구현 근거를 추적합니다.",
  },
];

const personalEvidence: readonly RuleEvidenceLink[] = [
  {
    sourceId: personalSourceId,
    role: "supports",
    applicability: "direct",
    note: "실제 관찰값은 BrewSession에서 런타임에 파생합니다.",
  },
];

const baseRules: RecommendationRuleDefinition[] = [
  {
    id: "dose.user-default.normalized.v1",
    version: 1,
    status: "active",
    title: "사용자 기본 원두량 정규화",
    description: "사용자 기본 원두량을 지원 범위와 1g 단위로 정규화",
    parameter: "dose",
    implementationKey: "normalize-dose",
    evidenceLinks: heuristicEvidence,
    introducedAt,
  },
  {
    id: "ratio.taste-goal.v1",
    version: 1,
    status: "active",
    title: "맛 목표별 초기 추출 비율",
    description: "맛 목표별 초기 추출 비율 적용",
    parameter: "ratio",
    implementationKey: "taste-goal-ratio",
    evidenceLinks: heuristicEvidence,
    introducedAt,
  },
  {
    id: "water.dose-ratio.normalized.v1",
    version: 1,
    status: "active",
    title: "원두량과 비율 기반 물량 정규화",
    description: "정규화된 원두량과 비율로 물량을 계산하고 5g 단위로 반올림",
    parameter: "water",
    implementationKey: "dose-ratio-water",
    evidenceLinks: heuristicEvidence,
    introducedAt,
  },
  {
    id: "temperature.roast-process-taste.v1",
    version: 1,
    status: "active",
    title: "배전도·가공 방식·맛 목표 기반 온도",
    description: "배전도·가공 방식·맛 목표의 초기 온도 오프셋 적용",
    parameter: "temperature",
    implementationKey: "roast-process-taste-temperature",
    evidenceLinks: heuristicEvidence,
    introducedAt,
  },
];

const grinderModels = [
  "1zpresso-k-ultra",
  "holzklotz-e80",
  "baratza-encore",
  "other",
] as const satisfies readonly GrinderModel[];

const grinderRules: RecommendationRuleDefinition[] = grinderModels.map((model) => ({
  id: `grind.${model}.v1`,
  version: 1,
  status: "active",
  title: `${model} 초기 분쇄도`,
  description: "그라인더 모델과 영점 기준의 초기 분쇄도 및 지원 범위 적용",
  parameter: "grind",
  implementationKey: "grinder-model-setting",
  scope: { grinder: { models: [model] } },
  evidenceLinks:
    model === "holzklotz-e80"
      ? [
          {
            sourceId: e80SourceId,
            observationId: e80ObservationId,
            role: "calibrates",
            applicability: "direct",
            note: "제조사 Step-미크론 표는 지원 범위와 표시값 교정에 사용합니다.",
          },
          ...heuristicEvidence,
        ]
      : heuristicEvidence,
  introducedAt,
}));

const brewers = ["v60", "clever", "switch", "other"] as const satisfies readonly BrewerType[];
const tasteGoals = ["sweet", "bright", "balanced", "body"] as const satisfies readonly TasteGoal[];

const pourRules: RecommendationRuleDefinition[] = brewers.flatMap((brewer) =>
  tasteGoals.map((tasteGoal) => ({
    id: `pour.${brewer}.${tasteGoal}.v1`,
    version: 1,
    status: "active" as const,
    title: `${brewer} ${tasteGoal} 푸어 구조`,
    description: "드리퍼와 맛 목표별 푸어 단계 및 누적 물량 적용",
    parameter: "pour" as const,
    implementationKey: "brewer-taste-pour" as const,
    scope: {
      brew: {
        brewerTypes: [brewer],
        tasteGoals: [tasteGoal],
      },
    },
    evidenceLinks: heuristicEvidence,
    introducedAt,
  })),
);

const timeRules: RecommendationRuleDefinition[] = brewers.map((brewer) => ({
  id: `time.${brewer}.v1`,
  version: 1,
  status: "active",
  title: `${brewer} 목표 추출 시간`,
  description: "드리퍼 유형별 목표 추출 시간 범위 적용",
  parameter: "time",
  implementationKey: "brewer-target-time",
  scope: { brew: { brewerTypes: [brewer] } },
  evidenceLinks: heuristicEvidence,
  introducedAt,
}));

const personalRules: RecommendationRuleDefinition[] = [
  {
    id: "personalization.profile-offset.v1",
    version: 1,
    status: "active",
    title: "개인 프로필 보정",
    description: "동일 조건의 사용자 추출 기록에서 저장한 보정값 적용",
    parameter: "personalization",
    implementationKey: "personal-profile-offset",
    evidenceLinks: personalEvidence,
    introducedAt,
  },
  {
    id: "personalization.success-history.single.v1",
    version: 1,
    status: "active",
    title: "단일 성공 이력 신뢰도 보정",
    description: "동일 조건의 현재 베스트 1회 이력 반영",
    parameter: "confidence",
    implementationKey: "personal-success-history",
    evidenceLinks: personalEvidence,
    introducedAt,
  },
  {
    id: "personalization.success-history.repeat.v1",
    version: 1,
    status: "active",
    title: "반복 성공 이력 신뢰도 보정",
    description: "동일 조건의 좋은 평가가 2회 이상 반복된 이력 반영",
    parameter: "confidence",
    implementationKey: "personal-success-history",
    evidenceLinks: personalEvidence,
    introducedAt,
  },
];

export const recommendationRules = [
  ...baseRules,
  ...grinderRules,
  ...pourRules,
  ...timeRules,
  ...personalRules,
] satisfies RecommendationRuleDefinition[];
