import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

const navigation = [
  { href: "/chat", label: "Chat" },
  { href: "/query-logs", label: "Query Logs" },
  { href: "/eval-runs", label: "Eval Runs" },
  { href: `${apiBaseUrl}/docs`, label: "API Docs", external: true },
];

export const metadata: Metadata = {
  title: "Support RAG Evaluator",
  description: "Eval-driven RAG support assistant dashboard scaffold.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar" aria-label="Primary navigation">
            <Link className="brand" href="/">
              <span className="brand-mark">SRE</span>
              <span>
                <strong>Support RAG</strong>
                <span>Evaluator</span>
              </span>
            </Link>

            <nav className="nav-links">
              {navigation.map((item) =>
                item.external ? (
                  <a
                    href={item.href}
                    key={item.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} key={item.label}>
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </aside>

          <main className="main-panel">{children}</main>
        </div>
      </body>
    </html>
  );
}
