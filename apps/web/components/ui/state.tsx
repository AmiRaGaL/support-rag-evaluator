import type { ReactNode } from "react";

interface StateProps {
  action?: ReactNode;
  children?: ReactNode;
  title: string;
}

export function EmptyState({ action, children, title }: StateProps) {
  return (
    <div className="state-message state-panel empty-state">
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
      {action ? <div className="state-actions">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ action, children, title }: StateProps) {
  return (
    <div className="state-message state-panel error-state" role="alert">
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
      {action ? <div className="state-actions">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ action, children, title }: StateProps) {
  return (
    <div
      className="state-message state-panel loading-state"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="loading-dot" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {children ? <p>{children}</p> : null}
        {action ? <div className="state-actions">{action}</div> : null}
      </div>
    </div>
  );
}
