"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  Activity,
  Lock,
  Globe2,
  Tv,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Check,
  LogOut,
  X,
  Clock,
  Sparkles,
  Laptop,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";
import { ClientPortal } from "@/components/ui/ClientPortal";

type ModalType = "archive" | "activity" | "language" | "device" | "logout" | null;

const LANGUAGES = [
  "English (US)",
  "Bahasa Indonesia",
  "Español",
  "Français",
  "日本語",
  "Deutsch",
];

export function SettingsMenu() {
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();

  const [isPrivate, setIsPrivate] = useState(false);
  const [highQualityUploads, setHighQualityUploads] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English (US)");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleTogglePrivacy = () => {
    const next = !isPrivate;
    setIsPrivate(next);
    showToast(next ? "Account is now Private" : "Account is now Public");
  };

  const handleToggleQuality = () => {
    const next = !highQualityUploads;
    setHighQualityUploads(next);
    showToast(next ? "High quality uploads enabled" : "Standard quality uploads enabled");
  };

  const handleConfirmLogout = () => {
    setActiveModal(null);
    logout();
    try {
      supabase.auth.signOut().catch(() => {});
    } catch {}
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  };

  const MENU_SECTIONS = [
    {
      title: "How you use the app",
      items: [
        {
          id: "archive",
          title: "Archive",
          subtitle: "Past stories and archived posts",
          icon: Archive,
          type: "link" as const,
          onClick: () => setActiveModal("archive"),
        },
        {
          id: "activity",
          title: "Your Activity",
          subtitle: "Interactions, time spent, search history",
          icon: Activity,
          type: "link" as const,
          onClick: () => setActiveModal("activity"),
        },
      ],
    },
    {
      title: "Who can see your content",
      items: [
        {
          id: "privacy",
          title: "Account Privacy",
          subtitle: isPrivate ? "Private account" : "Public account",
          icon: Lock,
          type: "toggle" as const,
          value: isPrivate,
          onToggle: handleTogglePrivacy,
        },
      ],
    },
    {
      title: "Preferences & Media",
      items: [
        {
          id: "language",
          title: "Language and Translate",
          subtitle: selectedLanguage,
          icon: Globe2,
          type: "select" as const,
          onClick: () => setActiveModal("language"),
        },
        {
          id: "media_quality",
          title: "Media Quality",
          subtitle: "Upload at highest quality (Wi-Fi and Cellular)",
          icon: Tv,
          type: "toggle" as const,
          value: highQualityUploads,
          onToggle: handleToggleQuality,
        },
      ],
    },
    {
      title: "Security & Login",
      items: [
        {
          id: "device",
          title: "Account Status or Device",
          subtitle: "Active sessions and trusted hardware",
          icon: Smartphone,
          type: "link" as const,
          onClick: () => setActiveModal("device"),
        },
      ],
    },
  ];

  return (
    <div className="w-full space-y-6 relative select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70">
        <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          <p className="text-xs text-slate-500">
            Manage your account security, privacy & media preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {MENU_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
              {section.title}
            </h3>

            <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={"onClick" in item ? item.onClick : undefined}
                    className={`flex items-center justify-between p-3.5 transition-colors ${
                      "onClick" in item ? "cursor-pointer hover:bg-slate-50/80" : "hover:bg-slate-50/40"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    {item.type === "toggle" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onToggle();
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                          item.value ? "bg-slate-900" : "bg-slate-200"
                        }`}
                      >
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5"
                          animate={{ left: item.value ? 22 : 2 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </button>
                    ) : item.type === "select" ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span>{selectedLanguage}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Prominent Red Logout Button */}
        <div className="pt-4 border-t border-slate-200/70">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModal("logout")}
            className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl border border-rose-200/80 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of AuraGlass</span>
          </motion.button>
        </div>
      </div>

      {/* Global Modals for Settings Options */}
      <ClientPortal>
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center p-4 select-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModal(null)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_25px_60px_rgba(0,0,0,0.22)] p-6 z-10 flex flex-col"
              >
                {/* Archive Modal */}
                {activeModal === "archive" && (
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-slate-800" />
                        <h3 className="text-sm font-bold text-slate-900">Archive</h3>
                      </div>
                      <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                      <Archive className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-700">No archived stories or posts</p>
                      <p className="text-[11px]">When you archive content, it will only be visible to you here.</p>
                    </div>
                  </div>
                )}

                {/* Your Activity Modal */}
                {activeModal === "activity" && (
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-800" />
                        <h3 className="text-sm font-bold text-slate-900">Your Activity</h3>
                      </div>
                      <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-slate-700">Daily Average</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900">18m / day</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-slate-700">Interactions</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900">Live Tracked</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Language Modal */}
                {activeModal === "language" && (
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-slate-800" />
                        <h3 className="text-sm font-bold text-slate-900">Select Language</h3>
                      </div>
                      <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                      {LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguage === lang;
                        return (
                          <button
                            key={lang}
                            onClick={() => {
                              setSelectedLanguage(lang);
                              showToast(`Language set to ${lang}`);
                              setActiveModal(null);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span>{lang}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Device & Security Modal */}
                {activeModal === "device" && (
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-slate-800" />
                        <h3 className="text-sm font-bold text-slate-900">Device & Sessions</h3>
                      </div>
                      <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Laptop className="w-3.5 h-3.5 text-blue-600" />
                            Current Browser Session
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Active Now
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {currentUser?.email || "Local user session"}
                        </p>
                      </div>
                      <div className="text-[11px] text-slate-400 px-1 leading-relaxed">
                        End-to-end encrypted session with Supabase Realtime Channels.
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Logout Modal */}
                {activeModal === "logout" && (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Log Out of AuraGlass?</h3>
                    <p className="text-xs text-slate-500">
                      You will be returned to the Login page. Your profile credentials will be safely cleared.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => setActiveModal(null)}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmLogout}
                        className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ClientPortal>
    </div>
  );
}
