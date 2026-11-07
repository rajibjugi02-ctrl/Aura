"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  MessageSquare,
  Bell,
  PlusSquare,
  User,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCreateMenuStore } from "@/store/useCreateMenuStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useChatStore } from "@/store/useChatStore";

export function DesktopFloatingSidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuthStore();
  const { openCreateMenu } = useCreateMenuStore();
  const { unreadCount: unreadNotifications } = useNotificationStore();
  const { conversations } = useChatStore();

  const unreadMessages = conversations.reduce(
    (acc, c) => acc + (c.lastMessage?.isUnread ? 1 : 0),
    0
  );

  const NAV_ITEMS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    {
      href: "/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadMessages > 0 ? unreadMessages : 0,
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : 0,
    },
    { href: "/upload", label: "Create", icon: PlusSquare },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex fixed left-6 top-8 bottom-8 z-40 flex-col justify-between w-20 lg:w-60 bg-white/75 backdrop-blur-2xl border border-white/80 rounded-[32px] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.06)]">
      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-3 px-3 py-2">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          A
        </div>
        <div className="hidden lg:block font-bold text-slate-900 text-lg tracking-tight">
          AuraGlass
        </div>
      </Link>

      {/* Nav links */}
      <nav className="space-y-1.5 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/explore" && pathname === "/search");
          const isCreate = item.label === "Create";

          if (isCreate) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={openCreateMenu}
                className="w-full text-left"
              >
                <motion.div
                  whileHover={{ scale: 1.04, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-white/90"
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </div>
                </motion.div>
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.04, x: 2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/90"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <Icon className="w-5 h-5 shrink-0" />
                    {Boolean(item.badge && item.badge > 0 && !isActive) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <span className="hidden lg:inline">{item.label}</span>
                </div>

                {Boolean(item.badge && item.badge > 0 && !isActive) && (
                  <span className="hidden lg:inline-flex items-center justify-center text-[10px] w-4 h-4 rounded-full bg-rose-50 text-rose-600 font-bold">
                    {item.badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User Mini Profile pill at bottom */}
      <Link href="/profile">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 p-2 bg-white/60 hover:bg-white rounded-2xl border border-white/80 shadow-sm transition-all"
        >
          <img
            src={
              currentUser?.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"
            }
            alt={currentUser?.name || "User"}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
          />
          <div className="hidden lg:block min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {currentUser?.username || "profile"}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentUser?.name || "User"}
            </div>
          </div>
        </motion.div>
      </Link>
    </aside>
  );
}
