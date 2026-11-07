import React from "react";

export function PeopleMusicSvg({ className = "w-64 h-64" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Human illustration enjoying music"
    >
      {/* Background radial layer */}
      <circle cx="160" cy="160" r="120" fill="#F8FAFC" />
      <circle cx="160" cy="160" r="95" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="8 8" />

      {/* Floating vinyl / disc */}
      <g filter="drop-shadow(0 8px 16px rgba(0,0,0,0.06))">
        <circle cx="230" cy="95" r="34" fill="#0F172A" />
        <circle cx="230" cy="95" r="14" fill="#FA709A" />
        <circle cx="230" cy="95" r="4" fill="#FFFFFF" />
      </g>

      {/* Musical wave ripples */}
      <path d="M60 135C68 125 76 145 84 135C92 125 100 145 108 135" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
      <path d="M65 155C72 147 79 163 86 155C93 147 100 163 107 155" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

      {/* Head and headphone */}
      <circle cx="150" cy="140" r="28" fill="#FBCFE8" />
      <path
        d="M125 130C125 108 175 108 175 130C175 145 160 150 150 150C140 150 125 145 125 130Z"
        fill="#334155"
      />

      {/* Over-ear headphones */}
      <path d="M122 135C122 105 178 105 178 135" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />
      <rect x="116" y="130" width="10" height="22" rx="4" fill="#1877F2" />
      <rect x="174" y="130" width="10" height="22" rx="4" fill="#1877F2" />

      {/* Torso */}
      <path
        d="M100 260C100 200 120 185 150 185C180 185 200 200 200 260H100Z"
        fill="#64748B"
      />
    </svg>
  );
}

