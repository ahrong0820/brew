import type {
  BrewerType,
  DrinkStyle,
  GrinderModel,
  OriginCountry,
  OriginGroup,
  ProcessMethod,
  RoastLevel,
  TasteGoal,
} from "@/lib/types/coffee";

export type EvidenceSourceType =
  | "paper"
  | "competition"
  | "expert"
  | "manufacturer"
  | "internal"
  | "personal";

export type EvidenceSourceStatus =
  | "active"
  | "superseded"
  | "retracted"
  | "archived";

export type EvidenceIdentifierScheme =
  | "doi"
  | "isbn"
  | "youtube"
  | "url"
  | "competition-entry"
  | "manufacturer-document"
  | "internal";

export interface EvidenceIdentifier {
  scheme: EvidenceIdentifierScheme;
  value: string;
}

export interface EvidenceAuthor {
  name: string;
  role?: "author" | "competitor" | "presenter" | "manufacturer" | "system";
  organization?: string;
}

export interface EvidenceSourceBase {
  id: string;
  type: EvidenceSourceType;
  title: string;
  authors: readonly EvidenceAuthor[];
  publisher?: string;
  publishedAt?: string;
  accessedAt: string;
  language?: string;
  canonicalUrl?: string;
  identifiers: readonly EvidenceIdentifier[];
  status: EvidenceSourceStatus;
  notes?: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaperEvidenceSource extends EvidenceSourceBase {
  type: "paper";
  journal?: string;
  volume?: string;
  issue?: string;
  peerReviewStatus: "peer-reviewed" | "preprint" | "conference" | "unknown";
}

export interface CompetitionEvidenceSource extends EvidenceSourceBase {
  type: "competition";
  competition: {
    name: string;
    year: number;
    division?: string;
    round?: string;
    placement?: number;
  };
}

export interface ExpertEvidenceSource extends EvidenceSourceBase {
  type: "expert";
  medium: "video" | "article" | "book" | "interview" | "course" | "social-post";
  expertProfile?: {
    credentials?: readonly string[];
    competitionHistory?: readonly string[];
    organization?: string;
  };
}

export interface ManufacturerEvidenceSource extends EvidenceSourceBase {
  type: "manufacturer";
  productModel?: string;
  documentVersion?: string;
}

export interface InternalEvidenceSource extends EvidenceSourceBase {
  type: "internal";
  rationale: string;
}

export interface PersonalEvidenceSource extends EvidenceSourceBase {
  type: "personal";
  runtimeCollection: "brewSessions";
}

export type EvidenceSource =
  | PaperEvidenceSource
  | CompetitionEvidenceSource
  | ExpertEvidenceSource
  | ManufacturerEvidenceSource
  | InternalEvidenceSource
  | PersonalEvidenceSource;

export interface EvidenceLocator {
  page?: number;
  section?: string;
  figure?: string;
  table?: string;
  timestampStartSeconds?: number;
  timestampEndSeconds?: number;
  paragraph?: string;
}

export interface EvidenceExcerpt {
  locator: EvidenceLocator;
  paraphrase: string;
  shortQuote?: string;
  contentHash?: string;
}

export interface NumericRange {
  min?: number;
  max?: number;
  unit: string;
}

export interface EvidenceContext {
  bean?: {
    originCountries?: readonly OriginCountry[];
    originGroups?: readonly OriginGroup[];
    roastLevels?: readonly RoastLevel[];
    processes?: readonly ProcessMethod[];
    varieties?: readonly string[];
    altitudeMeters?: NumericRange;
    roastAgeDays?: NumericRange;
  };
  brew?: {
    brewerTypes?: readonly BrewerType[];
    drinkStyles?: readonly DrinkStyle[];
    tasteGoals?: readonly TasteGoal[];
    filterMaterials?: readonly string[];
    doseGrams?: NumericRange;
    ratio?: NumericRange;
    waterGrams?: NumericRange;
    temperatureCelsius?: NumericRange;
    targetTimeSeconds?: NumericRange;
  };
  grinder?: {
    models?: readonly GrinderModel[];
    burrTypes?: readonly string[];
    settingRange?: NumericRange;
    representativeMicrons?: NumericRange;
  };
  water?: {
    tdsPpm?: NumericRange;
    hardnessPpmAsCaCO3?: NumericRange;
    alkalinityPpmAsCaCO3?: NumericRange;
    ph?: NumericRange;
  };
  environment?: {
    roomTemperatureCelsius?: NumericRange;
    humidityPercent?: NumericRange;
  };
}

export type EvidenceVariableName =
  | "doseGrams"
  | "waterGrams"
  | "brewRatio"
  | "temperatureCelsius"
  | "grinderSetting"
  | "representativeMicrons"
  | "bloomWaterGrams"
  | "bloomRatio"
  | "bloomTimeSeconds"
  | "pourCount"
  | "pourTargetWaterGrams"
  | "agitation"
  | "flowRateGramsPerSecond"
  | "targetTimeSeconds"
  | "actualTimeSeconds"
  | "beverageTdsPercent"
  | "extractionYieldPercent"
  | "sensoryAcidity"
  | "sensorySweetness"
  | "sensoryBitterness"
  | "sensoryAstringency"
  | "sensoryBody"
  | "sensoryClarity"
  | "overallPreference";

export type EvidenceValue =
  | { kind: "number"; value: number; unit: string }
  | { kind: "range"; min: number; max: number; unit: string }
  | { kind: "enum"; value: string }
  | { kind: "text"; value: string };

export interface ObservationVariable {
  name: EvidenceVariableName;
  role: "condition" | "control" | "intervention" | "measurement" | "recommendation";
  value: EvidenceValue;
}

export type ObservationDirection =
  | "increase"
  | "decrease"
  | "no-clear-change"
  | "optimum"
  | "association"
  | "not-applicable";

export interface ObservationOutcome {
  variable: EvidenceVariableName;
  direction: ObservationDirection;
  value?: EvidenceValue;
  comparisonGroup?: string;
  statisticalSignificance?: {
    reported: boolean;
    significant?: boolean;
    pValue?: number;
  };
  sensoryDescription?: string;
}

export interface EvidenceAssessment {
  extractionConfidence: "low" | "medium" | "high";
  directness: "direct" | "partially-applicable" | "indirect";
  methodologicalStrength:
    | "controlled"
    | "observational"
    | "recipe-example"
    | "expert-opinion"
    | "manufacturer-specification"
    | "personal-observation"
    | "heuristic"
    | "unknown";
  reproducibility: "single-source" | "multiple-sources" | "replicated" | "unknown";
  limitations: readonly string[];
  reviewedBy?: string;
  reviewedAt?: string;
}

export type EvidenceObservationKind =
  | "recipe-specification"
  | "controlled-comparison"
  | "measured-association"
  | "expert-guidance"
  | "calibration"
  | "heuristic"
  | "user-outcome";

export type EvidenceReviewStatus = "draft" | "reviewed" | "rejected" | "superseded";

export interface EvidenceObservation {
  id: string;
  sourceId: string;
  kind: EvidenceObservationKind;
  reviewStatus: EvidenceReviewStatus;
  summary: string;
  excerpt: EvidenceExcerpt;
  context: EvidenceContext;
  variables: readonly ObservationVariable[];
  outcome?: ObservationOutcome;
  assessment: EvidenceAssessment;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRegistry {
  version: string;
  sources: readonly EvidenceSource[];
  observations: readonly EvidenceObservation[];
}
