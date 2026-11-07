"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle } = useAuthStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("Account registered successfully! Please sign in with your credentials.");
    }
    const err = searchParams.get("error");
    if (err) {
      if (err === "timeout") {
        setError("Sign in timed out while connecting to Google. Please try again.");
      } else if (err === "oauth_rejected") {
        setError("Google authentication was cancelled or rejected.");
      } else {
        setError(`Authentication issue: ${err}`);
      }
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("Please fill in both fields");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(identifier, password);
      setIsLoading(false);
      router.push("/");
    }, 400);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      console.error("Google login error:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to initialize Google login. Please check configuration.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-white/85 backdrop-blur-2xl border border-white/80 p-8 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to explore stories, notes & chats
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Phone Number"
            placeholder="name@domain.com or +1 234..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={<User className="w-4 h-4" />}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-11 bg-slate-50/70 border border-slate-200/80 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/90 px-3 text-slate-400 font-medium">
                or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="glass"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-11 text-sm font-medium border border-slate-200/80 bg-white hover:bg-slate-50"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Login with Google
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-slate-900 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

