import type { ReactNode } from "react";

interface StateProps {
  children: ReactNode;
}

export function EmptyState({ children }: StateProps) {
  return <p className="state-message empty-state">{children}</p>;
}

export function ErrorState({ children }: StateProps) {
  return (
    <p className="state-message error-state" role="alert">
      {children}
    </p>
  );
}

export function LoadingState({ children }: StateProps) {
  return (
    <p className="state-message loading-state" aria-live="polite">
      {children}
    </p>
  );
}
