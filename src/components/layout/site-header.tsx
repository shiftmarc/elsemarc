import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/ui/container";
import { SiteNav } from "./site-nav";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="theme-ink sticky top-0 z-40 border-b hairline">
      <Container className="flex h-16 items-center justify-between gap-8 md:h-20">
        <Link href="/" aria-label={`${siteConfig.name}, home`} className="shrink-0">
          <Wordmark />
        </Link>
        <SiteNav />
      </Container>
    </header>
  );
}
