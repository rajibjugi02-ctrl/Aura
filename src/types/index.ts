export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatar: string;
  bio?: string;
  links?: { title: string; url: string }[];
  profileMusic?: {
    title: string;
    artist: string;
    coverUrl?: string;
    audioUrl?: string;
    previewUrl?: string;
    duration?: number;
  };
  isCurrent?: boolean;
}

export interface Note {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  pinnedSong?: {
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl?: string;
    previewUrl?: string;
    durationSeconds: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  status: "sent" | "delivered" | "read";
  imageUrl?: string;
  voiceNote?: {
    audioUrl?: string;
    durationSeconds: number;
    waveform: number[];
  };
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  type: "image" | "video";
  durationSeconds: number;
  caption?: string;
  musicTrack?: {
    title: string;
    artist: string;
    previewUrl?: string;
    audioUrl?: string;
    coverUrl?: string;
    duration?: number;
  };
  mentions?: string[];
  createdAt: string;
  viewsCount: number;
  liked?: boolean;
}

export interface StoryUserGroup {
  userId: string;
  username: string;
  userAvatar: string;
  hasUnseen: boolean;
  stories: StoryItem[];
}

export interface Highlight {
  id: string;
  title: string;
  coverUrl: string;
  storyIds: string[];
}

export interface PostComment {
  id: string;
  authorId: string;
  authorUsername: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  replyCount?: number;
}

export interface Post {
  id: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  };
  media: {
    url: string;
    aspectRatio?: "1:1" | "4:5" | "16:9";
    filter?: string;
  }[];
  caption: string;
  musicTrack?: {
    title: string;
    artist: string;
    duration: number; // in seconds
    source: "library" | "upload";
    previewUrl?: string;
    audioUrl?: string;
  };
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  repostsCount: number;
  isReposted?: boolean;
  createdAt: string;
  comments: PostComment[];
}

