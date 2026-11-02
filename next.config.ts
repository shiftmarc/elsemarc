import type { NextConfig } from "next";

/** Pages of the full site (tagged v1-full-site) that now live on the single page. */
const retired = ["/websites", "/websites/:slug", "/demo/:path*", "/custom", "/pricing", "/how-it-works", "/faq", "/start"];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return retired.map((source) => ({ source, destination: "/", permanent: true }));
  },
};

export default nextConfig;
