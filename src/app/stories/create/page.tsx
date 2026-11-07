"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Type,
  Music2,
  AtSign,
  Upload,
  Play,
  Pause,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  Sliders,
  Palette,
  Volume2,
  Camera,
} from "lucide-react";
import { useStoryStore } from "@/store/useStoryStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { NativeCameraModal } from "@/components/camera/NativeCameraModal";
import { uploadMedia } from "@/lib/supabase";

type FontStyle =
  | "Deco"
  | "Squeeze"
  | "Typewriter"
  | "Strong"
  | "Elegant"
  | "Directional";

type TextBgMode = "transparent" | "solid-dark" | "solid-light" | "glass";

interface StoryText {
  id: string;
  content: string;
  fontStyle: FontStyle;
  bgMode: TextBgMode;
  color: string;
  fontSize: number; // in px
  x: number;
  y: number;
}

interface SelectedTrack {
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl?: string;
}

const PRESET_BACKGROUNDS = [
  {
    id: "sunset",
    label: "Sunset Glow",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&h=1600&fit=crop",
  },
  {
    id: "neon",
    label: "Tokyo Neon",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=900&h=1600&fit=crop",
  },
  {
    id: "studio",
    label: "Studio Tape",
    url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&h=1600&fit=crop",
  },
  {
    id: "aurora",
    label: "Alpine Mist",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&h=1600&fit=crop",
  },
];

const FONT_OPTIONS: { id: FontStyle; label: string; className: string }[] = [
  { id: "Deco", label: "Deco", className: "font-serif tracking-tight" },
  { id: "Squeeze", label: "Squeeze", className: "font-black uppercase tracking-tighter" },
  { id: "Typewriter", label: "Typewriter", className: "font-mono tracking-tight" },
  { id: "Strong", label: "Strong", className: "font-extrabold uppercase tracking-wide" },
  { id: "Elegant", label: "Elegant", className: "font-serif italic font-normal" },
  { id: "Directional", label: "Directional", className: "font-bold uppercase tracking-[0.2em]" },
];

const COLOR_PALETTE = [
  "#FFFFFF",
  "#0F172A",
  "#F43F5E",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
];

const AVAILABLE_USERS = [
  {
    id: "user_maya",
    username: "maya.chen",
    name: "Maya Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "user_lucas",
    username: "lucas_sound",
    name: "Lucas Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "user_elena",
    username: "elena_craft",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
  },
  {
    id: "user_sora",
    username: "sora.minimal",
    name: "Sora Takahashi",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
  },
  {
    id: "user_liam",
    username: "liam.film",
    name: "Liam Thorne",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  },
];

export default function StoryCreatePage() {
  const router = useRouter();
  const { addStory, openStory } = useStoryStore();
  const { currentUser } = useAuthStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const mp3InputRef = useRef<HTMLInputElement>(null);

  // Background Media State
  const [selectedBg, setSelectedBg] = useState(PRESET_BACKGROUNDS[0].url);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Drawers & Modals
  const [activeDrawer, setActiveDrawer] = useState<"text" | "music" | "mention" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Text Tool State
  const [textContent, setTextContent] = useState("");
  const [activeFontStyle, setActiveFontStyle] = useState<FontStyle>("Strong");
  const [textBgMode, setTextBgMode] = useState<TextBgMode>("solid-dark");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState(24);
  const [hasTextSticker, setHasTextSticker] = useState(false);

  // Music Tool State
  const [selectedTrack, setSelectedTrack] = useState<SelectedTrack | null>(null);
  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [musicResults, setMusicResults] = useState<SelectedTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [playingPreviewUrl, setPlayingPreviewUrl] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Mention Tool State
  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionSearch, setMentionSearch] = useState("");

  // iTunes Live Search
  useEffect(() => {
    if (!musicSearchQuery.trim()) {
      setMusicResults([]);
      setIsSearchingMusic(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMusic(true);
      try {
        const res = await fetch(`/api/itunes?term=${encodeURIComponent(musicSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tracks) {
            setMusicResults(data.tracks);
          }
        }
      } catch (err) {
        console.error("Failed to query iTunes:", err);
      } finally {
        setIsSearchingMusic(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [musicSearchQuery]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      const res = await uploadMedia(file);
      setSelectedBg(res.url);
      if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    } catch (err: unknown) {
      console.error("Story media upload failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to upload file.";
      setUploadError(msg);
      setTimeout(() => setUploadError(null), 4000);
    }
  };

  const handleMp3Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      const res = await uploadMedia(file);
      const newTrack: SelectedTrack = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: currentUser?.name || "You",
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop",
        previewUrl: res.url,
      };
      setSelectedTrack(newTrack);
      setActiveDrawer(null);
    } catch (err: unknown) {
      console.error("Story audio upload failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to upload audio.";
      setUploadError(msg);
      setTimeout(() => setUploadError(null), 4000);
    }
  };

  const handleToggleAudioPreview = (track: SelectedTrack) => {
    if (!track.previewUrl) return;

    if (playingPreviewUrl === track.previewUrl) {
      audioPreviewRef.current?.pause();
      setPlayingPreviewUrl(null);
    } else {
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(track.previewUrl);
      } else {
        audioPreviewRef.current.src = track.previewUrl;
      }
      setPlayingPreviewUrl(track.previewUrl);
      audioPreviewRef.current.play();
      audioPreviewRef.current.onended = () => setPlayingPreviewUrl(null);
    }
  };

  const toggleMention = (username: string) => {
    if (mentions.includes(username)) {
      setMentions(mentions.filter((m) => m !== username));
    } else {
      setMentions([...mentions, username]);
    }
  };

  const handlePublishStory = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    addStory({
      mediaUrl: selectedBg,
      type: mediaType,
      durationSeconds: 5,
      caption: hasTextSticker ? textContent : undefined,
      musicTrack: selectedTrack
        ? {
            title: selectedTrack.title,
            artist: selectedTrack.artist,
            previewUrl: selectedTrack.previewUrl,
            audioUrl: selectedTrack.previewUrl,
            coverUrl: selectedTrack.coverUrl,
            duration: 30,
          }
        : undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
    });

    const user = useAuthStore.getState().currentUser;
    // Immediately open newly created story
    openStory(user?.id || "user_self");
    router.push("/");
  };

  const currentFont = FONT_OPTIONS.find((f) => f.id === activeFontStyle) || FONT_OPTIONS[0];

  const getTextBgClasses = () => {
    switch (textBgMode) {
      case "solid-dark":
        return "bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg";
      case "solid-light":
        return "bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg";
      case "glass":
        return "bg-white/30 backdrop-blur-xl border border-white/40 px-3.5 py-1.5 rounded-2xl shadow-lg";
      case "transparent":
      default:
        return "drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center select-none overflow-hidden text-white">
      {/* Hidden file inputs */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleMediaUpload}
        className="hidden"
      />
      <input
        ref={mp3InputRef}
        type="file"
        accept="audio/*"
        onChange={handleMp3Upload}
        className="hidden"
      />

      {/* Main 9:16 Canvas Stage */}
      <div
        ref={canvasRef}
        className="relative w-full max-w-[420px] h-full sm:h-[92vh] sm:max-h-[850px] sm:rounded-[36px] overflow-hidden bg-black shadow-[0_25px_80px_rgba(0,0,0,0.7)] flex flex-col justify-between"
      >
        {/* Background Media */}
        <div className="absolute inset-0 z-0">
          {mediaType === "video" ? (
            <video
              src={selectedBg}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={selectedBg}
              alt="Story stage background"
              className="w-full h-full object-cover"
            />
          )}

          {/* Vignette shadow gradient for legibility */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-4 right-4 z-50 bg-rose-500/90 backdrop-blur-md text-white text-xs font-semibold py-2.5 px-4 rounded-2xl text-center shadow-lg border border-rose-400/40"
            >
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Controls Bar */}
        <div className="relative z-20 flex items-center justify-between p-4 pt-5">
          {/* Close / Discard */}
          <button
            onClick={() => {
              if (audioPreviewRef.current) audioPreviewRef.current.pause();
              router.push("/");
            }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            title="Discard story"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tools Action Row */}
          <div className="flex items-center gap-2">
            {/* Text Overlay Tool */}
            <button
              onClick={() => setActiveDrawer(activeDrawer === "text" ? null : "text")}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                activeDrawer === "text"
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-black/40 text-white hover:bg-black/60"
              }`}
              title="Add or edit text"
            >
              <Type className="w-5 h-5" />
            </button>

            {/* Music Tool */}
            <button
              onClick={() => setActiveDrawer(activeDrawer === "music" ? null : "music")}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all relative ${
                activeDrawer === "music"
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-black/40 text-white hover:bg-black/60"
              }`}
              title="Add music"
            >
              <Music2 className="w-5 h-5" />
              {selectedTrack && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-pink-500" />
              )}
            </button>

            {/* Mention Tool */}
            <button
              onClick={() => setActiveDrawer(activeDrawer === "mention" ? null : "mention")}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all relative ${
                activeDrawer === "mention"
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-black/40 text-white hover:bg-black/60"
              }`}
              title="Tag people"
            >
              <AtSign className="w-5 h-5" />
              {mentions.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
              )}
            </button>

            {/* Native Camera Button */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 backdrop-blur-md text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              title="Record video or snap photo with camera"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Upload Custom Media */}
            <button
              onClick={() => mediaInputRef.current?.click()}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              title="Upload photo or video from device"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DRAGGABLE ON-CANVAS OVERLAYS */}
        <div className="relative z-10 flex-1 w-full h-full pointer-events-auto overflow-hidden">
          {/* Draggable Text Sticker */}
          {hasTextSticker && textContent.trim() && (
            <motion.div
              drag
              dragConstraints={canvasRef}
              dragElastic={0.1}
              whileDrag={{ scale: 1.05 }}
              className="absolute left-1/2 top-1/3 -translate-x-1/2 cursor-grab active:cursor-grabbing select-none group"
            >
              <div className="relative">
                <div
                  onClick={() => setActiveDrawer("text")}
                  style={{
                    fontSize: `${fontSize}px`,
                    color: textBgMode === "solid-light" ? "#0F172A" : textColor,
                  }}
                  className={`${currentFont.className} ${getTextBgClasses()} text-center leading-snug transition-all max-w-[320px] break-words`}
                >
                  {textContent}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHasTextSticker(false);
                    setTextContent("");
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 text-white border border-white/30 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                  title="Remove text"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Draggable Music Sticker */}
          {selectedTrack && (
            <motion.div
              drag
              dragConstraints={canvasRef}
              dragElastic={0.1}
              whileDrag={{ scale: 1.05 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2.5 bg-black/75 backdrop-blur-xl border border-white/30 rounded-2xl p-2 px-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                <img
                  src={selectedTrack.coverUrl}
                  alt={selectedTrack.title}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/30 shrink-0"
                />
                <div className="text-left min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    {/* Equalizer Wave */}
                    <span className="flex items-end gap-0.5 h-3 shrink-0">
                      <span className="w-[2px] h-3 bg-pink-400 rounded-full animate-pulse" />
                      <span className="w-[2px] h-2 bg-pink-400 rounded-full animate-bounce" />
                      <span className="w-[2px] h-2.5 bg-pink-400 rounded-full animate-pulse" />
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      {selectedTrack.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 truncate pl-3">
                    {selectedTrack.artist}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrack(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Draggable Mention Stickers */}
          {mentions.map((user, idx) => (
            <motion.div
              key={user}
              drag
              dragConstraints={canvasRef}
              dragElastic={0.1}
              whileDrag={{ scale: 1.05 }}
              style={{ top: `${60 + idx * 12}%`, left: "30%" }}
              className="absolute cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-1.5 bg-white/95 text-slate-900 backdrop-blur-xl px-3 py-1.5 rounded-full font-bold text-xs shadow-lg border border-white/80">
                <AtSign className="w-3.5 h-3.5 text-blue-600" />
                <span>{user}</span>
                <button
                  onClick={() => toggleMention(user)}
                  className="ml-1 p-0.5 text-slate-400 hover:text-slate-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar: Wallpaper Presets & Share Button */}
        <div className="relative z-20 p-4 pb-6 space-y-3">
          {/* Preset Wallpapers Picker */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {PRESET_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => {
                  setSelectedBg(bg.url);
                  setMediaType("image");
                }}
                className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-transform ${
                  selectedBg === bg.url
                    ? "border-white scale-105 shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
                title={bg.label}
              >
                <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Share Action Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  currentUser?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop"
                }
                alt={currentUser?.name || "Your Story"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
              />
              <div className="text-left text-xs">
                <div className="font-bold">Your Story</div>
                <div className="text-[10px] text-slate-400">Share to followers</div>
              </div>
            </div>

            <Button
              onClick={handlePublishStory}
              className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold hover:bg-slate-100 shadow-xl flex items-center gap-2"
            >
              <span>Share</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* TEXT TOOL DRAWER (Responsive: Slide-Up on Mobile, Slide-In on Desktop) */}
      <AnimatePresence>
        {activeDrawer === "text" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%", x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed bottom-0 inset-x-0 sm:bottom-auto sm:inset-x-auto sm:top-0 sm:right-0 sm:w-[400px] sm:h-full bg-slate-900/95 border-t sm:border-t-0 sm:border-l border-white/20 backdrop-blur-3xl p-6 z-40 rounded-t-[32px] sm:rounded-none max-h-[85vh] sm:max-h-full overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-bold text-sm">Advanced Text Tool</h3>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Text Input Area */}
              <div className="py-4 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Text Content
                  </label>
                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Type your story text..."
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white font-medium"
                    autoFocus
                  />
                </div>

                {/* Font Style Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Font Typo Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setActiveFontStyle(f.id)}
                        className={`p-2.5 rounded-xl border text-xs text-center transition-all ${
                          activeFontStyle === f.id
                            ? "bg-white text-slate-900 border-white font-bold shadow-md"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        } ${f.className}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Mode Toggle */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Background Style
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {(
                      [
                        { id: "transparent", label: "Clear" },
                        { id: "solid-dark", label: "Dark Pill" },
                        { id: "solid-light", label: "Light Pill" },
                        { id: "glass", label: "Glass" },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setTextBgMode(mode.id)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          textBgMode === mode.id
                            ? "bg-white text-slate-900 border-white font-bold"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          textColor === c
                            ? "border-white scale-110 shadow-md ring-2 ring-blue-500/50"
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <span>Font Size</span>
                    <span>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="42"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasTextSticker(false);
                      setTextContent("");
                      setActiveDrawer(null);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-rose-500/20 text-rose-400 font-bold transition-all text-xs flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove Text</span>
                  </button>
                  <Button
                    onClick={() => {
                      if (textContent.trim()) {
                        setHasTextSticker(true);
                      }
                      setActiveDrawer(null);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MUSIC TOOL DRAWER (Responsive: Slide-Up on Mobile, Slide-In on Desktop) */}
      <AnimatePresence>
        {activeDrawer === "music" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%", x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed bottom-0 inset-x-0 sm:bottom-auto sm:inset-x-auto sm:top-0 sm:right-0 sm:w-[400px] sm:h-full bg-slate-900/95 border-t sm:border-t-0 sm:border-l border-white/20 backdrop-blur-3xl p-6 z-40 rounded-t-[32px] sm:rounded-none max-h-[85vh] sm:max-h-full overflow-y-auto no-scrollbar flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-pink-400" />
                    <h3 className="font-bold text-sm">Add Music Track</h3>
                  </div>
                  <button
                    onClick={() => setActiveDrawer(null)}
                    className="p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* iTunes Search Bar */}
                <div className="py-4 space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={musicSearchQuery}
                      onChange={(e) => setMusicSearchQuery(e.target.value)}
                      placeholder="Search songs or artists on iTunes..."
                      className="w-full bg-white/10 border border-white/20 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-white"
                      autoFocus
                    />
                    {isSearchingMusic && (
                      <Loader2 className="w-4 h-4 text-pink-400 animate-spin absolute right-3 top-3" />
                    )}
                  </div>

                  {/* Manual MP3 Upload Option */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-dashed border-white/20 rounded-2xl">
                    <div className="text-xs">
                      <div className="font-semibold text-white">Custom Audio File</div>
                      <div className="text-[10px] text-slate-400">Upload your own .mp3 file</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => mp3InputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Browse MP3
                    </button>
                  </div>

                  {/* List of Tracks */}
                  <div className="space-y-1.5 max-h-[46vh] sm:max-h-[55vh] overflow-y-auto no-scrollbar pt-1">
                    {(musicResults.length > 0
                      ? musicResults
                      : [
                          {
                            title: "midnight city",
                            artist: "M83",
                            coverUrl:
                              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop",
                            previewUrl:
                              "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/91/3d/bf/913dbf07-a36c-9a4f-561b-9e4fc416c117/mzaf_6380630716757659560.plus.aac.p.m4a",
                          },
                          {
                            title: "Resonance",
                            artist: "HOME",
                            coverUrl:
                              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
                            previewUrl:
                              "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/03/49/74/034974c8-356a-e751-24fe-5c5ffbe51fb8/mzaf_10332306713437145885.plus.aac.p.m4a",
                          },
                          {
                            title: "Lost in Yesterday",
                            artist: "Tame Impala",
                            coverUrl:
                              "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop",
                            previewUrl:
                              "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/6c/ca/4f/6cca4f5d-d9b8-3e4b-610e-8fb88a7e02e1/mzaf_15783353457591657805.plus.aac.p.m4a",
                          },
                        ]
                    ).map((track) => {
                      const isSelected = selectedTrack?.title === track.title;
                      const isPlaying = playingPreviewUrl === track.previewUrl;

                      return (
                        <div
                          key={`${track.title}-${track.artist}`}
                          className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                            isSelected
                              ? "bg-white text-slate-900 shadow-md"
                              : "bg-white/5 hover:bg-white/10 text-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTrack(track);
                              setActiveDrawer(null);
                            }}
                            className="flex items-center gap-3 min-w-0 text-left flex-1"
                          >
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                            <div className="truncate text-xs">
                              <span className="font-bold block truncate">
                                {track.title}
                              </span>
                              <span
                                className={`text-[10px] truncate block ${
                                  isSelected ? "text-slate-600" : "text-slate-400"
                                }`}
                              >
                                {track.artist}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {track.previewUrl && (
                              <button
                                type="button"
                                onClick={() => handleToggleAudioPreview(track)}
                                className={`p-2 rounded-full ${
                                  isSelected
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-900"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                                }`}
                                title="Play 30s preview"
                              >
                                {isPlaying ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 translate-x-0.5" />
                                )}
                              </button>
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  onClick={() => setActiveDrawer(null)}
                  className="w-full py-3 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MENTION TOOL DRAWER (Responsive: Slide-Up on Mobile, Slide-In on Desktop) */}
      <AnimatePresence>
        {activeDrawer === "mention" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%", x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed bottom-0 inset-x-0 sm:bottom-auto sm:inset-x-auto sm:top-0 sm:right-0 sm:w-[400px] sm:h-full bg-slate-900/95 border-t sm:border-t-0 sm:border-l border-white/20 backdrop-blur-3xl p-6 z-40 rounded-t-[32px] sm:rounded-none max-h-[85vh] sm:max-h-full overflow-y-auto no-scrollbar flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <AtSign className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm">Mention Friends</h3>
                  </div>
                  <button
                    onClick={() => setActiveDrawer(null)}
                    className="p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Search */}
                <div className="py-4 space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={mentionSearch}
                      onChange={(e) => setMentionSearch(e.target.value)}
                      placeholder="Search accounts to tag..."
                      className="w-full bg-white/10 border border-white/20 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-white"
                      autoFocus
                    />
                  </div>

                  {/* Available Users */}
                  <div className="space-y-1.5 max-h-[46vh] sm:max-h-[55vh] overflow-y-auto no-scrollbar pt-1">
                    {AVAILABLE_USERS.filter((u) =>
                      u.username.toLowerCase().includes(mentionSearch.toLowerCase()) ||
                      u.name.toLowerCase().includes(mentionSearch.toLowerCase())
                    ).map((user) => {
                      const isTagged = mentions.includes(user.username);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleMention(user.username)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                            isTagged
                              ? "bg-white text-slate-900 shadow-md"
                              : "bg-white/5 hover:bg-white/10 text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="text-left text-xs min-w-0">
                              <span className="font-bold block truncate">
                                @{user.username}
                              </span>
                              <span
                                className={`text-[10px] truncate block ${
                                  isTagged ? "text-slate-600" : "text-slate-400"
                                }`}
                              >
                                {user.name}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                              isTagged
                                ? "bg-slate-900 text-white"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            {isTagged ? "Tagged" : "Tag"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  onClick={() => setActiveDrawer(null)}
                  className="w-full py-3 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Native Camera Modal */}
      <NativeCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        initialMode="photo"
        onCapture={({ type, url }) => {
          setSelectedBg(url);
          setMediaType(type === "video" ? "video" : "image");
        }}
      />
    </div>
  );
}

