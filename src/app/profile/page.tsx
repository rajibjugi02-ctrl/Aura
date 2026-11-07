import React from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileMusicWidget } from "@/components/profile/ProfileMusicWidget";
import { StoryHighlights } from "@/components/profile/StoryHighlights";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default function ProfilePage() {
  return (
    <div className="py-6 px-3 sm:px-6 max-w-5xl mx-auto pb-24 md:pb-12 relative">
      <div className="relative z-10 bg-white/85 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 sm:p-10 shadow-[0_16px_45px_rgba(0,0,0,0.04)] space-y-6">
        {/* Profile Header (Name, Username, Stats, Bio, Links, Switch Account) */}
        <ProfileHeader />

        {/* Music Player Widget pinned directly below bio */}
        <ProfileMusicWidget />

        {/* Story Highlights placed below the music widget with + New button */}
        <StoryHighlights />

        {/* Content Tabs (Post Feed, Reels, Repost) */}
        <ProfileTabs />
      </div>
    </div>
  );
}
