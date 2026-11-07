import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { StoryUserGroup, StoryItem } from "@/types";
import { useAuthStore } from "./useAuthStore";
import { safeStorage } from "@/lib/safeStorage";

interface StoryState {
  isOpen: boolean;
  userGroups: StoryUserGroup[];
  activeUserIndex: number;
  activeStoryIndex: number;
  isPaused: boolean;
  storyDurationMs: number;
  openStory: (userId: string, initialStoryIndex?: number) => void;
  closeStory: () => void;
  nextStory: () => void;
  prevStory: () => void;
  setIsPaused: (paused: boolean) => void;
  deleteCurrentStory: () => void;
  likeStory: () => void;
  addStory: (storyItem: Omit<StoryItem, "id" | "createdAt" | "viewsCount">) => void;
}

const INITIAL_STORY_GROUPS: StoryUserGroup[] = [];

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      userGroups: INITIAL_STORY_GROUPS,
      activeUserIndex: 0,
      activeStoryIndex: 0,
      isPaused: false,
      storyDurationMs: 5000,

  openStory: (userId: string, initialStoryIndex: number = 0) => {
    const { userGroups } = get();
    const userIndex = userGroups.findIndex((g) => g.userId === userId);
    if (userIndex !== -1 && userGroups[userIndex].stories.length > 0) {
      set({
        isOpen: true,
        activeUserIndex: userIndex,
        activeStoryIndex: initialStoryIndex,
        isPaused: false,
      });
    }
  },

  closeStory: () => {
    set({ isOpen: false, isPaused: false });
  },

  nextStory: () => {
    const { userGroups, activeUserIndex, activeStoryIndex } = get();
    const currentGroup = userGroups[activeUserIndex];
    if (!currentGroup) {
      set({ isOpen: false });
      return;
    }

    if (activeStoryIndex < currentGroup.stories.length - 1) {
      set({ activeStoryIndex: activeStoryIndex + 1 });
    } else if (activeUserIndex < userGroups.length - 1) {
      set({ activeUserIndex: activeUserIndex + 1, activeStoryIndex: 0 });
    } else {
      set({ isOpen: false });
    }
  },

  prevStory: () => {
    const { userGroups, activeUserIndex, activeStoryIndex } = get();
    if (activeStoryIndex > 0) {
      set({ activeStoryIndex: activeStoryIndex - 1 });
    } else if (activeUserIndex > 0) {
      const prevGroup = userGroups[activeUserIndex - 1];
      set({
        activeUserIndex: activeUserIndex - 1,
        activeStoryIndex: prevGroup.stories.length - 1,
      });
    }
  },

  setIsPaused: (paused) => set({ isPaused: paused }),

  deleteCurrentStory: () => {
    const { userGroups, activeUserIndex, activeStoryIndex } = get();
    const currentGroup = userGroups[activeUserIndex];
    if (!currentGroup) return;

    const updatedStories = currentGroup.stories.filter((_, idx) => idx !== activeStoryIndex);

    if (updatedStories.length === 0) {
      const updatedGroups = userGroups.filter((_, idx) => idx !== activeUserIndex);
      if (updatedGroups.length === 0) {
        set({ isOpen: false, userGroups: [] });
      } else {
        const nextGroupIndex = Math.min(activeUserIndex, updatedGroups.length - 1);
        set({
          userGroups: updatedGroups,
          activeUserIndex: nextGroupIndex,
          activeStoryIndex: 0,
        });
      }
    } else {
      const updatedGroups = [...userGroups];
      updatedGroups[activeUserIndex] = {
        ...currentGroup,
        stories: updatedStories,
      };
      set({
        userGroups: updatedGroups,
        activeStoryIndex: Math.min(activeStoryIndex, updatedStories.length - 1),
      });
    }
  },

  likeStory: () => {
    const { userGroups, activeUserIndex, activeStoryIndex } = get();
    const currentGroup = userGroups[activeUserIndex];
    if (!currentGroup) return;

    const story = currentGroup.stories[activeStoryIndex];
    if (!story) return;

    const updatedGroups = [...userGroups];
    updatedGroups[activeUserIndex].stories[activeStoryIndex] = {
      ...story,
      liked: !story.liked,
    };

    set({ userGroups: updatedGroups });
  },

  addStory: (storyData) => {
    const { userGroups } = get();
    const user = useAuthStore.getState().currentUser;
    const userId = user?.id || "user_self";
    const username = user?.username || "Your Story";
    const userAvatar =
      user?.avatar ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop";

    const newStory: StoryItem = {
      ...storyData,
      id: `st_self_${Date.now()}`,
      createdAt: "Just now",
      viewsCount: 0,
    };

    const selfGroupIndex = userGroups.findIndex((g) => g.userId === userId);
    if (selfGroupIndex >= 0) {
      const updatedGroups = [...userGroups];
      updatedGroups[selfGroupIndex] = {
        ...updatedGroups[selfGroupIndex],
        hasUnseen: true,
        stories: [newStory, ...updatedGroups[selfGroupIndex].stories],
      };
      set({ userGroups: updatedGroups });
    } else {
      const newGroup: StoryUserGroup = {
        userId,
        username,
        userAvatar,
        hasUnseen: true,
        stories: [newStory],
      };
      set({ userGroups: [newGroup, ...userGroups] });
    }
  },
}),
    {
      name: "auraglass-story-storage",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ userGroups: state.userGroups }),
    }
  )
);
