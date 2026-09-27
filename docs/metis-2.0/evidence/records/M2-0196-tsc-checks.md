# M2-0196 TypeScript compiler checks

Recorded: 2026-09-27

D-28 permits static `tsc --noEmit` checks because they execute no repository code (`docs/metis-2.0/DECISIONS.md:130`). These commands were run from the public code checkout with the local TypeScript binary and no repository tests, scripts, app launch, workflow dispatch, or package install.

## `tsconfig.node.json`

Command:

```bash
./node_modules/.bin/tsc --noEmit --pretty false --tsBuildInfoFile /tmp/metis-m2-0196-node.tsbuildinfo -p tsconfig.node.json
```

Exit code: 0

Output: none.

## `tsconfig.web.json`

Command:

```bash
./node_modules/.bin/tsc --noEmit --pretty false --tsBuildInfoFile /tmp/metis-m2-0196-web.tsbuildinfo -p tsconfig.web.json
```

Exit code: 0

Output: none.

## `tsconfig.tests.json`

Command:

```bash
./node_modules/.bin/tsc --noEmit --pretty false --incremental false -p tsconfig.tests.json
```

Exit code: 2

Output excerpt:

```text
intelligence/src/lib/slug.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
src/main/audit-log-chain.test.ts(71,73): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
src/main/brain/ingest-backfill.test.ts(49,22): error TS2339: Property 'cloudflare' does not exist on type '{ anthropic: string; openai: string; grok: string; nvidia: string; deepseek: string; qwen: string; minimax: string; kimi: string; openrouter: string; groq: string; together: string; fireworks: string; ... 5 more ...; custom: string; }'.
src/main/brain/ingest-backfill.test.ts(49,22): error TS2339: Property 'local' does not exist on type '{ anthropic: string; openai: string; grok: string; nvidia: string; deepseek: string; qwen: string; minimax: string; kimi: string; openrouter: string; groq: string; together: string; fireworks: string; ... 5 more ...; custom: string; }'.
src/main/brain/publish.test.ts(464,13): error TS2739: Type '{ text: string; by: string; meeting: string; date: string; status: "open"; }' is missing the following properties from type '{ status: "open" | "kept" | "broken" | "rejected"; date: string; text: string; confidence: "EXTRACTED" | "INFERRED" | "AMBIGUOUS"; quote: string; by: string; due_hint: string; meeting: string; }': confidence, quote, due_hint
src/main/cli.test.ts(109,72): error TS2353: Object literal may only specify known properties, and 'system' does not exist in type '{ model: string; }'.
src/main/llm/dust.test.ts(373,7): error TS2322: Type 'false' is not assignable to type 'true'.
src/main/llm/local-model-download.test.ts(110,7): error TS2741: Property 'ctxSize' is missing in type '{ id: string; label: string; minTotalRamGB: number; gguf: { bytes: number; sha256: string; url: string; }; mmproj: { bytes: number; sha256: string; url: string; }; }' but required in type 'LocalModelEntry'.
src/main/mcp/mcpClient.test.ts(106,13): error TS2322: Type '(newSid: string) => Map<string, StreamableHTTPServerTransport>' is not assignable to type '(sessionId: string) => void | Promise<void>'.
src/main/net/install-proxy.test.ts(107,58): error TS2749: 'FakeProxyAgent' refers to a value, but is being used as a type here. Did you mean 'typeof FakeProxyAgent'?
src/main/transcripts.test.ts(1127,47): error TS2345: Argument of type '(src: string, dest: string) => Promise<void>' is not assignable to parameter of type '(oldPath: PathLike, newPath: PathLike) => Promise<void>'.
```
