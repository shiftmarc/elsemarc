import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader, Schibsted_Grotesk } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const sans = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  alternates: { canonical: "/" },
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

/**
 * Runs before first paint: if the water wordmark is likely to run, hide the
 * h1's glyphs now so the word doesn't flash before the water pours in.
 * The wordmark sets "on" or "off" once it knows; CSS reveals the text
 * after a few seconds if neither happens.
 */
const waterFlag = `try{if("WebGL2RenderingContext"in window&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.water="pending"}catch(e){}`;

export const viewport: Viewport = {
  themeColor: "#181816",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-CA"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable} theme-ink antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: waterFlag }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contact"
          className="type-label sr-only z-50 bg-accent px-4 py-3 text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to the contact form
        </a>
        <main className="flex-1">{children}</main>
        <footer className="px-gutter py-8 text-center">
          <a href={`mailto:${siteConfig.email}`} className="type-label text-fg-muted transition-colors hover:text-fg">
            {siteConfig.email}
          </a>
        </footer>
      </body>
    </html>
  );
}
