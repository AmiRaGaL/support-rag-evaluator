#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const sourcePath = resolve("lib/provider-status.ts");
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const compiledModule = { exports: {} };
const load = new Function("exports", "module", "require", compiled.outputText);
load(compiledModule.exports, compiledModule, () => ({}));

const { getProviderStatus } = compiledModule.exports;

const baseHealth = {
  status: "ok",
  service: "support-rag-api",
  database: "ok",
  llmProvider: "groq",
  embeddingProvider: "gemini",
  embeddingModel: "gemini-embedding-2",
  embeddingDimensions: 1536,
  ragMode: "genai",
  timestamp: "2026-06-16T12:00:00.000Z",
};

assert.equal(getProviderStatus(baseHealth).title, "Hosted GenAI RAG active");
assert.equal(
  getProviderStatus({
    ...baseHealth,
    embeddingProvider: "deterministic",
    ragMode: "hybrid",
  }).title,
  "Deterministic embedding fallback",
);
assert.equal(
  getProviderStatus({
    ...baseHealth,
    llmProvider: "deterministic",
    ragMode: "hybrid",
  }).title,
  "Deterministic generation fallback",
);

console.log("Provider status mapping test passed.");
