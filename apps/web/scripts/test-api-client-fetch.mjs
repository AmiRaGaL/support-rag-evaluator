#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const sourcePath = resolve("lib/api-client.generated.ts");
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const originalFetch = globalThis.fetch;
const calls = [];

globalThis.fetch = function boundFetchProbe(input, init) {
  assert.equal(this, globalThis);
  calls.push({ input, init });

  return Promise.resolve({
    ok: true,
    json: async () => ({
      status: "ok",
      service: "support-rag-evaluator-api",
      database: "ok",
      timestamp: "2026-06-11T00:00:00.000Z",
    }),
  });
};

try {
  const compiledModule = { exports: {} };
  const load = new Function("exports", "module", compiled.outputText);
  load(compiledModule.exports, compiledModule);

  const { GeneratedApiClient } = compiledModule.exports;
  const client = new GeneratedApiClient({
    resolveUrl: (path) => `https://api.example.test${path}`,
  });

  const response = await client.getHealth();

  assert.equal(response.status, "ok");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, "https://api.example.test/health");
  assert.equal(calls[0].init.method, "GET");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("API client default fetch binding test passed.");
