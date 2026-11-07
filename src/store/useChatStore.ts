import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Note, ChatMessage } from "@/types";
import { RealtimeChannelHub } from "@/lib/supabase";
import { safeStorage } from "@/lib/safeStorage";
import { useAuthStore } from "./useAuthStore";
import { liveSync } from "@/lib/liveSync";

export interface ConversationThread {
  id: string;
  recipient: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    status: "online" | "idle" | "offline";
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isUnread?: boolean;
    isSelf?: boolean;
  };
  messages: ChatMessage[];
}

interface ChatState {
  notes: Note[];
  conversations: ConversationThread[];
  selectedConversationId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectConversation: (conversationId: string | null) => void;
  startNewConversation: (recipient: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  }) => string;
  deleteConversation: (conversationId: string) => void;
  addOrUpdateUserNote: (
    content: string,
    pinnedSong?: Note["pinnedSong"]
  ) => void;
  deleteUserNote: (userId?: string) => void;
  sendDirectNoteReply: (
    targetUserId: string,
    targetUsername: string,
    text: string,
    avatar: string
  ) => void;
  sendMessage: (
    content: string,
    replyTo?: ChatMessage["replyTo"],
    imageUrl?: string,
    voiceNote?: ChatMessage["voiceNote"]
  ) => void;
  receiveRealtimeMessage: (conversationId: string, message: ChatMessage) => void;
}

const INITIAL_NOTES: Note[] = [];
const INITIAL_CONVERSATIONS: ConversationThread[] = [];

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const hub = RealtimeChannelHub.getInstance();

      return {
        notes: INITIAL_NOTES,
    conversations: INITIAL_CONVERSATIONS,
    selectedConversationId: null,
    searchQuery: "",

    setSearchQuery: (query) => set({ searchQuery: query }),

    selectConversation: (conversationId) => {
      set({ selectedConversationId: conversationId });
      if (conversationId) {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId && c.lastMessage.isUnread
              ? { ...c, lastMessage: { ...c.lastMessage, isUnread: false } }
              : c
          ),
        }));
      }
    },

    startNewConversation: (recipient) => {
      const { conversations } = get();
      const existing = conversations.find(
        (c) => c.recipient.id === recipient.id || c.recipient.username === recipient.username
      );
      if (existing) {
        set({ selectedConversationId: existing.id });
        return existing.id;
      }

      const newConv: ConversationThread = {
        id: `conv_${Date.now()}`,
        recipient: {
          id: recipient.id,
          name: recipient.name,
          username: recipient.username,
          avatar: recipient.avatar,
          status: "online",
        },
        lastMessage: {
          text: "Started a conversation",
          timestamp: "Just now",
          isUnread: false,
          isSelf: true,
        },
        messages: [],
      };

      set({
        conversations: [newConv, ...conversations],
        selectedConversationId: newConv.id,
      });
      return newConv.id;
    },

    deleteConversation: (conversationId) => {
      const { conversations, selectedConversationId } = get();
      set({
        conversations: conversations.filter((c) => c.id !== conversationId),
        selectedConversationId:
          selectedConversationId === conversationId ? null : selectedConversationId,
      });
    },

    addOrUpdateUserNote: (content, pinnedSong) => {
      const user = useAuthStore.getState().currentUser;
      const currentUserId = user?.id || "user_self";
      const currentUsername = user?.username || "You";
      const currentAvatar =
        user?.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop";

      set((state) => {
        const existingIndex = state.notes.findIndex((n) => n.userId === currentUserId);
        const newNote: Note = {
          id: `note_${Date.now()}`,
          userId: currentUserId,
          username: currentUsername,
          userAvatar: currentAvatar,
          content,
          createdAt: new Date().toISOString(),
          pinnedSong,
        };

        if (existingIndex >= 0) {
          const updated = [...state.notes];
          updated[existingIndex] = newNote;
          return { notes: updated };
        }
        return { notes: [newNote, ...state.notes] };
      });
    },

    deleteUserNote: (userId) => {
      const user = useAuthStore.getState().currentUser;
      const targetUserId = userId || user?.id || "user_self";
      set((state) => ({
        notes: state.notes.filter((n) => n.userId !== targetUserId),
      }));
    },

    sendDirectNoteReply: (targetUserId, targetUsername, text, avatar) => {
      const user = useAuthStore.getState().currentUser;
      const currentUserId = user?.id || "user_self";
      const currentName = user?.name || "You";
      const currentAvatar =
        user?.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop";

      set((state) => {
        let updatedConvs = [...state.conversations];
        const existingIndex = updatedConvs.findIndex(
          (c) => c.recipient.id === targetUserId
        );

        const newMsg: ChatMessage = {
          id: `msg_note_reply_${Date.now()}`,
          senderId: currentUserId,
          senderName: currentName,
          senderAvatar: currentAvatar,
          content: text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSelf: true,
          status: "sent",
        };

        if (existingIndex >= 0) {
          const conv = updatedConvs[existingIndex];
          updatedConvs[existingIndex] = {
            ...conv,
            lastMessage: {
              text,
              timestamp: "Just now",
              isSelf: true,
              isUnread: false,
            },
            messages: [...conv.messages, newMsg],
          };
        } else {
          const newThread: ConversationThread = {
            id: `conv_${Date.now()}`,
            recipient: {
              id: targetUserId,
              name: targetUsername,
              username: targetUsername,
              avatar: avatar,
              status: "online",
            },
            lastMessage: {
              text,
              timestamp: "Just now",
              isSelf: true,
              isUnread: false,
            },
            messages: [newMsg],
          };
          updatedConvs = [newThread, ...updatedConvs];
        }

        return { conversations: updatedConvs };
      });
    },

    sendMessage: (content, replyTo, imageUrl, voiceNote) => {
      const { selectedConversationId, conversations } = get();
      if (!selectedConversationId) return;

      const user = useAuthStore.getState().currentUser;
      const activeConv = conversations.find((c) => c.id === selectedConversationId);
      if (!activeConv) return;

      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderId: user?.id || "user_self",
        senderName: user?.name || "You",
        senderAvatar:
          user?.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSelf: true,
        status: "sent",
        imageUrl,
        voiceNote,
        replyTo,
      };

      const updatedConversations = conversations.map((conv) => {
        if (conv.id === selectedConversationId) {
          return {
            ...conv,
            lastMessage: {
              text: voiceNote ? "Voice note (0:14)" : imageUrl ? "Photo" : content,
              timestamp: "Just now",
              isSelf: true,
              isUnread: false,
            },
            messages: [...conv.messages, newMsg],
          };
        }
        return conv;
      });

      set({ conversations: updatedConversations });

      // Broadcast via Realtime Channel
      hub.broadcast(`chat_${selectedConversationId}`, newMsg);
      liveSync.broadcast({
        type: "CHAT_MESSAGE",
        conversationId: selectedConversationId,
        message: newMsg,
      });
    },

    receiveRealtimeMessage: (conversationId, message) => {
      set((state) => {
        const updated = state.conversations.map((conv) => {
          if (conv.id === conversationId) {
            if (conv.messages.some((m) => m.id === message.id)) return conv;
            return {
              ...conv,
              lastMessage: {
                text: message.content,
                timestamp: message.timestamp,
                isUnread: state.selectedConversationId !== conversationId,
                isSelf: false,
              },
              messages: [...conv.messages, message],
            };
          }
          return conv;
        });
        return { conversations: updated };
      });
    },
  };
},
    {
      name: "auraglass-chat-storage",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
