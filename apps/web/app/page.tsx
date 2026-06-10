import Link from "next/link";
import { apiBaseUrl, getHealth, type HealthResponse } from "@/lib/api-client";

export const dynamic = "force-dynamic";

const dashboardSections = [
  {
    title: "Chat",
    description: "Ask support questions and review grounded answers with citations.",
    href: "/chat",
  },
  {
    title: "Query Logs",
    description: "Retrieval, answer, latency, and evaluation metadata.",
    href: "/query-logs",
  },
  {
    title: "Eval Runs",
    description: "Offline checks for retrieval, answers, citations, and refusals.",
    href: "/eval-runs",
  },
  {
    title: "API Docs",
    description: "OpenAPI documentation for the local support RAG service.",
    href: `${apiBaseUrl}/docs`,
    external: true,
  },
];

type HealthState =
  | { connected: true; data: HealthResponse }
  | { connected: false; message: string };

export default async function Home() {
  const health = await loadHealth();

  return (
    <div className="home">
      <section className="intro">
        <p className="eyebrow">Overview dashboard</p>
        <h1>Support RAG Evaluator</h1>
        <p className="lede">Eval-driven RAG support assistant</p>
      </section>

      <section className="health-panel" aria-label="API health">
        <div>
          <p className="eyebrow">API health</p>
          <h2>{health.connected ? "Connected" : "Disconnected"}</h2>
          <p>
            {health.connected
              ? `Service ${health.data.service} reports ${health.data.status}.`
              : health.message}
          </p>
        </div>
        <span
          className={
            health.connected ? "status-pill status-pill-ok" : "status-pill"
          }
        >
          {health.connected ? health.data.database : "offline"}
        </span>
      </section>

      <section className="status-strip" aria-label="Dashboard signals">
        <div>
          <span className="metric-label">Grounding</span>
          <strong>Docs only</strong>
        </div>
        <div>
          <span className="metric-label">Evidence</span>
          <strong>Citations</strong>
        </div>
        <div>
          <span className="metric-label">Unsupported</span>
          <strong>Refusals</strong>
        </div>
        <div>
          <span className="metric-label">API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
      </section>

      <section className="link-grid" aria-label="Dashboard sections">
        {dashboardSections.map((section) =>
          section.external ? (
            <a
              className="section-card"
              href={section.href}
              key={section.title}
              rel="noreferrer"
              target="_blank"
            >
              <span>{section.title}</span>
              <p>{section.description}</p>
            </a>
          ) : (
            <Link className="section-card" href={section.href} key={section.title}>
              <span>{section.title}</span>
              <p>{section.description}</p>
            </Link>
          ),
        )}
      </section>
    </div>
  );
}

async function loadHealth(): Promise<HealthState> {
  try {
    return {
      connected: true,
      data: await getHealth(),
    };
  } catch {
    return {
      connected: false,
      message:
        "The dashboard cannot reach the API right now. Start the API locally and refresh when it is ready.",
    };
  }
}
