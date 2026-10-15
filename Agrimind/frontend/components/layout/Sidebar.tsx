"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Sprout,
  Wheat,
  FlaskConical,
  HeartPulse,
  Bot,
  Settings,
  LogOut,
  CloudSun,
} from "lucide-react";
import clsx from "clsx";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Farm",
      href: "/farm",
      icon: Sprout,
      active: pathname === "/farm" || pathname === "/farm-profile",
    },
    {
      name: "Crops",
      href: "/crops",
      icon: Wheat,
      active: pathname === "/crops",
    },
    {
      name: "Weather",
      href: "/weather",
      icon: CloudSun,
      active: pathname === "/weather",
    },
    {
      name: "Fertilizer",
      href: "/fertilizer",
      icon: FlaskConical,
      active: pathname === "/fertilizer",
    },
    {
      name: "Crop Health",
      href: "/crop-health",
      icon: HeartPulse,
      active: pathname === "/crop-health" || pathname === "/disease",
    },
    {
      name: "Assistant",
      href: "/assistant",
      icon: Bot,
      active: pathname === "/assistant",
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-neutral-200 bg-white min-h-screen px-4 py-6">
      {/* Brand logo */}
      <div>
        <div className="px-3 mb-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="text-xl">🌱</span>
            <span className="text-lg font-semibold tracking-tight text-neutral-900">
              Agrimind
            </span>
          </Link>
          <p className="text-[11px] text-neutral-400 mt-1 pl-7">
            Intelligent Farming Companion
          </p>
        </div>

        {/* Primary navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  item.active
                    ? "bg-primary-50 text-primary-700 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                )}
              >
                <Icon
                  className={clsx(
                    "w-4 h-4",
                    item.active ? "text-primary-700" : "text-neutral-400"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Secondary & User Profile */}
      <div className="pt-4 border-t border-neutral-100 space-y-1">
        <Link
          href="/settings"
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary-50 text-primary-700 font-semibold"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
          )}
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span>Settings</span>
        </Link>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 hover:text-red-700 hover:bg-red-50/60 transition-colors"
        >
          <LogOut className="w-4 h-4 text-neutral-400" />
          <span>Sign Out</span>
        </button>

        {user && (
          <div className="pt-3 mt-2 border-t border-neutral-100 px-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700">
              {(user.name || user.email || "F").charAt(0).toUpperCase()}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-medium text-neutral-900 truncate">
                {user.name || "Farmer"}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
