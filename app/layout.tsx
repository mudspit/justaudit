import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Just Audit — SEO, AEO & GEO Website Auditor",
  description: "Free website audit tool covering SEO, Answer Engine Optimization (AEO), and Generative Engine Optimization (GEO) with downloadable PDF and Excel reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ background: '#ffffff' }}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
