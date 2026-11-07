"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useStoryStore } from "@/store/useStoryStore";
import { useAuthStore } from "@/store/useAuthStore";

export function StoryCircleBar() {
  const { userGroups, openStory } = useStoryStore();
  const { currentUser } = useAuthStore();

  const selfId = currentUser?.id || "user_self";
  const selfAvatar =
    currentUser?.avatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop";

  const selfGroup = userGroups.find((g) => g.userId === selfId);
  const otherGroups = userGroups.filter((g) => g.userId !== selfId);
  const hasSelfStories = (selfGroup?.stories?.length ?? 0) > 0;

  return (
    <div className="w-full py-2.5 overflow-x-auto no-scrollbar flex items-center gap-4 px-2">
      {/* Current User Story Circle (Always Visible) */}
      <div className="flex flex-col items-center shrink-0 cursor-pointer relative group">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => {
              if (hasSelfStories && selfGroup) {
                openStory(selfGroup.userId);
              } else {
                window.location.href = "/stories/create";
              }
            }}
            className={`p-[2.5px] rounded-full block transition-transform ${
              hasSelfStories && selfGroup?.hasUnseen
                ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 shadow-sm"
                : hasSelfStories
                ? "bg-slate-300"
                : "bg-transparent ring-2 ring-dashed ring-slate-300"
            }`}
            title={hasSelfStories ? "View Your Story" : "Create Story"}
          >
            <div className="p-0.5 bg-white rounded-full">
              <img
                src={selfAvatar}
                alt="Your Story"
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
          </motion.button>

          {/* Dedicated + Add Story button */}
          <Link
            href="/stories/create"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-white shadow-md hover:scale-110 active:scale-90 transition-transform"
            title="Create new story"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </Link>
        </div>

        <span className="text-[11px] text-slate-700 font-medium truncate max-w-[70px] mt-1.5">
          Your Story
        </span>
      </div>

      {/* Other Accounts Story Groups */}
      {otherGroups.map((group) => {
        const hasStories = group.stories.length > 0;

        return (
          <div
            key={group.userId}
            className="flex flex-col items-center shrink-0 cursor-pointer relative group"
          >
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                onClick={() => openStory(group.userId)}
                className={`p-[2.5px] rounded-full block transition-transform ${
                  group.hasUnseen
                    ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 shadow-sm"
                    : hasStories
                    ? "bg-slate-300"
                    : "bg-transparent ring-2 ring-dashed ring-slate-300"
                }`}
                title={`View ${group.username}'s Story`}
              >
                <div className="p-0.5 bg-white rounded-full">
                  <img
                    src={group.userAvatar}
                    alt={group.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                </div>
              </motion.button>
            </div>

            <span className="text-[11px] text-slate-700 font-medium truncate max-w-[70px] mt-1.5">
              {group.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
