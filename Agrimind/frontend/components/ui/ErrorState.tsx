"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  technicalDetails?: string;
  inline?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't retrieve the requested agricultural information.",
  onRetry,
  technicalDetails,
  inline = false,
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (inline) {
    return (
      <div
        className={clsx(
          "p-3.5 rounded-lg bg-error-light border border-error-border flex items-start gap-3",
          className
        )}
      >
        <AlertCircle className="w-4 h-4 text-error-text shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <p className="font-medium text-error-text">{title}</p>
          <p className="text-neutral-600 mt-0.5">{message}</p>
          {technicalDetails && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-neutral-500 hover:text-neutral-700 underline mt-1"
            >
              {showDetails ? "Hide technical details" : "View technical details"}
            </button>
          )}
          {showDetails && technicalDetails && (
            <pre className="mt-1.5 p-2 rounded bg-neutral-100 text-[10px] text-neutral-600 overflow-x-auto">
              {technicalDetails}
            </pre>
          )}
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-xl border border-neutral-200 bg-white",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-error-light border border-error-border flex items-center justify-center text-error-text mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>

      <h3 className="text-base font-semibold text-neutral-900 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button
          size="md"
          variant="secondary"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}

      {technicalDetails && (
        <div className="mt-4 pt-3 border-t border-neutral-100 w-full max-w-md">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <span>Developer Details</span>
            {showDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {showDetails && (
            <pre className="mt-2 text-left p-2.5 rounded bg-neutral-50 text-[11px] font-mono text-neutral-600 border border-neutral-200 overflow-x-auto">
              {technicalDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
