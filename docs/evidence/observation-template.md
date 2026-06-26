# Observation 입력 템플릿

```ts
{
  id: "obs:<source-id>:<claim-id>",
  sourceId: "Source ID",
  kind: "recipe-specification | controlled-comparison | expert-guidance",
  reviewStatus: "draft",
  summary: "한 문장 관찰 요약",
  excerpt: {
    locator: { page: 1, section: "절 또는 영상 시점" },
    paraphrase: "자료가 말한 핵심 내용의 요약",
  },
  context: {
    brew: { brewerTypes: ["v60"] },
  },
  variables: [],
  assessment: {
    extractionConfidence: "medium",
    directness: "direct",
    methodologicalStrength: "observational",
    reproducibility: "single-source",
    limitations: ["적용 한계"],
  },
  tags: [],
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
}
```

검수 완료 시 `reviewStatus`를 `reviewed`로 변경하고 `reviewedBy`, `reviewedAt`을 추가한다.
