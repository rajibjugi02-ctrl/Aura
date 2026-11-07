"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareDashed, MessageSquarePlus, Sparkles } from "lucide-react";
import { NotesBar } from "@/components/chat/NotesBar";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { useChatStore } from "@/store/useChatStore";

export default function MessagesInboxPage() {
  const { selectedConversationId } = useChatStore();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  return (
    <div className="py-4 px-3 sm:px-6 w-full max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col pb-20 md:pb-4">
      {/* Two-Pane Full-Width Desktop Inbox Master Container */}
      <div className="flex-1 bg-white/85 backdrop-blur-2xl border border-white/80 rounded-[32px] shadow-[0_16px_45px_rgba(0,0,0,0.06)] overflow-hidden flex">
        {/* Left Pane (Sidebar): Notes Bar at top + Conversation Contacts List below */}
        <div
          className={`w-full md:w-[360px] lg:w-[410px] shrink-0 border-r border-slate-100/90 flex flex-col bg-white/50 ${
            selectedConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100/80">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Messages
              </h2>
              <p className="text-[11px] text-slate-400">Direct notes & chats</p>
            </div>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white/80 transition-colors"
              title="New message"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Top Section: Notes Bar */}
          <div className="p-3 bg-white/60 border-b border-slate-100/60">
            <NotesBar />
          </div>

          {/* Bottom Section: Conversation Contacts List */}
          <div className="flex-1 min-h-0">
            <ConversationList />
          </div>
        </div>

        {/* Right Pane (Main Area): Active Chat Thread OR "No messages yet" Empty State */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white/30 ${
            !selectedConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <AnimatePresence mode="wait">
            {selectedConversationId ? (
              <motion.div
                key={selectedConversationId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full p-2 sm:p-4"
              >
                <ChatRoom />
              </motion.div>
            ) : (
              <motion.div
                key="empty_chat_state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-8 text-center select-none"
              >
                <div className="w-20 h-20 rounded-full border-2 border-slate-900 flex items-center justify-center mb-4 text-slate-900 shadow-sm">
                  <MessageSquareDashed className="w-9 h-9 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  No messages yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                  Send private messages and shared soundtracks to a friend or group.
                  Pick a conversation from the sidebar to start chatting.
                </p>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start a Chat</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />
    </div>
  );
}
