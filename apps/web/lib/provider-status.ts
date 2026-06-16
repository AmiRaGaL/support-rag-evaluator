import type { HealthResponse } from "@/lib/api-client";

export type ProviderStatusTone = "success" | "warning" | "danger";

export interface ProviderStatus {
  badgeTone: ProviderStatusTone;
  title: string;
  description: string;
}

export function getProviderStatus(health: HealthResponse): ProviderStatus {
  if (health.llmProvider === "deterministic") {
    return {
      badgeTone: "warning",
      title: "Deterministic generation fallback",
      description:
        "Generation is deterministic fallback. This is not the full hosted GenAI RAG path.",
    };
  }

  if (health.embeddingProvider === "deterministic") {
    return {
      badgeTone: "warning",
      title: "Deterministic embedding fallback",
      description:
        "Retrieval uses deterministic embeddings. This is not real embedding retrieval.",
    };
  }

  if (health.embeddingProvider === "gemini") {
    return {
      badgeTone: "success",
      title: "Hosted GenAI RAG active",
      description:
        "Using hosted LLM generation and Gemini embedding retrieval.",
    };
  }

  if (health.ragMode === "genai") {
    return {
      badgeTone: "success",
      title: "Hosted GenAI RAG active",
      description: "Using hosted LLM generation and real embedding retrieval.",
    };
  }

  if (health.ragMode === "hybrid") {
    return {
      badgeTone: "warning",
      title: "Hybrid RAG mode",
      description:
        "One provider is deterministic fallback. This is not the full GenAI RAG path.",
    };
  }

  return {
    badgeTone: "danger",
    title: "Deterministic fallback",
    description: "Not real GenAI generation or real embedding retrieval.",
  };
}
