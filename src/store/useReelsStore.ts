import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { RealtimeChannelHub } from "@/lib/supabase";
import { useAuthStore } from "./useAuthStore";
import { useNotificationStore } from "./useNotificationStore";
import { safeStorage } from "@/lib/safeStorage";

export interface ReelData {
  id: string;
  mediaUrl: string;
  type?: "video" | "image";
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  };
  caption: string;
  audioTrack: {
    title: string;
    artist: string;
    audioUrl?: string;
    previewUrl?: string;
  };
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  isLiked?: boolean;
  isReposted?: boolean;
}

interface ReelsState {
  reels: ReelData[];
  addReel: (
    reel: Omit<
      ReelData,
      | "id"
      | "likesCount"
      | "commentsCount"
      | "repostsCount"
      | "isLiked"
      | "isReposted"
    >
  ) => void;
  toggleLikeReel: (reelId: string) => void;
  toggleRepostReel: (reelId: string) => void;
  clearReels: () => void;
}

export const useReelsStore = create<ReelsState>()(
  persist(
    (set, get) => ({
      reels: [],

      addReel: (reelData) => {
        const newReel: ReelData = {
          ...reelData,
          id: `reel_${Date.now()}`,
          likesCount: 0,
          commentsCount: 0,
          repostsCount: 0,
          isLiked: false,
          isReposted: false,
        };

        set((state) => ({ reels: [newReel, ...state.reels] }));

        // Broadcast to Realtime hub for instant zero-delay sync across explore & feeds
        RealtimeChannelHub.getInstance().broadcast("reels", newReel);
      },

      toggleLikeReel: (reelId: string) => {
        const currentUser = useAuthStore.getState().currentUser;
        set((state) => {
          let targetReel: ReelData | undefined;
          const updated = state.reels.map((reel) => {
            if (reel.id === reelId) {
              const isLiked = !reel.isLiked;
              targetReel = {
                ...reel,
                isLiked,
                likesCount: isLiked
                  ? reel.likesCount + 1
                  : Math.max(0, reel.likesCount - 1),
              };
              return targetReel;
            }
            return reel;
          });

          if (targetReel?.isLiked) {
            useNotificationStore.getState().addNotification({
              type: "like",
              user: {
                name: currentUser?.name || "Aura Member",
                username: currentUser?.username || "user",
                avatar:
                  currentUser?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
              },
              postThumbnail: targetReel.mediaUrl,
            });
          }

          return { reels: updated };
        });
      },

      toggleRepostReel: (reelId: string) => {
        const currentUser = useAuthStore.getState().currentUser;
        set((state) => {
          let targetReel: ReelData | undefined;
          const updated = state.reels.map((reel) => {
            if (reel.id === reelId) {
              const isReposted = !reel.isReposted;
              targetReel = {
                ...reel,
                isReposted,
                repostsCount: isReposted
                  ? reel.repostsCount + 1
                  : Math.max(0, reel.repostsCount - 1),
              };
              return targetReel;
            }
            return reel;
          });

          if (targetReel?.isReposted) {
            useNotificationStore.getState().addNotification({
              type: "repost",
              user: {
                name: currentUser?.name || "Aura Member",
                username: currentUser?.username || "user",
                avatar:
                  currentUser?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
              },
              postThumbnail: targetReel.mediaUrl,
            });
          }

          return { reels: updated };
        });
      },

      clearReels: () => {
        set({ reels: [] });
      },
    }),
    {
      name: "auraglass_reels_v2",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

// Wipe any legacy dummy/mock reels on boot
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("auraglass_reels");
    localStorage.removeItem("auraglass_reels_v2");
    useReelsStore.setState({ reels: [] });
  } catch {}
}

// Listen to real-time reel uploads on client
if (typeof window !== "undefined") {
  RealtimeChannelHub.getInstance().subscribe("reels", (newReel: ReelData) => {
    const store = useReelsStore.getState();
    if (!store.reels.some((r) => r.id === newReel.id)) {
      useReelsStore.setState((state) => ({
        reels: [newReel, ...state.reels],
      }));
    }
  });
}
