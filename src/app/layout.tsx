import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "RankFlow – Roblox Group Dashboard",
  description: "Professional Roblox group management platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(30, 10, 60, 0.95)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              color: "#f0e8ff",
            },
          }}
        />
      </body>
    </html>
  );
}
