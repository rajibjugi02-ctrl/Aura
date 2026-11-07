"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";
import { DesktopFloatingSidebar } from "./DesktopFloatingSidebar";
import { MobileFloatingBottomBar } from "./MobileFloatingBottomBar";
import { GlobalModals } from "./GlobalModals";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isAuthPage = pathname.startsWith("/auth");
  const isCallbackPage = pathname === "/auth/callback";

  useEffect(() => {
    setHasMounted(true);

    // If on callback page, let AuthCallbackPage handle the token exchange directly
    if (isCallbackPage) {
      setIsCheckingAuth(false);
      return;
    }

    const hasOAuthParams =
      typeof window !== "undefined" &&
      (window.location.hash.includes("access_token=") ||
        window.location.search.includes("code="));

    // Hydrate Supabase authentication session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useAuthStore.getState().syncSupabaseUser(session.user);
        if (pathname.startsWith("/auth") && pathname !== "/auth/callback") {
          router.replace("/");
        }
      }
      setIsCheckingAuth(false);
    }).catch(() => {
      setIsCheckingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        useAuthStore.getState().syncSupabaseUser(session.user);
        setIsCheckingAuth(false);
        if (pathname.startsWith("/auth") && pathname !== "/auth/callback") {
          router.replace("/");
        }
      } else if (event === "SIGNED_OUT") {
        useAuthStore.getState().logout();
        setIsCheckingAuth(false);
      } else {
        setIsCheckingAuth(false);
      }
    });

    const safetyTimer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 1500);

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [isCallbackPage, pathname, router]);

  useEffect(() => {
    if (!hasMounted || isCheckingAuth) return;

    // Never redirect away from the callback page
    if (isCallbackPage) return;

    const hasOAuthParams =
      typeof window !== "undefined" &&
      (window.location.hash.includes("access_token=") ||
        window.location.search.includes("code="));

    // If OAuth params are present in URL but user isn't authenticated yet, wait for listener
    if (!isAuthenticated && hasOAuthParams) return;

    // Unauthenticated users must strictly start at Login
    if (!isAuthenticated && !isAuthPage) {
      router.replace("/auth/login");
    } else if (isAuthenticated && isAuthPage) {
      router.replace("/");
    }
  }, [isAuthenticated, isAuthPage, isCallbackPage, hasMounted, isCheckingAuth, router]);

  // Prevent flash during hydration or initial auth check
  if (!hasMounted || (isCheckingAuth && !isAuthPage)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Pure clean layout for Auth pages
  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        {children}
      </main>
    );
  }

  // Protected application layout
  return (
    <>
      <DesktopFloatingSidebar />
      <div className="md:pl-28 lg:pl-72 xl:pl-76 min-h-screen transition-all">
        {children}
      </div>
      <MobileFloatingBottomBar />
      <GlobalModals />
    </>
  );
}

