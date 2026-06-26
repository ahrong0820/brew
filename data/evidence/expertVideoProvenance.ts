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
  {
    sourceId: "expert:tetsu-kasuya:wmCW8xSWGZY",
    channelName: "TETSU KASUYA World Brewers Cup Champion 2016",
    channelUrl: "https://www.youtube.com/@TetsuKasuya",
    ownership: "expert-official",
    verificationMethod:
      "YouTube @TetsuKasuya 채널명과 Tetsu Kasuya가 창립한 PHILOCOFFEA 공식 사이트의 4:6 method 영상 임베드 ID를 교차 확인",
    verifiedAt: "2026-06-26",
    notes: [
      "PHILOCOFFEA 공식 사이트는 Tetsu Kasuya를 창립자이자 2016 World Brewers Cup Champion으로 소개합니다.",
      "공식 사이트의 4:6 method 안내 영역이 YouTube ID wmCW8xSWGZY를 직접 사용합니다.",
      "영상 내용의 Observation 검수와 채널 소유 관계 검수는 별도 단계로 유지합니다.",
    ],
  },
] as const satisfies readonly ExpertVideoProvenance[];
