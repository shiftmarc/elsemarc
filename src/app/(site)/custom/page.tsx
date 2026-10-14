import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BriefSummary, BriefToggle } from "@/components/custom/brief-controls";
import { CapabilitySpecimen } from "@/components/home/capability-specimen";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { buildKinds, priceFactors } from "@/content/capabilities";
import { pricingExclusions } from "@/content/pricing";

export const metadata: Metadata = {
  title: "Custom development",
  description:
    "Booking engines, payment systems, customer portals, dashboards, automations, integrations and custom web applications. Scoped from a written brief and priced individually.",
};

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

export default function CustomDevelopmentPage() {
  return (
    <>
      <Hero />
      <WhatCanBeBuilt />
      <ScopeAndPrice />
      <Begin />
    </>
  );
}

/* Hero -------------------------------------------------------------------- */

function Hero() {
  return (
    <Container as="section" aria-labelledby="custom-title" className="pt-10 pb-20 md:pt-16 md:pb-28">
      <div className="type-label flex justify-between gap-6 text-fg-muted">
        <p className="animate-rise">Custom development</p>
        <p className="animate-rise text-right" style={delay(120)}>
          Built to do more
        </p>
      </div>

      <h1 id="custom-title" className="type-display mt-14 text-display-xl md:mt-20">
        <span className="animate-rise block" style={delay(80)}>
          What if your website
        </span>
        <span className="animate-rise block" style={delay(200)}>
          could do <span className="text-accent italic">more?</span>
        </span>
      </h1>

      <div className="mt-12 grid gap-10 md:mt-20 lg:grid-cols-12 lg:items-end lg:gap-x-gutter">
        <p className="animate-rise max-w-[32ch] text-lede lg:col-span-5" style={delay(360)}>
          Reservations. Payments. Appointments. Customer portals. Automations. Or something
          nobody’s built before.
        </p>
        <div
          className="animate-rise flex flex-col gap-3 sm:flex-row lg:col-span-7 lg:justify-end"
          style={delay(480)}
        >
          <ButtonLink href="/start">Describe your project</ButtonLink>
          <ButtonLink href="#pricing" variant="secondary">
            How it’s priced
          </ButtonLink>
        </div>
      </div>

      {/* A running index of the kinds of work, like a table of contents */}
      <nav aria-label="Kinds of custom work" className="mt-20 border-t hairline pt-5 md:mt-28">
        <ol className="flex flex-wrap gap-x-6 gap-y-3 text-small">
          {buildKinds.map((kind, index) => (
            <li key={kind.id}>
              <a href={`#${kind.id}`} className="group inline-flex items-baseline gap-2">
                <span className="type-label text-fg-muted group-hover:text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="underline decoration-line decoration-1 underline-offset-4 transition-colors group-hover:text-accent group-hover:decoration-current">
                  {kind.title}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </Container>
  );
}

/* What can be built ------------------------------------------------------- */

function WhatCanBeBuilt() {
  return (
    <section aria-labelledby="build-title" className="theme-paper py-section">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-7">
            <SectionLabel index="01">What can be built</SectionLabel>
            <h2 id="build-title" className="type-display mt-6 text-display-lg">
              Seven kinds of work, <span className="italic">and everything between.</span>
            </h2>
          </div>
          <p className="text-lede text-fg-muted md:col-span-4 md:col-start-9 md:self-end">
            Most projects combine a few of these. Add the ones that sound close to your brief;
            you can describe the details later.
          </p>
        </div>

        <ol className="mt-16 border-t hairline md:mt-24">
          {buildKinds.map((kind, index) => (
            <li
              key={kind.id}
              id={kind.id}
              className="reveal grid gap-10 border-b hairline py-12 md:py-16 lg:grid-cols-12 lg:gap-x-gutter"
            >
              <div className="flex flex-col lg:col-span-6">
                <p className="type-label text-accent">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="type-display mt-4 text-display-md">{kind.title}</h3>
                <p className="mt-6 max-w-[46ch] text-lede text-fg-muted">{kind.description}</p>

                <p className="type-label mt-10 text-fg-muted">Often includes</p>
                <ul className="mt-3 grid max-w-[34rem] sm:grid-cols-2 sm:gap-x-gutter">
                  {kind.pieces.map((piece) => (
                    <li key={piece} className="flex gap-3 border-b hairline py-2.5">
                      <span aria-hidden="true" className="text-fg-muted">
                        —
                      </span>
                      {piece}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 lg:mt-auto lg:pt-10">
                  <BriefToggle functionId={kind.functionId} title={kind.title} />
                </div>
              </div>

              <div aria-hidden="true" className="lg:col-span-5 lg:col-start-8">
                <CapabilitySpecimen id={kind.specimen} />
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 md:mt-16">
          <BriefSummary />
        </div>
      </Container>
    </section>
  );
}

/* Scoping and pricing ----------------------------------------------------- */

const scopeSteps = [
  {
    title: "You write a brief",
    detail:
      "Online, in your own words and at your own pace. What it should do, who will use it, the software you already have, a budget range and a timeline.",
  },
  {
    title: "We ask, in writing",
    detail:
      "If anything is unclear, the questions arrive by email. You answer when it suits you. No call or meeting is needed.",
  },
  {
    title: "You receive a scope and price",
    detail:
      "A written scope: what will be built, what will not, the price and the timeline. Nothing starts until you approve it.",
  },
  {
    title: "It is built in stages",
    detail:
      "Work proceeds in the agreed stages, each ending with something you can try and review before the next begins.",
  },
] as const;

function ScopeAndPrice() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="py-section">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-7">
            <SectionLabel index="02">Scope and price</SectionLabel>
            <h2 id="pricing-title" className="type-display mt-6 text-display-lg">
              Priced individually. <span className="italic text-accent">Agreed in writing.</span>
            </h2>
          </div>
          <p className="text-lede text-fg-muted md:col-span-4 md:col-start-9 md:self-end">
            Custom work has no list price, because no two projects are alike. Every one starts
            from a written brief and ends in a written scope.
          </p>
        </div>

        <ol className="mt-16 grid gap-px md:mt-24 md:grid-cols-4 md:gap-x-gutter">
          {scopeSteps.map((step, index) => (
            <li
              key={step.title}
              className="reveal grid grid-cols-[3.5rem_1fr] gap-x-4 border-t hairline py-6 md:block md:pt-6 md:pb-0"
            >
              <span aria-hidden="true" className="type-display text-display-md leading-none text-accent">
                {index + 1}
              </span>
              <div className="md:mt-10">
                <h3 className="text-lede font-medium">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-3 text-small text-fg-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-20 grid gap-12 border-t hairline pt-10 md:mt-28 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-6">
            <h3 className="type-label text-fg-muted">What shapes the price</h3>
            <ul className="mt-6">
              {priceFactors.map((factor, index) => (
                <li key={factor} className="grid grid-cols-[2.5rem_1fr] border-b hairline py-3.5">
                  <span aria-hidden="true" className="type-label pt-1 text-fg-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <h3 className="type-label text-fg-muted">Good to know</h3>
            <p className="type-display mt-6 text-heading">
              Asking for a scope and price commits you to nothing.
            </p>
            <p className="mt-6 text-fg-muted">
              Custom features are priced separately from a website. Fees charged by other services
              your project relies on, such as payment processing or a booking provider, are paid
              to those services directly.
            </p>
            <p className="mt-4 text-small text-fg-muted">{pricingExclusions}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* The way in -------------------------------------------------------------- */

function Begin() {
  return (
    <section aria-labelledby="begin-title" className="pb-section">
      <Container>
        <div className="border-t hairline pt-section">
          <h2 id="begin-title" className="type-display reveal max-w-[16ch] text-display-xl">
            Start with a <span className="italic text-accent">sentence.</span>
          </h2>
          <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-x-gutter">
            <p className="max-w-[44ch] text-lede text-fg-muted lg:col-span-6">
              The custom brief asks what you want built, who will use it, the software it should
              work with, your budget range and your timeline. Your progress is saved as you go.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:justify-end">
              <ButtonLink href="/start">Start your custom brief</ButtonLink>
              <ButtonLink href="/websites" variant="secondary">
                Start from a design instead
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
