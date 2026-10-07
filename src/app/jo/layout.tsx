import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WorkLink Console",
  description: "Administrative control portal",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50 text-navy-900 font-sans antialiased">{children}</div>;
}
