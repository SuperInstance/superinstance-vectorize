# superinstance-vectorize

*Cloudflare Vectorize as the agent knowledge graph — every crate is a vector, every query discovers integration.*

## What

A Cloudflare Worker + Vectorize index that stores 32-dimensional embeddings of every SuperInstance crate. Enables semantic search across 560+ repos to find:
- Similar crates (same domain, same patterns)
- Cross-domain synergies (different domain, similar structure)
- Knowledge gaps (areas with low coverage)
- Evolution patterns (how crates change across waves)

## The 32 Dimensions

Each dimension maps to a domain/category:
0-3: ternary (math, ML, GPU, compression)
4-7: agent (coordination, music, cognition, timing)
8-11: infrastructure (oxide, cuda, character, education)
12-15: algorithms (compression, signal, crypto, distributed)
16-19: quality (testing, formal verification, creative writing, physics)
20-23: applications (ecology, game theory, scheduling, data structures)
24-27: systems (compiler, runtime, IoT, web)
28-31: meta (experimental, meta-cognition, scaling, integration)

## API

### Insert crates
```bash
curl -X POST https://superinstance-vectorize.your-subdomain.workers.dev/insert \
  -H "Content-Type: application/json" \
  -d '[{"name":"agent-sync","tests":10,"loc":1200,"domain":"agent-timing","category":"music-cognition","wave":65,"model":"glm-5.1","github_url":"...","description":"..."}]'
```

### Query for similar crates
```bash
curl -X POST https://superinstance-vectorize.your-subdomain.workers.dev/query \
  -d '{"crate":{"name":"agent-sync","tests":10,"loc":1200,"domain":"agent-timing","category":"music-cognition","wave":65,"model":"glm-5.1","github_url":"","description":""},"topK":5}'
```

### Find cross-domain synergies
```bash
curl -X POST https://superinstance-vectorize.yer-subdomain.workers.dev/synergies \
  -d '{"domain":"agent-music","topK":5}'
```

## Setup

```bash
# Create the Vectorize index
npx wrangler vectorize create superinstance-knowledge --dimensions=32 --metric=cosine

# Deploy the worker
npx wrangler deploy
```

## Why Vectorize

Casey's directive: "The vectordb absorbs the repo and environment as standard state and builds internal tiles as part of idle-time optimization/training."

This is the tile builder. Every crate gets embedded. Every query discovers connections. The system gets smarter just by existing and being queried.

## Architecture

```
Crate → embedCrate() → 32-dim vector → Vectorize
                                           ↓
Query → embedCrate() → cosine search → matches
                                           ↓
                    Cross-domain filter → synergies
```
