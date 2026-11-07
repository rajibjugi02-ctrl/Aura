"use client";

import React from "react";
import { StoryViewerModal } from "@/components/stories/StoryViewerModal";
import { CommentsSlideSheet } from "@/components/comments/CommentsSlideSheet";
import { CreateActionSheet } from "@/components/navigation/CreateActionSheet";

export function GlobalModals() {
  return (
    <>
      <StoryViewerModal />
      <CommentsSlideSheet />
      <CreateActionSheet />
    </>
  );
}

