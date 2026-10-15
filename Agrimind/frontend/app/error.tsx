"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Agrimind runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-md p-8 text-center shadow-card space-y-4">
        <div className="w-10 h-10 rounded-full bg-error-light border border-error-border flex items-center justify-center text-error-text mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>

        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Application error
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
          Agrimind encountered an unexpected condition while loading this page. Your data remains safe.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => reset()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Try Again
          </Button>

          <Link href="/dashboard">
            <Button size="sm" variant="outline">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
