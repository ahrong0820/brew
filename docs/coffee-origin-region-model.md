# Coffee origin region data model

## Decision

Store detailed origin regions as an optional ordered collection:

```ts
originRegions?: readonly string[]
```

The field is available on both `Bean` and `EvidenceContext.bean`.

## Rationale

- A coffee lot can name more than one production region, especially blends or composite lots.
- Evidence scopes can cover one or several regions.
- An optional collection preserves legacy records without migration.
- Region labels remain source or user text until an explicit normalization policy is reviewed.

## Storage compatibility

The Local Storage schema version is unchanged.

Existing beans without `originRegions` remain valid. New beans normalize the collection by trimming labels, removing blank values, and removing exact duplicates while preserving first occurrence order. Stored values are accepted only when `originRegions` is absent or is an array of strings.

The current bean form does not expose a region field. Editing an existing bean preserves an already stored `originRegions` value because updates merge the existing bean before replacing edited fields. A user-facing input can be added in a separate UI PR.

## Matching boundary

This change does not alter evidence relevance scores or active recommendation values.

Region matching and alias handling are deferred. In particular, this model does not assume that labels such as `Sidama`, `Sidamo`, or translated spellings are equivalent. A later matching PR must define explicit normalization and fallback behavior before using region labels in scoring.
