import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader, Schibsted_Grotesk } from "next/font/google";
import { elementBootScript } from "@/components/brand/elements/rotation";
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
 * Runs before first paint. Marks that JavaScript is on (the contact form
 * then shows one step at a time), picks this visit's element (rotation.ts)
 * into data-element, and, if the element is likely to run, hides the h1's
 * glyphs now (data-stage="pending") so the word doesn't flash before it
 * appears. The stage sets "on" or "off" once it knows; CSS reveals the text
 * after a few seconds if neither happens.
 */
const bootFlags = `try{var d=document.documentElement;d.dataset.js="";try{d.dataset.element=${elementBootScript()}}catch(e){d.dataset.element="water"}if("WebGL2RenderingContext"in window&&!matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.stage="pending"}catch(e){}`;

export const viewport: Viewport = {
  themeColor: "#181816",
  // The tank fills the screen; on Android the keyboard shrinks it instead of covering the form.
  interactiveWidget: "resizes-content",
  viewportFit: "cover",
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
        <script dangerouslySetInnerHTML={{ __html: bootFlags }} />
      </head>
      <body>
        <a
          href="#contact-message"
          className="type-label sr-only z-50 bg-accent px-4 py-3 text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to the contact form
        </a>
        <main>{children}</main>
      </body>
    </html>
  );
}
