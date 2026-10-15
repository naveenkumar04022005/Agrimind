"use client";

import React from "react";
import clsx from "clsx";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-neutral-200 bg-white",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-900 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryAction) && (
        <div className="flex items-center gap-3">
          {actionLabel && actionHref && (
            <a href={actionHref}>
              <Button size="md">{actionLabel}</Button>
            </a>
          )}
          {actionLabel && onAction && !actionHref && (
            <Button size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
