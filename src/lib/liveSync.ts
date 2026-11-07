import { supabase } from "./supabase";
import { useFeedStore } from "@/store/useFeedStore";
import { useStoryStore } from "@/store/useStoryStore";
import { useReelsStore, ReelData } from "@/store/useReelsStore";
import { useChatStore } from "@/store/useChatStore";
import { Post, PostComment, StoryItem, StoryUserGroup, ChatMessage, Note } from "@/types";

type SyncEvent =
  | { type: "POST_NEW"; post: Post }
  | { type: "POST_LIKE"; postId: string; likesCount: number; userId: string; isLiked: boolean }
  | { type: "POST_COMMENT"; postId: string; comment: PostComment }
  | { type: "POST_DELETE"; postId: string }
  | { type: "STORY_NEW"; group: StoryUserGroup }
  | { type: "REEL_NEW"; reel: ReelData }
  | { type: "REEL_LIKE"; reelId: string; likesCount: number }
  | { type: "CHAT_MESSAGE"; conversationId: string; message: ChatMessage }
  | { type: "CHAT_NOTE"; note: Note };

class LiveSyncEngine {
  private static instance: LiveSyncEngine;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): LiveSyncEngine {
    if (!LiveSyncEngine.instance) {
      LiveSyncEngine.instance = new LiveSyncEngine();
    }
    return LiveSyncEngine.instance;
  }

  init() {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    // 1. Join global Supabase Realtime channel for instant cross-device sync
    try {
      this.channel = supabase.channel("auraglass_global_channel", {
        config: { broadcast: { self: false } },
      });

      this.channel
        .on("broadcast", { event: "live_sync" }, ({ payload }) => {
          this.handleIncomingEvent(payload as SyncEvent);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Connected to AuraGlass live cross-device sync!");
          }
        });
    } catch (err) {
      console.warn("Failed to subscribe to Realtime sync channel:", err);
    }

    // 2. Hydrate from Supabase database tables if available
    this.hydrateFromDatabase();
  }

  private handleIncomingEvent(event: SyncEvent) {
    if (!event || !event.type) return;

    try {
      switch (event.type) {
        case "POST_NEW": {
          const currentPosts = useFeedStore.getState().posts;
          if (!currentPosts.some((p) => p.id === event.post.id)) {
            useFeedStore.setState({ posts: [event.post, ...currentPosts] });
          }
          break;
        }

        case "POST_LIKE": {
          useFeedStore.setState((state) => ({
            posts: state.posts.map((p) =>
              p.id === event.postId ? { ...p, likesCount: event.likesCount } : p
            ),
          }));
          break;
        }

        case "POST_COMMENT": {
          useFeedStore.setState((state) => ({
            posts: state.posts.map((p) => {
              if (p.id === event.postId) {
                const exists = p.comments.some((c) => c.id === event.comment.id);
                if (exists) return p;
                return {
                  ...p,
                  commentsCount: p.commentsCount + 1,
                  comments: [event.comment, ...p.comments],
                };
              }
              return p;
            }),
          }));
          break;
        }

        case "POST_DELETE": {
          useFeedStore.setState((state) => ({
            posts: state.posts.filter((p) => p.id !== event.postId),
          }));
          break;
        }

        case "STORY_NEW": {
          const { userGroups } = useStoryStore.getState();
          const targetIndex = userGroups.findIndex((g) => g.userId === event.group.userId);
          if (targetIndex >= 0) {
            const updated = [...userGroups];
            updated[targetIndex] = {
              ...updated[targetIndex],
              stories: [...event.group.stories, ...updated[targetIndex].stories],
              hasUnseen: true,
            };
            useStoryStore.setState({ userGroups: updated });
          } else {
            useStoryStore.setState({ userGroups: [event.group, ...userGroups] });
          }
          break;
        }

        case "REEL_NEW": {
          const { reels } = useReelsStore.getState();
          if (!reels.some((r) => r.id === event.reel.id)) {
            useReelsStore.setState({ reels: [event.reel, ...reels] });
          }
          break;
        }

        case "REEL_LIKE": {
          useReelsStore.setState((state) => ({
            reels: state.reels.map((r) =>
              r.id === event.reelId ? { ...r, likesCount: event.likesCount } : r
            ),
          }));
          break;
        }

        case "CHAT_MESSAGE": {
          useChatStore.getState().receiveRealtimeMessage(event.conversationId, event.message);
          break;
        }

        case "CHAT_NOTE": {
          const { notes } = useChatStore.getState();
          const filtered = notes.filter((n) => n.userId !== event.note.userId);
          useChatStore.setState({ notes: [event.note, ...filtered] });
          break;
        }
      }
    } catch (err) {
      console.warn("Error processing live sync event:", err);
    }
  }

  broadcast(event: SyncEvent) {
    if (!this.channel) {
      this.init();
    }
    try {
      this.channel?.send({
        type: "broadcast",
        event: "live_sync",
        payload: event,
      });
    } catch (err) {
      console.warn("Failed to broadcast live sync event:", err);
    }
  }

  // Hydrate persistent data from Supabase DB tables (if created by user)
  private async hydrateFromDatabase() {
    try {
      // 1. Fetch posts
      const { data: dbPosts, error: postsErr } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);

      if (!postsErr && dbPosts && dbPosts.length > 0) {
        const localPosts = useFeedStore.getState().posts;
        const mappedPosts: Post[] = dbPosts.map((p: any) => ({
          id: p.id,
          author: {
            id: p.author_id,
            name: p.author_name || "Aura Member",
            username: p.author_username || "user",
            avatar: p.author_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
          },
          media: Array.isArray(p.media) ? p.media : [],
          caption: p.caption || "",
          musicTrack: p.music_track,
          likesCount: p.likes_count || 0,
          isLiked: false,
          commentsCount: p.comments_count || 0,
          repostsCount: p.reposts_count || 0,
          isReposted: false,
          createdAt: new Date(p.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          comments: [],
        }));

        // Merge: keep local posts + remote posts uniquely
        const merged = [...localPosts];
        mappedPosts.forEach((remotePost) => {
          if (!merged.some((lp) => lp.id === remotePost.id)) {
            merged.push(remotePost);
          }
        });
        useFeedStore.setState({ posts: merged });
      }

      // 2. Fetch reels
      const { data: dbReels, error: reelsErr } = await supabase
        .from("reels")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!reelsErr && dbReels && dbReels.length > 0) {
        const localReels = useReelsStore.getState().reels;
        const mergedReels = [...localReels];
        dbReels.forEach((dr: any) => {
          if (!mergedReels.some((lr) => lr.id === dr.id)) {
            mergedReels.push({
              id: dr.id,
              mediaUrl: dr.media_url,
              type: dr.type || "video",
              author: dr.author,
              caption: dr.caption || "",
              audioTrack: dr.audio_track || { title: "Original Audio", artist: dr.author?.name || "Aura" },
              likesCount: dr.likes_count || 0,
              commentsCount: dr.comments_count || 0,
              repostsCount: dr.reposts_count || 0,
            });
          }
        });
        useReelsStore.setState({ reels: mergedReels });
      }
    } catch {
      // Tables don't exist yet, gracefully skip DB hydration
    }
  }

  // Persist actions to Supabase DB tables in background
  async persistPost(post: Post) {
    try {
      await supabase.from("posts").insert({
        id: post.id,
        author_id: post.author.id,
        author_name: post.author.name,
        author_username: post.author.username,
        author_avatar: post.author.avatar,
        media: post.media,
        caption: post.caption,
        music_track: post.musicTrack || null,
        likes_count: post.likesCount || 0,
        comments_count: post.commentsCount || 0,
        reposts_count: post.repostsCount || 0,
      });
    } catch {}
  }

  async persistComment(postId: string, comment: PostComment) {
    try {
      await supabase.from("post_comments").insert({
        id: comment.id,
        post_id: postId,
        author_id: comment.authorId,
        author_username: comment.authorUsername,
        author_avatar: comment.authorAvatar,
        text: comment.text,
        likes_count: comment.likesCount || 0,
      });
    } catch {}
  }

  async persistReel(reel: ReelData) {
    try {
      await supabase.from("reels").insert({
        id: reel.id,
        media_url: reel.mediaUrl,
        type: reel.type || "video",
        author: reel.author,
        caption: reel.caption,
        audio_track: reel.audioTrack,
        likes_count: reel.likesCount || 0,
        comments_count: reel.commentsCount || 0,
        reposts_count: reel.repostsCount || 0,
      });
    } catch {}
  }
}

export const liveSync = LiveSyncEngine.getInstance();
