"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, Film, Repeat, Heart, MessageCircle, Plus } from "lucide-react";
import { useFeedStore } from "@/store/useFeedStore";
import { useReelsStore } from "@/store/useReelsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCreateMenuStore } from "@/store/useCreateMenuStore";

type TabType = "feed" | "reels" | "repost";

export function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const { posts } = useFeedStore();
  const { reels } = useReelsStore();
  const { currentUser } = useAuthStore();
  const { openCreateMenu } = useCreateMenuStore();

  // Filter content strictly for the current logged-in profile
  const myPosts = posts.filter(
    (p) =>
      p.author?.id === currentUser?.id ||
      (currentUser?.username &&
        p.author?.username?.toLowerCase() === currentUser?.username?.toLowerCase())
  );

  const myReels = reels.filter(
    (r) =>
      r.author?.id === currentUser?.id ||
      (currentUser?.username &&
        r.author?.username?.toLowerCase() === currentUser?.username?.toLowerCase())
  );

  const repostedPosts = myPosts.filter((p) => p.isReposted);

  const TABS = [
    { id: "feed", label: "Posts", icon: Grid, count: myPosts.length },
    { id: "reels", label: "Reels", icon: Film, count: myReels.length },
    { id: "repost", label: "Reposts", icon: Repeat, count: repostedPosts.length },
  ];

  return (
    <div className="w-full pt-4">
      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200/70 relative">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-semibold transition-colors relative ${
                isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                  {tab.count}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Grid Content with Functional Navigation */}
      <div className="py-5">
        <AnimatePresence mode="wait">
          {activeTab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {myPosts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                    <Grid className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Posts Yet</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Share photos, carousels, and stories</p>
                  </div>
                  <button
                    onClick={openCreateMenu}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Post</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {myPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm"
                    >
                      <img
                        src={post.media[0]?.url}
                        alt="Post media"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex items-center justify-center gap-4 text-white font-bold text-xs select-none">
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 fill-white" />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 fill-white" />
                          {post.commentsCount}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "reels" && (
            <motion.div
              key="reels"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {myReels.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Reels Yet</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Record or upload vertical videos</p>
                  </div>
                  <Link
                    href="/reels/create"
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Reel</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {myReels.map((reel) => (
                    <Link
                      key={reel.id}
                      href={`/reels/${reel.id}`}
                      className="relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden group cursor-pointer shadow-sm"
                    >
                      {reel.type === "video" ? (
                        <video
                          src={reel.mediaUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <img
                          src={reel.mediaUrl}
                          alt={reel.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute bottom-3 left-3 text-white text-xs font-bold drop-shadow flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5" />
                        {reel.likesCount}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "repost" && (
            <motion.div
              key="repost"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {repostedPosts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                    <Repeat className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Reposts Yet</h4>
                  <p className="text-xs text-slate-400">Reposts from other creators will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {repostedPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm"
                    >
                      <img
                        src={post.media[0]?.url}
                        alt="Repost media"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 left-2 p-1 bg-black/50 backdrop-blur-sm rounded-lg text-emerald-400">
                        <Repeat className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
