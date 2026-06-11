import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "section" | "div";
  children: ReactNode;
}

export function Card({
  as: Component = "section",
  children,
  className,
  ...props
}: CardProps) {
  const classes = ["card", className].filter(Boolean).join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
