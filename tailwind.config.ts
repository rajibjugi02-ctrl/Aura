import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        glass: {
          light: "rgba(255, 255, 255, 0.72)",
          card: "rgba(255, 255, 255, 0.85)",
          border: "rgba(255, 255, 255, 0.55)",
          pill: "rgba(240, 243, 246, 0.75)",
        },
        brand: {
          primary: "#1877F2",
          accent: "#FA709A",
          muted: "#64748B",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
        "glass-hover": "0 12px 40px 0 rgba(31, 38, 135, 0.12)",
        "ios-float": "0 20px 45px -10px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        ios: "22px",
      },
    },
  },
  plugins: [],
};
export default config;

