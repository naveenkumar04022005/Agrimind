"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  redirectTo?: string;
  onError?: (message: string) => void;
  text?: string;
}

export function GoogleAuthButton({
  redirectTo = "/dashboard",
  onError,
  text = "Continue with Google",
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const handleGoogleClick = async () => {
    setIsLoading(true);
    try {
      const email = customEmail.trim() || undefined;
      const name = customName.trim() || undefined;
      const { error } = await signInWithGoogle(
        email ? { email, name } : undefined
      );

      if (error) {
        onError?.(error.message);
        setIsLoading(false);
      } else {
        router.replace(redirectTo);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Google authentication failed.";
      onError?.(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={isLoading}
        className="w-full relative flex items-center justify-center gap-2.5 px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-50 text-neutral-800 text-sm font-medium transition-colors border border-neutral-200 shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
        ) : (
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>{isLoading ? "Connecting to Google..." : text}</span>
      </button>

      {/* Optional link to customize Google test email */}
      <div className="mt-1 text-center">
        <button
          type="button"
          onClick={() => setShowPrompt(!showPrompt)}
          className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          {showPrompt ? "✕ Hide custom account" : "Customize Google account"}
        </button>
      </div>

      {showPrompt && (
        <div className="mt-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-2">
          <div>
            <label className="block text-[11px] text-neutral-500 mb-0.5">
              Google Email
            </label>
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="e.g. surya@gmail.com"
              className="w-full px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-neutral-800 text-xs focus:outline-none focus:border-primary-600"
            />
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 mb-0.5">
              Full Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Surya Farmer"
              className="w-full px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-neutral-800 text-xs focus:outline-none focus:border-primary-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}
