#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const clientPath = resolve(appRoot, "lib/api-client.generated.ts");
const openApiSource =
  process.env.OPENAPI_JSON_PATH ??
  process.env.OPENAPI_URL ??
  "http://localhost:3001/docs-json";

const requiredPaths = [
  "/health",
  "/chat",
  "/chat/stream",
  "/ingestion/sample-docs",
  "/retrieval/embed-missing",
  "/query-logs",
  "/query-logs/{id}",
  "/evals/run-baseline",
  "/evals/runs",
  "/evals/runs/{id}",
];

async function main() {
  const document = await readOpenApiDocument(openApiSource);

  if (document) {
    validateRequiredPaths(document, requiredPaths);
    console.log(`Validated API client paths against ${openApiSource}.`);
  } else {
    console.log(
      `OpenAPI document was not available at ${openApiSource}; keeping the checked-in generated-style client.`,
    );
  }

  const currentClient = await readFile(clientPath, "utf8");
  await writeFile(clientPath, currentClient);
  console.log(`API client is ready at ${clientPath}.`);
}

async function readOpenApiDocument(source) {
  try {
    if (source.startsWith("http://") || source.startsWith("https://")) {
      const response = await fetch(source);

      if (!response.ok) {
        return null;
      }

      return response.json();
    }

    return JSON.parse(await readFile(resolve(appRoot, source), "utf8"));
  } catch {
    return null;
  }
}

function validateRequiredPaths(document, paths) {
  if (!document || typeof document !== "object" || !document.paths) {
    throw new Error("OpenAPI document does not contain a paths object.");
  }

  const missing = paths.filter((path) => !document.paths[path]);

  if (missing.length > 0) {
    throw new Error(
      `OpenAPI document is missing required paths: ${missing.join(", ")}`,
    );
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
