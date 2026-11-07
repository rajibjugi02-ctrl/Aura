import { create } from "zustand";

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number; // in seconds
  audioUrl?: string;
  previewUrl?: string;
}

export const DEFAULT_AUDIO_PREVIEW =
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/03/49/74/034974c8-356a-e751-24fe-5c5ffbe51fb8/mzaf_10332306713437145885.plus.aac.p.m4a";

interface MusicState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seek: (seconds: number) => void;
  tick: () => void;
}

// Client-side singleton HTMLAudioElement
let globalAudio: HTMLAudioElement | null = null;

function getGlobalAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = "auto";
    globalAudio.crossOrigin = "anonymous";
  }
  return globalAudio;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  volume: 0.8,
  isMuted: false,

  playTrack: (track) => {
    const audio = getGlobalAudio();
    const sourceUrl = track.audioUrl || track.previewUrl || DEFAULT_AUDIO_PREVIEW;

    if (audio) {
      const currentResolved = audio.src;
      const targetResolved = new URL(sourceUrl, window.location.href).href;

      if (currentResolved !== targetResolved) {
        audio.src = sourceUrl;
        audio.load();
        audio.currentTime = 0;
      }

      audio.volume = get().isMuted ? 0 : get().volume;
      audio.muted = get().isMuted;

      // Handle browser autoplay policy safely
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            set({
              currentTrack: { ...track, audioUrl: sourceUrl },
              isPlaying: true,
              currentTime: Math.floor(audio.currentTime),
            });
          })
          .catch((error) => {
            console.warn("Audio autoplay policy waiting for user interaction:", error);
            // Allow retry on next direct user gesture
            set({
              currentTrack: { ...track, audioUrl: sourceUrl },
              isPlaying: false,
            });
          });
      }

      // Sync time updates
      audio.ontimeupdate = () => {
        set({ currentTime: Math.floor(audio.currentTime) });
      };

      audio.onended = () => {
        set({ isPlaying: false, currentTime: 0 });
      };
    } else {
      set({ currentTrack: track, isPlaying: true, currentTime: 0 });
    }
  },

  pauseTrack: () => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.pause();
    }
    set({ isPlaying: false });
  },

  togglePlay: () => {
    const { isPlaying, currentTrack, playTrack, pauseTrack } = get();
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  },

  setVolume: (newVolume) => {
    const audio = getGlobalAudio();
    const clamped = Math.max(0, Math.min(1, newVolume));
    if (audio) {
      audio.volume = clamped;
      audio.muted = clamped === 0;
    }
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    const audio = getGlobalAudio();
    const nextMuted = !isMuted;
    if (audio) {
      audio.muted = nextMuted;
      audio.volume = nextMuted ? 0 : volume;
    }
    set({ isMuted: nextMuted });
  },

  seek: (seconds) => {
    const { currentTrack } = get();
    const audio = getGlobalAudio();
    if (!currentTrack) return;
    const clamped = Math.max(0, Math.min(seconds, currentTrack.duration));
    if (audio) {
      audio.currentTime = clamped;
    }
    set({ currentTime: clamped });
  },

  tick: () => {
    const audio = getGlobalAudio();
    if (audio && !audio.paused) {
      set({ currentTime: Math.floor(audio.currentTime), isPlaying: true });
    }
  },
}));
