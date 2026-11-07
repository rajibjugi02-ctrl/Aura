"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Disc3, Play, Pause, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMusicStore } from "@/store/useMusicStore";

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  relation: string;
}

const SUGGESTIONS: SuggestedUser[] = [
  {
    id: "sug_1",
    name: "Elena Rostova",
    username: "elena_craft",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop",
    relation: "Followed by maya.chen",
  },
  {
    id: "sug_2",
    name: "Liam Thorne",
    username: "liam.film",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    relation: "New to AuraGlass",
  },
  {
    id: "sug_3",
    name: "Sora Takahashi",
    username: "sora.minimal",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
    relation: "Suggested for you",
  },
];

export function DesktopRightPanel() {
  const { currentUser } = useAuthStore();
  const { currentTrack, isPlaying, togglePlay } = useMusicStore();
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const toggleFollow = (id: string) => {
    setFollowingMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="w-80 shrink-0 space-y-5 select-none">
      {/* Current User Quick Card */}
      <div className="flex items-center justify-between p-3.5 bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl shadow-sm">
        <Link href="/profile" className="flex items-center gap-3 min-w-0">
          <img
            src={
              currentUser?.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"
            }
            alt={currentUser?.name || "User"}
            className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {currentUser?.username || "user"}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {currentUser?.name || "User"}
            </div>
          </div>
        </Link>
        <Link
          href="/profile"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          View
        </Link>
      </div>

      {/* Suggested for You */}
      <div className="p-4 bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Suggested for you</span>
          <button className="text-[11px] text-slate-400 hover:text-slate-700">
            See All
          </button>
        </div>

        <div className="space-y-3">
          {SUGGESTIONS.map((user) => {
            const isFollowing = followingMap[user.id];
            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {user.username}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {user.relation}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleFollow(user.id)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    isFollowing
                      ? "text-slate-600 bg-slate-100 hover:bg-slate-200"
                      : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending Audio Widget */}
      {currentTrack && (
        <div className="p-3.5 bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-10 h-10 rounded-xl object-cover"
              />
              {isPlaying && (
                <div className="absolute -top-1 -right-1 p-0.5 bg-slate-900 rounded-full">
                  <Disc3 className="w-2.5 h-2.5 text-pink-400 animate-spin" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Trending Audio
              </div>
              <div className="text-xs font-semibold text-slate-800 truncate">
                {currentTrack.title}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {currentTrack.artist}
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
            )}
          </motion.button>
        </div>
      )}

      {/* Footer Meta Links */}
      <div className="px-2 text-[11px] text-slate-400 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">About</a>
          <span>•</span>
          <a href="#" className="hover:underline">Help</a>
          <span>•</span>
          <a href="#" className="hover:underline">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:underline">Terms</a>
          <span>•</span>
          <a href="#" className="hover:underline">Language</a>
        </div>
        <p>© 2026 AuraGlass by Lead Frontend Engineer</p>
      </div>
    </aside>
  );
}

