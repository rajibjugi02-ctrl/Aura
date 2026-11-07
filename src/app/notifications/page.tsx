"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Repeat2,
  MessageCircle,
  UserPlus,
  Bell,
  BellOff,
  Sparkles,
  ChevronDown,
  Check,
  Filter,
  Trash2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNotificationStore, NotificationItem } from "@/store/useNotificationStore";

export default function NotificationsPage() {
  const { notifications, markAllAsRead, toggleFollowUser, clearNotifications } = useNotificationStore();
  const [filterType, setFilterType] = useState<"all" | "like" | "comment" | "follow">("all");

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === "all") return true;
    return n.type === filterType;
  });

  const GROUPS: ("Today" | "This Week" | "Earlier")[] = [
    "Today",
    "This Week",
    "Earlier",
  ];

  return (
    <div className="py-6 px-3 sm:px-6 max-w-4xl mx-auto pb-24 md:pb-12 space-y-6 select-none">
      {/* Header Card */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-2xl border border-white/85 rounded-[28px] p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-slate-900 text-white rounded-2xl shadow-sm shrink-0">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              Notifications
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
              Real-time activity, likes, comments, and followers
            </p>
          </div>
        </div>

        {/* Mobile Filter Dropdown */}
        <div className="sm:hidden">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100/90 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-all border border-slate-200/50 shadow-sm"
              >
                <Filter className="w-3 h-3 text-slate-500" />
                <span className="capitalize">{filterType === "all" ? "All" : `${filterType}s`}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[150px] bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.12)] text-xs text-slate-700 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
              >
                {(["all", "like", "comment", "follow"] as const).map((t) => (
                  <DropdownMenu.Item
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer outline-none transition-colors ${
                      filterType === t
                        ? "bg-slate-900 text-white font-semibold"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="capitalize">{t === "all" ? "All Activity" : `${t}s`}</span>
                    {filterType === t && <Check className="w-3.5 h-3.5 ml-2" />}
                  </DropdownMenu.Item>
                ))}
                {notifications.length > 0 && (
                  <>
                    <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />
                    <DropdownMenu.Item
                      onClick={() => clearNotifications()}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer outline-none text-rose-600 hover:bg-rose-50 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </DropdownMenu.Item>
                  </>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Desktop Filter Badges */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl">
            {(["all", "like", "comment", "follow"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filterType === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "all" ? "All" : `${t}s`}
              </button>
            ))}
          </div>

          {notifications.length > 0 && (
            <button
              onClick={() => clearNotifications()}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2.5 py-1 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List or Empty State */}
      {filteredNotifs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[32px] p-12 text-center shadow-[0_16px_45px_rgba(0,0,0,0.04)] space-y-3"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BellOff className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No notifications yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            When someone likes your photos, leaves a comment, reposts your clip, or starts following you, you will see it here instantly.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const groupNotifs = filteredNotifs.filter((n) => n.timeGroup === group);
            if (groupNotifs.length === 0) return null;

            return (
              <div key={group} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3">
                  {group}
                </h3>

                <div className="bg-white/85 backdrop-blur-2xl border border-white/80 rounded-[28px] divide-y divide-slate-100 shadow-[0_12px_36px_rgba(0,0,0,0.04)] overflow-hidden">
                  {groupNotifs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar with Type badge */}
                        <div className="relative shrink-0">
                          <Link href="/profile">
                            <img
                              src={item.user.avatar}
                              alt={item.user.name}
                              className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200"
                            />
                          </Link>
                          <div
                            className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow-sm ${
                              item.type === "like"
                                ? "bg-rose-500"
                                : item.type === "comment"
                                ? "bg-blue-500"
                                : item.type === "repost"
                                ? "bg-emerald-500"
                                : "bg-purple-600"
                            }`}
                          >
                            {item.type === "like" && <Heart className="w-2.5 h-2.5 fill-white" />}
                            {item.type === "comment" && <MessageCircle className="w-2.5 h-2.5 fill-white" />}
                            {item.type === "repost" && <Repeat2 className="w-2.5 h-2.5 stroke-[3]" />}
                            {item.type === "follow" && <UserPlus className="w-2.5 h-2.5" />}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="text-xs leading-snug min-w-0">
                          <p className="text-slate-800">
                            <Link
                              href="/profile"
                              className="font-bold text-slate-900 hover:underline mr-1"
                            >
                              {item.user.username}
                            </Link>
                            {item.type === "like" && "liked your photo."}
                            {item.type === "repost" && "reposted your photo."}
                            {item.type === "comment" && (
                              <>
                                commented:{" "}
                                <span className="text-slate-600 font-normal">
                                  &ldquo;{item.content}&rdquo;
                                </span>
                              </>
                            )}
                            {item.type === "follow" && "started following you."}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {item.timeAgo}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      {item.type === "follow" ? (
                        <button
                          onClick={() => toggleFollowUser(item.user.username)}
                          className={`text-xs font-semibold px-4 py-1.5 rounded-xl transition-all shrink-0 ${
                            item.isFollowing
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                          }`}
                        >
                          {item.isFollowing ? "Following" : "Follow"}
                        </button>
                      ) : item.postThumbnail ? (
                        <Link href="/" className="shrink-0">
                          <img
                            src={item.postThumbnail}
                            alt="Post preview"
                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 hover:opacity-90 transition-opacity"
                          />
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
