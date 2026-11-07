"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Sparkles, Check, Edit2, Trash2, Camera } from "lucide-react";
import { Highlight } from "@/types";
import { useStoryStore } from "@/store/useStoryStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { uploadMedia } from "@/lib/supabase";

const INITIAL_HIGHLIGHTS: Highlight[] = [
  {
    id: "hl_1",
    title: "Kyoto '25",
    coverUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&h=200&fit=crop",
    storyIds: ["st_2_1"],
  },
  {
    id: "hl_2",
    title: "Alpine Hike",
    coverUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&h=200&fit=crop",
    storyIds: ["st_1_1"],
  },
  {
    id: "hl_3",
    title: "Studio Sound",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
    storyIds: ["st_3_1"],
  },
];

export function StoryHighlights() {
  const { userGroups } = useStoryStore();
  const [highlights, setHighlights] = useState<Highlight[]>(INITIAL_HIGHLIGHTS);

  // New Highlight modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState("");
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);

  // Edit Highlight modal states
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCover, setEditCover] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { currentUser } = useAuthStore();
  const currentUserId = currentUser?.id || "user_self";
  const currentUserStories =
    userGroups.find((g) => g.userId === currentUserId)?.stories || [];

  const handleCreate = () => {
    if (!highlightTitle.trim() || selectedStoryIds.length === 0) return;

    const firstStory = currentUserStories.find((s) => s.id === selectedStoryIds[0]);

    const newHl: Highlight = {
      id: `hl_${Date.now()}`,
      title: highlightTitle.trim(),
      coverUrl:
        firstStory?.mediaUrl ||
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&h=200&fit=crop",
      storyIds: selectedStoryIds,
    };

    setHighlights([...highlights, newHl]);
    setHighlightTitle("");
    setSelectedStoryIds([]);
    setIsCreateModalOpen(false);
  };

  const handleOpenEdit = (hl: Highlight) => {
    setEditingHighlight(hl);
    setEditTitle(hl.title);
    setEditCover(hl.coverUrl);
  };

  const handleSaveEdit = () => {
    if (!editingHighlight || !editTitle.trim()) return;

    setHighlights((prev) =>
      prev.map((h) =>
        h.id === editingHighlight.id
          ? { ...h, title: editTitle.trim(), coverUrl: editCover }
          : h
      )
    );
    setEditingHighlight(null);
  };

  const handleDeleteHighlight = () => {
    if (!editingHighlight) return;
    setHighlights((prev) => prev.filter((h) => h.id !== editingHighlight.id));
    setEditingHighlight(null);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadMedia(file);
    setEditCover(res.url);
  };

  const toggleSelectStory = (id: string) => {
    if (selectedStoryIds.includes(id)) {
      setSelectedStoryIds(selectedStoryIds.filter((item) => item !== id));
    } else {
      setSelectedStoryIds([...selectedStoryIds, id]);
    }
  };

  return (
    <div className="w-full py-2 select-none">
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        className="hidden"
      />

      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
        {/* "+ New" highlight button */}
        <div className="flex flex-col items-center shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 hover:border-slate-500 bg-white/70 backdrop-blur-md flex items-center justify-center text-slate-600 transition-colors shadow-sm"
            title="Create new highlight"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
          <span className="text-[11px] font-medium text-slate-600 mt-1.5">
            New
          </span>
        </div>

        {/* Existing Highlights */}
        {highlights.map((hl) => (
          <div key={hl.id} className="flex flex-col items-center shrink-0 relative group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenEdit(hl)}
              className="p-0.5 rounded-full ring-2 ring-slate-200 bg-white cursor-pointer shadow-sm relative"
            >
              <img
                src={hl.coverUrl}
                alt={hl.title}
                className="w-14 h-14 rounded-full object-cover"
              />
              {/* Subtle hover edit pen */}
              <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Edit2 className="w-3.5 h-3.5" />
              </div>
            </motion.div>
            <span className="text-[11px] font-medium text-slate-700 mt-1.5 truncate max-w-[70px]">
              {hl.title}
            </span>
          </div>
        ))}
      </div>

      {/* HIGHLIGHTS EDITOR: Bottom-Up on Mobile, Centered Modal on Desktop */}
      <ClientPortal>
        <AnimatePresence>
          {editingHighlight && (
            <div className="fixed inset-0 w-screen h-screen z-[100] flex items-end sm:items-center justify-center select-none p-0 sm:p-4">
              {/* Fullscreen Backdrop Blur Covering 100% of Viewport */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingHighlight(null)}
                className="fixed inset-0 w-screen h-screen bg-slate-950/50 backdrop-blur-md"
              />

              {/* Responsive Container */}
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white/90 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl z-10"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Edit Highlight
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingHighlight(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cover Image Editor */}
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <div className="relative group">
                    <img
                      src={editCover}
                      alt="Highlight cover"
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]"
                    >
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold">Edit</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Edit Cover Photo
                  </button>
                </div>

                {/* Name Input */}
                <div className="space-y-1 mb-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Highlight Name
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Highlight Name"
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                  />
                </div>

                {/* Actions: Delete & Save */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDeleteHighlight}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingHighlight(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editTitle.trim()}
                      className="rounded-xl px-4"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ClientPortal>

      {/* CREATE NEW HIGHLIGHT DIALOG */}
      <ClientPortal>
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreateModalOpen(false)}
                className="fixed inset-0 w-screen h-screen bg-slate-950/50 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 shadow-2xl z-10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      New Story Highlight
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Highlight Title (e.g. Kyoto 2026)"
                  value={highlightTitle}
                  onChange={(e) => setHighlightTitle(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-4 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />

                <div className="text-xs font-medium text-slate-600 mb-2">
                  Select Stories to include:
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar mb-5">
                  {currentUserStories.map((story) => {
                    const isSelected = selectedStoryIds.includes(story.id);
                    return (
                      <div
                        key={story.id}
                        onClick={() => toggleSelectStory(story.id)}
                        className={`relative aspect-[9/14] rounded-xl overflow-hidden cursor-pointer ring-2 transition-all ${
                          isSelected
                            ? "ring-blue-600 scale-[0.98]"
                            : "ring-transparent hover:opacity-90"
                        }`}
                      >
                        <img
                          src={story.mediaUrl}
                          alt="Story preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={!highlightTitle.trim() || selectedStoryIds.length === 0}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ClientPortal>
    </div>
  );
}
