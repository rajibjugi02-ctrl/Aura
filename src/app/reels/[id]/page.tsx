"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ImmersiveReelsView } from "@/components/reels/ImmersiveReelsView";

export default function SingleReelPage() {
  const params = useParams();
  const reelId = params?.id as string | undefined;

  return <ImmersiveReelsView initialReelId={reelId} />;
}

