import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbitarium Control",
  description:
    "Mission control em Kanban para unidades de negocio, pessoas e agentes.",
  other: {
    "codex-preview": "orbitarium-control",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
