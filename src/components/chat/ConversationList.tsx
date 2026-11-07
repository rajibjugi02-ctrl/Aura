"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, MessageSquareDashed, Send } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";

export function ConversationList() {
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    searchQuery,
    setSearchQuery,
  } = useChatStore();

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.recipient.name.toLowerCase().includes(q) ||
      c.recipient.username.toLowerCase().includes(q) ||
      c.lastMessage.text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full select-none">
      {/* Search Input Bar */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages or contacts..."
            className="w-full h-9 pl-9 pr-3 bg-slate-100/70 border border-slate-200/50 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Conversations List / Empty State */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <MessageSquareDashed className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                No messages yet
              </h4>
              <p className="text-[11px] text-slate-400 max-w-[200px] mt-0.5">
                {searchQuery
                  ? "No contacts found matching your search."
                  : "Start a conversation by choosing a friend from the notes above."}
              </p>
            </div>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedConversationId === conv.id;
            return (
              <motion.button
                key={conv.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  selectConversation(conv.id);
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", `/messages/${conv.id}`);
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "hover:bg-slate-100/70 text-slate-800"
                }`}
              >
                {/* Avatar with Status badge */}
                <div className="relative shrink-0">
                  <img
                    src={conv.recipient.avatar}
                    alt={conv.recipient.name}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  {conv.recipient.status === "online" && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                        isSelected
                          ? "bg-emerald-400 border-slate-900"
                          : "bg-emerald-500 border-white"
                      }`}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {conv.recipient.name}
                    </span>
                    <span
                      className={`text-[10px] shrink-0 ml-1 ${
                        isSelected ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {conv.lastMessage.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-[11px] truncate ${
                        conv.lastMessage.isUnread && !isSelected
                          ? "font-bold text-slate-900"
                          : isSelected
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      {conv.lastMessage.isSelf && "You: "}
                      {conv.lastMessage.text}
                    </p>

                    {conv.lastMessage.isUnread && !isSelected && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 ml-1.5" />
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

