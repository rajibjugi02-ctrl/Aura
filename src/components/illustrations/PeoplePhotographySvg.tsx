import React from "react";

export function PeoplePhotographySvg({ className = "w-64 h-64" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Human illustration photography"
    >
      {/* Background circle and ambient frame */}
      <circle cx="160" cy="160" r="125" fill="#F1F5F9" opacity="0.7" />
      <rect x="45" y="45" width="230" height="230" rx="36" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 6" />

      {/* Floating lens / flash accent */}
      <circle cx="235" cy="85" r="28" fill="#FFFFFF" filter="drop-shadow(0 6px 16px rgba(0,0,0,0.06))" />
      <path d="M235 73V97M223 85H247" stroke="#1877F2" strokeWidth="3" strokeLinecap="round" />

      {/* Character body */}
      <circle cx="160" cy="120" r="26" fill="#FDE68A" />
      <path
        d="M135 110C135 90 185 90 185 110C185 125 170 128 160 128C150 128 135 125 135 110Z"
        fill="#1E293B"
      />
      {/* Torso */}
      <path
        d="M115 250C115 190 135 170 160 170C185 170 205 190 205 250H115Z"
        fill="#475569"
      />

      {/* Camera device held in hands */}
      <rect x="130" y="160" width="60" height="42" rx="8" fill="#0F172A" />
      <circle cx="160" cy="181" r="14" fill="#334155" />
      <circle cx="160" cy="181" r="8" fill="#1877F2" />
      <circle cx="178" cy="168" r="3" fill="#EF4444" />

      {/* Hands holding the camera */}
      <path d="M125 185H135" stroke="#FDE68A" strokeWidth="7" strokeLinecap="round" />
      <path d="M185 185H195" stroke="#FDE68A" strokeWidth="7" strokeLinecap="round" />

      {/* Shutter sparkle */}
      <path d="M85 105L90 120L105 125L90 130L85 145L80 130L65 125L80 120Z" fill="#CBD5E1" />
    </svg>
  );
}

