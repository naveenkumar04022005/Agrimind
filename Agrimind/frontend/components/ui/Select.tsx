"use client";

import React, { forwardRef } from "react";
import clsx from "clsx";
import { AlertCircle, ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, id, label, helperText, error, disabled, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
            {props.required && <span className="text-error-text ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-control">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={clsx(
              "w-full rounded-control border text-sm transition-colors duration-150 py-2 pl-3.5 pr-9 bg-white text-neutral-900 appearance-none",
              error
                ? "border-error-border focus:border-error-text focus:ring-1 focus:ring-error-text"
                : "border-neutral-200 hover:border-neutral-300 focus:border-primary-600 focus:ring-1 focus:ring-primary-600",
              disabled && "bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200",
              className
            )}
            {...props}
          >
            {children}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400">
            {error ? (
              <AlertCircle className="w-4 h-4 text-error-text" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>

        {error ? (
          <p className="text-sm text-error-text mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

