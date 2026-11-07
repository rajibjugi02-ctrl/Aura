"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  Volume2,
  VolumeX,
  Music2,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Bookmark,
  MoreHorizontal,
  Film,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFeedStore } from "@/store/useFeedStore";
import { useReelsStore, ReelData } from "@/store/useReelsStore";
import { useMusicStore } from "@/store/useMusicStore";
import { CommentsSlideSheet } from "@/components/comments/CommentsSlideSheet";
import { ReelShareSheet } from "./ReelShareSheet";

function ReelVideoPlayer({
  src,
  isActive,
  isMuted,
}: {
  src: string;
  isActive: boolean;
  isMuted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive, isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      muted={isMuted}
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
    />
  );
}

export function ImmersiveReelsView({ initialReelId }: { initialReelId?: string }) {
  const router = useRouter();
  const { openComments } = useFeedStore();
  const { reels, toggleLikeReel, toggleRepostReel } = useReelsStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const reelRefs = useRef<(HTMLElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [expandedCaptionMap, setExpandedCaptionMap] = useState<Record<string, boolean>>({});
  const [heartPopReelId, setHeartPopReelId] = useState<string | null>(null);
  const [shareReel, setShareReel] = useState<ReelData | null>(null);
  // Pause any global audio while in reels view
  useEffect(() => {
    useMusicStore.getState().pauseTrack();
  }, []);

  // Filter & sort reels; clicked initial reel appears first
  const displayReels = React.useMemo(() => {
    if (reels.length === 0) return [];
    if (!initialReelId) return reels;

    const foundIdx = reels.findIndex((r) => r.id === initialReelId);
    if (foundIdx <= 0) return reels;

    const clicked = reels[foundIdx];
    const rest = reels.filter((_, i) => i !== foundIdx);
    return [clicked, ...rest];
  }, [reels, initialReelId]);

  // Scroll to initial reel on mount
  useEffect(() => {
    if (initialReelId && displayReels.length > 0) {
      const idx = displayReels.findIndex((r) => r.id.startsWith(initialReelId));
      if (idx >= 0 && reelRefs.current[idx]) {
        reelRefs.current[idx]?.scrollIntoView({ behavior: "instant" });
        setActiveIndex(idx);
      }
    }
  }, [initialReelId, displayReels.length]);

  // Observer to track current active visible reel
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    reelRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [displayReels]);

  const scrollToReel = (index: number) => {
    if (index >= 0 && index < displayReels.length) {
      reelRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
      setActiveIndex(index);
    }
  };

  const handleDoubleTapLike = (reelId: string) => {
    setHeartPopReelId(reelId);
    toggleLikeReel(reelId);
    setTimeout(() => {
      setHeartPopReelId((curr) => (curr === reelId ? null : curr));
    }, 900);
  };

  const toggleFollow = (username: string) => {
    setFollowingMap((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const toggleExpandCaption = (reelId: string) => {
    setExpandedCaptionMap((prev) => ({
      ...prev,
      [reelId]: !prev[reelId],
    }));
  };

  if (reels.length === 0) {
    return (
      <div className="h-full sm:h-[90vh] flex flex-col items-center justify-center p-6 text-center select-none max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center mb-4 shadow-xl">
          <Film className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1.5">No Reels Yet</h2>
        <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
          Record full-height vertical clips, attach your favorite music snippet, and share with your followers.
        </p>
        <Link
          href="/reels/create"
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create First Reel</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 sm:relative sm:inset-auto w-full h-[100dvh] sm:h-full z-30 sm:z-auto flex items-center justify-center select-none overflow-hidden bg-slate-950 sm:bg-transparent py-0 sm:py-4">
      {/* Desktop Floating Navigation Arrows */}
      <div className="hidden lg:flex flex-col gap-3 absolute right-8 top-1/2 -translate-y-1/2 z-30">
        <button
          onClick={() => scrollToReel(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md flex items-center justify-center disabled:opacity-20 transition-all shadow-lg"
          aria-label="Scroll to previous reel"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={() => scrollToReel(activeIndex + 1)}
          disabled={activeIndex === displayReels.length - 1}
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md flex items-center justify-center disabled:opacity-20 transition-all shadow-lg"
          aria-label="Scroll to next reel"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Main Container with CSS Mandatory Scroll Snapping */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[440px] h-[100dvh] sm:h-[94vh] sm:max-h-[880px] overflow-y-scroll snap-y snap-mandatory no-scrollbar sm:rounded-[36px] bg-slate-950 shadow-2xl"
      >
        {displayReels.map((reel, idx) => {
          const isExpanded = expandedCaptionMap[reel.id];
          const isFollowing = followingMap[reel.author.username];

          return (
            <section
              key={reel.id}
              data-index={idx}
              ref={(el) => {
                reelRefs.current[idx] = el;
              }}
              onDoubleClick={() => handleDoubleTapLike(reel.id)}
              className="relative w-full h-[100dvh] sm:h-full snap-start snap-always shrink-0 overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              {/* Media Asset: Video or Photo */}
              <div className="absolute inset-0 z-0">
                {reel.type === "video" ? (
                  <ReelVideoPlayer
                    src={reel.mediaUrl}
                    isActive={idx === activeIndex}
                    isMuted={isMuted}
                  />
                ) : (
                  <img
                    src={reel.mediaUrl}
                    alt={reel.caption}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Visual Glass Overlays */}
                <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Heart Pop Animation */}
              <AnimatePresence>
                {heartPopReelId === reel.id && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.35, 1], opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.85, ease: "easeOut" }}
                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                  >
                    <Heart className="w-28 h-28 text-white fill-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.6)]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top Bar: Back Button, "Reels" Title, Mute/Unmute */}
              <div className="relative z-20 flex items-center justify-between p-4 pt-5">
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors shadow-sm"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <span className="text-white font-bold text-sm tracking-wide drop-shadow">
                  Reels
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors shadow-sm"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Bottom Content Area */}
              <div className="relative z-20 p-5 flex items-end justify-between gap-4 pb-24 sm:pb-6">
                {/* Bottom-Left Overlay: Author, Follow, Caption, Pill-shaped Audio Ticker */}
                <div className="flex-1 min-w-0 space-y-2.5 text-white">
                  {/* Author row + Follow button */}
                  <div className="flex items-center gap-3">
                    <Link href="/profile" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={reel.author.avatar}
                        alt={reel.author.username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                    </Link>
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href="/profile"
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-sm drop-shadow truncate hover:underline"
                      >
                        {reel.author.username}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow(reel.author.username);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
                          isFollowing
                            ? "bg-white/20 border-white/40 text-white"
                            : "bg-white text-slate-900 border-white hover:bg-slate-100"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  </div>

                  {/* Caption with more/less toggle */}
                  <p className="text-xs text-white/95 leading-relaxed drop-shadow break-words">
                    {isExpanded ? reel.caption : reel.caption.slice(0, 75)}
                    {reel.caption.length > 75 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandCaption(reel.id);
                        }}
                        className="ml-1 text-white font-bold hover:underline"
                      >
                        {isExpanded ? "less" : "...more"}
                      </button>
                    )}
                  </p>

                  {/* Pill-shaped Music Track Overlay */}
                  <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full max-w-[280px] truncate border border-white/20">
                    <Music2 className="w-3.5 h-3.5 text-pink-400 shrink-0 animate-pulse" />
                    <span className="text-xs text-white/90 font-medium truncate">
                      {reel.audioTrack.artist} • {reel.audioTrack.title}
                    </span>
                  </div>
                </div>

                {/* Bottom-Right Vertically Stacked Action Buttons */}
                <div className="flex flex-col items-center gap-4 shrink-0 pb-1">
                  {/* Like Button */}
                  <motion.button
                    whileTap={{ scale: 0.7 }}
                    animate={reel.isLiked ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleLikeReel(reel.id);
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <Heart
                        className={`w-6 h-6 transition-colors ${
                          reel.isLiked
                            ? "fill-rose-500 text-rose-500"
                            : "text-white"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow">
                      {reel.likesCount > 1000
                        ? `${(reel.likesCount / 1000).toFixed(1)}K`
                        : reel.likesCount}
                    </span>
                  </motion.button>

                  {/* Comment Button -> triggers slide-up sheet */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      openComments(reel.id);
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow">
                      {reel.commentsCount}
                    </span>
                  </motion.button>

                  {/* Repost Button */}
                  <motion.button
                    whileTap={{ scale: 0.7 }}
                    animate={reel.isReposted ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleRepostReel(reel.id);
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <Repeat2
                        className={`w-6 h-6 ${
                          reel.isReposted ? "text-emerald-400" : "text-white"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow">
                      {reel.repostsCount}
                    </span>
                  </motion.button>

                  {/* Share Button -> triggers slide-up sheet */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShareReel(reel);
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <Send className="w-5 h-5 text-white translate-x-0.5" />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow">
                      Share
                    </span>
                  </motion.button>

                  {/* Bookmark / Save Button */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSavedMap((prev) => ({ ...prev, [reel.id]: !prev[reel.id] }));
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <Bookmark
                        className={`w-5 h-5 ${
                          savedMap[reel.id]
                            ? "fill-white text-white"
                            : "text-white"
                        }`}
                      />
                    </div>
                  </motion.button>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Slide-Up Comments Dialog */}
      <CommentsSlideSheet />

      {/* Slide-Up Share Sheet */}
      <ReelShareSheet
        isOpen={!!shareReel}
        reel={shareReel}
        onClose={() => setShareReel(null)}
      />
    </div>
  );
}
