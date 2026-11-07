"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Music,
  ChevronLeft,
  ChevronRight,
  Search,
  Play,
  Pause,
  Check,
  Loader2,
  Disc3,
  X,
} from "lucide-react";
import { useFeedStore } from "@/store/useFeedStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { uploadMedia } from "@/lib/supabase";

interface AudioTrackOption {
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl?: string;
}

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1080&h=1080&fit=crop",
];

const FILTERS = [
  { id: "none", name: "Normal", class: "" },
  { id: "clarendon", name: "Clarendon", class: "contrast-125 saturate-125" },
  { id: "juno", name: "Juno", class: "contrast-115 hue-rotate-15" },
  { id: "ludwig", name: "Ludwig", class: "sepia-[0.2] contrast-110" },
  { id: "mono", name: "Mono", class: "grayscale" },
];

const TRENDING_TRACKS: AudioTrackOption[] = [
  {
    title: "Resonance",
    artist: "HOME",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/03/49/74/034974c8-356a-e751-24fe-5c5ffbe51fb8/mzaf_10332306713437145885.plus.aac.p.m4a",
  },
  {
    title: "midnight city",
    artist: "M83",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/91/3d/bf/913dbf07-a36c-9a4f-561b-9e4fc416c117/mzaf_6380630716757659560.plus.aac.p.m4a",
  },
  {
    title: "Lost in Yesterday",
    artist: "Tame Impala",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/6c/ca/4f/6cca4f5d-d9b8-3e4b-610e-8fb88a7e02e1/mzaf_15783353457591657805.plus.aac.p.m4a",
  },
];

export default function UploadPage() {
  const router = useRouter();
  const { createPost } = useFeedStore();
  const { currentUser } = useAuthStore();

  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([SAMPLE_IMAGES[0]]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:5" | "16:9">("1:1");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [caption, setCaption] = useState("");

  const [musicMode, setMusicMode] = useState<"auto" | "manual" | "none">("auto");
  const [selectedTrack, setSelectedTrack] = useState<AudioTrackOption | null>(TRENDING_TRACKS[0]);
  const [searchMusicTerm, setSearchMusicTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AudioTrackOption[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [playingPreviewUrl, setPlayingPreviewUrl] = useState<string | null>(null);
  const [manualMusicFileName, setManualMusicFileName] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Search iTunes API
  useEffect(() => {
    if (!searchMusicTerm.trim()) {
      setSearchResults([]);
      setIsSearchingMusic(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMusic(true);
      try {
        const res = await fetch(`/api/itunes?term=${encodeURIComponent(searchMusicTerm)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tracks) {
            setSearchResults(data.tracks);
          }
        }
      } catch (err) {
        console.error("iTunes query error:", err);
      } finally {
        setIsSearchingMusic(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchMusicTerm]);

  const handleToggleAudioPreview = (track: AudioTrackOption) => {
    if (!track.previewUrl) return;

    if (playingPreviewUrl === track.previewUrl) {
      audioRef.current?.pause();
      setPlayingPreviewUrl(null);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(track.previewUrl);
      } else {
        audioRef.current.src = track.previewUrl;
      }
      setPlayingPreviewUrl(track.previewUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingPreviewUrl(null);
    }
  };

  const handleAddSample = (url: string) => {
    if (!selectedPhotos.includes(url)) {
      setSelectedPhotos([...selectedPhotos, url]);
    }
  };

  const handleDeletePhoto = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotos((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    setCurrentSlide((prev) => (prev >= indexToDelete && prev > 0 ? prev - 1 : 0));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const results = await Promise.all(files.map((file) => uploadMedia(file)));
      const urls = results.map((r) => r.url);
      setSelectedPhotos((prev) => [...prev, ...urls]);
    }
  };

  const handleManualAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setManualMusicFileName(file.name);
      setSelectedTrack({
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: currentUser?.name || "You",
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop",
      });
    }
  };

  const handlePublish = () => {
    if (audioRef.current) audioRef.current.pause();

    createPost({
      author: {
        id: currentUser?.id || `acc_${Date.now()}`,
        name: currentUser?.name || "Aura Member",
        username: currentUser?.username || `user_${Date.now().toString().slice(-4)}`,
        avatar:
          currentUser?.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      },
      media: selectedPhotos.map((url) => ({
        url,
        aspectRatio,
        filter: selectedFilter,
      })),
      caption: caption || "Captured via iOS Glass interface",
      musicTrack:
        musicMode === "auto" && selectedTrack
          ? {
              title: selectedTrack.title,
              artist: selectedTrack.artist,
              duration: 30,
              source: "library",
              audioUrl: selectedTrack.previewUrl,
              previewUrl: selectedTrack.previewUrl,
            }
          : musicMode === "manual" && manualMusicFileName && selectedTrack
          ? {
              title: manualMusicFileName.replace(/\.[^/.]+$/, ""),
              artist: currentUser?.username || "user",
              duration: 120,
              source: "upload",
              audioUrl: selectedTrack.previewUrl,
              previewUrl: selectedTrack.previewUrl,
            }
          : undefined,
    });

    router.push("/");
  };

  const ratioClass = {
    "1:1": "aspect-square",
    "4:5": "aspect-[4/5]",
    "16:9": "aspect-video",
  }[aspectRatio];

  return (
    <div className="py-6 px-3 sm:px-6 max-w-4xl mx-auto pb-24 md:pb-12 select-none">
      <div className="bg-white/85 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 sm:p-8 shadow-[0_16px_45px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create New Post</h2>
            <p className="text-xs text-slate-400">Share memories with custom ratio and audio sync</p>
          </div>
          <Button size="sm" onClick={handlePublish} className="px-5 rounded-xl font-bold">
            Share
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 pt-6">
          {/* Left Column: Carousel Preview */}
          <div className="space-y-3">
            <div
              className={`relative ${ratioClass} bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center`}
            >
              {selectedPhotos.length > 0 ? (
                <>
                  <img
                    src={selectedPhotos[currentSlide] || selectedPhotos[0]}
                    alt="Upload preview"
                    className={`w-full h-full object-cover ${
                      FILTERS.find((f) => f.id === selectedFilter)?.class || ""
                    }`}
                  />

                  {/* Carousel navigation */}
                  {selectedPhotos.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentSlide((prev) =>
                            prev > 0 ? prev - 1 : selectedPhotos.length - 1
                          )
                        }
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentSlide((prev) =>
                            prev < selectedPhotos.length - 1 ? prev + 1 : 0
                          )
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-1 rounded-full">
                        {selectedPhotos.map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              i === currentSlide ? "bg-white" : "bg-white/40"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <UploadCloud className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-white/90">No photos selected</p>
                  <p className="text-[11px] text-white/60 mb-3">Upload from device or pick a sample</p>
                  <button
                    type="button"
                    onClick={() => setSelectedPhotos([SAMPLE_IMAGES[0]])}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium backdrop-blur-sm transition-all"
                  >
                    Load Sample Photo
                  </button>
                </div>
              )}
            </div>

            {/* Multiple Photos Selector */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Selected Photos ({selectedPhotos.length})</span>
                <label className="text-blue-600 cursor-pointer hover:underline flex items-center gap-1 font-medium">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload from Device
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-0.5">
                {selectedPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <button
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden block ring-2 transition-all ${
                        currentSlide === idx ? "ring-blue-600 shadow-sm" : "ring-transparent hover:opacity-90"
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePhoto(idx, e)}
                      title="Remove photo"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-all active:scale-90 z-10"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                ))}
                {SAMPLE_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSample(sample)}
                    className="w-14 h-14 rounded-xl border border-dashed border-slate-300 flex items-center justify-center shrink-0 hover:bg-slate-50 text-[10px] text-slate-500 font-medium text-center p-1 transition-colors"
                  >
                    + Sample
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Ratio, Filters, Music Integration, Caption */}
          <div className="space-y-4">
            {/* Aspect Ratio Adjuster */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Adjust Ratio
              </label>
              <div className="flex gap-2">
                {(["1:1", "4:5", "16:9"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      aspectRatio === r
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {r === "1:1" ? "1:1 Square" : r === "4:5" ? "4:5 Portrait" : "16:9 Landscape"}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Filter Presets
              </label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border shrink-0 transition-all ${
                      selectedFilter === f.id
                        ? "bg-blue-50 text-blue-700 border-blue-300 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Music Integration */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-pink-500" />
                  <span>Music Integration</span>
                </div>
                {selectedTrack && (
                  <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full">
                    {selectedTrack.title}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                {/* Search iTunes Mode */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="music"
                      checked={musicMode === "auto"}
                      onChange={() => setMusicMode("auto")}
                    />
                    <span className="font-semibold text-slate-800">
                      Search iTunes Soundtrack (30s preview)
                    </span>
                  </label>

                  {musicMode === "auto" && (
                    <div className="space-y-2 pt-1">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={searchMusicTerm}
                          onChange={(e) => setSearchMusicTerm(e.target.value)}
                          placeholder="Search track or artist on iTunes..."
                          className="w-full bg-slate-50 pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 focus:outline-none focus:border-slate-400"
                        />
                        {isSearchingMusic && (
                          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-2.5 top-2.5" />
                        )}
                      </div>

                      {/* Tracks list */}
                      <div className="space-y-1 max-h-28 overflow-y-auto no-scrollbar">
                        {(searchResults.length > 0 ? searchResults : TRENDING_TRACKS).map((track) => {
                          const isSel = selectedTrack?.title === track.title;
                          const isPlaying = playingPreviewUrl === track.previewUrl;

                          return (
                            <div
                              key={`${track.title}-${track.artist}`}
                              className={`flex items-center justify-between p-1.5 rounded-lg transition-colors ${
                                isSel ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-800"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedTrack(track)}
                                className="flex items-center gap-2 text-left min-w-0 flex-1"
                              >
                                <img
                                  src={track.coverUrl}
                                  alt={track.title}
                                  className="w-6 h-6 rounded-md object-cover"
                                />
                                <div className="truncate text-[11px]">
                                  <span className="font-semibold block truncate">
                                    {track.title}
                                  </span>
                                  <span
                                    className={`text-[9px] block truncate ${
                                      isSel ? "text-slate-300" : "text-slate-400"
                                    }`}
                                  >
                                    {track.artist}
                                  </span>
                                </div>
                              </button>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {track.previewUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAudioPreview(track)}
                                    className={`p-1 rounded-full ${
                                      isSel ? "text-white hover:bg-white/20" : "text-slate-600 hover:bg-slate-200"
                                    }`}
                                  >
                                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                  </button>
                                )}
                                {isSel && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual File Upload Mode */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer mb-1">
                    <input
                      type="radio"
                      name="music"
                      checked={musicMode === "manual"}
                      onChange={() => setMusicMode("manual")}
                    />
                    <span className="font-semibold text-slate-800">
                      Upload Custom Audio (.mp3 / .wav)
                    </span>
                  </label>

                  {musicMode === "manual" && (
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleManualAudioUpload}
                      className="mt-1.5 text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-900 file:text-white"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption... share your thoughts"
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

