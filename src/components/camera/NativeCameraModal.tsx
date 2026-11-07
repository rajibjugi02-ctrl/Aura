"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  Video,
  SwitchCamera,
  Circle,
  Square,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { uploadMedia } from "@/lib/supabase";

interface NativeCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (media: { type: "photo" | "video"; url: string }) => void;
  initialMode?: "photo" | "video";
}

export function NativeCameraModal({
  isOpen,
  onClose,
  onCapture,
  initialMode = "photo",
}: NativeCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<"photo" | "video">(initialMode);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStartingStream, setIsStartingStream] = useState(false);

  // Stop current active media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start media stream using navigator.mediaDevices.getUserMedia
  const startStream = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Native camera API is not supported in this browser environment.");
      return;
    }

    stopStream();
    setIsStartingStream(true);
    setErrorMessage(null);

    const videoConstraints: MediaTrackConstraints = {
      facingMode: facingMode,
      width: { ideal: 1080 },
      height: { ideal: 1920 },
    };

    try {
      // First attempt: video + audio with studio noise suppression & echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio:
          mode === "video"
            ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      // Fallback: try video only (e.g., if mic permission is blocked or unavailable)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        console.error("Camera access failed:", err);
        setErrorMessage(
          "Camera access denied or device not found. Please allow camera permissions in your browser."
        );
      }
    } finally {
      setIsStartingStream(false);
    }
  }, [facingMode, mode, stopStream]);

  // Manage camera lifecycle based on modal visibility
  useEffect(() => {
    if (isOpen) {
      startStream();
    } else {
      stopStream();
      setIsRecording(false);
      setRecordingSeconds(0);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startStream, stopStream]);

  // Video recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Snap photo from current video frame
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if selfie front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoUrl = canvas.toDataURL("image/jpeg", 0.95);

    stopStream();
    onCapture({ type: "photo", url: photoUrl });
    onClose();
  };

  // Toggle video recording
  const handleToggleRecord = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      if (!streamRef.current) return;
      recordedChunksRef.current = [];

      try {
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : "video/webm";

        const recorder = new MediaRecorder(streamRef.current, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const file = new File([blob], `cam_video_${Date.now()}.webm`, { type: mimeType });
          const res = await uploadMedia(file);
          stopStream();
          onCapture({ type: "video", url: res.url });
          onClose();
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        console.error("MediaRecorder start error:", err);
      }
    }
  };

  // Toggle between front and back camera
  const handleToggleFacingMode = () => {
    if (isRecording) return;
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 w-screen h-screen z-[110] bg-black flex items-center justify-center select-none overflow-hidden">
            {/* Camera Viewport Container */}
            <div className="relative w-full h-full max-w-md sm:h-[94vh] sm:max-h-[860px] bg-slate-950 sm:rounded-[36px] overflow-hidden flex flex-col justify-between shadow-2xl">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover absolute inset-0 ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Error overlay if permissions denied */}
              {errorMessage && (
                <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-white">
                  <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                  <h4 className="text-base font-bold mb-2">Camera Unavailable</h4>
                  <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
                    {errorMessage}
                  </p>
                  <button
                    onClick={startStream}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-bold transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Top Control Bar: Close & Timer */}
              <div className="relative z-20 flex items-center justify-between p-4 pt-5 bg-gradient-to-b from-black/60 to-transparent">
                <button
                  type="button"
                  onClick={() => {
                    stopStream();
                    onClose();
                  }}
                  className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-colors shadow-sm"
                  aria-label="Close Camera"
                >
                  <X className="w-5 h-5" />
                </button>

                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>REC {formatTimer(recordingSeconds)}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-colors shadow-sm"
                  aria-label="Switch Camera"
                  title="Switch front/back camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Control Bar: Trigger & Mode Switcher */}
              <div className="relative z-20 pb-8 pt-4 px-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-4">
                {/* Mode Switcher Pill */}
                <div className="flex items-center gap-1 p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isRecording) setMode("photo");
                    }}
                    className={`px-4 py-1.5 rounded-full transition-all ${
                      mode === "photo"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isRecording) setMode("video");
                    }}
                    className={`px-4 py-1.5 rounded-full transition-all ${
                      mode === "video"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Video
                  </button>
                </div>

                {/* Shutter / Record Trigger Button */}
                <div className="flex items-center justify-center py-2">
                  {mode === "photo" ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={handleSnapPhoto}
                      className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center shadow-lg transition-transform"
                      aria-label="Snap Photo"
                    >
                      <div className="w-full h-full rounded-full bg-white active:bg-slate-200" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={handleToggleRecord}
                      className={`w-20 h-20 rounded-full border-4 p-1 flex items-center justify-center shadow-lg transition-all ${
                        isRecording ? "border-rose-500" : "border-white"
                      }`}
                      aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                      <div
                        className={`transition-all ${
                          isRecording
                            ? "w-8 h-8 rounded-lg bg-rose-600"
                            : "w-full h-full rounded-full bg-rose-600 active:bg-rose-700"
                        }`}
                      />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}

