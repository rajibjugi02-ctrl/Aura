"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Grid, X, Sparkles, ChevronRight, Video, Camera } from "lucide-react";
import { useCreateMenuStore } from "@/store/useCreateMenuStore";
import { ClientPortal } from "@/components/ui/ClientPortal";

export function CreateActionSheet() {
  const router = useRouter();
  const { isOpen, closeCreateMenu } = useCreateMenuStore();

  const handleSelect = (path: string) => {
    closeCreateMenu();
    router.push(path);
  };

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 w-screen h-screen z-[100] flex items-end sm:items-center justify-center select-none p-0 sm:p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateMenu}
              className="fixed inset-0 w-screen h-screen bg-slate-950/50 backdrop-blur-md"
            />

            {/* Bottom-Up Sheet on Mobile, Centered Glass Dialog on Desktop */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="relative w-full max-w-md bg-white/95 backdrop-blur-3xl border border-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.22)] z-10"
            >
              {/* Mobile Drag Indicator Handle */}
              <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Create New</h3>
                    <p className="text-[11px] text-slate-400">Choose format to share with your audience</p>
                  </div>
                </div>

                <button
                  onClick={closeCreateMenu}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Options */}
              <div className="py-4 space-y-3">
                {/* 1. Reels Option */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect("/reels/create")}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-50/60 to-purple-50/40 border border-pink-200/50 hover:border-pink-300 text-left transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
                      <Film className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Reels</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                          9:16 Video
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        Full-height vertical video, native camera & music sync
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
                </motion.button>

                {/* 2. Post / Feed Option */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect("/upload")}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-slate-50/40 border border-blue-200/50 hover:border-blue-300 text-left transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                      <Grid className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Post / Feed</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          Carousels
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        Square & portrait photo carousels with filters & soundtrack
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
                </motion.button>
              </div>

              {/* Quick Cancel button for mobile */}
              <div className="pt-2">
                <button
                  onClick={closeCreateMenu}
                  className="w-full py-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}

