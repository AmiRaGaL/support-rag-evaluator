import Link from "next/link";
import { Badge, Card, MetricCard, PageHeader } from "@/components/ui";
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
      <PageHeader
        description="Eval-driven RAG support assistant"
        eyebrow="Overview dashboard"
        title="Support RAG Evaluator"
      />

      <Card className="health-panel" aria-label="API health">
        <div>
          <p className="eyebrow">API health</p>
          <h2>{health.connected ? "Connected" : "Disconnected"}</h2>
          <p>
            {health.connected
              ? `Service ${health.data.service} reports ${health.data.status}.`
              : health.message}
          </p>
        </div>
        <Badge tone={health.connected ? "success" : "danger"}>
          {health.connected ? health.data.database : "offline"}
        </Badge>
      </Card>

      <dl className="metric-grid overview-metrics" aria-label="Dashboard signals">
        <MetricCard label="Grounding" value="Docs only" />
        <MetricCard label="Evidence" value="Citations" />
        <MetricCard label="Unsupported" value="Refusals" />
        <MetricCard label="API" value={apiBaseUrl} />
      </dl>

      <section className="link-grid" aria-label="Dashboard sections">
        {dashboardSections.map((section) =>
          section.external ? (
            <a
              className="card section-card"
              href={section.href}
              key={section.title}
              rel="noreferrer"
              target="_blank"
            >
              <span>{section.title}</span>
              <p>{section.description}</p>
            </a>
          ) : (
            <Link
              className="card section-card"
              href={section.href}
              key={section.title}
            >
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
