/**
 * Site-wide identity. The business name is temporary: change `name` here and
 * the wordmark, metadata and footer all follow.
 */
export const siteConfig = {
  name: "elsemarc",
  tagline: "Websites that do something else.",
  description: "An independent studio making websites that do something else.",
  email: "hello@elsemarc.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://elsemarc.com",
  locale: "en_CA",
} as const;
