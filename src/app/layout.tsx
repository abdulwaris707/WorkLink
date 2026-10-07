import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "WorkLink | Trusted Skilled Marketplace",
  description:
    "Find vetted local trade professionals and digital specialists. Book appointments, chat securely, and manage projects seamlessly with WorkLink.",
  keywords: ["home services", "electrician", "plumber", "cleaning", "handyman", "freelance marketplace", "vetted workers"],
  authors: [{ name: "WorkLink Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorkLink",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B1F3A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50 text-navy-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
