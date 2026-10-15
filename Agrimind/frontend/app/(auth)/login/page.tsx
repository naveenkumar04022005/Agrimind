"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const { user, isLoading: authLoading, signIn, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      } else {
        setSuccessMessage("Signed in successfully.");
        router.replace(redirectTo);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm p-6 sm:p-8 shadow-card">
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <span className="text-2xl">🌱</span>
          <span className="text-xl font-semibold tracking-tight text-neutral-900">
            Agrimind
          </span>
        </Link>
        <h2 className="text-lg font-semibold text-neutral-900">Welcome back</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Sign in to your farm assistant
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-success-light border border-success-border text-xs text-success-text flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-error-light border border-error-border text-xs text-error-text flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google Sign In option */}
      <div className="mb-5">
        <GoogleAuthButton
          redirectTo={redirectTo}
          onError={(msg) => setErrorMessage(msg)}
          text="Continue with Google"
        />

        <div className="relative mt-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-neutral-400">or with email</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="farmer@agrimind.ai"
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />
          <div className="text-right mt-1.5">
            <Link
              href="/forgot-password"
              className="text-[11px] text-neutral-500 hover:text-primary-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!isConfigured}
          className="w-full mt-2"
          size="md"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-neutral-100 text-center text-xs text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary-700 font-medium hover:underline"
        >
          Register
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-neutral-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
