"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let isHandled = false;

    const handleCallback = async () => {
      try {
        // 1. Check if user session is already established
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !isHandled) {
          isHandled = true;
          useAuthStore.getState().syncSupabaseUser(session.user);
          router.replace("/");
          return;
        }

        // 2. If PKCE authorization code is present in URL, exchange it for session
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session?.user && !isHandled) {
              isHandled = true;
              useAuthStore.getState().syncSupabaseUser(data.session.user);
              router.replace("/");
              return;
            }
          }
        }
      } catch (err) {
        console.error("[AuthCallback] Error during OAuth callback exchange:", err);
      }

      // 3. Fallback: subscribe to auth state change in case of slight delay
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user && !isHandled) {
          isHandled = true;
          useAuthStore.getState().syncSupabaseUser(session.user);
          router.replace("/");
        }
      });

      // Safety timeout
      setTimeout(() => {
        if (!isHandled) {
          isHandled = true;
          subscription.unsubscribe();
          router.replace("/");
        }
      }, 2500);
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-3">
      <div className="w-9 h-9 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      <p className="text-xs font-semibold text-slate-500">Signing in with Google...</p>
    </div>
  );
}
