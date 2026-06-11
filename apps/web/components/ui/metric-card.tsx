import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="metric-card">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
