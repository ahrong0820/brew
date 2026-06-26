# Source 입력 템플릿

```ts
{
  id: "<type>:<stable-id>",
  type: "paper | competition | expert | manufacturer",
  title: "자료 제목",
  authors: [{ name: "작성자", role: "author" }],
  publisher: "발행 기관",
  publishedAt: "YYYY-MM-DD",
  accessedAt: "YYYY-MM-DD",
  canonicalUrl: "원본 URL",
  identifiers: [{ scheme: "doi | youtube | url", value: "식별자" }],
  status: "active",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
}
```

자료 유형별 추가 필드도 함께 기록한다. 논문은 심사 상태, 대회는 연도·라운드·순위, 영상은 매체 유형, 제조사 자료는 제품 모델과 문서 버전이 필요하다.

## 전문가 YouTube 영상 검증 기록

전문가 영상 Source와 별도로 `data/evidence/expertVideoProvenance.ts`에 채널 검증 기록을 추가한다.

```ts
{
  sourceId: "expert:<expert>:<video-id>",
  channelName: "공식 채널명",
  channelUrl: "공식 채널 URL",
  ownership: "expert-official | organization-official | third-party | unknown",
  verificationMethod: "공식 웹사이트 연결 등 검증 방법",
  verifiedAt: "YYYY-MM-DD",
}
```

공식 채널 영상은 `expert-official` 또는 `organization-official`로 기록한다. 제3자 재업로드와 소유 관계 미확인 영상은 Source 후보로 보관할 수 있지만 직접 전문가 근거처럼 취급하지 않는다.
