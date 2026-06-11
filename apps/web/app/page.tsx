import Link from "next/link";
import { Suspense } from "react";
import {
  Badge,
  Card,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
} from "@/components/ui";
import { SetupActions } from "@/components/dashboard/setup-actions";
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
  return (
    <div className="home">
      <PageHeader
        description="Eval-driven RAG support assistant"
        eyebrow="Overview dashboard"
        title="Support RAG Evaluator"
      />

      <Suspense fallback={<HealthPanelLoading />}>
        <HealthPanel />
      </Suspense>

      <dl className="metric-grid overview-metrics" aria-label="Dashboard signals">
        <MetricCard label="Grounding" value="Docs only" />
        <MetricCard label="Evidence" value="Citations" />
        <MetricCard label="Unsupported" value="Refusals" />
        <MetricCard label="API" value={apiBaseUrl} />
      </dl>

      <SetupActions />

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

async function HealthPanel() {
  const health = await loadHealth();

  if (!health.connected) {
    return (
      <Card className="health-panel" aria-label="API health">
        <ErrorState title="API unavailable">
          {health.message} Check that <code>NEXT_PUBLIC_API_BASE_URL</code>{" "}
          points to <code>{apiBaseUrl}</code>, then refresh the dashboard.
        </ErrorState>
        <Badge tone="danger">offline</Badge>
      </Card>
    );
  }

  return (
    <Card className="health-panel" aria-label="API health">
      <div>
        <p className="eyebrow">API health</p>
        <h2>Connected</h2>
        <p>
          Service {health.data.service} reports {health.data.status}. Database
          status is {health.data.database}.
        </p>
      </div>
      <Badge tone="success">{health.data.database}</Badge>
    </Card>
  );
}

function HealthPanelLoading() {
  return (
    <Card className="health-panel" aria-label="API health">
      <LoadingState title="Checking API health">
        Contacting <code>{apiBaseUrl}/health</code> before showing dashboard
        status.
      </LoadingState>
      <Badge>checking</Badge>
    </Card>
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
      message: "The dashboard cannot reach the support API right now.",
    };
  }
}
