"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Film,
  Heart,
  MessageCircle,
  Sparkles,
  TrendingUp,
  X,
  User,
} from "lucide-react";
import Link from "next/link";
import { useReelsStore } from "@/store/useReelsStore";
import { useFeedStore } from "@/store/useFeedStore";
import { useAuthStore } from "@/store/useAuthStore";

interface ExploreItem {
  id: string;
  type: "image" | "reel";
  url: string;
  author: string;
  likes: number;
  comments: number;
  span?: "tall" | "normal";
  category: string;
}

const CATEGORY_CHIPS = [
  "All",
  "Architecture",
  "Photography",
  "Soundscapes",
  "Minimalist",
  "Tokyo",
  "Reels",
];

export default function ExplorePage() {
  const { reels } = useReelsStore();
  const { posts } = useFeedStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const dynamicReelItems: ExploreItem[] = reels.map((r) => ({
    id: r.id,
    type: "reel",
    url: r.mediaUrl,
    author: r.author.username,
    likes: r.likesCount,
    comments: r.commentsCount,
    span: "tall",
    category: "Reels",
  }));

  const dynamicPostItems: ExploreItem[] = posts.map((p) => ({
    id: p.id,
    type: "image",
    url: p.media[0]?.url || "",
    author: p.author.username,
    likes: p.likesCount,
    comments: p.commentsCount,
    category: "Architecture",
  }));

  // Render ONLY real data from user uploads and store
  const combinedItems = [...dynamicReelItems, ...dynamicPostItems];

  const filteredItems = combinedItems.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    return (
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const { accounts } = useAuthStore();

  const matchingAccounts = searchQuery.trim()
    ? accounts.filter(
        (acc) =>
          acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          acc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="py-6 px-3 sm:px-6 max-w-7xl mx-auto pb-24 md:pb-12 space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/85 rounded-[28px] p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.04)] space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts, aesthetics, reels, or soundtracks..."
            className="w-full h-11 pl-11 pr-10 bg-slate-100/70 border border-slate-200/50 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Matching Accounts Dropdown when typing */}
        <AnimatePresence>
          {matchingAccounts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-2 bg-white/95 rounded-2xl border border-slate-100 shadow-lg space-y-1"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                Accounts
              </div>
              {matchingAccounts.map((acc) => (
                <Link
                  key={acc.username}
                  href="/profile"
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {acc.username}
                    </div>
                    <div className="text-[11px] text-slate-400">{acc.name} • {acc.bio}</div>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {CATEGORY_CHIPS.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State when no real content is available */}
      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[32px] p-12 text-center shadow-sm space-y-3"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Explore is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Create your first post or upload a reel to see it populated on the Explore grid in real-time.
          </p>
        </motion.div>
      )}

      {/* Main Full-Width Explore / Masonry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 auto-rows-[220px] sm:auto-rows-[260px]">
        {filteredItems.map((item, idx) => {
          const isTall = item.span === "tall";
          const href = item.type === "reel" ? `/reels/${item.id}` : `/post/${item.id}`;
          return (
            <Link
              key={item.id}
              href={href}
              className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 cursor-pointer shadow-sm ${
                isTall ? "row-span-2" : "row-span-1"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="w-full h-full relative"
              >
                <img
                  src={item.url}
                  alt="Explore item"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Reel indicator icon if video */}
                {item.type === "reel" && (
                  <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-xl text-white shadow-sm">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Glass Hover Overlay with Likes & Comments */}
                <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 text-white">
                  <div className="text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold drop-shadow">
                      @{item.author}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold mt-1">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        {item.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        {item.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

