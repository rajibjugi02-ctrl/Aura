import type { Metadata } from "next";
import "./globals.css";
import { AppLayoutShell } from "@/components/navigation/AppLayoutShell";

export const metadata: Metadata = {
  title: "AuraGlass — Minimalist iOS Social Experience",
  description:
    "Modern glassmorphism social app featuring Notes, Stories, synchronized audio, and real-time chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white min-h-screen text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        <AppLayoutShell>{children}</AppLayoutShell>
      </body>
    </html>
  );
}
