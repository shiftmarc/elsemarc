import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { Concept } from "@/content/concepts";

/**
 * The slim elsemarc strip pinned above every full-screen demo. It stays in
 * elsemarc's own voice so it never reads as part of the fictional business,
 * and it is the only way the demo links back to the studio.
 */
export function DemoBar({ concept }: { concept: Concept }) {
  return (
    <aside
      aria-label={`${siteConfig.name} demonstration`}
      className="theme-ink sticky top-0 z-50 border-b hairline font-sans"
    >
      <div className="flex h-11 items-center gap-3 px-4 md:px-6">
        <Link
          href="/"
          className="type-display shrink-0 text-[1.25rem] leading-none tracking-[-0.03em]"
          aria-label={`${siteConfig.name}, home`}
        >
          {siteConfig.name}
          <span aria-hidden="true" className="text-accent">
            .
          </span>
        </Link>

        <p className="type-label min-w-0 truncate text-fg-muted">
          <span className="text-fg sm:hidden">Demo concept</span>
          <span className="hidden text-fg sm:inline">Demonstration concept</span>
          <span className="hidden lg:inline">
            {" "}
            · {concept.demoName} is a fictional business
          </span>
        </p>

        <nav aria-label="Demonstration" className="ml-auto flex shrink-0 items-center gap-1">
          <Link
            href={`/websites/${concept.slug}`}
            className="inline-flex h-8 items-center px-2 text-small text-fg-muted transition-colors hover:text-fg sm:px-3"
          >
            <span aria-hidden="true" className="mr-1.5">
              ←
            </span>
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to {siteConfig.name}</span>
          </Link>
          <Link
            href={`/start?design=${concept.slug}`}
            className="inline-flex h-8 items-center bg-accent px-3 text-small font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface"
          >
            <span className="sm:hidden">Choose</span>
            <span className="hidden sm:inline">Choose this design</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
