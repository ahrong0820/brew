export type ExpertVideoChannelOwnership =
  | "expert-official"
  | "organization-official"
  | "third-party"
  | "unknown";

export interface ExpertVideoProvenance {
  sourceId: string;
  channelName: string;
  channelUrl?: string;
  ownership: ExpertVideoChannelOwnership;
  verificationMethod: string;
  verifiedAt: string;
  notes?: readonly string[];
}
