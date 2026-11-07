"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ClientPortal } from "./ClientPortal";

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  altText?: string;
  onClose: () => void;
}

export function ImageLightboxModal({
  isOpen,
  imageUrl,
  altText = "Full image preview",
  onClose,
}: ImageLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <ClientPortal>
      <AnimatePresence>
        <div className="fixed inset-0 w-screen h-screen z-[200] flex items-center justify-center p-3 sm:p-6 select-none">
          {/* Full Dark Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/92 backdrop-blur-2xl"
          />

          {/* Top-Right 'X' Close Button with High Contrast Solid Dark Pill and Shadow */}
          <button
            onClick={onClose}
            className="fixed top-5 right-5 z-[210] w-11 h-11 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:scale-110 active:scale-95"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Main Displayed Image with Spring Animation */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="relative z-[205] max-w-[95vw] max-h-[90vh] flex items-center justify-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={altText}
              className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-[0_25px_70px_rgba(0,0,0,0.8)] ring-1 ring-white/15"
            />
          </motion.div>
        </div>
      </AnimatePresence>
    </ClientPortal>
  );
}

