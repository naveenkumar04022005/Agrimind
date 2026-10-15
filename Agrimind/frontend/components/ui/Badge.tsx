"use client";

import React from "react";
import clsx from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const base = "inline-flex items-center font-medium rounded-md tracking-tight";

  const variants = {
    primary: "bg-primary-50 text-primary-700 border border-primary-200",
    success: "bg-success-light text-success-text border border-success-border",
    warning: "bg-warning-light text-warning-text border border-warning-border",
    error: "bg-error-light text-error-text border border-error-border",
    info: "bg-info-light text-info-text border border-info-border",
    neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
