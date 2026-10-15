"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sprout,
  Wheat,
  HeartPulse,
  Bot,
} from "lucide-react";
import clsx from "clsx";

export function MobileNav() {
  const pathname = usePathname();

  const items = [
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
      name: "Health",
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-2 py-2 flex items-center justify-around safe-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
              item.active
                ? "text-primary-700 font-semibold"
                : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            <Icon
              className={clsx(
                "w-5 h-5",
                item.active ? "text-primary-700" : "text-neutral-400"
              )}
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
