"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-md p-8 text-center shadow-card space-y-4">
        <span className="text-3xl block">🌱</span>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Page not found
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
          The requested page or resource could not be found. Please check the URL or return to the dashboard.
        </p>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
