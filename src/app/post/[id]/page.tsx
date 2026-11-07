"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  Bookmark,
  Music2,
  MoreHorizontal,
  Smile,
  Disc3,
  Sparkles,
} from "lucide-react";
import { useFeedStore } from "@/store/useFeedStore";
import { useMusicStore } from "@/store/useMusicStore";
import { PostMenuDropdown } from "@/components/feed/PostMenuDropdown";

const SPECIAL_EMOJIS = ["❤️", "🔥", "🙌", "👏", "😍", "😢", "😮", "😂"];

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    posts,
    toggleLikePost,
    toggleRepostPost,
    addComment,
    toggleLikeComment,
    openComments,
  } = useFeedStore();
  const { playTrack } = useMusicStore();

  const postId = (params?.id as string) || "";
  const post = posts.find((p) => p.id === postId) || posts[0];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  if (!post) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <div className="bg-white/85 backdrop-blur-2xl border border-white/80 rounded-[32px] p-8 shadow-[0_16px_45px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-bold text-slate-900">Post Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
            This post may have been removed or no posts have been shared yet.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-2xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const totalSlides = post.media?.length || 0;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText("");
  };

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-6xl mx-auto pb-24 md:pb-12 space-y-4">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-white/80 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Post Detail
        </span>
      </div>

      {/* Main Post Detail Split Card */}
      <div className="bg-white/90 backdrop-blur-3xl border border-white/90 rounded-[36px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Column: Media Carousel (7 Cols on desktop) */}
        <div className="lg:col-span-7 bg-slate-950 relative flex items-center justify-center min-h-[420px] lg:min-h-full overflow-hidden select-none">
          <AnimatePresence initial={false} mode="wait">
            <motion.img
              key={currentSlide}
              src={post.media[currentSlide]?.url}
              alt="Post slide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`w-full h-full object-cover max-h-[640px] ${
                post.media[currentSlide]?.filter === "clarendon"
                  ? "contrast-125 saturate-125"
                  : post.media[currentSlide]?.filter === "mono"
                  ? "grayscale"
                  : ""
              }`}
            />
          </AnimatePresence>

          {/* Carousel Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full">
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
        </div>

        {/* Right Column: Author Info, Full Caption, Comments & Input (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 bg-white/70">
          <div className="space-y-4">
            {/* Header: Author + Follow button */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200"
                  />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/profile"
                      className="text-xs font-bold text-slate-900 hover:underline"
                    >
                      {post.author.username}
                    </Link>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <button
                      onClick={() => setIsFollowing(!isFollowing)}
                      className={`text-[11px] font-bold ${
                        isFollowing
                          ? "text-slate-500 hover:text-slate-800"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {post.createdAt}
                  </span>
                </div>
              </div>

              <PostMenuDropdown
                post={post}
                onPostDeleted={() => router.push("/")}
              />
            </div>

            {/* Pinned Music Badge */}
            {post.musicTrack && (
              <div
                onClick={() =>
                  playTrack({
                    id: `post_track_${post.id}`,
                    title: post.musicTrack!.title,
                    artist: post.musicTrack!.artist,
                    coverUrl: post.media[0]?.url,
                    duration: post.musicTrack!.duration,
                  })
                }
                className="flex items-center justify-between p-2.5 bg-slate-100/80 rounded-2xl cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Music2 className="w-3.5 h-3.5 text-pink-500 animate-pulse shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {post.musicTrack.artist} • {post.musicTrack.title}
                  </span>
                </div>
                <Disc3 className="w-4 h-4 text-slate-500" />
              </div>
            )}

            {/* Full Post Caption */}
            <div className="text-xs text-slate-800 leading-relaxed space-y-1">
              <span className="font-bold mr-1.5 text-slate-900">
                {post.author.username}
              </span>
              <span>{post.caption}</span>
            </div>

            {/* Scrollable Comments List */}
            <div className="border-t border-slate-100 pt-3 space-y-3 max-h-56 overflow-y-auto no-scrollbar">
              <div
                onClick={() => openComments(post.id)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                  Comments ({post.comments.length})
                </span>
                <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                  Open sheet
                </span>
              </div>

              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorUsername}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 mt-0.5"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 mr-1.5">
                        {comment.authorUsername}
                      </span>
                      <span className="text-slate-700">{comment.text}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{comment.createdAt}</span>
                        {comment.likesCount > 0 && (
                          <span>{comment.likesCount} likes</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleLikeComment(post.id, comment.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        comment.isLiked
                          ? "fill-rose-500 text-rose-500"
                          : "text-slate-400"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Area: Actions, Quick Emojis, Comment Input */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => toggleLikePost(post.id)}
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      post.isLiked
                        ? "fill-rose-500 text-rose-500"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => openComments(post.id)}
                  className="p-1 hover:text-slate-900 transition-colors"
                  title="Open comments sheet"
                >
                  <MessageCircle className="w-6 h-6 text-slate-700 hover:text-slate-900" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => toggleRepostPost(post.id)}
                >
                  <Repeat2
                    className={`w-6 h-6 ${
                      post.isReposted ? "text-emerald-600" : "text-slate-700"
                    }`}
                  />
                </motion.button>
                <motion.button whileTap={{ scale: 0.8 }}>
                  <Send className="w-5 h-5 text-slate-700 hover:text-slate-900" />
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setIsSaved(!isSaved)}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    isSaved ? "fill-slate-900 text-slate-900" : "text-slate-700"
                  }`}
                />
              </motion.button>
            </div>

            <div className="text-xs font-bold text-slate-900">
              {post.likesCount.toLocaleString()} likes
            </div>

            {/* Quick Interactive Emojis */}
            <div className="flex items-center justify-between px-1 py-1 bg-slate-50 rounded-xl">
              {SPECIAL_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-base p-1 hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 h-9 px-3.5 bg-slate-100/80 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 border border-slate-200/50"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.9 }}
                disabled={!commentText.trim()}
                className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-3.5 h-3.5 translate-x-0.5" />
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

