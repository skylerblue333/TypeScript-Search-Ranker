# Sky Search Ranker

A deterministic TypeScript/Express ranking service for bounded document collections in the SKYCOIN4444 engineering portfolio.

## Implemented

- `POST /api/v1/rank` with strict Zod validation.
- Maximum 500 documents per request, 20,000 characters per document, 256-character queries, and 100 returned results.
- Deterministic token-frequency/coverage scoring with stable tie ordering.
- Explicit health and readiness endpoints.
- Bounded JSON request bodies and disabled Express disclosure header.
- Jest/Supertest tests for ranking behavior, stable ties, health/readiness, and invalid input.
- TypeScript build, production dependency audit, non-root container build, and runtime smoke test in CI.

## Run locally

```bash
npm install
npm run build
npm test -- --runInBand
npm start
```

Example request:

```json
{
  "query": "golang performance",
  "limit": 10,
  "documents": [
    {"id": "doc-1", "text": "golang services with strong performance"},
    {"id": "doc-2", "text": "python application"}
  ]
}
```

## Product boundary

Status: **engineering beta**.

The current algorithm is deterministic lexical ranking. It does **not** claim BM25 equivalence, semantic/vector search, embeddings, trained relevance models, indexing persistence, distributed search, personalization, production capacity, HA, or production deployment. Those require separate implementation and evidence.

## SKYCOIN4444 integration role

Use as a bounded ranking primitive behind search/discovery workflows where deterministic local scoring is appropriate. Large-scale indexing and semantic retrieval belong in separate services.

## License

See `LICENSE`.
