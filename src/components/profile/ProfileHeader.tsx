"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Link2, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedStore } from "@/store/useFeedStore";
import { AccountSwitcherModal } from "./AccountSwitcherModal";
import { Button } from "@/components/ui/Button";

export function ProfileHeader() {
  const { currentUser } = useAuthStore();
  const { posts } = useFeedStore();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const username = currentUser?.username || "user";
  const name = currentUser?.name || "User";
  const avatar =
    currentUser?.avatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop";

  const myPostsCount = posts.filter(
    (p) =>
      p.author?.id === currentUser?.id ||
      (currentUser?.username &&
        p.author?.username?.toLowerCase() === currentUser?.username?.toLowerCase())
  ).length;

  return (
    <div className="w-full space-y-4">
      {/* Top Username bar with switch account pop-up trigger */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsSwitcherOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm hover:bg-white/90 transition-all cursor-pointer"
        >
          <span className="font-bold text-slate-900 text-base">
            {username}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.button>

        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="glass" size="icon" className="rounded-2xl">
              <SettingsIcon className="w-4 h-4 text-slate-700" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Avatar & Stats row */}
      <div className="flex items-center gap-5 sm:gap-8 pt-1">
        <div className="relative">
          <div className="p-1 rounded-full ring-2 ring-slate-200/90 shadow-sm">
            <img
              src={avatar}
              alt={name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
            />
          </div>
        </div>

        {/* Dynamic real stats */}
        <div className="flex-1 flex justify-around text-center">
          <div>
            <div className="font-bold text-slate-900 text-base sm:text-lg">
              {myPostsCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Posts</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base sm:text-lg">
              0
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Followers
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base sm:text-lg">
              0
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Following
            </div>
          </div>
        </div>
      </div>

      {/* Bio & Links */}
      <div className="space-y-1.5 pt-1">
        <h2 className="font-semibold text-slate-900 text-sm">
          {name}
        </h2>
        {currentUser?.bio && (
          <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
            {currentUser.bio}
          </p>
        )}

        {currentUser?.links && currentUser.links.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {currentUser.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
              >
                <Link2 className="w-3 h-3" />
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile CTA Button with Solid High Contrast Background */}
      <div className="pt-2">
        <Link href="/profile/edit" className="block w-full">
          <Button
            variant="primary"
            className="w-full h-10 rounded-2xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all flex items-center justify-center"
          >
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Modal for switching accounts */}
      <AccountSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </div>
  );
}
