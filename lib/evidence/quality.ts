export interface EvidenceQualityIssue {
  level: "error" | "warning";
  code: string;
  path: string;
  message: string;
}
