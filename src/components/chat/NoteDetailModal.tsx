"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Send, Check } from "lucide-react";
import { Note } from "@/types";
import { useChatStore } from "@/store/useChatStore";
import { useMusicStore } from "@/store/useMusicStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ClientPortal } from "@/components/ui/ClientPortal";

interface NoteDetailModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateNewNote: () => void;
}

export function NoteDetailModal({
  note,
  isOpen,
  onClose,
  onOpenCreateNewNote,
}: NoteDetailModalProps) {
  const { deleteUserNote, sendDirectNoteReply } = useChatStore();
  const { playTrack, pauseTrack, currentTrack, isPlaying } = useMusicStore();
  const { currentUser } = useAuthStore();

  const [replyText, setReplyText] = useState("");
  const [sentFeedback, setSentFeedback] = useState(false);

  const currentUserId = currentUser?.id || "user_self";
  const isSelf =
    note?.userId === currentUserId ||
    note?.id === "note_self" ||
    note?.username === currentUser?.username;

  // When opening a note with a song, immediately play it; destroy on close/unmount
  useEffect(() => {
    if (isOpen && note?.pinnedSong) {
      const audioUrl = note.pinnedSong.audioUrl || note.pinnedSong.previewUrl;
      if (audioUrl) {
        playTrack({
          id: `note_song_${note.id}`,
          title: note.pinnedSong.title,
          artist: note.pinnedSong.artist,
          coverUrl: note.pinnedSong.coverUrl,
          audioUrl,
          duration: note.pinnedSong.durationSeconds || 30,
        });
      }
    } else {
      pauseTrack();
    }

    return () => {
      pauseTrack();
    };
  }, [isOpen, note, playTrack, pauseTrack]);

  if (!note) return null;

  const handleClose = () => {
    pauseTrack();
    onClose();
  };

  const handleDelete = () => {
    pauseTrack();
    deleteUserNote(note.userId);
    onClose();
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    sendDirectNoteReply(
      note.userId,
      note.username,
      replyText.trim(),
      note.userAvatar
    );

    setSentFeedback(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const isSongPlaying =
    isPlaying && currentTrack?.title === note.pinnedSong?.title;

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center select-none p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 w-screen h-screen bg-slate-950/60 backdrop-blur-md"
            />

            {/* Centered Modal Card matching Instagram Glass Spec */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className="relative w-full max-w-[340px] bg-[#1e2023]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.5)] z-10 flex flex-col items-center text-center text-white"
            >
              {/* Note Bubble at Top */}
              <div className="relative mb-2 w-full flex flex-col items-center">
                <div className="px-4 py-2.5 bg-slate-900/90 text-white rounded-2xl border border-white/15 shadow-lg max-w-[240px] text-left">
                  {note.pinnedSong && (
                    <div className="mb-0.5">
                      <div className="flex items-center gap-1.5 leading-tight">
                        {/* Equalizer Bars */}
                        <span className="flex items-end gap-0.5 h-3 shrink-0">
                          <span
                            className={`w-[2.5px] bg-white rounded-full ${
                              isSongPlaying ? "h-3 animate-pulse" : "h-2.5"
                            }`}
                          />
                          <span
                            className={`w-[2.5px] bg-white rounded-full ${
                              isSongPlaying ? "h-2 animate-bounce" : "h-1.5"
                            }`}
                          />
                          <span
                            className={`w-[2.5px] bg-white rounded-full ${
                              isSongPlaying ? "h-2.5 animate-pulse" : "h-2"
                            }`}
                          />
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[170px]">
                          {note.pinnedSong.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate pl-4">
                        {note.pinnedSong.artist}
                      </div>
                    </div>
                  )}

                  {note.content && (
                    <p className="text-xs font-medium text-white/95 leading-snug break-words mt-0.5">
                      {note.content}
                    </p>
                  )}
                </div>

                {/* Pointing triangle */}
                <div className="w-2.5 h-2.5 bg-slate-900/90 rotate-45 border-r border-b border-white/15 -mt-1.5 shadow-sm" />
              </div>

              {/* User Avatar */}
              <div className="relative my-2">
                <img
                  src={note.userAvatar}
                  alt={note.username}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-[#1e2023] shadow-xl"
                />
              </div>

              {/* Username */}
              <h3 className="text-base font-bold text-white tracking-tight mt-1">
                {note.username}
              </h3>

              {/* Subtitle / Description */}
              {isSelf ? (
                <p className="text-[11px] text-slate-400 mt-1 mb-5">
                  Shared with followers you follow back
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1 mb-4">
                  Listening now • Tap to send a quick reply
                </p>
              )}

              {/* Action Buttons: Self vs Other User */}
              {isSelf ? (
                <div className="w-full space-y-2 pt-1">
                  {/* Leave a new note */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      onOpenCreateNewNote();
                    }}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
                  >
                    Leave a new note
                  </motion.button>

                  {/* Delete note */}
                  <button
                    onClick={handleDelete}
                    className="w-full py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Delete note
                  </button>
                </div>
              ) : (
                /* Another User's Note: Reply Form */
                <form onSubmit={handleSendReply} className="w-full mt-2">
                  <div className="relative flex items-center bg-[#141517] rounded-full border border-white/10 px-3.5 py-2.5 focus-within:border-blue-500/60 transition-all shadow-inner">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Send message to ${note.username}...`}
                      autoFocus
                      className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none pr-8"
                    />

                    {replyText.trim() ? (
                      <button
                        type="submit"
                        className="text-blue-400 hover:text-blue-300 p-1"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="text-slate-400">
                        <Smile className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {sentFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold mt-2.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Message sent!</span>
                    </motion.div>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}

