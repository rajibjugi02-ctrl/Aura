import React from "react";

export function PeopleChattingSvg({ className = "w-64 h-64" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Human illustration chatting"
    >
      {/* Soft decorative background circles */}
      <circle cx="160" cy="160" r="130" fill="#EEF2F6" opacity="0.6" />
      <circle cx="190" cy="120" r="70" fill="#E2E8F0" opacity="0.5" />

      {/* Floating speech bubbles */}
      <rect x="70" y="60" width="65" height="34" rx="14" fill="#FFFFFF" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.06))" />
      <circle cx="85" cy="77" r="3" fill="#94A3B8" />
      <circle cx="102" cy="77" r="3" fill="#94A3B8" />
      <circle cx="119" cy="77" r="3" fill="#94A3B8" />

      <rect x="180" y="85" width="75" height="34" rx="14" fill="#1877F2" filter="drop-shadow(0 4px 12px rgba(24,119,242,0.25))" />
      <path d="M195 102H240" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Character 1 (Left) */}
      <circle cx="110" cy="150" r="22" fill="#E2E8F0" />
      <path
        d="M95 140C95 130 125 130 125 140C125 148 115 152 110 152C105 152 95 148 95 140Z"
        fill="#334155"
      />
      {/* Torso */}
      <path
        d="M75 240C75 195 95 180 110 180C125 180 145 195 145 240H75Z"
        fill="#64748B"
      />
      {/* Arm holding phone */}
      <path
        d="M125 195L140 215L135 228"
        stroke="#475569"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="135" y="210" width="12" height="22" rx="3" fill="#0F172A" />

      {/* Character 2 (Right) */}
      <circle cx="210" cy="165" r="24" fill="#FED7AA" />
      {/* Hair bun */}
      <circle cx="228" cy="150" r="10" fill="#1E293B" />
      <path
        d="M190 162C190 145 230 145 230 162C230 172 215 174 210 174C200 174 190 172 190 162Z"
        fill="#1E293B"
      />
      {/* Torso */}
      <path
        d="M175 250C175 205 195 192 210 192C225 192 245 205 245 250H175Z"
        fill="#94A3B8"
      />
      {/* Arm with mug */}
      <path
        d="M195 205L178 220"
        stroke="#64748B"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="168" y="215" width="14" height="18" rx="4" fill="#FFFFFF" />

      {/* Floating accent spark */}
      <path d="M155 125L158 135L168 138L158 141L155 151L152 141L142 138L152 135Z" fill="#CBD5E1" />
    </svg>
  );
}

