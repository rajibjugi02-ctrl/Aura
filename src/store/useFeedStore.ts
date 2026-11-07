import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Post, PostComment } from "@/types";
import { useAuthStore } from "./useAuthStore";
import { useNotificationStore } from "./useNotificationStore";
import { safeStorage } from "@/lib/safeStorage";

interface FeedState {
  posts: Post[];
  activeCommentPostId: string | null;
  openComments: (postId: string) => void;
  closeComments: () => void;
  toggleLikePost: (postId: string) => void;
  toggleRepostPost: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleLikeComment: (postId: string, commentId: string) => void;
  deletePost: (postId: string) => void;
  archivePost: (postId: string) => void;
  createPost: (
    post: Omit<
      Post,
      | "id"
      | "likesCount"
      | "isLiked"
      | "commentsCount"
      | "repostsCount"
      | "comments"
      | "createdAt"
    >
  ) => void;
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      posts: [],
      activeCommentPostId: null,

      openComments: (postId: string) => {
        set({ activeCommentPostId: postId });
      },

      closeComments: () => {
        set({ activeCommentPostId: null });
      },

      toggleLikePost: (postId) => {
        const currentUser = useAuthStore.getState().currentUser;
        set((state) => {
          let targetPost: Post | undefined;
          const updatedPosts = state.posts.map((post) => {
            if (post.id === postId) {
              const isLiked = !post.isLiked;
              targetPost = {
                ...post,
                isLiked,
                likesCount: isLiked
                  ? post.likesCount + 1
                  : Math.max(0, post.likesCount - 1),
              };
              return targetPost;
            }
            return post;
          });

          if (targetPost?.isLiked) {
            useNotificationStore.getState().addNotification({
              type: "like",
              user: {
                name: currentUser?.name || "Aura Member",
                username: currentUser?.username || "user",
                avatar:
                  currentUser?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
              },
              postThumbnail: targetPost.media[0]?.url,
            });
          }

          return { posts: updatedPosts };
        });
      },

      toggleRepostPost: (postId) => {
        const currentUser = useAuthStore.getState().currentUser;
        set((state) => {
          let targetPost: Post | undefined;
          const updatedPosts = state.posts.map((post) => {
            if (post.id === postId) {
              const isReposted = !post.isReposted;
              targetPost = {
                ...post,
                isReposted,
                repostsCount: isReposted
                  ? post.repostsCount + 1
                  : Math.max(0, post.repostsCount - 1),
              };
              return targetPost;
            }
            return post;
          });

          if (targetPost?.isReposted) {
            useNotificationStore.getState().addNotification({
              type: "repost",
              user: {
                name: currentUser?.name || "Aura Member",
                username: currentUser?.username || "user",
                avatar:
                  currentUser?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
              },
              postThumbnail: targetPost.media[0]?.url,
            });
          }

          return { posts: updatedPosts };
        });
      },

      addComment: (postId, text) => {
        const user = useAuthStore.getState().currentUser;
        const newComment: PostComment = {
          id: `comment_${Date.now()}`,
          authorId: user?.id || "user_self",
          authorUsername: user?.username || "user",
          authorAvatar:
            user?.avatar ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          text,
          createdAt: "Just now",
          likesCount: 0,
          isLiked: false,
        };

        set((state) => {
          let targetPost: Post | undefined;
          const updatedPosts = state.posts.map((post) => {
            if (post.id === postId) {
              targetPost = post;
              return {
                ...post,
                commentsCount: post.commentsCount + 1,
                comments: [newComment, ...post.comments],
              };
            }
            return post;
          });

          useNotificationStore.getState().addNotification({
            type: "comment",
            content: text,
            user: {
              name: user?.name || "Aura Member",
              username: user?.username || "user",
              avatar:
                user?.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
            },
            postThumbnail: targetPost?.media[0]?.url,
          });

          return { posts: updatedPosts };
        });
      },

      toggleLikeComment: (postId, commentId) => {
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: post.comments.map((comment) => {
                  if (comment.id === commentId) {
                    const isLiked = !comment.isLiked;
                    return {
                      ...comment,
                      isLiked,
                      likesCount: isLiked
                        ? comment.likesCount + 1
                        : Math.max(0, comment.likesCount - 1),
                    };
                  }
                  return comment;
                }),
              };
            }
            return post;
          }),
        }));
      },

      deletePost: (postId) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
        }));
      },

      archivePost: (postId) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
        }));
      },

      createPost: (newPostData) => {
        const post: Post = {
          ...newPostData,
          id: `post_${Date.now()}`,
          likesCount: 0,
          isLiked: false,
          commentsCount: 0,
          repostsCount: 0,
          isReposted: false,
          createdAt: "Just now",
          comments: [],
        };

        set((state) => ({ posts: [post, ...state.posts] }));
      },
    }),
    {
      name: "auraglass_feed",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
