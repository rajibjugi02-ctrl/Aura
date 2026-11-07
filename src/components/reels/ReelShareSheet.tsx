"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Send,
  MessageCircle,
  Share2,
  ExternalLink,
} from "lucide-react";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { useChatStore } from "@/store/useChatStore";
import { ReelData } from "@/store/useReelsStore";

interface ReelShareSheetProps {
  isOpen: boolean;
  reel: ReelData | null;
  onClose: () => void;
}

export function ReelShareSheet({ isOpen, reel, onClose }: ReelShareSheetProps) {
  const { startNewConversation, sendMessage } = useChatStore();
  const [copied, setCopied] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  if (!reel) return null;

  const reelUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/reels/${reel.id}`
      : `https://auraglass.app/reels/${reel.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Check out this reel on AuraGlass: ${reel.caption} ${reelUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareInstagram = () => {
    // Web intent or copy link
    handleCopyLink();
    window.open("https://www.instagram.com/", "_blank");
  };

  const IN_APP_FRIENDS = [
    {
      id: "friend_maya",
      name: "Maya Chen",
      username: "maya.chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    },
    {
      id: "friend_lucas",
      name: "Lucas Vance",
      username: "lucas_sound",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    },
    {
      id: "friend_elena",
      name: "Elena Craft",
      username: "elena_craft",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop",
    },
    {
      id: "friend_liam",
      name: "Liam Film",
      username: "liam.film",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    },
  ];

  const handleSendToFriend = (friend: typeof IN_APP_FRIENDS[0]) => {
    startNewConversation(friend);
    sendMessage(`Shared a Reel by @${reel.author.username}: ${reelUrl}`);
    setSentMap((prev) => ({ ...prev, [friend.id]: true }));
  };

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 w-screen h-screen z-[100] flex items-end justify-center select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Slide-Up Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-t-[36px] border-t border-white/80 shadow-[0_-15px_45px_rgba(0,0,0,0.2)] p-6 z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Drag Pill */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Share Reel</h3>
                    <p className="text-[11px] text-slate-400">Share to external platforms or send in DM</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* External Share Actions */}
              <div className="grid grid-cols-3 gap-3 py-4 border-b border-slate-100">
                {/* Copy Link */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 text-center transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    {copied ? "Copied!" : "Copy Link"}
                  </span>
                </motion.button>

                {/* Share to Instagram */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleShareInstagram}
                  className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 text-center transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-500 text-white flex items-center justify-center shadow-sm">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Instagram</span>
                </motion.button>

                {/* Share to WhatsApp */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 text-center transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">WhatsApp</span>
                </motion.button>
              </div>

              {/* Direct In-App Friends List */}
              <div className="pt-4 flex-1 min-h-0 flex flex-col">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Send Direct Message
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {IN_APP_FRIENDS.map((friend) => {
                    const isSent = sentMap[friend.id];

                    return (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-100"
                          />
                          <div className="truncate text-xs">
                            <div className="font-semibold text-slate-900 truncate">
                              {friend.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              @{friend.username}
                            </div>
                          </div>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleSendToFriend(friend)}
                          disabled={isSent}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            isSent
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          }`}
                        >
                          {isSent ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Sent</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}

