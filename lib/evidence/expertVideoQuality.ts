import type { EvidenceSource } from "@/lib/types/evidence";
import type { ExpertVideoProvenance } from "@/lib/types/expertVideoProvenance";
import type { EvidenceQualityIssue } from "@/lib/evidence/quality";

function isExpertVideo(source: EvidenceSource) {
  return source.type === "expert" && source.medium === "video";
}

export function checkExpertVideoProvenance(
  sources: readonly EvidenceSource[],
  provenance: readonly ExpertVideoProvenance[],
): EvidenceQualityIssue[] {
  const issues: EvidenceQualityIssue[] = [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const provenanceBySourceId = new Map<string, ExpertVideoProvenance>();

  provenance.forEach((entry, index) => {
    const path = `expertVideoProvenance[${index}]`;
    if (provenanceBySourceId.has(entry.sourceId)) {
      issues.push({
        level: "error",
        code: "duplicate-expert-video-provenance",
        path: `${path}.sourceId`,
        message: `${entry.sourceId}의 영상 출처 검증 기록이 중복되었습니다.`,
      });
      return;
    }
    provenanceBySourceId.set(entry.sourceId, entry);

    const source = sourceById.get(entry.sourceId);
    if (!source) {
      issues.push({
        level: "error",
        code: "unknown-expert-video-source",
        path: `${path}.sourceId`,
        message: `${entry.sourceId}에 해당하는 Source가 없습니다.`,
      });
      return;
    }
    if (!isExpertVideo(source)) {
      issues.push({
        level: "error",
        code: "provenance-source-not-expert-video",
        path: `${path}.sourceId`,
        message: `${entry.sourceId}는 expert video Source가 아닙니다.`,
      });
    }
    if (
      (entry.ownership === "expert-official" ||
        entry.ownership === "organization-official") &&
      !entry.channelUrl
    ) {
      issues.push({
        level: "warning",
        code: "official-channel-url-missing",
        path: `${path}.channelUrl`,
        message: `${entry.sourceId}의 공식 채널 URL을 보강해야 합니다.`,
      });
    }
    if (entry.ownership === "third-party" || entry.ownership === "unknown") {
      issues.push({
        level: "warning",
        code: "expert-video-not-first-party",
        path: `${path}.ownership`,
        message: `${entry.sourceId}는 공식 1차 영상으로 확인되지 않았습니다.`,
      });
    }
  });

  sources.forEach((source, index) => {
    if (!isExpertVideo(source)) {
      return;
    }
    if (!source.identifiers.some((identifier) => identifier.scheme === "youtube")) {
      issues.push({
        level: "error",
        code: "expert-video-youtube-id-missing",
        path: `sources[${index}].identifiers`,
        message: `${source.id}에 YouTube 영상 ID가 필요합니다.`,
      });
    }
    if (!provenanceBySourceId.has(source.id)) {
      issues.push({
        level: "warning",
        code: "expert-video-provenance-missing",
        path: `sources[${index}]`,
        message: `${source.id}의 채널 소유 관계와 검증 방법을 기록해야 합니다.`,
      });
    }
  });

  return issues;
}
