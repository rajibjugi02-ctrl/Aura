"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  Bookmark,
  Music2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Post } from "@/types";
import { useFeedStore } from "@/store/useFeedStore";
import { useMusicStore } from "@/store/useMusicStore";
import { ImageLightboxModal } from "@/components/ui/ImageLightboxModal";
import { PostMenuDropdown } from "./PostMenuDropdown";

export function PostCard({ post }: { post: Post }) {
  const { toggleLikePost, toggleRepostPost, openComments } = useFeedStore();
  const { playTrack, toggleMute, isMuted, currentTrack, isPlaying } = useMusicStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const totalSlides = post.media.length;
  const trackId = `post_track_${post.id}`;
  const isThisTrackActive = currentTrack?.id === trackId;
  const isAudioPlaying = isThisTrackActive && isPlaying && !isMuted;

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.musicTrack) return;

    if (currentTrack?.id === trackId) {
      if (isMuted) {
        toggleMute();
        if (!isPlaying) playTrack(currentTrack);
      } else if (isPlaying) {
        toggleMute();
      } else {
        playTrack(currentTrack);
      }
    } else {
      playTrack({
        id: trackId,
        title: post.musicTrack.title,
        artist: post.musicTrack.artist,
        coverUrl: post.media[0]?.url || "",
        audioUrl: post.musicTrack.audioUrl || post.musicTrack.previewUrl,
        duration: post.musicTrack.duration,
      });
    }
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const isActionLockedRef = useRef(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isActionLockedRef.current) return;
    isActionLockedRef.current = true;
    toggleLikePost(post.id);
    setTimeout(() => {
      isActionLockedRef.current = false;
    }, 300);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isActionLockedRef.current) return;
    isActionLockedRef.current = true;
    toggleRepostPost(post.id);
    setTimeout(() => {
      isActionLockedRef.current = false;
    }, 300);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openComments(post.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsSaved((prev) => !prev);
  };

  return (
    <article className="w-full bg-white/85 backdrop-blur-2xl border border-white/85 rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.04)] mb-5">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.username}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {post.author.username}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[11px] text-slate-400">{post.createdAt}</span>
            </div>
            {post.musicTrack && (
              <button
                onClick={() =>
                  playTrack({
                    id: `post_track_${post.id}`,
                    title: post.musicTrack!.title,
                    artist: post.musicTrack!.artist,
                    coverUrl: post.media[0]?.url,
                    audioUrl: post.musicTrack!.audioUrl || post.musicTrack!.previewUrl,
                    duration: post.musicTrack!.duration,
                  })
                }
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Music2 className="w-3 h-3 text-pink-500" />
                <span className="truncate max-w-[170px]">
                  {post.musicTrack.artist} • {post.musicTrack.title}
                </span>
              </button>
            )}
          </div>
        </div>

        <PostMenuDropdown post={post} />
      </div>

      {/* Multi-Photo Carousel Container */}
      <div className="relative aspect-square sm:aspect-[4/3] bg-slate-100 overflow-hidden select-none">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={currentSlide}
            src={post.media[currentSlide]?.url}
            alt={`Slide ${currentSlide + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxUrl(post.media[currentSlide]?.url)}
            className={`w-full h-full object-cover cursor-zoom-in ${
              post.media[currentSlide]?.filter === "clarendon"
                ? "contrast-125 saturate-125"
                : post.media[currentSlide]?.filter === "mono"
                ? "grayscale"
                : ""
            }`}
          />
        </AnimatePresence>

        {/* Carousel Prev/Next Buttons */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-md flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-md flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full">
              {post.media.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentSlide ? "bg-white w-3" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Audio Mute/Unmute Overlay Control */}
        {post.musicTrack && (
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
            {isAudioPlaying && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium shadow-md">
                <span className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 h-2.5 bg-white rounded-full animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-white rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
                  <span className="w-0.5 h-2 bg-white rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
                </span>
                <span className="truncate max-w-[100px]">{post.musicTrack.title}</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleAudioToggle}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-all"
              aria-label={isAudioPlaying ? "Mute audio" : "Play audio"}
              title={isAudioPlaying ? "Mute audio" : "Play post audio"}
            >
              {isAudioPlaying ? (
                <Volume2 className="w-4 h-4 stroke-[2.2]" />
              ) : (
                <VolumeX className="w-4 h-4 stroke-[2.2]" />
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Action Buttons: Like, Comment, Repost, Send */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like button with spring bounce and event stopPropagation */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className="focus:outline-none"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  post.isLiked
                    ? "fill-rose-500 text-rose-500"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              />
            </motion.button>

            {/* Comment button -> triggers Slide-Up Pop-up Sheet */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleComment}
              className="focus:outline-none"
            >
              <MessageCircle className="w-6 h-6 text-slate-700 hover:text-slate-900" />
            </motion.button>

            {/* Repost button with debounced stopPropagation */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleRepost}
              className="focus:outline-none"
            >
              <Repeat2
                className={`w-6 h-6 transition-colors ${
                  post.isReposted
                    ? "text-emerald-600"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              />
            </motion.button>

            {/* Send button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="focus:outline-none"
            >
              <Send className="w-5 h-5 text-slate-700 hover:text-slate-900" />
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleBookmark}
            className="focus:outline-none"
          >
            <Bookmark
              className={`w-5 h-5 ${
                isSaved ? "fill-slate-900 text-slate-900" : "text-slate-700"
              }`}
            />
          </motion.button>
        </div>

        {/* Likes count */}
        <div className="text-xs font-bold text-slate-900">
          {post.likesCount.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div className="text-xs text-slate-800 leading-relaxed">
          <span className="font-bold mr-1.5 text-slate-900">
            {post.author.username}
          </span>
          {isExpanded ? post.caption : post.caption.slice(0, 80)}
          {post.caption.length > 80 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-1 text-slate-400 font-medium hover:text-slate-600"
            >
              {isExpanded ? "less" : "...more"}
            </button>
          )}
        </div>

        {/* View all comments link */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => openComments(post.id)}
            className="text-xs text-slate-400 font-medium hover:text-slate-600"
          >
            View all {post.commentsCount} comments
          </button>
        )}
      </div>

      {/* Full-Screen Image Lightbox */}
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        imageUrl={lightboxUrl}
        altText={`Post by ${post.author.username}`}
        onClose={() => setLightboxUrl(null)}
      />
    </article>
  );
}

