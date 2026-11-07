"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let isHandled = false;

    const completeAuth = (user: unknown) => {
      if (isHandled) return;
      isHandled = true;
      if (user) {
        useAuthStore.getState().syncSupabaseUser(user);
      }
      router.replace("/");
    };

    const handleCallback = async () => {
      try {
        if (typeof window !== "undefined") {
          // 1. Handle PKCE authorization code if present
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session?.user) {
              completeAuth(data.session.user);
              return;
            }
          }

          // 2. Check if session already active or hydrated from hash
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            completeAuth(session.user);
            return;
          }
        }
      } catch (err) {
        console.error("[AuthCallback] Error during OAuth callback exchange:", err);
      }
    };

    // 3. Fallback: subscribe to auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        completeAuth(session.user);
      }
    });

    handleCallback();

    // Safety timeout: redirect within 2 seconds regardless to prevent hanging
    const timer = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        subscription.unsubscribe();
        router.replace("/");
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-3">
      <div className="w-9 h-9 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      <p className="text-xs font-semibold text-slate-500">Signing in with Google...</p>
    </div>
  );
}

