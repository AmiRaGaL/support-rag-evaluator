"use client";

import Link from "next/link";
import { useState } from "react";
import {
  apiBaseUrl,
  embedMissingChunks,
  getApiErrorMessage,
  ingestSampleDocs,
  runBaselineEval,
} from "@/lib/api-client";
import { Button, Card, ErrorState, LoadingState } from "@/components/ui";

type SetupActionId = "ingest" | "embed" | "baseline";

interface ActionState {
  error: string | null;
  success: string | null;
}

const setupActions: Array<{
  id: SetupActionId;
  title: string;
  description: string;
  buttonLabel: string;
  loadingTitle: string;
  loadingText: string;
}> = [
  {
    id: "ingest",
    title: "Ingest sample docs",
    description:
      "Loads the bundled support markdown files and chunks them for retrieval.",
    buttonLabel: "Ingest sample docs",
    loadingTitle: "Ingesting sample docs",
    loadingText: "Reading bundled docs, chunking content, and saving records.",
  },
  {
    id: "embed",
    title: "Embed missing chunks",
    description:
      "Creates deterministic local embeddings for chunks that do not have vectors yet.",
    buttonLabel: "Embed missing chunks",
    loadingTitle: "Embedding missing chunks",
    loadingText: "Generating local vectors for stored support chunks.",
  },
  {
    id: "baseline",
    title: "Run baseline eval",
    description:
      "Runs the baseline dataset and persists retrieval, citation, answer, and refusal results.",
    buttonLabel: "Run baseline eval",
    loadingTitle: "Running baseline eval",
    loadingText:
      "Preparing docs, embedding missing chunks, running cases, and saving the eval run.",
  },
];

const initialState: Record<SetupActionId, ActionState> = {
  ingest: { error: null, success: null },
  embed: { error: null, success: null },
  baseline: { error: null, success: null },
};

export function SetupActions() {
  const [activeAction, setActiveAction] = useState<SetupActionId | null>(null);
  const [actionState, setActionState] = useState(initialState);

  async function handleAction(actionId: SetupActionId) {
    setActiveAction(actionId);
    setActionState((current) => ({
      ...current,
      [actionId]: { error: null, success: null },
    }));

    try {
      const success = await runSetupAction(actionId);

      setActionState((current) => ({
        ...current,
        [actionId]: { error: null, success },
      }));
    } catch (error) {
      setActionState((current) => ({
        ...current,
        [actionId]: {
          error: getApiErrorMessage(error),
          success: null,
        },
      }));
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <Card className="setup-panel" aria-label="Demo setup actions">
      <div className="setup-header">
        <div>
          <p className="eyebrow">Demo setup</p>
          <h2>Prepare a support RAG demo</h2>
        </div>
        <p>
          These actions are explicit and run only when clicked. The default
          deterministic embedding path does not require <code>GROQ_API_KEY</code>.
        </p>
      </div>

      <ol className="demo-flow" aria-label="Recommended demo flow">
        <li>Ingest sample docs</li>
        <li>Embed missing chunks</li>
        <li>
          <Link href="/chat">Ask a chat question</Link>
        </li>
        <li>
          <Link href="/query-logs">Inspect query logs</Link>
        </li>
        <li>Run baseline eval</li>
      </ol>

      <div className="setup-actions">
        {setupActions.map((action) => {
          const isLoading = activeAction === action.id;
          const isDisabled = activeAction !== null;
          const state = actionState[action.id];

          return (
            <section className="setup-action" key={action.id}>
              <div>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <Button
                disabled={isDisabled}
                onClick={() => void handleAction(action.id)}
                type="button"
              >
                {isLoading ? "Working..." : action.buttonLabel}
              </Button>

              {isLoading ? (
                <LoadingState title={action.loadingTitle}>
                  {action.loadingText}
                </LoadingState>
              ) : null}
              {state.success ? (
                <p className="success-message">{state.success}</p>
              ) : null}
              {state.error ? (
                <ErrorState title={`${action.title} failed`}>
                  {state.error} Current API base URL:{" "}
                  <code>{apiBaseUrl}</code>.
                </ErrorState>
              ) : null}
            </section>
          );
        })}
      </div>
    </Card>
  );
}

async function runSetupAction(actionId: SetupActionId) {
  if (actionId === "ingest") {
    const result = await ingestSampleDocs();

    return `Ingested ${result.documentsProcessed} sample docs and created ${result.chunksCreated} chunks.`;
  }

  if (actionId === "embed") {
    const result = await embedMissingChunks();

    return result.embeddedCount === 0
      ? "All stored chunks already have embeddings."
      : `Embedded ${result.embeddedCount} missing chunks.`;
  }

  const result = await runBaselineEval();

  return `Baseline eval completed and saved as ${result.evalRunId}.`;
}
