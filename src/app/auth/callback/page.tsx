"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Signing in with Google...");

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
        if (typeof window === "undefined") return;

        const searchParams = new URLSearchParams(window.location.search);
        const errorParam = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");

        if (errorParam || errorDesc) {
          console.error("OAuth error returned:", errorParam, errorDesc);
          setStatusMessage(`Login failed: ${errorDesc || errorParam}`);
          setTimeout(() => router.replace("/auth/login?error=oauth_rejected"), 2000);
          return;
        }

        // 1. Check if Supabase session is already restored or active
        const { data: initialSession } = await supabase.auth.getSession();
        if (initialSession?.session?.user) {
          completeAuth(initialSession.session.user);
          return;
        }

        // 2. If PKCE authorization code is present in URL
        const code = searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session?.user) {
            completeAuth(data.session.user);
            return;
          }

          // If manual exchange returned error (e.g. background listener already consumed it),
          // re-check getSession
          const { data: retrySession } = await supabase.auth.getSession();
          if (retrySession?.session?.user) {
            completeAuth(retrySession.session.user);
            return;
          }
        }

        // 3. If hash parameters exist (#access_token=...)
        if (window.location.hash.includes("access_token=")) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token") || "";
          if (accessToken) {
            const { data: hashData } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (hashData?.session?.user) {
              completeAuth(hashData.session.user);
              return;
            }
          }
        }
      } catch (err) {
        console.error("[AuthCallback] Error during OAuth callback exchange:", err);
      }
    };

    // 1. Subscribe to auth state change first so no event is missed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !isHandled) {
        completeAuth(session.user);
      }
    });

    handleCallback();

    // Safety timeout: check session one last time before deciding where to route
    const timer = setTimeout(async () => {
      if (!isHandled) {
        const { data: finalSession } = await supabase.auth.getSession();
        if (finalSession?.session?.user) {
          completeAuth(finalSession.session.user);
        } else {
          isHandled = true;
          subscription.unsubscribe();
          router.replace("/auth/login?error=timeout");
        }
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-3 px-4 text-center">
      <div className="w-9 h-9 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      <p className="text-xs font-semibold text-slate-600">{statusMessage}</p>
    </div>
  );
}

