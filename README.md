# SuperInstance Vectorize

**SuperInstance Vectorize** is a Cloudflare Workers service providing semantic search across 560+ SuperInstance repositories using 32-dimensional domain-encoded embeddings and Cloudflare Vectorize for approximate nearest neighbor queries.

## Why It Matters

With 560+ crates spanning ternary mathematics, agent coordination, GPU optimization, music theory, and ecology, finding the right crate for a task requires understanding semantic relationships between repositories. Traditional keyword search fails — "ternary compression" could mean `oxide-chunk` (GPU memory) or `riff-benchmark-hashing` (data structures). Vectorize encodes each crate's DNA — domain, test density, LOC, wave number — into a 32-dimensional vector and finds semantically similar crates via cosine similarity.

## How It Works

### Embedding Construction

Each crate is embedded into a 32-dimensional vector. The dimensions encode:

| Dim | Domain | Meaning |
|-----|--------|---------|
| 0-23 | Domain categories | ternary-math, ternary-ml, agent-coordination, etc. |
| 24 | Testing | test density (tests/30, clamped) |
| 25 | Runtime | LOC density (LOC/10000, clamped) |
| 26-28 | Cross-domain signals | music↔cognition, ternary↔math crossovers |
| 29 | Meta-cognition | wave number (recency signal) |
| 30 | Scaling | scaling properties |
| 31 | Synergy | cross-ecosystem integration potential |

Normalization: L2 norm = 1, enabling cosine similarity via dot product.

### Domain Encoding

```typescript
function embedCrate(crate: CrateMetadata): number[] {
  vec[domainIdx] = 1.0;           // primary domain
  vec[24] = tests / 30;           // test density
  vec[25] = loc / 10000;          // code density
  vec[29] = wave / 70;            // temporal signal
  // Cross-domain signals...
  return normalize(vec);          // L2 normalize
}
```

Embedding cost: **O(32)** = **O(1)** per crate.

### Similarity Search

Queries use Cloudflare Vectorize for ANN (Approximate Nearest Neighbor):

```
POST /search {"query": "ternary GPU compression", "topK": 10}
→ Vectorize.query(query_vector, topK)
→ Returns ranked crate list with cosine similarity scores
```

Query latency: **O(log N)** with HNSW index (Vectorize uses hierarchical navigable small world graphs). Supports top-K queries up to K=100.

### Ingestion Pipeline

```typescript
POST /ingest [crate_metadata...]
→ embedCrate(each) → Vectorize.upsert(vectors)
```

Bulk upsert: **O(N)** for N crates.

## Quick Start

```typescript
// Search for crates related to GPU memory management
const results = await fetch('https://superinstance-vectorize.casey-digennaro.workers.dev/search', {
  method: 'POST',
  body: JSON.stringify({ query: 'GPU memory management', topK: 5 })
});

const crates = await results.json();
// [{ name: 'oxide-chunk', score: 0.92 }, { name: 'oxide-epoch', score: 0.87 }, ...]
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | POST | Semantic search: `{"query": "...", "topK": N}` |
| `/ingest` | POST | Bulk upsert crate embeddings |
| `/stats` | GET | Vectorize index statistics |

Deployed: `https://superinstance-vectorize.casey-digennaro.workers.dev`

## Architecture Notes

SuperInstance Vectorize provides the discovery layer for the ecosystem. In γ + η = C, semantic search enables γ (growth — finding crates that extend capabilities) and η (avoidance — avoiding duplication by finding existing implementations). The 32-dimensional encoding maps directly to the γ + η = C framework: domain dimensions represent γ (what it builds), meta-cognition represents η (what it avoids repeating). Integrates with `fleet-vector-api` for fleet-wide crate search.

See [ARCHITECTURE.md](https://github.com/SuperInstance/SuperInstance/blob/main/ARCHITECTURE.md) for the discovery architecture.

## References

1. Malkov, Y. A. & Yashunin, D. A. (2020). "Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs." *IEEE TPAMI*, 42(4), 824–836.
2. Cloudflare (2024). "Vectorize: Vector Database Documentation." *Cloudflare Developer Docs*.
3. Johnson, J. et al. (2019). "Billion-scale similarity search with GPUs." *IEEE Transactions on Big Data*.

## License

MIT
