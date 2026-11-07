"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  MoreVertical,
  Trash2,
  Bookmark,
  Sparkles,
  Eye,
  Smile,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useStoryStore } from "@/store/useStoryStore";
import { useMusicStore } from "@/store/useMusicStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ClientPortal } from "@/components/ui/ClientPortal";

interface ViewerUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  seenAgo: string;
  liked?: boolean;
}

const QUICK_EMOJIS = ["😂", "😮", "😍", "😢", "👏", "🔥"];

export function StoryViewerModal() {
  const {
    isOpen,
    userGroups,
    activeUserIndex,
    activeStoryIndex,
    closeStory,
    nextStory,
    prevStory,
    deleteCurrentStory,
    likeStory,
  } = useStoryStore();
  const { playTrack, pauseTrack } = useMusicStore();

  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isStoryMuted, setIsStoryMuted] = useState(false);
  const [showActivityViewer, setShowActivityViewer] = useState(false);
  const [flyingEmojis, setFlyingEmojis] = useState<{ id: number; emoji: string }[]>([]);
  const [measuredVideoDuration, setMeasuredVideoDuration] = useState<number | null>(null);
  const [dynamicViewers, setDynamicViewers] = useState<ViewerUser[]>([]);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const { currentUser } = useAuthStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentGroup = userGroups[activeUserIndex];
  const currentStory = currentGroup?.stories[activeStoryIndex];
  const currentUserId = currentUser?.id || "user_self";
  const isSelf =
    currentGroup?.userId === currentUserId ||
    currentGroup?.username === currentUser?.username ||
    currentGroup?.userId === "acc_1";

  // Reset measured duration & progress on slide change
  useEffect(() => {
    setMeasuredVideoDuration(null);
    setProgress(0);
  }, [activeStoryIndex, activeUserIndex]);

  // Dynamic Story Duration Logic for photos:
  // - Photo + No Music: Exactly 10 seconds
  // - Photo + Music: Match duration of music snippet
  const getDynamicDurationSeconds = useCallback(() => {
    if (!currentStory) return 10;
    if (currentStory.musicTrack) {
      return currentStory.musicTrack.duration || 15;
    }
    return 10;
  }, [currentStory]);

  // Auto-progress timer for PHOTOS only (Video progress is driven directly by video.currentTime / video.duration events)
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || showActivityViewer) return;
    if (currentStory.type === "video") return; // Video progress handled directly by HTML5 video onTimeUpdate

    setProgress(0);
    const durationMs = getDynamicDurationSeconds() * 1000;
    const intervalMs = 50;
    const step = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          nextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, activeUserIndex, activeStoryIndex, isPaused, showActivityViewer, currentStory, nextStory, getDynamicDurationSeconds]);

  // Synchronized audio snippet playback when story contains a music track
  useEffect(() => {
    if (!isOpen || !currentStory) {
      pauseTrack();
      return;
    }

    if (currentStory.musicTrack) {
      const audioUrl =
        currentStory.musicTrack.audioUrl ||
        currentStory.musicTrack.previewUrl;
      if (audioUrl) {
        playTrack({
          id: `story_music_${currentStory.id}`,
          title: currentStory.musicTrack.title,
          artist: currentStory.musicTrack.artist,
          coverUrl: currentStory.musicTrack.coverUrl || currentStory.mediaUrl,
          audioUrl,
          duration: currentStory.musicTrack.duration || 15,
        });
      }
    } else {
      pauseTrack();
    }

    return () => {
      pauseTrack();
    };
  }, [isOpen, activeUserIndex, activeStoryIndex, currentStory, playTrack, pauseTrack]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isStoryMuted;
    }
  }, [isStoryMuted]);

  useEffect(() => {
    if (isPaused) {
      pauseTrack();
      videoRef.current?.pause();
    } else {
      videoRef.current?.play().catch(() => {});
    }
  }, [isPaused, pauseTrack]);

  if (!isOpen || !currentGroup || !currentStory) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyText("");
  };

  const handleQuickEmoji = (emoji: string) => {
    const id = Date.now() + Math.random();
    setFlyingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFlyingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1400);
  };

  const handleShareStory = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Story on AuraGlass",
          text: `Check out ${currentGroup?.username}'s story on AuraGlass`,
          url: window.location.href,
        });
      } else if (typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage("Story link copied to clipboard!");
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch {}
  };

  return (
    <ClientPortal>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl select-none">
          {/* Desktop Prev Button */}
          <button
            onClick={prevStory}
            className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md items-center justify-center transition-all z-20"
            aria-label="Previous story"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Desktop Next Button */}
          <button
            onClick={nextStory}
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md items-center justify-center transition-all z-20"
            aria-label="Next story"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Story Card Container with iOS spring motion */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="relative w-full max-w-[420px] h-[92vh] max-h-[820px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Background Story Media */}
            <div className="absolute inset-0 z-0">
              {currentStory.type === "video" ? (
                <video
                  ref={videoRef}
                  src={currentStory.mediaUrl}
                  autoPlay
                  loop={false}
                  muted={isStoryMuted}
                  playsInline
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
                      setMeasuredVideoDuration(Math.round(e.currentTarget.duration));
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    if (v.duration && !isNaN(v.duration)) {
                      setProgress((v.currentTime / v.duration) * 100);
                    }
                  }}
                  onEnded={() => {
                    nextStory();
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={currentStory.mediaUrl}
                  alt="Story"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&h=1920&fit=crop";
                  }}
                  className="w-full h-full object-cover"
                />
              )}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
          </div>

          {/* Flying Emoji Reactions Animation */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/90 text-white text-xs font-semibold rounded-2xl shadow-xl backdrop-blur-md"
                >
                  {toastMessage}
                </motion.div>
              )}
              {flyingEmojis.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 1, y: 550, scale: 0.8, x: Math.random() * 200 + 100 }}
                  animate={{
                    opacity: 0,
                    y: 100,
                    scale: 2.2,
                    x: Math.random() * 200 + 80,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.3, ease: "easeOut" }}
                  className="absolute text-4xl select-none"
                >
                  {item.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Tap Zones for Skip Interactions */}
          <div className="absolute inset-0 z-10 flex">
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={prevStory}
              aria-label="Previous story tap zone"
            />
            <div className="w-1/3 h-full" />
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={nextStory}
              aria-label="Next story tap zone"
            />
          </div>

          {/* Top Header Layer */}
          <div className="relative z-20 p-4 space-y-3">
            {/* Animated duration progress bar per story */}
            <div className="flex items-center gap-1.5 w-full">
              {currentGroup.stories.map((story, idx) => {
                const isPast = idx < activeStoryIndex;
                const isCurrent = idx === activeStoryIndex;
                return (
                  <div
                    key={story.id}
                    className="flex-1 h-1 bg-white/35 rounded-full overflow-hidden"
                  >
                    {isPast && <div className="w-full h-full bg-white" />}
                    {isCurrent && (
                      <motion.div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* User info, time, 3-dot dropdown (ONLY FOR SELF), X button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentGroup.userAvatar}
                  alt={currentGroup.username}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/80"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-semibold drop-shadow">
                      {isSelf ? "Your Story" : currentGroup.username}
                    </span>
                    <span className="text-white/70 text-[10px]">
                      {currentStory.createdAt}
                    </span>
                  </div>

                  {/* Pinned Music Badge */}
                  {currentStory.musicTrack && (
                    <div className="flex items-center gap-1.5 text-[10px] text-pink-300 font-medium">
                      <span className="flex items-end gap-0.5 h-2.5 shrink-0">
                        <span className="w-[1.5px] h-2.5 bg-pink-400 rounded-full animate-pulse" />
                        <span className="w-[1.5px] h-1.5 bg-pink-400 rounded-full animate-bounce" />
                        <span className="w-[1.5px] h-2 bg-pink-400 rounded-full animate-pulse" />
                      </span>
                      <span className="truncate max-w-[140px]">
                        {currentStory.musicTrack.artist} • {currentStory.musicTrack.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* 3-dot management menu: STRICTLY VISIBLE ONLY WHEN VIEWING OWN STORY */}
                {isSelf && (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="p-1.5 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                        aria-label="Story management options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[160px] bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl p-1.5 shadow-xl z-50 text-xs"
                        sideOffset={5}
                      >
                        <DropdownMenu.Item
                          onClick={deleteCurrentStory}
                          className="flex items-center gap-2 px-3 py-2 text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer focus:outline-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Story</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          onClick={() => {}}
                          className="flex items-center gap-2 px-3 py-2 text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer focus:outline-none"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Save to Camera Roll</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          onClick={() => {}}
                          className="flex items-center gap-2 px-3 py-2 text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer focus:outline-none"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                          <span>Add to Highlights</span>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}

                {/* Audio Mute/Unmute Toggle for Video Stories */}
                {currentStory.type === "video" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStoryMuted((prev) => !prev);
                    }}
                    className="p-1.5 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                    aria-label={isStoryMuted ? "Unmute story video" : "Mute story video"}
                  >
                    {isStoryMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                )}

                {/* X button to close */}
                <button
                  onClick={closeStory}
                  className="p-1.5 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close stories"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Story Caption and Mentions if present */}
          {(currentStory.caption || currentStory.mentions) && (
            <div className="relative z-20 px-5 text-center space-y-2">
              {currentStory.caption && (
                <span className="inline-block px-3.5 py-1.5 bg-black/50 backdrop-blur-md rounded-2xl text-xs text-white drop-shadow max-w-[85%] break-words">
                  {currentStory.caption}
                </span>
              )}
              {currentStory.mentions && currentStory.mentions.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {currentStory.mentions.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-white/90 text-slate-900 rounded-full font-bold text-[10px] shadow-sm backdrop-blur-md"
                    >
                      @{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BOTTOM CONTROLS: Differentiated for Own Story vs Others' Story */}
          <div className="relative z-20 p-4 space-y-2.5">
            {isSelf ? (
              /* VIEWING OWN STORY: ONLY Share button and Activity Viewer (Strictly NO Like or Comment/Reply fields) */
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowActivityViewer(true)}
                  className="flex-1 py-2.5 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-between text-white transition-all shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Activity Viewer ({dynamicViewers.length})</span>
                  </div>
                  <div className="flex items-center -space-x-2">
                    {dynamicViewers.slice(0, 3).map((v) => (
                      <img
                        key={v.id}
                        src={v.avatar}
                        alt={v.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                      />
                    ))}
                    <span className="text-[10px] text-white/80 font-bold pl-3">
                      View list →
                    </span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShareStory}
                  className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all shadow-sm shrink-0"
                  title="Share your story"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              /* VIEWING OTHERS' STORY: Quick Emoji Reply Bar + Text Reply Input */
              <div className="space-y-2.5">
                {/* Quick Emoji Reaction Buttons */}
                <div className="flex items-center justify-between px-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.3, y: -2 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleQuickEmoji(emoji)}
                      className="text-xl p-1.5 hover:bg-white/10 rounded-full transition-all"
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>

                {/* Text Reply Form */}
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Reply to ${currentGroup.username}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 h-10 px-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs text-white placeholder:text-white/70 focus:outline-none focus:bg-white/30"
                  />

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    onClick={likeStory}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        currentStory.liked
                          ? "fill-rose-500 text-rose-500"
                          : "text-white"
                      }`}
                    />
                  </motion.button>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.85 }}
                    disabled={!replyText.trim()}
                    className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center disabled:opacity-40"
                  >
                    <Send className="w-4 h-4 translate-x-0.5" />
                  </motion.button>
                </form>
              </div>
            )}
          </div>

          {/* ACTIVITY VIEWER: PARTIAL HEIGHT SLIDE-UP BOTTOM SHEET */}
          <AnimatePresence>
            {showActivityViewer && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowActivityViewer(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30"
                />

                {/* Slide-Up Sheet */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute bottom-0 inset-x-0 h-[62%] bg-slate-900/95 border-t border-white/20 backdrop-blur-2xl rounded-t-[32px] p-5 z-40 flex flex-col justify-between shadow-2xl"
                >
                  <div>
                    {/* Sheet drag pill */}
                    <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-3" />

                    {/* Sheet Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">
                          Story Viewers ({dynamicViewers.length})
                        </h4>
                      </div>
                      <button
                        onClick={() => setShowActivityViewer(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Vertically Scrollable List of Viewers */}
                    <div className="space-y-2 mt-3 max-h-[240px] overflow-y-auto no-scrollbar pr-1">
                      {dynamicViewers.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">
                          <Eye className="w-8 h-8 mx-auto mb-2 opacity-30 text-white" />
                          <p className="text-xs font-semibold text-white/80">No views yet</p>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                            When followers view your story, their activity will appear here.
                          </p>
                        </div>
                      ) : (
                        dynamicViewers.map((viewer) => (
                          <div
                            key={viewer.id}
                            className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={viewer.avatar}
                                alt={viewer.name}
                                className="w-10 h-10 rounded-full object-cover ring-1 ring-white/30 shrink-0"
                              />
                              <div className="min-w-0 text-left">
                                <span className="font-bold text-xs text-white block truncate">
                                  {viewer.username}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {viewer.name} • {viewer.seenAgo}
                                </span>
                              </div>
                            </div>

                            {viewer.liked && (
                              <div className="p-1.5 rounded-full bg-rose-500/20 text-rose-400 shrink-0">
                                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowActivityViewer(false)}
                      className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Close Viewer
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  </ClientPortal>
);
}
