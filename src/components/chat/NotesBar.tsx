"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { NoteCreateModal } from "./NoteCreateModal";
import { NoteDetailModal } from "./NoteDetailModal";
import { useMusicStore } from "@/store/useMusicStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Note } from "@/types";

export function NotesBar() {
  const { notes } = useChatStore();
  const { playTrack, currentTrack, isPlaying } = useMusicStore();
  const { currentUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNoteForModal, setSelectedNoteForModal] = useState<Note | null>(null);
  const [isNoteDetailOpen, setIsNoteDetailOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const currentUserId = currentUser?.id || "user_self";
  const selfNote = notes.find((n) => n.userId === currentUserId);
  const friendNotes = notes.filter((n) => n.userId !== currentUserId);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [notes]);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleSelfNoteClick = () => {
    if (selfNote) {
      setSelectedNoteForModal(selfNote);
      setIsNoteDetailOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleFriendNoteClick = (note: Note) => {
    setSelectedNoteForModal(note);
    setIsNoteDetailOpen(true);
  };

  return (
    <div className="relative w-full pb-3 select-none group/notes">
      {/* Scroll Left Button */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollByAmount(-220)}
            className="absolute left-1 top-[62%] -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white text-slate-800 shadow-md border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            aria-label="Scroll notes left"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scroll Right Button */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollByAmount(220)}
            className="absolute right-1 top-[62%] -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white text-slate-800 shadow-md border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            aria-label="Scroll notes right"
          >
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-start gap-5 overflow-x-auto no-scrollbar py-3 px-2 scroll-smooth"
      >
        {/* User's own note / Add Note item */}
        <div className="flex flex-col items-center shrink-0 text-center relative group">
          {/* Note Speech Bubble pointing down to avatar */}
          <div className="relative mb-2">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSelfNoteClick}
              className="relative px-3 py-1.5 bg-slate-900/90 text-white backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col items-center text-center cursor-pointer max-w-[130px] transition-all"
            >
              {selfNote?.pinnedSong ? (
                <div className="w-full text-left">
                  <div className="flex items-center gap-1.5 leading-tight">
                    {/* Animated Equalizer Sound Bars */}
                    <span className="flex items-end gap-0.5 h-3 shrink-0">
                      <span className="w-[2px] h-3 bg-white rounded-full animate-pulse" />
                      <span className="w-[2px] h-2 bg-white rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
                      <span className="w-[2px] h-2.5 bg-white rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
                    </span>
                    <span className="text-[11px] font-bold text-white truncate max-w-[95px]">
                      {selfNote.pinnedSong.title}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate pl-3.5">
                    {selfNote.pinnedSong.artist}
                  </div>
                  {selfNote.content && (
                    <div className="text-[10px] text-white/95 mt-0.5 font-medium truncate max-w-[110px]">
                      {selfNote.content}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] font-medium text-white/90 leading-snug px-1">
                  {selfNote?.content || "Share a thought..."}
                </p>
              )}

              {/* Instagram Speech Bubble Pointing Tail */}
              <div className="absolute -bottom-1.5 left-4 w-2.5 h-2.5 bg-slate-900/90 rotate-45 border-r border-b border-white/20" />
            </motion.button>
          </div>

          {/* Avatar with plus icon */}
          <div className="relative">
            <img
              src={
                selfNote?.userAvatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
              }
              alt="Your Avatar"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-sm cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute bottom-0 right-0 p-1.5 bg-slate-900 text-white rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform"
              title="Add Note"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1.5">
            Your Note
          </span>
        </div>

        {/* Friends' Notes */}
        {friendNotes.map((note) => {
          const isNotePlaying =
            isPlaying && currentTrack?.title === note.pinnedSong?.title;

          return (
            <div
              key={note.id}
              className="flex flex-col items-center shrink-0 text-center relative group"
            >
              {/* Note Speech Bubble */}
              <div className="relative mb-2">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFriendNoteClick(note)}
                  className={`relative px-3 py-1.5 bg-slate-900/90 text-white backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col items-center text-center cursor-pointer max-w-[130px] transition-all ${
                    isNotePlaying ? "ring-2 ring-pink-500/80" : ""
                  }`}
                  title={
                    note.pinnedSong
                      ? `Listen to ${note.pinnedSong.title} by ${note.pinnedSong.artist}`
                      : undefined
                  }
                >
                  {note.pinnedSong ? (
                    <div className="w-full text-left">
                      <div className="flex items-center gap-1.5 leading-tight">
                        {/* Animated Equalizer Sound Bars */}
                        <span className="flex items-end gap-0.5 h-3 shrink-0">
                          <span
                            className={`w-[2px] bg-white rounded-full ${
                              isNotePlaying
                                ? "h-3 animate-pulse"
                                : "h-2.5"
                            }`}
                          />
                          <span
                            className={`w-[2px] bg-white rounded-full ${
                              isNotePlaying
                                ? "h-2 animate-bounce"
                                : "h-1.5"
                            }`}
                          />
                          <span
                            className={`w-[2px] bg-white rounded-full ${
                              isNotePlaying
                                ? "h-2.5 animate-pulse"
                                : "h-2"
                            }`}
                          />
                        </span>
                        <span className="text-[11px] font-bold text-white truncate max-w-[95px]">
                          {note.pinnedSong.title}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate pl-3.5">
                        {note.pinnedSong.artist}
                      </div>
                      {note.content && (
                        <div className="text-[10px] text-white/95 mt-0.5 font-medium truncate max-w-[110px]">
                          {note.content}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] font-medium text-white/90 leading-snug px-1">
                      {note.content}
                    </p>
                  )}

                  {/* Instagram Speech Bubble Pointing Tail */}
                  <div className="absolute -bottom-1.5 left-4 w-2.5 h-2.5 bg-slate-900/90 rotate-45 border-r border-b border-white/20" />
                </motion.button>
              </div>

              {/* Avatar */}
              <div className="relative">
                <img
                  src={note.userAvatar}
                  alt={note.username}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              </div>
              <span className="text-[11px] text-slate-600 font-medium mt-1.5 truncate max-w-[90px]">
                {note.username}
              </span>
            </div>
          );
        })}
      </div>

      <NoteCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <NoteDetailModal
        note={selectedNoteForModal}
        isOpen={isNoteDetailOpen}
        onClose={() => setIsNoteDetailOpen(false)}
        onOpenCreateNewNote={() => setIsModalOpen(true)}
      />
    </div>
  );
}

