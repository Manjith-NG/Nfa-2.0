import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { APP_NAME, APP_FULL_NAME, UNIVERSITY_NAME } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: `${APP_NAME} | ${UNIVERSITY_NAME}`,
  description: `${APP_FULL_NAME} — enterprise approval management`,
  icons: {
    icon: [{ url: "/gcu-logo.png", type: "image/png" }],
    apple: "/gcu-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
