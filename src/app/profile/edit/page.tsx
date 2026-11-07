"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Camera,
  Plus,
  Trash2,
  Check,
  Link2,
  Music2,
  Sparkles,
  Search,
  Play,
  Pause,
  UploadCloud,
  X,
  Loader2,
  Disc3,
  Edit2,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMusicStore } from "@/store/useMusicStore";
import { Button } from "@/components/ui/Button";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { uploadMedia } from "@/lib/supabase";

interface AudioTrackItem {
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl?: string;
}

const PRESET_PROFILE_SONGS: AudioTrackItem[] = [
  {
    title: "back to friends",
    artist: "sombr",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/03/49/74/034974c8-356a-e751-24fe-5c5ffbe51fb8/mzaf_10332306713437145885.plus.aac.p.m4a",
  },
  {
    title: "resonance (night drive)",
    artist: "HOME",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop",
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
    title: "midnight city",
    artist: "M83",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&h=120&fit=crop",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/03/49/74/034974c8-356a-e751-24fe-5c5ffbe51fb8/mzaf_10332306713437145885.plus.aac.p.m4a",
  },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser, updateProfile } = useAuthStore();
  const { currentTrack, playTrack } = useMusicStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const [name, setName] = useState(currentUser?.name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [links, setLinks] = useState(currentUser?.links || []);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<AudioTrackItem | null>(
    (currentUser?.profileMusic as AudioTrackItem) || null
  );

  useEffect(() => {
    if (currentUser) {
      setAvatar(currentUser.avatar || "");
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setLinks(currentUser.links || []);
      if (currentUser.profileMusic) {
        setSelectedMusic(currentUser.profileMusic as AudioTrackItem);
      }
    }
  }, [currentUser]);

  // Music Slide-up Sheet states
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicSheetOpen, setIsMusicSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AudioTrackItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  // Debounced iTunes API search
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
        console.error("iTunes query error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectSong = (track: AudioTrackItem) => {
    if (previewAudioRef.current) previewAudioRef.current.pause();
    setSelectedMusic(track);
    playTrack({
      id: `profile_track_${Date.now()}`,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      duration: 30,
      audioUrl: track.previewUrl,
    });
    setIsMusicSheetOpen(false);
  };

  const handleManualAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await uploadMedia(file);
    handleSelectSong({
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: currentUser?.name || "Aura Creator",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop",
      previewUrl: res.url,
    });
  };

  const handleTogglePreview = (track: AudioTrackItem) => {
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
      previewAudioRef.current.play().catch(() => {});
      previewAudioRef.current.onended = () => setPlayingPreview(null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadMedia(file);
    setAvatar(res.url);
  };

  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    setLinks([
      ...links,
      {
        title: newLinkTitle.trim(),
        url: newLinkUrl.trim().startsWith("http")
          ? newLinkUrl.trim()
          : `https://${newLinkUrl.trim()}`,
      },
    ]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    setShowAddLink(false);
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    updateProfile({
      name: name.trim() || currentUser?.name || "User",
      username: username.trim().toLowerCase().replace(/\s+/g, "") || currentUser?.username || "user",
      avatar,
      bio: bio.trim(),
      links,
      profileMusic: selectedMusic
        ? {
            title: selectedMusic.title,
            artist: selectedMusic.artist,
            coverUrl: selectedMusic.coverUrl,
            audioUrl: selectedMusic.previewUrl,
            previewUrl: selectedMusic.previewUrl,
            duration: 30,
          }
        : undefined,
    });
    router.push("/profile");
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-2xl mx-auto pb-24 md:pb-12 select-none">
      <div className="bg-white/85 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 sm:p-8 shadow-[0_16px_45px_rgba(0,0,0,0.04)] space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Cancel</span>
          </button>
          <h1 className="text-sm font-bold text-slate-900">Edit Profile</h1>
          <Button size="sm" onClick={handleSave} className="px-5 rounded-xl font-bold">
            Done
          </Button>
        </div>

        {/* Avatar Editor */}
        <div className="flex flex-col items-center justify-center py-2 space-y-2.5">
          <div className="relative group">
            <img
              src={avatar}
              alt="Profile avatar"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Change</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Change Profile Photo
          </button>
        </div>

        {/* Basic Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-xs text-slate-400">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 pl-8 pr-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Bio
              </label>
              <span className="text-[10px] text-slate-400">{bio.length}/150</span>
            </div>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              placeholder="Write something aesthetic about yourself..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>

        {/* Pinned Soundtrack Info */}
        <div
          onClick={() => setIsMusicSheetOpen(true)}
          className="p-3.5 bg-slate-50/90 hover:bg-slate-100 rounded-2xl border border-slate-200/70 hover:border-slate-300 space-y-2 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Music2 className="w-4 h-4 text-pink-500" />
              Pinned Profile Soundtrack
            </span>
            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Change
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {(selectedMusic || currentTrack) ? (
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={selectedMusic?.coverUrl || currentTrack?.coverUrl}
                  alt={selectedMusic?.title || currentTrack?.title}
                  className="w-9 h-9 rounded-lg object-cover"
                />
                <div className="truncate text-xs">
                  <div className="font-semibold text-slate-900 truncate">
                    {selectedMusic?.title || currentTrack?.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {selectedMusic?.artist || currentTrack?.artist}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
                <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Tap to select soundtrack</p>
          )}
        </div>

        {/* Links Manager */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              Profile Links ({links.length})
            </label>
            <button
              type="button"
              onClick={() => setShowAddLink(!showAddLink)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              {showAddLink ? "Cancel" : "+ Add Link"}
            </button>
          </div>

          {showAddLink && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <input
                type="text"
                placeholder="Link Title (e.g. Portfolio)"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <input
                type="text"
                placeholder="URL (e.g. https://vance.studio)"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddLink} className="rounded-xl">
                  Add to Profile
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            {links.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60"
              >
                <div className="truncate text-xs min-w-0 pr-2">
                  <div className="font-semibold text-slate-800 truncate">
                    {link.title}
                  </div>
                  <div className="text-[10px] text-blue-600 truncate">
                    {link.url}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file input for custom MP3 upload */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleManualAudioUpload}
        className="hidden"
      />

      {/* Music Selector Bottom Slide-Up Sheet */}
      <ClientPortal>
        <AnimatePresence>
          {isMusicSheetOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMusicSheetOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto bg-white/95 backdrop-blur-2xl rounded-t-[32px] border-t border-white/80 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] p-6 flex flex-col max-h-[85vh]"
              >
                {/* Drag / Pull handle */}
                <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                      <Music2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Pinned Profile Soundtrack</h3>
                      <p className="text-[11px] text-slate-500">Search 30s iTunes snippets or upload MP3</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMusicSheetOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar & Upload Button */}
                <div className="mt-4 space-y-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search songs or artists on iTunes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-11 pl-10 pr-10 bg-slate-100/80 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {isSearching && (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>Upload your own audio file (MP3 / M4A)</span>
                  </button>
                </div>

                {/* Track List */}
                <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 pb-4">
                  {(searchTerm.trim() ? searchResults : PRESET_PROFILE_SONGS).map((track, i) => {
                    const isSelected = currentTrack?.title === track.title;
                    const isPlaying = playingPreview === track.previewUrl;

                    return (
                      <div
                        key={i}
                        onClick={() => handleSelectSong(track)}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-200"
                            : "bg-white/80 hover:bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                          />
                          <div className="truncate text-xs">
                            <p className="font-semibold text-slate-900 truncate">{track.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{track.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {track.previewUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePreview(track);
                              }}
                              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                              title={isPlaying ? "Pause Preview" : "Play Preview"}
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 translate-x-0.5" />
                              )}
                            </button>
                          )}

                          {isSelected ? (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 px-2 py-0.5 rounded-full transition-colors">
                              Select
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </ClientPortal>
    </div>
  );
}
