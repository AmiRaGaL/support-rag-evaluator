const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

const dashboardLinks = [
  {
    title: "Chat",
    description: "Grounded support responses with citations.",
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
];

export default function Home() {
  return (
    <div className="home">
      <section className="intro">
        <p className="eyebrow">Dashboard scaffold</p>
        <h1>Support RAG Evaluator</h1>
        <p className="lede">Eval-driven RAG support assistant</p>
      </section>

      <section className="status-strip" aria-label="Project focus">
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
        {dashboardLinks.map((link) => (
          <a className="section-card" href={link.href} key={link.title}>
            <span>{link.title}</span>
            <p>{link.description}</p>
          </a>
        ))}
      </section>
    </div>
  );
}
