"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  PlusSquare,
  MessageSquare,
  Bell,
  User,
} from "lucide-react";
import { useCreateMenuStore } from "@/store/useCreateMenuStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useChatStore } from "@/store/useChatStore";

export function MobileFloatingBottomBar() {
  const pathname = usePathname();
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
    { href: "/upload", label: "Create", icon: PlusSquare, isAction: true },
    {
      href: "/messages",
      label: "Messages",
      icon: MessageSquare,
      hasDot: unreadMessages > 0,
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      hasDot: unreadNotifications > 0,
    },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="flex md:hidden fixed bottom-4 left-4 right-4 z-40 h-16 bg-white/85 backdrop-blur-2xl border border-white/85 rounded-full px-3 items-center justify-around shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href === "/explore" && pathname === "/search");

        if (item.isAction) {
          return (
            <button
              key={item.label}
              type="button"
              onClick={openCreateMenu}
              className="focus:outline-none"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md -translate-y-2 border-2 border-white"
              >
                <Icon className="w-5 h-5 stroke-[2.5]" />
              </motion.div>
            </button>
          );
        }

        return (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className={`relative p-2 rounded-2xl transition-colors ${
                isActive ? "text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.hasDot && !isActive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
