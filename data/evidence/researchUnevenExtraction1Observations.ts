import { researchUnevenExtraction1Sources } from "@/data/evidence/researchUnevenExtraction1";
import type { EvidenceObservation } from "@/lib/types/evidence";

const sourceId = researchUnevenExtraction1Sources[0].id;

export const researchUnevenExtraction1Observations = [
  {
    id: "obs:research-uneven-extraction-1:fine-grind-turnover-model",
    sourceId,
    kind: "measured-association",
    reviewStatus: "reviewed",
    summary:
      "에스프레소 실험 데이터에 적합한 두 유로 모델은 중간 분쇄도에서 추출 수율이 정점에 이르고, 임계점보다 미세한 구간에서는 더 미세해질수록 전체 추출 수율이 낮아지는 정성적 추세를 재현했습니다.",
    excerpt: {
      locator: {
        page: 4,
        section: "III. Results",
        figure: "Figures 5-7",
      },
      paraphrase:
        "Figure 5의 실험점과 적합선은 중간 설정 부근의 추출 수율 정점과 더 미세한 설정에서의 감소를 보여줍니다. 모델에서는 초기 공극률 차이가 유량과 추출의 양의 피드백으로 확대되고, 더 빠른 경로의 용해 가능한 커피가 먼저 소진되는 현상이 이 전환과 함께 나타납니다.",
    },
    context: {
      brew: {
        brewerTypes: ["other"],
        drinkStyles: ["hot"],
      },
    },
    variables: [
      {
        name: "grinderSetting",
        role: "intervention",
        value: {
          kind: "text",
          value: "espresso grinder setting varied from finer to coarser",
        },
      },
      {
        name: "extractionYieldPercent",
        role: "measurement",
        value: {
          kind: "text",
          value: "peaked at an intermediate setting and decreased in the finest region",
        },
      },
      {
        name: "flowRateGramsPerSecond",
        role: "measurement",
        value: {
          kind: "text",
          value: "unequal flow between two modeled pathways",
        },
      },
    ],
    outcome: {
      variable: "extractionYieldPercent",
      direction: "optimum",
      comparisonGroup:
        "intermediate grind setting versus coarser and finer espresso settings",
      sensoryDescription:
        "전체 평균 추출 수율만으로 커피층 내부의 과다·과소 추출 공존 여부를 판단할 수 없다는 모델 기반 제한을 제시합니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "indirect",
      methodologicalStrength: "unknown",
      reproducibility: "single-source",
      limitations: [
        "새로운 통제 추출 실험이 아니라 기존 에스프레소 실험 데이터에 적합한 수학 모델입니다.",
        "두 개의 동일 면적 유로, 일정한 전체 유량, 깊이 방향으로 균일한 상태를 가정한 저차원 모델입니다.",
        "실제 커피 입도 분포가 이봉형일 수 있음에도 단일 전달항을 사용했습니다.",
        "정성적 추세를 재현했을 뿐 특정 그라인더 설정이나 임계 분쇄도를 보편값으로 제공하지 않습니다.",
        "V60·종이 필터·중력식 추출의 유동과 감각 결과를 직접 측정하지 않았습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "paper",
      "peer-reviewed",
      "mathematical-model",
      "espresso",
      "grind-size",
      "uneven-extraction",
      "flow-instability",
      "indirect-for-v60",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
  {
    id: "obs:research-uneven-extraction-1:physical-density-limit",
    sourceId,
    kind: "measured-association",
    reviewStatus: "reviewed",
    summary:
      "실험에서 측정된 커피 밀도값을 사용하면 임계 분쇄도 아래에서 추출 수율은 평탄해질 뿐 감소하지 않았고, 감소 추세를 재현하려면 측정값의 두 배인 비물리적 밀도 매개변수가 필요했습니다.",
    excerpt: {
      locator: {
        page: 5,
        section: "IV. Discussion",
      },
      paraphrase:
        "저자들은 측정된 밀도값으로는 미세 분쇄 구간의 추출 감소가 나타나지 않고 일정하게 유지됐다고 명시합니다. 관측된 감소를 만들기 위해 물리값의 두 배를 사용했으며, 이는 단순 모델이 유동과 용해의 상호작용 또는 이봉형 입도 분포를 충분히 표현하지 못했을 가능성을 뜻합니다.",
    },
    context: {
      brew: {
        brewerTypes: ["other"],
        drinkStyles: ["hot"],
      },
    },
    variables: [
      {
        name: "grinderSetting",
        role: "condition",
        value: {
          kind: "text",
          value: "below the critical espresso grind setting",
        },
      },
      {
        name: "extractionYieldPercent",
        role: "measurement",
        value: {
          kind: "text",
          value: "plateau with measured density; decrease only with doubled unphysical density",
        },
      },
    ],
    outcome: {
      variable: "extractionYieldPercent",
      direction: "no-clear-change",
      comparisonGroup:
        "measured coffee density parameter versus doubled imposed density parameter",
      sensoryDescription:
        "미세화가 추출 수율을 낮춘다는 인과 규칙을 이 모델 하나만으로 활성화해서는 안 된다는 제한 근거입니다.",
    },
    assessment: {
      extractionConfidence: "high",
      directness: "indirect",
      methodologicalStrength: "unknown",
      reproducibility: "single-source",
      limitations: [
        "모델의 실패 조건을 기록한 것이며 실제 에스프레소에서 추출 감소가 존재하지 않는다는 실험 결과는 아닙니다.",
        "비물리적 매개변수 필요성은 누락된 이봉형 입도 분포나 더 복잡한 공간 구조 때문일 수 있습니다.",
        "에스프레소 모델의 한계이므로 V60 분쇄도 규칙에 직접 반박 근거로 적용할 때 조건 일치도를 낮춰야 합니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "paper",
      "peer-reviewed",
      "mathematical-model",
      "model-limitation",
      "limiting-evidence",
      "espresso",
      "grind-size",
      "indirect-for-v60",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
