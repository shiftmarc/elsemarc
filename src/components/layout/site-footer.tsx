import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/ui/container";
import { primaryNav, siteConfig, startProjectHref } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="theme-paper">
      <Container className="pt-20 pb-8 md:pt-28">
        <div className="grid gap-12 md:grid-cols-12">
          <p className="type-display text-heading md:col-span-6">{siteConfig.tagline}</p>

          <nav aria-label="Footer" className="md:col-span-3 md:col-start-8">
            <p className="type-label text-fg-muted">Explore</p>
            <ul className="mt-4 space-y-2">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <p className="type-label text-fg-muted">Begin</p>
            <Link
              href={startProjectHref}
              className="mt-4 inline-block underline decoration-1 underline-offset-4 hover:text-accent"
            >
              Start a project
            </Link>
          </div>
        </div>

        <div className="mt-24 overflow-hidden border-t hairline pt-6 md:mt-32">
          <Wordmark size="display" className="-ml-[0.04em] block" />
        </div>

        <div className="type-label mt-6 flex flex-col gap-2 text-fg-muted sm:flex-row sm:justify-between">
          <p>Independent web design &amp; development</p>
          <p>Prices in Canadian dollars</p>
        </div>
      </Container>
    </footer>
  );
}
