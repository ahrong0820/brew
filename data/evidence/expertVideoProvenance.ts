import type { ExpertVideoProvenance } from "@/lib/types/expertVideoProvenance";

export const expertVideoProvenance = [
  {
    sourceId: "expert:james-hoffmann:1oB1oDrDkHM",
    channelName: "James Hoffmann",
    channelUrl: "https://www.youtube.com/channel/UCMb0O2CdPBNi-QqPk5T3gsQ",
    ownership: "expert-official",
    verificationMethod:
      "YouTube 영상 페이지 제목과 James Hoffmann 채널 페이지의 채널명을 직접 확인",
    verifiedAt: "2026-06-26",
    notes: [
      "영상 내용의 Observation 검수와 채널 소유 관계 검수는 별도 단계로 유지합니다.",
    ],
  },
] as const satisfies readonly ExpertVideoProvenance[];
