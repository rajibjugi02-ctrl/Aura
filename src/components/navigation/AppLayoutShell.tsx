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

  useEffect(() => {
    setHasMounted(true);

    // Hydrate Supabase authentication session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useAuthStore.getState().syncSupabaseUser(session.user);
      }
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        useAuthStore.getState().syncSupabaseUser(session.user);
      } else if (event === "SIGNED_OUT") {
        useAuthStore.getState().logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    if (!hasMounted) return;

    // Unauthenticated users must strictly start at Login
    if (!isAuthenticated && !isAuthPage) {
      router.replace("/auth/login");
    } else if (isAuthenticated && isAuthPage) {
      router.replace("/");
    }
  }, [isAuthenticated, isAuthPage, hasMounted, router]);

  // Prevent flash during hydration
  if (!hasMounted) {
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

