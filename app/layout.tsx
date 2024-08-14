import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#008080] min-h-screen p-4`}>
        {children}
      </body>
    </html>
  );
}

const title = "vidummy"
const description = 
    "Generate dummy/placeholder videos for manual testing scenarions with customizable dimensions, colors and formats (mp4, webm) right in your browser." 
const siteUrl = new URL("https://vidummy.vercel.app/")

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  applicationName: title,
  alternates: {
    canonical: "/"
  },
  creator: "Igor Klepacki",
  authors: {
    name: "Igor Klepacki",
    url: "https://neg4n.dev/",
  },
  keywords: [
    "image-generation",
    "video-generation",
    "local-first",
    "next.js",
    "react",
    "vercel",
    "mp4",
    "webm",
    "ffmpeg",
    "wasm",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
     type: "website",
     siteName: title,
     url: siteUrl,
     locale: "en-GB",
     images: "/og.jpg",
     title,
     description,
  },
  twitter: {
    card: "summary_large_image",
    creatorId: "@igorklepacki",
    creator: "Igor Klepacki",
    description,
    title,
    site: siteUrl.toString(),
    images: "/og.jpg"
  },
};

export const viewport: Viewport = {
  themeColor: "#008080",
  colorScheme: "light",
};

export const dynamic = "force-static";
