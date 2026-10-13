import Link from "next/link";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { concepts } from "@/content/concepts";
import { conceptNameClass } from "@/components/concepts/concept-preview";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/**
 * The hero is set on a visible layout grid with printer's crop marks: the
 * construction lines of a page, left showing. Below it, the four concept
 * identities as swatches, a first glimpse of the range.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <LayoutGrid />

      <Container className="relative pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="type-label flex justify-between gap-6 text-fg-muted">
          <p className="animate-rise" style={delay(200)}>
            Beautiful websites.
          </p>
          <p className="animate-rise text-right" style={delay(320)}>
            Limitless possibilities.
          </p>
        </div>

        <div className="relative mt-14 md:mt-24 lg:mt-28">
          <CropMarks />
          <h1 id="hero-title" className="type-display text-display-xl">
            <span className="animate-rise block" style={delay(100)}>
              A beautiful website is just the
            </span>
            <span className="animate-rise block text-accent italic" style={delay(260)}>
              beginning.
            </span>
          </h1>
        </div>

        <div className="mt-12 grid gap-10 md:mt-20 md:grid-cols-12 md:items-end md:gap-x-gutter">
          <p
            className="animate-rise max-w-[30ch] text-lede md:col-span-6 lg:col-span-5"
            style={delay(480)}
          >
            We design exceptional websites. Then we make them do whatever your business needs.
          </p>
          <div
            className="animate-rise flex flex-col gap-3 sm:flex-row md:col-span-6 md:justify-end lg:col-span-7"
            style={delay(600)}
          >
            <ButtonLink href="/#websites">Explore websites</ButtonLink>
            <ButtonLink href="/#imagine" variant="secondary">
              Imagine what’s possible
            </ButtonLink>
          </div>
        </div>
      </Container>

      <ConceptSwatches />
    </section>
  );
}

/** Column guides: 4 on small screens, 12 from md. Decorative only. */
function LayoutGrid() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="mx-auto grid h-full max-w-site grid-cols-4 gap-x-gutter px-gutter md:grid-cols-12">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className={`animate-draw-y relative border-x border-fg/[0.045] ${index >= 4 ? "hidden md:block" : ""}`}
            style={delay(index * 45)}
          >
            <span className="type-label absolute top-3 left-2 text-[0.625rem] text-fg/25">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Printer's crop marks at the corners of the headline block. */
function CropMarks() {
  const mark = "absolute size-4 border-fg-muted/60 md:size-6";
  return (
    <div aria-hidden="true" className="animate-rise pointer-events-none absolute -inset-3 md:-inset-5" style={delay(700)}>
      <span className={`${mark} top-0 left-0 border-t border-l`} />
      <span className={`${mark} top-0 right-0 border-t border-r`} />
      <span className={`${mark} bottom-0 left-0 border-b border-l`} />
      <span className={`${mark} right-0 bottom-0 border-r border-b`} />
    </div>
  );
}

/** The four identities in miniature, linking down to the full previews. */
function ConceptSwatches() {
  return (
    <div className="relative border-t hairline">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {concepts.map((concept, index) => (
          <li
            key={concept.slug}
            className="animate-rise"
            style={{
              ...delay(760 + index * 90),
              "--demo-bg": concept.palette.bg,
              "--demo-fg": concept.palette.fg,
              "--demo-accent": concept.palette.accent,
            } as CSSProperties}
          >
            <Link
              href={`/#concept-${concept.slug}`}
              aria-label={`${concept.demoName}: ${concept.title}, demonstration concept`}
              className="group flex h-full min-h-32 flex-col justify-between bg-demo-bg p-4 text-demo-fg md:min-h-40 md:p-5"
            >
              <span className="type-label flex justify-between opacity-70">
                <span>{concept.index}</span>
                <span className="hidden lg:inline">{concept.title}</span>
              </span>
              <span>
                <span className={`block text-[1.375rem] leading-none md:text-[1.75rem] ${conceptNameClass[concept.slug]}`}>
                  {concept.demoName}
                </span>
                <span className="mt-3 block h-px w-8 bg-demo-accent transition-[width] duration-500 ease-out-expo group-hover:w-16" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
