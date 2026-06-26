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
