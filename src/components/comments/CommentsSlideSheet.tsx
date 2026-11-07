"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Send, CornerUpLeft } from "lucide-react";
import Link from "next/link";
import { useFeedStore } from "@/store/useFeedStore";
import { PostComment } from "@/types";

const SPECIAL_EMOJIS = ["❤️", "🔥", "🙌", "👏", "😍", "😢", "😮", "😂"];

export function CommentsSlideSheet() {
  const { posts, activeCommentPostId, closeComments, addComment, toggleLikeComment } =
    useFeedStore();

  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<PostComment | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateSize = () => setIsDesktop(window.innerWidth >= 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const activePost = posts.find((p) => p.id === activeCommentPostId);
  const isOpen = !!activeCommentPostId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeCommentPostId) return;

    const fullText = replyTarget
      ? `@${replyTarget.authorUsername} ${commentText.trim()}`
      : commentText.trim();

    addComment(activeCommentPostId, fullText);
    setCommentText("");
    setReplyTarget(null);
  };

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeComments()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            {/* Slide-Up Bottom Sheet on Mobile / Slide-In Right-Side Panel on Desktop */}
            <Dialog.Content asChild>
              <motion.div
                initial={isDesktop ? { x: "100%", opacity: 0 } : { y: "100%", opacity: 0 }}
                animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
                exit={isDesktop ? { x: "100%", opacity: 0 } : { y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 md:left-auto md:right-0 md:top-0 md:bottom-0 md:w-[440px] md:h-screen z-50 h-[78vh] bg-white/95 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-white/80 rounded-t-[32px] md:rounded-t-none md:rounded-l-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.12)] md:shadow-[-20px_0_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden focus:outline-none"
              >
                {/* Drag handle pill on mobile */}
                <div className="md:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-4 md:pt-6 pb-3 border-b border-slate-100">
                  <Dialog.Title className="text-sm font-bold text-slate-900">
                    Comments ({activePost?.comments.length || 0})
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* 8 Special Interactive Emojis at the top */}
                <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50/70 border-b border-slate-100">
                  {SPECIAL_EMOJIS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-xl sm:text-2xl p-1 hover:bg-white rounded-xl transition-colors cursor-pointer select-none"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>

                {/* Scrollable Comment List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
                  {activePost?.comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    activePost?.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Click avatar/name to view account */}
                          <Link
                            href="/profile"
                            onClick={closeComments}
                            className="shrink-0"
                          >
                            <img
                              src={comment.authorAvatar}
                              alt={comment.authorUsername}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                          </Link>

                          <div className="text-xs space-y-1">
                            <div className="leading-snug">
                              <Link
                                href="/profile"
                                onClick={closeComments}
                                className="font-bold text-slate-900 mr-1.5 hover:underline"
                              >
                                {comment.authorUsername}
                              </Link>
                              <span className="text-slate-700">{comment.text}</span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span>{comment.createdAt}</span>
                              {comment.likesCount > 0 && (
                                <span className="font-medium text-slate-500">
                                  {comment.likesCount} likes
                                </span>
                              )}
                              <button
                                onClick={() => setReplyTarget(comment)}
                                className="font-semibold text-slate-600 hover:text-slate-900"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Like comment button */}
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() =>
                            toggleLikeComment(activePost.id, comment.id)
                          }
                          className="pt-1 text-slate-400 hover:text-rose-500"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              comment.isLiked
                                ? "fill-rose-500 text-rose-500"
                                : "text-slate-400"
                            }`}
                          />
                        </motion.button>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply target banner */}
                {replyTarget && (
                  <div className="flex items-center justify-between px-6 py-1.5 bg-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <CornerUpLeft className="w-3.5 h-3.5 text-blue-600" />
                      Replying to{" "}
                      <span className="font-semibold text-slate-800">
                        @{replyTarget.authorUsername}
                      </span>
                    </span>
                    <button
                      onClick={() => setReplyTarget(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Input field to type a new comment */}
                <form
                  onSubmit={handleSubmit}
                  className="p-3.5 px-6 bg-white border-t border-slate-100 flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      replyTarget
                        ? `Reply to @${replyTarget.authorUsername}...`
                        : "Add a comment..."
                    }
                    className="flex-1 h-10 px-4 bg-slate-100/80 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-200/50"
                  />
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.9 }}
                    disabled={!commentText.trim()}
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="w-4 h-4 translate-x-0.5" />
                  </motion.button>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

