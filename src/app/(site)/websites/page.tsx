import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChooseDesignLink, ChosenDesignNote } from "@/components/concepts/choose-design";
import { ConceptPreview } from "@/components/concepts/concept-preview";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { concepts, type Concept } from "@/content/concepts";
import { offerings, pricingExclusions } from "@/content/pricing";

export const metadata: Metadata = {
  title: "Website collection",
  description:
    "A small, curated collection of website designs. Open each one full screen, then choose the one to make your own.",
};

const website = offerings[0];

/**
 * The collection, laid out like a printed catalogue: a contents list, then
 * one plate per design with its specification beside it.
 */
export default function WebsitesPage() {
  return (
    <>
      <Intro />
      <Container as="div" className="pb-section">
        <ol className="space-y-28 md:space-y-40">
          {concepts.map((concept) => (
            <li key={concept.slug}>
              <Plate concept={concept} />
            </li>
          ))}
        </ol>
      </Container>
      <Closing />
    </>
  );
}

/* Intro and contents ------------------------------------------------------ */

function Intro() {
  return (
    <Container as="section" aria-labelledby="collection-title" className="pt-10 pb-20 md:pt-16 md:pb-28">
      <div className="type-label flex justify-between gap-6 text-fg-muted">
        <p>Website collection</p>
        <p>
          {concepts.length} designs <span className="hidden sm:inline">· {website.price} CAD</span>
        </p>
      </div>

      <h1 id="collection-title" className="type-display mt-14 text-display-xl md:mt-20">
        Find your <span className="text-accent italic">website.</span>
      </h1>

      <div className="mt-12 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-x-gutter">
        <div className="md:col-span-5">
          <p className="max-w-[34ch] text-lede">
            A small collection, each design drawn for a different kind of business. Open any of
            them full screen, then choose the one to make your own.
          </p>
          <p className="type-label mt-8 border-l-2 border-accent pl-3 text-fg">
            Demonstration concepts for fictional businesses. Not client work.
          </p>
        </div>

        <nav aria-label="Designs in the collection" className="md:col-span-6 md:col-start-7">
          <ol className="border-t hairline">
            {concepts.map((concept) => (
              <li key={concept.slug} className="border-b hairline">
                <a
                  href={`#${concept.slug}`}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-4 md:py-5"
                >
                  <span className="type-label text-fg-muted group-hover:text-accent">{concept.index}</span>
                  <span>
                    <span className="type-display text-heading transition-colors group-hover:text-accent">
                      {concept.title}
                    </span>
                    <span className="mt-1 block text-small text-fg-muted">
                      For {concept.suits.slice(0, 2).join(" and ").toLowerCase()}
                    </span>
                  </span>
                  <Swatches concept={concept} />
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </Container>
  );
}

/** The design's three identity colours, as small printed chips. */
function Swatches({ concept, large = false }: { concept: Concept; large?: boolean }) {
  const { bg, fg, accent } = concept.palette;
  return (
    <span aria-hidden="true" className="flex self-center">
      {[bg, fg, accent].map((colour) => (
        <span
          key={colour}
          className={`${large ? "size-7" : "size-4"} ring-1 ring-line not-first:-ml-px`}
          style={{ backgroundColor: colour }}
        />
      ))}
    </span>
  );
}

/* One plate per design ---------------------------------------------------- */

function Plate({ concept }: { concept: Concept }) {
  const titleId = `${concept.slug}-title`;
  return (
    <article id={concept.slug} aria-labelledby={titleId}>
      <header className="grid items-end gap-y-4 border-t hairline pt-6 md:grid-cols-[auto_1fr] md:gap-x-8 lg:grid-cols-12 lg:gap-x-gutter">
        <p
          aria-hidden="true"
          className="type-display text-display-lg leading-none text-accent lg:col-span-2"
        >
          {concept.index}
        </p>
        <h2 id={titleId} className="type-display text-display-lg lg:col-span-7">
          {concept.title}
        </h2>
        <p className="type-label text-fg-muted md:col-span-2 lg:col-span-3 lg:pb-2 lg:text-right">
          Demonstration concept
          <span className="mt-1 block text-fg">{concept.demoName}, a fictional business</span>
        </p>
      </header>

      <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:gap-x-gutter">
        <figure className="lg:col-span-8">
          <a
            href={concept.demoHref ?? `/websites/${concept.slug}`}
            className="group/preview relative block overflow-hidden ring-1 ring-line"
          >
            <span className="sr-only">Open the full demo of {concept.demoName}</span>
            <span className="block transition-transform duration-1000 ease-out-expo group-hover/preview:scale-[1.015]">
              <ConceptPreview concept={concept} />
            </span>
            <span
              aria-hidden="true"
              className="type-label absolute right-3 bottom-3 bg-ink/85 px-3 py-2 text-paper opacity-0 transition-opacity duration-300 group-hover/preview:opacity-100 group-focus-visible/preview:opacity-100"
            >
              Open full screen →
            </span>
          </a>
          <figcaption className="type-label mt-3 flex justify-between gap-4 text-fg-muted">
            <span>Homepage preview</span>
            <span>{concept.typefaces}</span>
          </figcaption>
        </figure>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="type-display text-heading italic">{concept.direction}</p>

            <dl className="mt-8 border-t hairline text-small">
              <SpecRow label="Made for">{concept.suits.join(", ")}</SpecRow>
              <SpecRow label="In the demo">
                <ul>
                  {concept.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </SpecRow>
              <SpecRow label="Palette">
                <span className="flex items-center gap-3">
                  <Swatches concept={concept} large />
                  <span className="text-fg-muted tabular-nums uppercase">
                    {concept.palette.accent}
                  </span>
                </span>
              </SpecRow>
              <SpecRow label="Price">
                {website.price} <span className="text-fg-muted">{website.priceNote}</span>
              </SpecRow>
            </dl>

            <div className="mt-8 flex flex-col gap-3">
              <ChosenDesignNote concept={concept} />
              <ChooseDesignLink concept={concept} className="justify-between" />
              {concept.demoHref ? (
                <ButtonLink href={concept.demoHref} variant="secondary" className="justify-between">
                  Open the full demo<span className="sr-only">: {concept.demoName}</span>
                </ButtonLink>
              ) : null}
            </div>
            <Link
              href={`/websites/${concept.slug}`}
              className="mt-5 inline-block text-small text-fg-muted underline decoration-1 underline-offset-4 hover:text-fg"
            >
              About this concept<span className="sr-only">: {concept.title}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-x-4 border-b hairline py-3">
      <dt className="type-label pt-0.5 text-fg-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/* Closing ----------------------------------------------------------------- */

function Closing() {
  return (
    <section aria-labelledby="collection-next-title" className="pb-section">
      <Container>
        <div className="border-t hairline pt-section">
          <SectionLabel>After you choose</SectionLabel>
          <h2 id="collection-next-title" className="type-display mt-6 max-w-[18ch] text-display-lg">
            A starting point, <span className="italic">not a template.</span>
          </h2>

          <div className="mt-16 grid border-t hairline md:mt-24 md:grid-cols-2">
            <div className="pt-8 pb-12 md:border-r md:pr-gutter md:pb-4 hairline">
              <p className="type-label text-accent">Made yours</p>
              <h3 className="type-display mt-4 text-heading">Customised to your business</h3>
              <p className="mt-4 max-w-[44ch] text-fg-muted">
                Your name, words, images and colours, set into the design with care. Choosing a
                design commits you to nothing: you receive a written scope and price first.
              </p>
              <ul className="mt-8">
                {website.items.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-3 border-b hairline py-3">
                    <span aria-hidden="true" className="text-fg-muted">
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-6 inline-block text-small font-medium underline decoration-1 underline-offset-4 hover:text-accent"
              >
                Everything included, and what isn’t
              </Link>
            </div>

            <div className="border-t pt-8 hairline md:border-t-0 md:pl-gutter">
              <p className="type-label text-accent">Built to do more</p>
              <h3 className="type-display mt-4 text-heading">Need it to do something more?</h3>
              <p className="mt-4 max-w-[44ch] text-fg-muted">
                Any design can take bookings, payments, customer accounts or something entirely your
                own. Custom work is scoped and priced separately.
              </p>
              <p className="mt-8 text-small text-fg-muted">{pricingExclusions}</p>
              <ButtonLink href="/custom" variant="secondary" className="mt-8">
                Explore custom development
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
