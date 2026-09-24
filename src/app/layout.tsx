import type { Metadata, Viewport } from "next";
import { grotesk, serif } from "./fonts";
import { SITE_LINE, SITE_NAME } from "@/lib/routes";
import { MotionProvider } from "@/components/MotionProvider";
import { PillNav } from "@/components/nav/PillNav";
import { Floor } from "@/components/Floor";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: `${SITE_LINE}.`,
};

export const viewport: Viewport = {
  themeColor: "#16161d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${grotesk.variable} ${serif.variable}`}>
      <body className="relative min-h-dvh bg-bg font-sans text-text-1">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Floor />
        <MotionProvider>
          <header>
            <PillNav />
          </header>
          <div className="relative z-10">{children}</div>
        </MotionProvider>
      </body>
    </html>
  );
}
