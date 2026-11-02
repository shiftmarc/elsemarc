/**
 * Site-wide identity. The business name is temporary: change `name` here and
 * the wordmark, metadata and footer all follow.
 */
export const siteConfig = {
  name: "elsemarc",
  tagline: "Websites no one else has.",
  /** The short line under the wordmark. */
  statement: "We build websites no one else has.",
  description: "elsemarc builds websites no one else has.",
  email: "hello@elsemarc.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://elsemarc.com",
  locale: "en_CA",
} as const;
