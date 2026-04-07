import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "師匠マッチング | 研修制度50周年記念",
  description: "OB と初期研修医の双方向マッチング（記名式アンケート）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${noto.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
