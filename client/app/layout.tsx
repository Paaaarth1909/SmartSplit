import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartSplit",
  description: "Shared expenses made simple."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
