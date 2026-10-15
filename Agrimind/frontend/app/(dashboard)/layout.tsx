"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Header } from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirectTo=/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-neutral-200 bg-white text-center space-y-4">
          <div className="text-2xl animate-pulse">🌱</div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-neutral-900">
              Verifying Agrimind Session
            </h3>
            <p className="text-xs text-neutral-500">
              Connecting to local agricultural engine...
            </p>
          </div>
          <div className="w-full space-y-2 pt-2">
            <Skeleton className="h-3 w-3/4 mx-auto" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Desktop Minimal Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 mb-16 lg:mb-6">
          {children}
        </main>
      </div>

      {/* Mobile Minimal Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
