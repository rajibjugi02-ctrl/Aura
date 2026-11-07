"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Image as ImageIcon,
  Smile,
  CheckCheck,
  X,
  CornerUpLeft,
  ChevronLeft,
  MoreVertical,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Copy,
  User,
  Check,
} from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { ChatMessage } from "@/types";
import { ClientPortal } from "@/components/ui/ClientPortal";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { uploadMedia } from "@/lib/supabase";

const EMOJI_LIST = [
  "😀", "😂", "🥰", "😍", "😎", "🥳", "🥺", "🔥",
  "✨", "⚡️", "❤️", "🖤", "👍", "👏", "🙌", "🙏",
  "☕️", "🎧", "📸", "🌙", "🌊", "🏔️", "💫", "🎨",
  "🚀", "💎", "💯", "🎈", "🎉", "🕊️", "🥂", "👾",
];

const DEFAULT_WAVEFORM = [
  20, 45, 70, 35, 90, 60, 40, 85, 95, 50,
  30, 80, 65, 40, 75, 90, 55, 30, 60, 85,
];

export function ChatRoom() {
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    sendMessage,
    deleteConversation,
  } = useChatStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAboutProfile, setShowAboutProfile] = useState(false);

  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // Real voice note recording states (getUserMedia & MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioPlayersRef = useRef<Record<string, HTMLAudioElement>>({});

  // Voice note playback tracking: map messageId -> { isPlaying: boolean, currentTime: number }
  const [voicePlaybackMap, setVoicePlaybackMap] = useState<
    Record<string, { isPlaying: boolean; currentTime: number }>
  >({});
  const audioIntervalRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Simulated typing indicator for partner
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isPartnerTyping]);

  // Voice Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const handleStartVoiceRecording = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        alert("Audio recording is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.warn("Microphone access permission denied or failed:", err);
      // Fallback timer mode if permission is blocked in sandbox
      setIsRecording(true);
      setRecordingSeconds(0);
    }
  };

  const handleCopyChat = async () => {
    if (!activeConversation) return;
    const conversationText =
      activeConversation.messages.length > 0
        ? activeConversation.messages
            .map((m) => `[${m.timestamp}] ${m.senderName}: ${m.content}`)
            .join("\n")
        : `Chat with @${activeConversation.recipient.username}`;
    try {
      await navigator.clipboard.writeText(conversationText);
      setToastMessage("Chat copied to clipboard!");
      setTimeout(() => setToastMessage(null), 2500);
    } catch {}
    setIsMenuOpen(false);
  };

  const handleDeleteChat = () => {
    if (!activeConversation) return;
    deleteConversation(activeConversation.id);
    setIsMenuOpen(false);
  };

  const handleAboutProfile = () => {
    setIsMenuOpen(false);
    setShowAboutProfile(true);
  };

  if (!activeConversation) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadMedia(file);
    setSelectedImagePreview(res.url);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImagePreview) return;

    sendMessage(
      inputText.trim(),
      replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            senderName: replyingTo.senderName,
          }
        : undefined,
      selectedImagePreview || undefined
    );

    setInputText("");
    setSelectedImagePreview(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);

    // Simulate partner typing 1.5s after send
    setTimeout(() => {
      setIsPartnerTyping(true);
      setTimeout(() => {
        setIsPartnerTyping(false);
      }, 1800);
    }, 900);
  };

  const handleSendVoiceNote = () => {
    setIsRecording(false);
    const recordedDuration = Math.max(recordingSeconds, 1);
    const recorder = mediaRecorderRef.current;

    const dispatchNote = (audioUrl?: string) => {
      sendMessage(
        "",
        replyingTo
          ? {
              id: replyingTo.id,
              content: replyingTo.content,
              senderName: replyingTo.senderName,
            }
          : undefined,
        undefined,
        {
          audioUrl,
          durationSeconds: recordedDuration,
          waveform: DEFAULT_WAVEFORM,
        }
      );

      setReplyingTo(null);
      setRecordingSeconds(0);
    };

    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const mimeType = recorder.mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioFile = new File([blob], `voice_${Date.now()}.webm`, { type: mimeType });
          const res = await uploadMedia(audioFile);
          dispatchNote(res.url);
        } else {
          dispatchNote(undefined);
        }
        recorder.stream?.getTracks().forEach((track) => track.stop());
      };
      recorder.stop();
    } else {
      dispatchNote(undefined);
    }

    // Simulate partner typing
    setTimeout(() => {
      setIsPartnerTyping(true);
      setTimeout(() => {
        setIsPartnerTyping(false);
      }, 2000);
    }, 1000);
  };

  const handleCancelVoiceNote = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      recorder.stream?.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Toggle real voice playback using HTMLAudioElement
  const toggleVoicePlayback = (msgId: string, maxDuration: number, audioUrl?: string) => {
    const current = voicePlaybackMap[msgId] || { isPlaying: false, currentTime: 0 };

    if (current.isPlaying) {
      const player = activeAudioPlayersRef.current[msgId];
      if (player) {
        player.pause();
      }
      if (audioIntervalRef.current[msgId]) {
        clearInterval(audioIntervalRef.current[msgId]);
      }
      setVoicePlaybackMap((prev) => ({
        ...prev,
        [msgId]: { ...current, isPlaying: false },
      }));
    } else {
      if (audioUrl) {
        let player = activeAudioPlayersRef.current[msgId];
        if (!player) {
          player = new Audio(audioUrl);
          activeAudioPlayersRef.current[msgId] = player;
        }

        player.currentTime = current.currentTime >= maxDuration ? 0 : current.currentTime;
        player.play().catch(() => {});

        player.ontimeupdate = () => {
          setVoicePlaybackMap((prev) => ({
            ...prev,
            [msgId]: { isPlaying: true, currentTime: Math.floor(player.currentTime) },
          }));
        };

        player.onended = () => {
          setVoicePlaybackMap((prev) => ({
            ...prev,
            [msgId]: { isPlaying: false, currentTime: 0 },
          }));
        };
      } else {
        const interval = setInterval(() => {
          setVoicePlaybackMap((prev) => {
            const state = prev[msgId] || { isPlaying: true, currentTime: 0 };
            if (state.currentTime >= maxDuration) {
              clearInterval(interval);
              return { ...prev, [msgId]: { isPlaying: false, currentTime: 0 } };
            }
            return {
              ...prev,
              [msgId]: { isPlaying: true, currentTime: state.currentTime + 1 },
            };
          });
        }, 1000);

        audioIntervalRef.current[msgId] = interval;
      }

      setVoicePlaybackMap((prev) => ({
        ...prev,
        [msgId]: { isPlaying: true, currentTime: current.currentTime },
      }));
    }
  };

  const handleScrubAudio = (msgId: string, newTime: number) => {
    setVoicePlaybackMap((prev) => ({
      ...prev,
      [msgId]: {
        isPlaying: prev[msgId]?.isPlaying || false,
        currentTime: newTime,
      },
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.05)] select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Chat Room Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/70 border-b border-slate-100/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              selectConversation(null);
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", "/messages");
              }
            }}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="Back to inbox"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={activeConversation.recipient.avatar}
              alt={activeConversation.recipient.name}
              className="w-10 h-10 rounded-full object-cover shadow-sm"
            />
            {activeConversation.recipient.status === "online" && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {activeConversation.recipient.name}
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {isPartnerTyping ? (
                <span className="text-blue-600 font-bold animate-pulse">
                  typing...
                </span>
              ) : isRecording ? (
                <span className="text-rose-500 font-bold animate-pulse">
                  recording voice...
                </span>
              ) : (
                <>
                  @{activeConversation.recipient.username} •{" "}
                  <span className="text-emerald-600 font-semibold">
                    {activeConversation.recipient.status === "online"
                      ? "Active now"
                      : "Offline"}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute right-12 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-full shadow-lg whitespace-nowrap z-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}

          <span className="hidden sm:inline px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-600 rounded-full border border-blue-100/80">
            Realtime Sync
          </span>

          {/* Top-Right Dropdown Pop-up Menu via Radix Portal (Zero z-index trapping) */}
          <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                title="Chat options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="w-44 bg-white/95 backdrop-blur-2xl border border-white/90 rounded-2xl shadow-[0_16px_45px_rgba(0,0,0,0.18)] p-1.5 z-[100] select-none text-xs"
              >
                <DropdownMenu.Item
                  onClick={handleCopyChat}
                  className="flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer focus:outline-none"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Chat</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={handleAboutProfile}
                  className="flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer focus:outline-none"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>About Profile</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

                <DropdownMenu.Item
                  onClick={handleDeleteChat}
                  className="flex items-center gap-2.5 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer focus:outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Chat</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {activeConversation.messages.map((msg) => {
          const playback = voicePlaybackMap[msg.id] || {
            isPlaying: false,
            currentTime: 0,
          };
          const totalDuration = msg.voiceNote?.durationSeconds || 14;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
            >
              {/* Quoted message if replied */}
              {msg.replyTo && (
                <div
                  className={`text-[11px] mb-1 px-3 py-1 rounded-xl bg-slate-200/60 text-slate-600 max-w-xs truncate border-l-2 border-blue-500 ${
                    msg.isSelf ? "mr-2" : "ml-2"
                  }`}
                >
                  Replying to{" "}
                  <span className="font-semibold">{msg.replyTo.senderName}</span>:{" "}
                  {msg.replyTo.content}
                </div>
              )}

              <div className="group relative flex items-center gap-1.5">
                {!msg.isSelf && (
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity"
                    title="Reply"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                <div
                  className={`rounded-2xl text-sm leading-relaxed max-w-[280px] sm:max-w-md ${
                    msg.isSelf
                      ? "bg-slate-900 text-white rounded-br-sm shadow-sm"
                      : "bg-white/95 text-slate-800 rounded-bl-sm border border-white/90 shadow-sm"
                  }`}
                >
                  {/* Photo attachment if present */}
                  {msg.imageUrl && (
                    <div className="p-1.5">
                      <img
                        src={msg.imageUrl}
                        alt="Chat attachment"
                        className="rounded-xl max-h-56 w-full object-cover shadow-sm"
                      />
                    </div>
                  )}

                  {/* Voice Note player with interactive waveform scrubber */}
                  {msg.voiceNote && (
                    <div className="p-3 w-64 sm:w-72 space-y-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleVoicePlayback(msg.id, totalDuration, msg.voiceNote?.audioUrl)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 ${
                            msg.isSelf
                              ? "bg-white text-slate-900"
                              : "bg-slate-900 text-white"
                          }`}
                        >
                          {playback.isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current translate-x-0.5" />
                          )}
                        </button>

                        {/* Interactive Waveform with Scrubbing Slider */}
                        <div className="flex-1 space-y-1">
                          <div className="relative h-6 flex items-center gap-0.5">
                            {/* Visual Waveform bars */}
                            {(msg.voiceNote.waveform || DEFAULT_WAVEFORM).map(
                              (height, barIdx) => {
                                const barPercent = (barIdx / (DEFAULT_WAVEFORM.length - 1)) * 100;
                                const currentPercent = (playback.currentTime / totalDuration) * 100;
                                const isPlayed = barPercent <= currentPercent;

                                return (
                                  <div
                                    key={barIdx}
                                    style={{ height: `${height}%` }}
                                    className={`flex-1 rounded-full transition-colors ${
                                      isPlayed
                                        ? msg.isSelf
                                          ? "bg-white"
                                          : "bg-blue-600"
                                        : msg.isSelf
                                        ? "bg-white/30"
                                        : "bg-slate-200"
                                    }`}
                                  />
                                );
                              }
                            )}

                            {/* Range Scrubber input overlaid on waveform */}
                            <input
                              type="range"
                              min="0"
                              max={totalDuration}
                              value={playback.currentTime}
                              onChange={(e) =>
                                handleScrubAudio(msg.id, Number(e.target.value))
                              }
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              aria-label="Seek voice note position"
                            />
                          </div>

                          <div
                            className={`flex items-center justify-between text-[10px] font-medium ${
                              msg.isSelf ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            <span>0:{playback.currentTime.toString().padStart(2, "0")}</span>
                            <span>0:{totalDuration.toString().padStart(2, "0")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text content if present */}
                  {msg.content && (
                    <div className="px-4 py-2.5 break-words">{msg.content}</div>
                  )}
                </div>

                {msg.isSelf && (
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity"
                    title="Reply"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                {msg.isSelf && (
                  <CheckCheck className="w-3 h-3 text-blue-500 stroke-[2.5]" />
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Real-time Partner Typing Glass Bubble */}
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <img
                src={activeConversation.recipient.avatar}
                alt="Typing avatar"
                className="w-6 h-6 rounded-full object-cover"
              />
              <div className="px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-[bounce_1.2s_ease-in-out_infinite]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-[bounce_0.8s_ease-in-out_infinite]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Attachment Preview Bar */}
      <AnimatePresence>
        {selectedImagePreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-slate-50 border-t border-slate-200/60 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={selectedImagePreview}
                alt="Selected attachment"
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-300"
              />
              <span className="text-xs text-slate-600 font-medium">
                Photo attachment ready to send
              </span>
            </div>
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quoted Reply Target Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-between px-4 py-2 bg-slate-100/90 border-t border-slate-200/60 text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <CornerUpLeft className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-500">Replying to</span>
              <span className="font-semibold text-slate-800">
                {replyingTo.senderName}
              </span>
              <span className="text-slate-400 truncate max-w-xs">
                &ldquo;{replyingTo.content}&rdquo;
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Glass Emoji Picker Popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="mx-4 mb-2 p-3 bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-xl z-20"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Emoji
              </span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-lg hover:scale-120 active:scale-95 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Note Recording Live Overlay vs Normal Input Bar */}
      {isRecording ? (
        <div className="p-3 bg-rose-50/90 border-t border-rose-200/80 backdrop-blur-md flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <Mic className="w-4 h-4 text-rose-600" />
              <span>
                Recording Voice... 0:
                {recordingSeconds.toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelVoiceNote}
              className="p-2 text-rose-600 hover:bg-rose-100 rounded-full transition-colors"
              title="Cancel recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSendVoiceNote}
              className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Voice</span>
            </button>
          </div>
        </div>
      ) : (
        /* Normal Message Input Bar */
        <form
          onSubmit={handleSend}
          className="p-3 bg-white/80 border-t border-slate-100/90 backdrop-blur-md flex items-center gap-2"
        >
          {/* Photo upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100/60 transition-colors"
            title="Attach image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Voice Note button */}
          <button
            type="button"
            onClick={handleStartVoiceRecording}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            title="Record voice note"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text input with inside emoji picker button */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeConversation.recipient.name}...`}
              className="w-full h-10 pl-4 pr-10 bg-slate-100/80 border border-slate-200/50 rounded-full text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Pick emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            disabled={!inputText.trim() && !selectedImagePreview}
            className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-opacity"
          >
            <Send className="w-4 h-4 translate-x-0.5" />
          </motion.button>
        </form>
      )}

      {/* About Profile Modal Dialog */}
      <ClientPortal>
        <AnimatePresence>
          {showAboutProfile && (
            <div className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center p-4 select-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAboutProfile(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_25px_60px_rgba(0,0,0,0.25)] p-6 z-10 flex flex-col items-center text-center"
              >
                <button
                  onClick={() => setShowAboutProfile(false)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <img
                  src={activeConversation.recipient.avatar}
                  alt={activeConversation.recipient.name}
                  className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-slate-100 mb-3"
                />

                <h3 className="text-base font-bold text-slate-900">
                  {activeConversation.recipient.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  @{activeConversation.recipient.username}
                </p>

                <div className="my-4 p-3 bg-slate-50 rounded-2xl w-full text-xs text-slate-600 space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account status</span>
                    <span className="font-semibold text-emerald-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connected</span>
                    <span className="font-semibold text-slate-800">Direct Chat</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowAboutProfile(false);
                    window.location.href = "/profile";
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-2xl shadow transition-colors"
                >
                  View Profile
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ClientPortal>
    </div>
  );
}
