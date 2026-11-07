"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ShieldCheck, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { ClientPortal } from "@/components/ui/ClientPortal";

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSwitcherModal({
  isOpen,
  onClose,
}: AccountSwitcherModalProps) {
  const router = useRouter();
  const { accounts, currentUser, switchAccount } = useAuthStore();

  const handleAddAnotherAccount = () => {
    onClose();
    router.push("/auth/login?action=add_account");
  };

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 w-screen h-screen z-[100] flex items-start justify-center pt-20 px-4 select-none">
            {/* Full Screen Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 w-screen h-screen bg-slate-950/50 backdrop-blur-md"
            />

            {/* Top-to-bottom slide pop-up */}
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.22)] z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Switch Accounts ({accounts.length}/5)
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Accounts list */}
              <div className="py-2 space-y-1">
                {accounts.map((acc) => {
                  const isSelected = acc.id === currentUser?.id;
                  return (
                    <motion.button
                      key={acc.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        switchAccount(acc.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                        isSelected
                          ? "bg-slate-100/90 font-medium"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div className="text-left">
                          <div className="text-sm text-slate-900 leading-snug">
                            {acc.username}
                          </div>
                          <div className="text-xs text-slate-500">{acc.name}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Route directly to Login/Register page to authenticate new session */}
              {accounts.length < 5 && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddAnotherAccount}
                  className="w-full mt-2 py-3 px-3.5 flex items-center gap-3 text-xs font-semibold text-slate-800 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200/80 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">Add another account</div>
                    <div className="text-[10px] text-slate-400">Authenticate a new profile session</div>
                  </div>
                </motion.button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}
