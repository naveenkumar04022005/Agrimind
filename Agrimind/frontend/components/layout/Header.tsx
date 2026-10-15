"use client";

import React from "react";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-neutral-50/90 backdrop-blur-sm border-b border-neutral-200/70 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Mobile brand / Desktop Title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="text-base font-semibold text-neutral-900">
            Agrimind
          </span>
        </Link>
        <div className="hidden lg:block">
          {title && (
            <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
        <button
          onClick={() => signOut()}
          className="lg:hidden p-2 text-neutral-500 hover:text-red-700 hover:bg-neutral-100 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
