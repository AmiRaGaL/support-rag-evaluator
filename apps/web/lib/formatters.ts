export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatConfidence(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not recorded";
  }

  return formatPercent(value);
}
