import { createClient } from "@supabase/supabase-js";
import { saveMediaFileToDb } from "./indexedDbMedia";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock_key_for_development";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface StorageUploadResult {
  url: string;
  path: string;
  size: number;
}

export async function uploadMedia(file: File, bucket = "media"): Promise<StorageUploadResult> {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  // Validate supported media types
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  if (!isImage && !isVideo && !isAudio) {
    throw new Error(`Unsupported media format: ${file.type || file.name}`);
  }

  // Attempt real Supabase Storage upload if credentials are provided
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
  ) {
    try {
      const fileExt = file.name.split(".").pop() || "bin";
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data, error } = await supabase.storage.from(bucket).upload(cleanFileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

      if (!error && data) {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        if (publicData?.publicUrl) {
          return {
            url: publicData.publicUrl,
            path: data.path,
            size: file.size,
          };
        }
      }
    } catch (err) {
      console.warn("Supabase storage upload error, falling back to persistent local storage:", err);
    }
  }

  // Safe fallback 1: For images & small audio snippets (<= 1.5MB), use persistent Base64 Data URL
  if (file.size <= 1.5 * 1024 * 1024) {
    const dataUrl = await new Promise<string>((resolve) => {
      if (typeof window === "undefined" || typeof FileReader === "undefined") {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });

    if (dataUrl) {
      return {
        url: dataUrl,
        path: `local_data/${Date.now()}_${file.name}`,
        size: file.size,
      };
    }
  }

  // Safe fallback 2: For videos & large files (> 1.5MB), use persistent IndexedDB storage
  // Prevents localStorage QuotaExceededError while persisting across reloads
  const mediaId = `media_idb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const persistentUrl = await saveMediaFileToDb(mediaId, file);

  return {
    url: persistentUrl,
    path: `idb/${mediaId}`,
    size: file.size,
  };
}

export class RealtimeChannelHub {
  private static instance: RealtimeChannelHub;
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  private constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastChannel = new BroadcastChannel("auraglass_realtime_sync");
      this.broadcastChannel.onmessage = (event) => {
        const { channel, payload } = event.data || {};
        if (channel && payload) {
          const channelListeners = this.listeners.get(channel);
          if (channelListeners) {
            channelListeners.forEach((fn) => fn(payload));
          }
        }
      };
    }
  }

  static getInstance(): RealtimeChannelHub {
    if (!RealtimeChannelHub.instance) {
      RealtimeChannelHub.instance = new RealtimeChannelHub();
    }
    return RealtimeChannelHub.instance;
  }

  subscribe(channel: string, callback: (payload: any) => void) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // Also connect Supabase Realtime channel if active
    let supabaseChannel: ReturnType<typeof supabase.channel> | null = null;
    try {
      supabaseChannel = supabase
        .channel(channel)
        .on("broadcast", { event: "alert" }, ({ payload }) => {
          callback(payload);
        })
        .subscribe();
    } catch {}

    return () => {
      this.listeners.get(channel)?.delete(callback);
      if (supabaseChannel) {
        try {
          supabase.removeChannel(supabaseChannel);
        } catch {}
      }
    };
  }

  broadcast(channel: string, payload: any) {
    // 1. Dispatch locally in-memory
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach((fn) => fn(payload));
    }

    // 2. Broadcast across all browser tabs via BroadcastChannel (Zero-delay WebSockets emulation)
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ channel, payload });
    }

    // 3. Broadcast to Supabase Realtime WebSocket if connected
    try {
      supabase.channel(channel).send({
        type: "broadcast",
        event: "alert",
        payload,
      });
    } catch {}
  }
}
