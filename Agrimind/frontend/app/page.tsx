"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  CloudSun,
  Wheat,
  FlaskConical,
  HeartPulse,
  Bot,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between selection:bg-primary-100 selection:text-primary-800">
      {/* Minimal Top Header */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-neutral-200/60">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl">🌱</span>
          <span className="text-lg font-semibold tracking-tight text-neutral-900">
            Agrimind
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!isLoading && user ? (
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-medium mb-6">
          <span>🌱</span>
          <span>Intelligent Agronomy</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-900 mb-6 leading-tight">
          Your intelligent farming companion.
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Agrimind turns weather forecasts, soil parameters, and crop imagery
          into clear, actionable daily decisions for farmers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started
            </Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Learn More
            </Button>
          </a>
        </div>
      </section>

      {/* 2. HOW AGRIMIND WORKS */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16 border-t border-neutral-200/60">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-700 mb-1">
            How Agrimind Works
          </h2>
          <p className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Designed for everyday farm management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white border border-neutral-200">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-700 mb-4">
              01
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
              Connect Your Farm
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Enter your acreage, soil characteristics, and location to establish a
              localized microclimate baseline.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-neutral-200">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-700 mb-4">
              02
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
              Receive Daily Advisories
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Understand whether to irrigate, spray, or harvest with weather
              intelligence that anticipates rain and winds.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-neutral-200">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-700 mb-4">
              03
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
              Protect Your Harvest
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Upload leaf photos for instant pathology screening and receive
              tailored organic or chemical treatment plans.
            </p>
          </div>
        </div>
      </section>

      {/* 3. KEY CAPABILITIES */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-neutral-200/60">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-700 mb-1">
            Capabilities
          </h2>
          <p className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Comprehensive farm decision support.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-white border border-neutral-200 space-y-2">
            <CloudSun className="w-5 h-5 text-primary-600" />
            <h4 className="text-sm font-semibold text-neutral-900">
              Weather Telemetry
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              7-day agricultural forecasts with rain probability, surface wind, and
              microclimate alerts.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-neutral-200 space-y-2">
            <Wheat className="w-5 h-5 text-primary-600" />
            <h4 className="text-sm font-semibold text-neutral-900">
              Crop Recommendation
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Match soil NPK, pH, and precipitation with optimal crops for the
              upcoming growing season.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-neutral-200 space-y-2">
            <FlaskConical className="w-5 h-5 text-primary-600" />
            <h4 className="text-sm font-semibold text-neutral-900">
              Precision Fertilizer
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Nutrient dosage tailored to growth stage, preventing overuse and
              protecting soil health.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-neutral-200 space-y-2">
            <HeartPulse className="w-5 h-5 text-primary-600" />
            <h4 className="text-sm font-semibold text-neutral-900">
              Crop Health Vision
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Computer-vision diagnostics detect foliar diseases and provide
              clear organic remedies.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-neutral-200 space-y-2">
            <Bot className="w-5 h-5 text-primary-600" />
            <h4 className="text-sm font-semibold text-neutral-900">
              Agronomy Assistant
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Ask questions anytime about field conditions, irrigation scheduling,
              or pest control.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-neutral-200 space-y-2">
            <CheckCircle2 className="w-5 h-5 text-primary-600" />
            <h4 className="text-sm font-semibold text-neutral-900">
              Daily Farm Plan
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              A calm, actionable checklist of priority tasks based on today&apos;s field
              and weather telemetry.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SIMPLE WORKFLOW */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200/60 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-700 mb-1">
          Simple Workflow
        </h2>
        <p className="text-2xl font-semibold text-neutral-900 tracking-tight mb-8">
          Clear answers in seconds.
        </p>

        <div className="p-6 rounded-2xl bg-white border border-neutral-200 text-left max-w-lg mx-auto space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-900">
                &ldquo;Should I irrigate today?&rdquo;
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Agrimind evaluates 48-hour rainfall probability and crop water requirements before answering.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-900">
                &ldquo;Is it safe to spray foliar nutrients?&rdquo;
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Agrimind reviews wind drift velocity and foliage moisture index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-neutral-200/60 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
          Start making calmer farming decisions today.
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mb-6 max-w-md mx-auto">
          Free to use for individual farmers and agricultural researchers.
        </p>
        <Link href={user ? "/dashboard" : "/register"}>
          <Button size="lg">Get Started with Agrimind</Button>
        </Link>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-200/60 py-8 px-6 text-center text-xs text-neutral-400">
        <p>© {new Date().getFullYear()} Agrimind. Less interface. More intelligence.</p>
      </footer>
    </div>
  );
}
