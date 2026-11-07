"use client";

import React from "react";
import { StoryCircleBar } from "@/components/stories/StoryCircleBar";
import { PostCard } from "@/components/feed/PostCard";
import { StoryViewerModal } from "@/components/stories/StoryViewerModal";
import { CommentsSlideSheet } from "@/components/comments/CommentsSlideSheet";
import { DesktopRightPanel } from "@/components/navigation/DesktopRightPanel";
import { useFeedStore } from "@/store/useFeedStore";
import { useCreateMenuStore } from "@/store/useCreateMenuStore";
import { Sparkles, Plus } from "lucide-react";

export default function HomePage() {
  const { posts } = useFeedStore();
  const { openCreateMenu } = useCreateMenuStore();

  return (
    <div className="py-6 px-3 sm:px-6 max-w-6xl mx-auto pb-24 md:pb-12 relative">
      {/* 3-Column Cohesive Layout for Desktop */}
      <div className="flex justify-center gap-8 items-start relative z-10">
        {/* Main Feed Column */}
        <main className="w-full max-w-[620px] space-y-5">
          {/* Stories Bar container */}
          <section className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <StoryCircleBar />
          </section>

          {/* Feed Posts */}
          <section className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-[32px] p-8 sm:p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-800 shadow-inner">
                  <Sparkles className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Welcome to AuraGlass</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Your feed is fresh and clean. Capture moments, share multi-photo carousels, or explore soundtracks.
                  </p>
                </div>
                <button
                  onClick={openCreateMenu}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Post</span>
                </button>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </section>
        </main>

        {/* Functional Right Panel for Desktop */}
        <div className="hidden xl:block sticky top-8">
          <DesktopRightPanel />
        </div>
      </div>

      {/* Fullscreen Interactive Stories Viewer */}
      <StoryViewerModal />

      {/* Slide-Up Bottom Sheet Comments Dialog */}
      <CommentsSlideSheet />
    </div>
  );
}
