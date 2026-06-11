#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const sourcePath = resolve("lib/eval-analytics.ts");
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const compiledModule = { exports: {} };
const load = new Function("exports", "module", compiled.outputText);
load(compiledModule.exports, compiledModule);

const { shapeEvalAnalytics } = compiledModule.exports;

assert.equal(typeof shapeEvalAnalytics, "function");

const emptySummary = shapeEvalAnalytics([]);
assert.deepEqual(emptySummary, {
  runCount: 0,
  totalCases: 0,
  passedCases: 0,
  failedCases: 0,
  refusalAccuracy: 0,
  citationAccuracy: 0,
  answerMatchAccuracy: 0,
  trend: [],
});

const runs = [
  evalRun({
    id: "newer",
    createdAt: "2026-06-11T12:00:00.000Z",
    totalCases: 2,
    passedCases: 1,
    failedCases: 1,
    refusalAccuracy: 0.5,
    citationAccuracy: 1,
    answerMatchAccuracy: 0.5,
  }),
  evalRun({
    id: "older",
    createdAt: "2026-06-10T12:00:00.000Z",
    totalCases: 6,
    passedCases: 6,
    failedCases: 0,
    refusalAccuracy: 1,
    citationAccuracy: 0.5,
    answerMatchAccuracy: 1,
  }),
];

const summary = shapeEvalAnalytics(runs);

assert.equal(summary.runCount, 2);
assert.equal(summary.totalCases, 8);
assert.equal(summary.passedCases, 7);
assert.equal(summary.failedCases, 1);
assert.equal(summary.refusalAccuracy, 0.875);
assert.equal(summary.citationAccuracy, 0.625);
assert.equal(summary.answerMatchAccuracy, 0.875);
assert.deepEqual(
  summary.trend.map((point) => point.id),
  ["older", "newer"],
);
assert.deepEqual(
  summary.trend.map((point) => point.label),
  ["Run 1", "Run 2"],
);
assert.equal(summary.trend[0].passRate, 1);
assert.equal(summary.trend[1].passRate, 0.5);

console.log("Eval analytics shaping tests passed.");

function evalRun(overrides) {
  return {
    id: "run",
    name: "baseline",
    datasetPath: "/repo/datasets/evals/baseline.json",
    totalCases: 0,
    passedCases: 0,
    failedCases: 0,
    refusalAccuracy: 0,
    citationAccuracy: 0,
    answerMatchAccuracy: 0,
    provider: "deterministic",
    createdAt: "2026-06-10T00:00:00.000Z",
    results: [],
    ...overrides,
  };
}
