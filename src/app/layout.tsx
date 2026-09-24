import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/Shell";
import { NAME, PROJECTS, ROLE, SITE_URL, TAGLINE } from "@/content/site";
import { COLOR } from "@/lib/color";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${NAME} - ${ROLE}`, template: `%s - ${NAME}` },
  description: TAGLINE,
};

export const viewport: Viewport = {
  themeColor: COLOR.bg,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Person", name: NAME, jobTitle: ROLE, url: SITE_URL },
    ...PROJECTS.map((p) => ({
      "@type": "CreativeWork",
      name: p.title,
      url: `${SITE_URL}/projects/${p.slug}`,
      author: { "@type": "Person", name: NAME },
    })),
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" style={{ "--vv-bottom-inset": "0px" } as React.CSSProperties}>
      <head>
        <link rel="preload" href="/fonts/grotesk-500.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/serif.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="bg-eigengrau">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <noscript>
          <style>{`nav[data-navbar]{visibility:visible}`}</style>
        </noscript>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
