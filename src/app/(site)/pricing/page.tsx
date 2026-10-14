import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ToBeConfirmed } from "@/components/ui/to-be-confirmed";
import { buildKinds } from "@/content/capabilities";
import { carePlan, exclusions, offerings, pricingExclusions } from "@/content/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Websites from $999 CAD, with everything included listed. Custom development, individually priced from a written brief. Optional care from $59 CAD a month.",
};

const [website, custom] = offerings;

export default function PricingPage() {
  return (
    <>
      <Intro />
      <Offerings />
      <Care />
      <NotIncluded />
      <Begin />
    </>
  );
}

/* Intro ------------------------------------------------------------------- */

function Intro() {
  return (
    <Container as="section" aria-labelledby="pricing-title" className="pt-10 pb-20 md:pt-16 md:pb-28">
      <div className="type-label flex justify-between gap-6 text-fg-muted">
        <p>Pricing</p>
        <p>All prices in Canadian dollars</p>
      </div>
      <h1 id="pricing-title" className="type-display mt-14 text-display-xl md:mt-20">
        Clear prices, <span className="text-accent italic">in writing.</span>
      </h1>
      <div className="mt-12 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-x-gutter">
        <p className="max-w-[34ch] text-lede md:col-span-6 lg:col-span-5">
          Published prices for websites. Clear, written quotes for everything else. You always
          see the price before you commit.
        </p>
        <nav aria-label="On this page" className="md:col-span-5 md:col-start-8">
          <ol className="border-t hairline text-small">
            {[
              ["#websites", website.title, website.price],
              ["#custom", custom.title, custom.price],
              ["#care", "Website care", `${carePlan.price} / month`],
              ["#not-included", "Not included", "Listed in full"],
            ].map(([href, label, note], index) => (
              <li key={href} className="border-b hairline">
                <a href={href} className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-3 py-3.5">
                  <span className="type-label text-fg-muted group-hover:text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="transition-colors group-hover:text-accent">{label}</span>
                  <span className="text-fg-muted">{note}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </Container>
  );
}

/* The two offerings ------------------------------------------------------- */

function Offerings() {
  return (
    <section aria-label="Offerings" className="theme-paper py-section">
      <Container>
        <div className="grid border-t hairline lg:grid-cols-2">
          {/* 01 — Beautiful by design */}
          <article
            id="websites"
            aria-labelledby="offering-websites"
            className="flex flex-col pt-10 pb-16 lg:border-r lg:pr-gutter lg:pb-6 hairline"
          >
            <p className="type-label text-accent">{website.index}</p>
            <h2 id="offering-websites" className="type-display mt-4 text-display-md">
              {website.title}
            </h2>
            <p className="mt-4 max-w-[40ch] text-fg-muted">
              A design from the collection, customised for your business and built to last.
            </p>
            <p className="type-display mt-12 text-display-lg">{website.price}</p>
            <p className="type-label mt-3 text-fg-muted">{website.priceNote}</p>

            <h3 className="type-label mt-12 text-fg-muted">{website.listLabel}</h3>
            <ul className="mt-3 flex-1">
              {website.items.map((item) => (
                <li key={item} className="flex gap-3 border-b hairline py-3.5">
                  <span aria-hidden="true" className="text-accent">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-small text-fg-muted">
              Not included: custom features, third-party service charges, domain registration,
              extensive additional work and, without the care plan, hosting.{" "}
              <a href="#not-included" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
                What that means
              </a>
            </p>
            <ButtonLink href={website.cta.href} className="mt-10 self-start">
              {website.cta.label}
            </ButtonLink>
          </article>

          {/* 02 — Built to do more */}
          <article
            id="custom"
            aria-labelledby="offering-custom"
            className="flex flex-col border-t pt-10 hairline lg:border-t-0 lg:pl-gutter"
          >
            <p className="type-label text-accent">{custom.index}</p>
            <h2 id="offering-custom" className="type-display mt-4 text-display-md">
              {custom.title}
            </h2>
            <p className="mt-4 max-w-[40ch] text-fg-muted">
              Functionality made for how your business works, added to a website or built on its
              own.
            </p>
            <p className="type-display mt-12 text-display-lg">{custom.price}</p>
            <p className="type-label mt-3 text-fg-muted">{custom.priceNote}</p>

            <h3 className="type-label mt-12 text-fg-muted">{custom.listLabel}</h3>
            <ul className="mt-3 flex-1">
              {custom.items.map((item) => {
                // Examples share their titles with the kinds of work on /custom.
                const kind = buildKinds.find((value) => value.title === item);
                return (
                  <li key={item} className="border-b hairline">
                    {kind ? (
                      <Link
                        href={`/custom#${kind.id}`}
                        className="group flex gap-3 py-3.5 transition-colors hover:text-accent"
                      >
                        <span aria-hidden="true" className="text-fg-muted">
                          —
                        </span>
                        {item}
                        <span
                          aria-hidden="true"
                          className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          →
                        </span>
                      </Link>
                    ) : (
                      <span className="flex gap-3 py-3.5">
                        <span aria-hidden="true" className="text-fg-muted">
                          —
                        </span>
                        {item}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-small text-fg-muted">
              Every custom project starts from a written brief. You receive a written scope with
              what will be built, what will not, the price and the timeline. Nothing starts until
              you approve it.
            </p>
            <ButtonLink href={custom.cta.href} variant="secondary" className="mt-10 self-start">
              {custom.cta.label}
            </ButtonLink>
          </article>
        </div>
      </Container>
    </section>
  );
}

/* Care plan --------------------------------------------------------------- */

function Care() {
  return (
    <section id="care" aria-labelledby="care-title" className="py-section">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-7">
            <SectionLabel index="03">Website care, optional</SectionLabel>
            <h2 id="care-title" className="type-display mt-6 text-display-lg">
              Kept in <span className="italic">good shape.</span>
            </h2>
          </div>
          <div className="md:col-span-4 md:col-start-9 md:self-end">
            <p className="type-display text-display-md">{carePlan.price}</p>
            <p className="type-label mt-3 text-fg-muted">{carePlan.priceNote}</p>
          </div>
        </div>

        <div className="mt-16 grid gap-12 border-t hairline pt-10 md:mt-24 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-7">
            <h3 className="type-label text-fg-muted">Intended to cover</h3>
            <ul className="mt-6 grid gap-px sm:grid-cols-2 sm:gap-x-gutter">
              {carePlan.areas.map((area, index) => (
                <li key={area.title} className="border-t hairline pt-4 pb-6">
                  <span className="type-label text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <p className="mt-3 text-lede font-medium">{area.title}</p>
                  <p className="mt-2 text-small text-fg-muted">{area.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 md:col-span-4 md:col-start-9">
            <p className="text-fg-muted">
              The care plan is optional and separate from the website price. Specific inclusions
              and limits will be finalized and published before launch.
            </p>
            <ToBeConfirmed>
              Specific inclusions, monthly limits, commitment period and cancellation terms.
            </ToBeConfirmed>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* Not included ------------------------------------------------------------ */

function NotIncluded() {
  return (
    <section id="not-included" aria-labelledby="excluded-title" className="theme-paper py-section">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-7">
            <SectionLabel index="04">Not included</SectionLabel>
            <h2 id="excluded-title" className="type-display mt-6 text-display-lg">
              What the price <span className="italic">doesn’t</span> cover.
            </h2>
          </div>
          <p className="text-lede text-fg-muted md:col-span-4 md:col-start-9 md:self-end">
            Said plainly now, so nothing is a surprise later.
          </p>
        </div>

        <dl className="mt-16 border-t hairline md:mt-24">
          {exclusions.map((item, index) => (
            <div
              key={item.title}
              className="grid gap-3 border-b hairline py-8 md:grid-cols-12 md:gap-x-gutter md:py-10"
            >
              <dt className="flex items-baseline gap-4 md:col-span-5">
                <span aria-hidden="true" className="type-label text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="type-display text-heading">{item.title}</span>
              </dt>
              <dd className="max-w-[52ch] text-fg-muted md:col-span-6 md:col-start-7 md:pt-1.5">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 max-w-[60ch] text-small text-fg-muted">{pricingExclusions}</p>
      </Container>
    </section>
  );
}

/* Begin ------------------------------------------------------------------- */

function Begin() {
  return (
    <section aria-labelledby="pricing-begin-title" className="py-section">
      <Container>
        <h2 id="pricing-begin-title" className="type-display max-w-[16ch] text-display-xl">
          See your price <span className="italic text-accent">first.</span>
        </h2>
        <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-x-gutter">
          <p className="max-w-[44ch] text-lede text-fg-muted lg:col-span-6">
            Choose a design or describe your idea. Your written scope and price arrive before
            anything is built.{" "}
            <Link href="/faq#pricing" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
              Pricing questions
            </Link>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:justify-end">
            <ButtonLink href="/websites">Choose a design</ButtonLink>
            <ButtonLink href="/start" variant="secondary">
              Describe your project
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
