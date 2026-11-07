"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Disc3, Volume2 } from "lucide-react";
import { useMusicStore } from "@/store/useMusicStore";
import { useAuthStore } from "@/store/useAuthStore";

export function ProfileMusicWidget() {
  const { currentTrack, isPlaying, currentTime, togglePlay, playTrack, tick } =
    useMusicStore();
  const { currentUser } = useAuthStore();

  const activeTrack = currentTrack || (currentUser?.profileMusic ? {
    id: `profile_pinned_${currentUser.id}`,
    title: currentUser.profileMusic.title,
    artist: currentUser.profileMusic.artist,
    coverUrl: currentUser.profileMusic.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop",
    audioUrl: currentUser.profileMusic.audioUrl || currentUser.profileMusic.previewUrl,
    duration: currentUser.profileMusic.duration || 30,
  } : null);

  useEffect(() => {
    const timer = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(timer);
  }, [tick]);

  if (!activeTrack) return null;

  const isCurrentPlaying = isPlaying && currentTrack?.title === activeTrack.title;
  const progressPercent = activeTrack.duration ? (currentTime / activeTrack.duration) * 100 : 0;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handlePlayToggle = () => {
    if (!currentTrack || currentTrack.title !== activeTrack.title) {
      if (activeTrack.audioUrl) {
        playTrack(activeTrack);
      }
    } else {
      togglePlay();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white/80 backdrop-blur-xl border border-white/90 p-3.5 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Track cover and vinyl rotation effect */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <img
              src={activeTrack.coverUrl}
              alt={activeTrack.title}
              className="w-11 h-11 rounded-xl object-cover shadow-sm"
            />
            {isCurrentPlaying && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute -top-1.5 -right-1.5 p-1 bg-slate-900 text-white rounded-full shadow-sm"
              >
                <Disc3 className="w-3 h-3 text-pink-400" />
              </motion.div>
            )}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pinned Song
              </span>
              <Volume2 className="w-3 h-3 text-blue-500" />
            </div>
            <div className="text-xs font-semibold text-slate-900 truncate">
              {activeTrack.title}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {activeTrack.artist}
            </div>
          </div>
        </div>

        {/* Play / Pause button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handlePlayToggle}
          className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm"
          aria-label={isCurrentPlaying ? "Pause track" : "Play track"}
        >
          {isCurrentPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white translate-x-0.5" />
          )}
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] text-slate-400 tabular-nums">
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-slate-800 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-400 tabular-nums">
          {formatTime(activeTrack.duration)}
        </span>
      </div>
    </motion.div>
  );
}

