"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Music2,
  Check,
  Disc3,
  Search,
  Upload,
  Play,
  Pause,
  Loader2,
} from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { uploadMedia } from "@/lib/supabase";

interface NoteCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AudioTrack {
  title: string;
  artist: string;
  coverUrl: string;
  durationSeconds: number;
  previewUrl?: string;
  audioUrl?: string;
}

const SONG_PRESETS: AudioTrack[] = [
  {
    title: "midnight city",
    artist: "M83",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop",
    durationSeconds: 243,
  },
  {
    title: "resonance (night drive)",
    artist: "HOME",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    durationSeconds: 212,
  },
  {
    title: "Lost in Yesterday",
    artist: "Tame Impala",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop",
    durationSeconds: 249,
  },
  {
    title: "Weightless",
    artist: "Marconi Union",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop",
    durationSeconds: 485,
  },
];

const MOOD_EMOJIS = ["☕️", "✨", "🎧", "🌙", "🏔️", "💭", "🔥", "⚡️", "🖤", "🌊"];

export function NoteCreateModal({ isOpen, onClose }: NoteCreateModalProps) {
  const { addOrUpdateUserNote, notes } = useChatStore();
  const { currentUser } = useAuthStore();
  const currentSelfNote = notes.find((n) => n.userId === "acc_1");

  const [noteText, setNoteText] = useState(currentSelfNote?.content || "");
  const [selectedSong, setSelectedSong] = useState<AudioTrack | undefined>(
    currentSelfNote?.pinnedSong || SONG_PRESETS[0]
  );
  const [showSongPicker, setShowSongPicker] = useState(false);

  // iTunes live search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AudioTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Audio preview playback
  const [previewTrackUrl, setPreviewTrackUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop & destroy audio preview on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Search iTunes API with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/itunes?term=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tracks) {
            setSearchResults(data.tracks);
          }
        }
      } catch (err) {
        console.error("iTunes search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTogglePreview = (track: AudioTrack) => {
    if (!track.previewUrl) return;

    if (previewTrackUrl === track.previewUrl && isPlayingPreview) {
      audioRef.current?.pause();
      setIsPlayingPreview(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(track.previewUrl);
      } else {
        audioRef.current.src = track.previewUrl;
      }
      setPreviewTrackUrl(track.previewUrl);
      audioRef.current.play();
      setIsPlayingPreview(true);
      audioRef.current.onended = () => setIsPlayingPreview(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await uploadMedia(file);
    const customTrack: AudioTrack = {
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: currentUser?.name || "You",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop",
      durationSeconds: 120,
      previewUrl: res.url,
      audioUrl: res.url,
    };
    setSelectedSong(customTrack);
    setShowSongPicker(false);
  };

  const handleSave = () => {
    if (!noteText.trim() && !selectedSong) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const songPayload = selectedSong
      ? {
          title: selectedSong.title,
          artist: selectedSong.artist,
          coverUrl: selectedSong.coverUrl,
          durationSeconds: selectedSong.durationSeconds || 30,
          audioUrl: selectedSong.audioUrl || selectedSong.previewUrl,
          previewUrl: selectedSong.previewUrl || selectedSong.audioUrl,
        }
      : undefined;

    addOrUpdateUserNote(noteText.trim(), songPayload);
    onClose();
  };

  const handleAddEmoji = (emoji: string) => {
    if (noteText.length + emoji.length <= 60) {
      setNoteText((prev) => prev + emoji);
    }
  };

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center p-3 sm:p-4 select-none">
            {/* Glass Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                onClose();
              }}
              className="fixed inset-0 w-screen h-screen bg-slate-950/50 backdrop-blur-md"
            />

            {/* Floating Glass Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative w-full max-w-md max-h-[88vh] bg-white/95 backdrop-blur-3xl border border-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_70px_rgba(0,0,0,0.22)] z-10 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-3.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    <Music2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Share a Note</h3>
                    <p className="text-[11px] text-slate-400">Share a music snippet or status with followers</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    onClose();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="p-5 overflow-y-auto no-scrollbar flex-1 space-y-3.5">
                {/* LIVE INSTAGRAM NOTE PREVIEW */}
                <div className="py-4 flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl border border-slate-100">
              <div className="relative flex flex-col items-center">
                {/* Speech Bubble */}
                <div className="relative mb-2">
                  <motion.div
                    layout
                    className="relative px-3.5 py-2 bg-slate-900/95 text-white backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_6px_25px_rgba(0,0,0,0.2)] flex flex-col items-center text-center max-w-[170px]"
                  >
                    {selectedSong && (
                      <div className="w-full text-left mb-0.5">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span className="flex items-end gap-0.5 h-3 shrink-0">
                            <span className="w-[2px] h-3 bg-white rounded-full animate-pulse" />
                            <span className="w-[2px] h-2 bg-white rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
                            <span className="w-[2px] h-2.5 bg-white rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
                          </span>
                          <span className="text-[11px] font-bold text-white truncate max-w-[130px]">
                            {selectedSong.title}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate pl-3.5">
                          {selectedSong.artist}
                        </div>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-white/95 leading-snug break-words">
                      {noteText || (selectedSong ? "" : "Share a thought...")}
                    </p>

                    {/* Pointer tail */}
                    <div className="absolute -bottom-1.5 left-5 w-2.5 h-2.5 bg-slate-900/95 rotate-45 border-r border-b border-white/20" />
                  </motion.div>
                </div>

                {/* User Avatar */}
                <div className="relative">
                  <img
                    src={
                      currentUser?.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"
                    }
                    alt={currentUser?.name || "You"}
                    className="w-16 h-16 rounded-full object-cover ring-3 ring-white shadow-md"
                  />
                </div>
              </div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-2">
                Live Bubble Preview
              </span>
            </div>

            {/* Note Text Input */}
            <div className="space-y-2 mb-4">
              <div className="relative bg-slate-50 border border-slate-200/70 rounded-2xl p-3 focus-within:bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value.slice(0, 60))}
                  placeholder="What's on your mind? (up to 60 characters)"
                  rows={2}
                  className="w-full bg-transparent resize-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                />
                <div className="text-right text-[11px] font-medium text-slate-400">
                  {noteText.length}/60
                </div>
              </div>

              {/* Quick Mood Emojis */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {MOOD_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-sm transition-all shrink-0 hover:scale-110 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Pinned Soundtrack Picker with Live iTunes API search + MP3 upload */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-pink-500" />
                  Pinned Audio Track
                </span>
                <button
                  type="button"
                  onClick={() => setShowSongPicker(!showSongPicker)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {showSongPicker ? "Close Picker" : "Change Track"}
                </button>
              </div>

              {showSongPicker ? (
                <div className="space-y-2 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/70">
                  {/* Search iTunes Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search iTunes songs or artists..."
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-slate-400"
                    />
                    {isSearching && (
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 top-2.5" />
                    )}
                  </div>

                  {/* Manual File Upload option */}
                  <div className="flex items-center justify-between px-2 py-1 bg-white/70 rounded-xl border border-dashed border-slate-300">
                    <span className="text-[11px] text-slate-600">Or upload your own MP3</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      Browse
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Search Results or Presets */}
                  <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
                    {(searchResults.length > 0 ? searchResults : SONG_PRESETS).map((song) => {
                      const isSelected = selectedSong?.title === song.title;
                      const isTrackPlaying =
                        isPlayingPreview && previewTrackUrl === song.previewUrl;

                      return (
                        <div
                          key={`${song.title}-${song.artist}`}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                            isSelected
                              ? "bg-slate-900 text-white"
                              : "hover:bg-slate-200/70 text-slate-800 bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSong(song);
                              setShowSongPicker(false);
                            }}
                            className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                          >
                            <img
                              src={song.coverUrl}
                              alt={song.title}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                            <div className="truncate text-xs">
                              <span className="font-semibold block truncate">
                                {song.title}
                              </span>
                              <span
                                className={`text-[10px] truncate block ${
                                  isSelected ? "text-slate-300" : "text-slate-400"
                                }`}
                              >
                                {song.artist}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {song.previewUrl && (
                              <button
                                type="button"
                                onClick={() => handleTogglePreview(song)}
                                className={`p-1.5 rounded-full ${
                                  isSelected
                                    ? "bg-white/20 hover:bg-white/30 text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                                title="Play preview"
                              >
                                {isTrackPlaying ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <Play className="w-3 h-3 translate-x-0.5" />
                                )}
                              </button>
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selectedSong ? (
                <div className="flex items-center justify-between p-2.5 bg-slate-100/70 border border-slate-200/60 rounded-2xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <img
                        src={selectedSong.coverUrl}
                        alt={selectedSong.title}
                        className="w-9 h-9 rounded-xl object-cover shadow-sm"
                      />
                      <div className="absolute -top-1 -right-1 p-0.5 bg-slate-900 text-white rounded-full">
                        <Disc3 className="w-2.5 h-2.5 text-pink-400" />
                      </div>
                    </div>
                    <div className="truncate text-xs">
                      <div className="font-semibold text-slate-900 truncate">
                        {selectedSong.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {selectedSong.artist}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSong(undefined)}
                    className="text-[11px] text-rose-500 hover:underline px-2"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Fixed Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-white/70 backdrop-blur-md shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!noteText.trim() && !selectedSong}
                className="px-6 rounded-xl font-semibold shadow-sm"
              >
                Share Note
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </ClientPortal>
);
}

