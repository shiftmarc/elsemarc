/**
 * Site-wide identity and navigation.
 * The business name is temporary: change `name` here and the wordmark,
 * metadata and footer all follow.
 */
export const siteConfig = {
  name: "elsemarc",
  tagline: "Beautiful websites. Limitless possibilities.",
  description:
    "An independent studio designing exceptional websites, then making them do whatever your business needs.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://elsemarc.com",
  locale: "en_CA",
} as const;

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Websites", href: "/websites" },
  { label: "Custom development", href: "/custom" },
  { label: "Pricing", href: "/pricing" },
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
];

export const startProjectHref = "/start";
