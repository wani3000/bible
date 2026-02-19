import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KorRV 성경 앱",
  description:
    "개역한글(KorRV) 기반 성경 읽기, 일독표, 그룹 읽기 기능을 제공하는 앱입니다.",
  keywords:
    "성경 앱, KorRV, 개역한글, 성경읽기, 성경일독표, 그룹 성경읽기",
  authors: [{ name: "KorRV Bible Team" }],
  creator: "KorRV Bible Team",
  publisher: "KorRV Bible Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://bible.local"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "KorRV 성경 앱",
    description:
      "개역한글(KorRV) 기반 성경 읽기, 일독표, 그룹 읽기 기능을 제공하는 앱입니다.",
    url: "https://bible.local",
    siteName: "KorRV Bible",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "KorRV 성경 앱",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KorRV 성경 앱",
    description:
      "개역한글(KorRV) 기반 성경 읽기, 일독표, 그룹 읽기 기능을 제공하는 앱입니다.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className="font-pretendard">{children}</body>
    </html>
  );
}
