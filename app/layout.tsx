import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "정선 FC: 90분의 백룸";
  const description = "축구공과 함께 정선의 끝없는 백룸을 탈출하는 호러 어드벤처";
  const socialImage = `${origin}/og.png`;

  return {
    title,
    description,
    icons: { icon: "/assets/characters/hero-game.png", shortcut: "/assets/characters/hero-game.png" },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: socialImage, width: 1672, height: 941, alt: "정선 FC: 90분의 백룸 게임 대표 이미지" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
