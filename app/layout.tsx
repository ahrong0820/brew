import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "핸드드립 레시피 노트",
  description: "핸드드립 커피 레시피와 브루잉 타이머를 정리하는 웹페이지입니다.",
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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
