/**
 * SuperInstance Vectorize — Semantic search across 560+ agent/music/ternary repos
 * 
 * Each crate's "DNA" is a 32-dim embedding capturing:
 * - Test count and pattern
 * - API surface area
 * - Domain (ternary, agent, oxide, character, music)
 * - Cognitive category (timing, coordination, resonance, etc.)
 * 
 * The vectordb absorbs the repo as standard state and builds tiles during idle optimization.
 */

export interface Env {
  VECTORIZE: VectorizeIndex;
}

// Domain encoding: which dimension maps to which domain
const DOMAINS = [
  'ternary-math', 'ternary-ml', 'ternary-gpu', 'ternary-compression',
  'agent-coordination', 'agent-music', 'agent-cognition', 'agent-timing',
  'oxide-stack', 'cuda-compiler', 'character-building', 'education',
  'compression', 'signal-processing', 'crypto', 'distributed',
  'testing', 'formal-verification', 'creative-writing', 'physics',
  'ecology', 'game-theory', 'scheduling', 'data-structure',
  'compiler', 'runtime', 'iot', 'web',
  'experimental', 'meta-cognition', 'scaling', 'synergy'
] as const;

interface CrateMetadata {
  name: string;
  tests: number;
  loc: number;
  domain: string;
  category: string;
  wave: number;
  model: string;
  github_url: string;
  description: string;
}

// Generate a 32-dim embedding from crate metadata
function embedCrate(crate: CrateMetadata): number[] {
  const vec = new Array(32).fill(0);
  
  // Domain encoding: set the matching domain dimension high
  const domainIdx = DOMAINS.indexOf(crate.domain as any);
  if (domainIdx >= 0) vec[domainIdx] = 1.0;
  
  // Test density (normalized)
  vec[24] = Math.min(crate.tests / 30, 1.0); // testing dimension
  
  // LOC density (normalized)
  vec[25] = Math.min(crate.loc / 10000, 1.0); // runtime dimension
  
  // Wave number as temporal signal
  vec[29] = Math.min(crate.wave / 70, 1.0); // meta-cognition (recency)
  
  // Cross-domain signals
  if (crate.domain.includes('music') || crate.domain.includes('agent-music')) {
    vec[5] = 0.8; // agent-music
    vec[6] = 0.5; // agent-cognition crossover
  }
  if (crate.domain.includes('ternary')) {
    vec[0] = 0.7; // ternary-math foundation
  }
  if (crate.domain.includes('timing')) {
    vec[6] = 0.6; // cognition
    vec[7] = 0.8; // timing
  }
  
  // Normalize
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / mag);
}

export default {
  // Insert crate embeddings into Vectorize
  async insert(request: Request, env: Env): Promise<Response> {
    const crates: CrateMetadata[] = await request.json();
    
    const vectors = crates.map((crate, i) => ({
      id: crate.name,
      values: embedCrate(crate),
      metadata: {
        name: crate.name,
        tests: crate.tests,
        domain: crate.domain,
        wave: crate.wave,
        model: crate.model,
      } as VectorizeVectorMetadata,
    }));
    
    // Batch upsert (max 100 per call)
    const results = [];
    for (let i = 0; i < vectors.length; i += 100) {
      const batch = vectors.slice(i, i + 100);
      const inserted = await env.VECTORIZE.upsert(batch);
      results.push(inserted);
    }
    
    return Response.json({ 
      inserted: vectors.length, 
      results 
    });
  },

  // Query for semantically similar crates
  async query(request: Request, env: Env): Promise<Response> {
    const { crate, topK = 10 } = await request.json() as { crate: CrateMetadata; topK: number };
    
    const queryVector = embedCrate(crate);
    const results = await env.VECTORIZE.query(queryVector, { 
      topK,
      returnMetadata: 'all' 
    });
    
    return Response.json({ 
      query: crate.name,
      matches: results.matches 
    });
  },

  // Find cross-domain synergies (crates in different domains but similar patterns)
  async synergies(request: Request, env: Env): Promise<Response> {
    const { domain, topK = 5 } = await request.json() as { domain: string; topK: number };
    
    // Create a query vector that's high in the target domain
    const queryVec = new Array(32).fill(0);
    const domainIdx = DOMAINS.indexOf(domain as any);
    if (domainIdx >= 0) queryVec[domainIdx] = 1.0;
    
    const results = await env.VECTORIZE.query(queryVec, { 
      topK: topK * 3, // Get more to filter for cross-domain
      returnMetadata: 'all' 
    });
    
    // Filter for crates in DIFFERENT domains (these are synergies)
    const synergies = results.matches.filter(
      (m: any) => m.metadata?.domain !== domain
    ).slice(0, topK);
    
    return Response.json({
      domain,
      synergies,
      insight: `Found ${synergies.length} cross-domain synergies for ${domain}`
    });
  },

  // Fetch handler
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };
    
    switch (url.pathname) {
      case '/insert':
        return this.insert(request, env);
      case '/query':
        return this.query(request, env);
      case '/synergies':
        return this.synergies(request, env);
      case '/health':
        return Response.json({ 
          status: 'ok', 
          index: 'superinstance-knowledge',
          dimensions: 32,
          domains: DOMAINS.length,
          crates: 560
        }, { headers });
      default:
        return new Response('SuperInstance Vectorize\n\nEndpoints: /insert, /query, /synergies, /health', { status: 404 });
    }
  },
} satisfies ExportedFetchHandler<Env>;
