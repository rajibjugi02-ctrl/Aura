import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { RealtimeChannelHub } from "@/lib/supabase";
import { safeStorage } from "@/lib/safeStorage";

export interface NotificationItem {
  id: string;
  type: "like" | "repost" | "comment" | "follow";
  timeGroup: "Today" | "This Week" | "Earlier";
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content?: string;
  timeAgo: string;
  postThumbnail?: string;
  isFollowing?: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (item: {
    type: "like" | "repost" | "comment" | "follow";
    user: { name: string; username: string; avatar: string };
    content?: string;
    postThumbnail?: string;
    isFollowing?: boolean;
  }) => void;
  markAllAsRead: () => void;
  toggleFollowUser: (username: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (item) => {
        const newNotif: NotificationItem = {
          ...item,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timeGroup: "Today",
          timeAgo: "Just now",
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotif, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Broadcast through Supabase Realtime channel for zero delay sync
        RealtimeChannelHub.getInstance().broadcast("notifications", newNotif);
      },

      markAllAsRead: () => {
        set({ unreadCount: 0 });
      },

      toggleFollowUser: (username) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.user.username === username
              ? { ...n, isFollowing: !n.isFollowing }
              : n
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: "auraglass_notifications_v2",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

// Wipe any legacy dummy/mock notifications on boot
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("auraglass_notifications");
    localStorage.removeItem("auraglass_notifications_v2");
    useNotificationStore.setState({ notifications: [], unreadCount: 0 });
  } catch {}
}

// Subscribe to real-time broadcast channel once on client boot
if (typeof window !== "undefined") {
  RealtimeChannelHub.getInstance().subscribe("notifications", (incoming: NotificationItem) => {
    const store = useNotificationStore.getState();
    if (!store.notifications.some((n) => n.id === incoming.id)) {
      useNotificationStore.setState((state) => ({
        notifications: [incoming, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    }
  });
}

