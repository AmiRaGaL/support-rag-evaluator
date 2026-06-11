import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "default" | "success" | "warning" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: BadgeTone;
}

export function Badge({
  children,
  className,
  tone = "default",
  ...props
}: BadgeProps) {
  const classes = ["badge", `badge-${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
