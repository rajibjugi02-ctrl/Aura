"use client";

import React, { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  UserX,
  Flag,
  Check,
} from "lucide-react";
import { Post } from "@/types";
import { useFeedStore } from "@/store/useFeedStore";
import { useAuthStore } from "@/store/useAuthStore";

interface PostMenuDropdownProps {
  post: Post;
  onPostDeleted?: () => void;
}

export function PostMenuDropdown({ post, onPostDeleted }: PostMenuDropdownProps) {
  const { currentUser } = useAuthStore();
  const { deletePost, archivePost } = useFeedStore();
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const isOwner =
    currentUser?.id === post.author.id ||
    currentUser?.username === post.author.username;

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePost(post.id);
    showToast("Post deleted");
    if (onPostDeleted) onPostDeleted();
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    archivePost(post.id);
    showToast("Post archived");
    if (onPostDeleted) onPostDeleted();
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`Blocked @${post.author.username}`);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast("Report submitted. Thank you for keeping AuraGlass safe.");
  };

  return (
    <div className="relative">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            onClick={(e) => e.stopPropagation()}
            align="end"
            sideOffset={6}
            className="z-[150] w-48 bg-white/95 backdrop-blur-2xl border border-white/85 rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] space-y-0.5 animate-in fade-in-0 zoom-in-95 focus:outline-none"
          >
            {isOwner ? (
              <>
                <DropdownMenu.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast("Editing mode active");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors focus:outline-none"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Caption</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={handleArchive}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors focus:outline-none"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-500" />
                  <span>Archive</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

                <DropdownMenu.Item
                  onClick={handleDelete}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors focus:outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </DropdownMenu.Item>
              </>
            ) : (
              <>
                <DropdownMenu.Item
                  onClick={handleBlock}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors focus:outline-none"
                >
                  <UserX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Block @{post.author.username}</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

                <DropdownMenu.Item
                  onClick={handleReport}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors focus:outline-none"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Floating Action Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium rounded-full shadow-xl flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}
    </div>
  );
}

