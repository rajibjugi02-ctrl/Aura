"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Camera,
  UploadCloud,
  Music2,
  Search,
  Play,
  Pause,
  Check,
  Disc3,
  Loader2,
  Film,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMusicStore } from "@/store/useMusicStore";
import { useReelsStore } from "@/store/useReelsStore";
import { Button } from "@/components/ui/Button";
import { NativeCameraModal } from "@/components/camera/NativeCameraModal";
import { uploadMedia } from "@/lib/supabase";

interface AudioTrackOption {
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl?: string;
}

const DEFAULT_AUDIO_SUGGESTIONS: AudioTrackOption[] = [
  {
    title: "back to friends",
    artist: "sombr",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/03/49/74/034974c8-356a-e751-24fe-5c5ffbe51fb8/mzaf_10332306713437145885.plus.aac.p.m4a",
  },
  {
    title: "Lost in Kyoto",
    artist: "Tycho",
    coverUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=120&h=120&fit=crop",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/03/49/74/034974c8-356a-e751-24fe-5c5ffbe51fb8/mzaf_10332306713437145885.plus.aac.p.m4a",
  },
  {
    title: "Resonance (ambient mix)",
    artist: "HOME",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop",
  },
];

export default function CreateReelPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const { playTrack } = useMusicStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [mediaUrl, setMediaUrl] = useState<string>(
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&h=1920&fit=crop"
  );
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [caption, setCaption] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Music state
  const [selectedTrack, setSelectedTrack] = useState<AudioTrackOption | null>(
    DEFAULT_AUDIO_SUGGESTIONS[0]
  );
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AudioTrackOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  // iTunes live search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/itunes?term=${encodeURIComponent(searchTerm)}`);
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
  }, [searchTerm]);

  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await uploadMedia(file);
    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "photo");
    setMediaUrl(res.url);
  };

  const handleManualAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await uploadMedia(file);
    setSelectedTrack({
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: currentUser?.name || "You",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop",
      previewUrl: res.url,
    });
    setShowMusicPicker(false);
  };

  const handleToggleAudioPreview = (track: AudioTrackOption) => {
    if (!track.previewUrl) return;

    if (playingPreview === track.previewUrl) {
      previewAudioRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(track.previewUrl);
      } else {
        previewAudioRef.current.src = track.previewUrl;
      }
      setPlayingPreview(track.previewUrl);
      previewAudioRef.current.play().catch(() => { });
      previewAudioRef.current.onended = () => setPlayingPreview(null);
    }
  };

  const { addReel } = useReelsStore();

  const handlePublishReel = () => {
    if (previewAudioRef.current) previewAudioRef.current.pause();

    addReel({
      mediaUrl:
        mediaUrl ||
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&h=1920&fit=crop",
      type: mediaType === "photo" ? "image" : "video",
      author: {
        id: currentUser?.id || "user_self",
        username: currentUser?.username || "You",
        name: currentUser?.name || "You",
        avatar:
          currentUser?.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
      },
      caption: caption || "Captured via iOS Glass interface",
      audioTrack: selectedTrack
        ? {
          title: selectedTrack.title,
          artist: selectedTrack.artist,
          audioUrl: selectedTrack.previewUrl,
          previewUrl: selectedTrack.previewUrl,
        }
        : {
          title: "Original Audio",
          artist: currentUser?.name || "Original Sound",
        },
    });

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    useMusicStore.getState().pauseTrack();

    router.push("/reels");
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-4xl mx-auto pb-24 md:pb-12 select-none">
      <div className="bg-white/85 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 sm:p-8 shadow-[0_16px_45px_rgba(0,0,0,0.05)] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <Film className="w-4 h-4 text-pink-500" />
              Create Reel
            </h1>
            <p className="text-[11px] text-slate-400">9:16 vertical video & sound synchronization</p>
          </div>
          <Button size="sm" onClick={handlePublishReel} className="px-5 rounded-xl font-bold">
            Share
          </Button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-7">
          {/* Left Column: 9:16 Vertical Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[280px] aspect-[9/16] bg-slate-950 rounded-[28px] overflow-hidden shadow-xl flex items-center justify-center select-none group">
              {mediaType === "video" ? (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Reel preview"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Glass Sound Badge overlay */}
              {selectedTrack && (
                <div className="absolute bottom-3 left-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white flex items-center gap-2">
                  <Music2 className="w-3.5 h-3.5 text-pink-400 shrink-0 animate-pulse" />
                  <div className="truncate text-[11px]">
                    <span className="font-bold">{selectedTrack.title}</span> •{" "}
                    <span className="text-white/70">{selectedTrack.artist}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Media Action Buttons */}
            <div className="flex items-center gap-2.5 mt-4 w-full max-w-[280px]">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleDeviceUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Right Column: Audio Selection & Caption */}
          <div className="md:col-span-7 space-y-5">
            {/* Music Integration Section */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Music2 className="w-4 h-4 text-pink-500" />
                  Audio Soundtrack
                </label>
                <button
                  type="button"
                  onClick={() => setShowMusicPicker(!showMusicPicker)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  {showMusicPicker ? "Close" : selectedTrack ? "Change Music" : "Select Music"}
                </button>
              </div>

              {/* Selected Track Pill */}
              {selectedTrack && !showMusicPicker && (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={selectedTrack.coverUrl}
                      alt={selectedTrack.title}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="truncate text-xs">
                      <div className="font-bold text-slate-900 truncate">{selectedTrack.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{selectedTrack.artist}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                    30s Snippet
                  </span>
                </div>
              )}

              {/* Interactive Music Picker */}
              {showMusicPicker && (
                <div className="space-y-3 pt-2">
                  {/* iTunes Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search iTunes trending audio or artists..."
                      className="w-full h-9 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                    )}
                  </div>

                  {/* Manual MP3 Upload */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Or use custom audio file</span>
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Browse MP3
                    </button>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleManualAudioUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Track List */}
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1 pt-1">
                    {(searchResults.length > 0 ? searchResults : DEFAULT_AUDIO_SUGGESTIONS).map((track, i) => {
                      const isSelected = selectedTrack?.title === track.title;
                      const isPlaying = playingPreview === track.previewUrl;

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            setSelectedTrack(track);
                            setShowMusicPicker(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${isSelected ? "bg-slate-900 text-white" : "hover:bg-slate-200/60 text-slate-800"
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                            />
                            <div className="truncate text-xs">
                              <div className="font-semibold truncate">{track.title}</div>
                              <div className={`text-[10px] truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                                {track.artist}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {track.previewUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAudioPreview(track);
                                }}
                                className={`p-1.5 rounded-full ${isSelected ? "hover:bg-slate-800 text-white" : "hover:bg-slate-200 text-slate-700"
                                  }`}
                              >
                                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Reel Caption</label>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a catchy caption, hashtags, and mentions..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Native Camera Modal */}
      <NativeCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        initialMode="video"
        onCapture={({ type, url }) => {
          setMediaType(type);
          setMediaUrl(url);
        }}
      />
    </div>
  );
}

