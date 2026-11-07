"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MessageSquarePlus, UserCheck, Check } from "lucide-react";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { useChatStore } from "@/store/useChatStore";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_ACCOUNTS = [
  {
    id: "user_maya",
    name: "Maya Chen",
    username: "maya.chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    bio: "Visual storyteller & analog curator",
  },
  {
    id: "user_lucas",
    name: "Lucas Vance",
    username: "lucas_sound",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    bio: "Modular synth sound designer",
  },
  {
    id: "user_elena",
    name: "Elena Craft",
    username: "elena_craft",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop",
    bio: "Ceramics & tactile pottery / Kyoto",
  },
  {
    id: "user_liam",
    name: "Liam Thorne",
    username: "liam.film",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    bio: "35mm film photographer & director",
  },
  {
    id: "user_sora",
    name: "Sora Takahashi",
    username: "sora.minimal",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    bio: "Architectural geometries & concrete lines",
  },
];

export function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const { startNewConversation } = useChatStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAccounts = AVAILABLE_ACCOUNTS.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAccount = (account: typeof AVAILABLE_ACCOUNTS[0]) => {
    startNewConversation({
      id: account.id,
      name: account.name,
      username: account.username,
      avatar: account.avatar,
    });
    onClose();
  };

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_25px_60px_rgba(0,0,0,0.22)] p-6 z-10 flex flex-col max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MessageSquarePlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">New Message</h3>
                    <p className="text-[11px] text-slate-400">Choose an account to start chatting</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search input */}
              <div className="relative my-3 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search accounts or usernames..."
                  className="w-full h-10 pl-9 pr-4 bg-slate-100/80 border border-slate-200/70 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Accounts list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {filteredAccounts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No accounts found matching &quot;{searchTerm}&quot;
                  </div>
                ) : (
                  filteredAccounts.map((account) => (
                    <motion.button
                      key={account.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectAccount(account)}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={account.avatar}
                          alt={account.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-100"
                        />
                        <div className="truncate text-xs">
                          <div className="font-semibold text-slate-900 truncate">
                            {account.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            @{account.username}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-3 py-1 rounded-full transition-colors">
                        Chat
                      </span>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}

