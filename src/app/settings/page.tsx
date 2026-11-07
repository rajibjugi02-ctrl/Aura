import React from "react";
import { SettingsMenu } from "@/components/settings/SettingsMenu";

export default function SettingsPage() {
  return (
    <div className="py-6 px-3 sm:px-6 max-w-3xl mx-auto pb-24 md:pb-12">
      <div className="bg-white/85 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 sm:p-9 shadow-[0_16px_45px_rgba(0,0,0,0.04)]">
        <SettingsMenu />
      </div>
    </div>
  );
}
