import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { offerings } from "@/content/pricing";
import { inWriting, processPaths, processSteps } from "@/content/process";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Choose a design or describe your idea, receive a clear scope and price, and launch. Five steps, completed online, without unnecessary meetings.",
};

const [website, custom] = offerings;

const paths = [
  {
    id: "design",
    label: "Start from a design",
    title: "Choose a website",
    summary:
      "Pick a design from the collection and have it customised for your business, up to five pages.",
    price: `${website.price} ${website.priceNote}`,
    href: "/websites",
    cta: "Browse the collection",
  },
  {
    id: "custom",
    label: "Start from an idea",
    title: "Describe custom work",
    summary:
      "Bookings, payments, portals, automations or something nobody’s built before, scoped from your written brief.",
    price: `${custom.price}, ${custom.priceNote.toLowerCase()}`,
    href: "/custom",
    cta: "Explore custom development",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <Intro />
      <Steps />
      <InWriting />
      <Begin />
    </>
  );
}

/* Intro and the two paths ------------------------------------------------- */

function Intro() {
  return (
    <Container as="section" aria-labelledby="how-title" className="pt-10 pb-20 md:pt-16 md:pb-28">
      <div className="type-label flex justify-between gap-6 text-fg-muted">
        <p>How it works</p>
        <p>Five steps, online</p>
      </div>
      <h1 id="how-title" className="type-display mt-14 text-display-xl md:mt-20">
        Designed to be done <span className="text-accent italic">online.</span>
      </h1>
      <p className="mt-12 max-w-[38ch] text-lede md:mt-20">
        Choose a design or describe your idea, receive a clear scope and price, and launch. At
        your pace, without unnecessary meetings.
      </p>

      <h2 className="type-label mt-20 text-fg-muted md:mt-28">Two ways to begin</h2>
      <ul className="mt-6 grid border-t hairline md:grid-cols-2">
        {paths.map((path, index) => (
          <li
            key={path.id}
            className={`flex flex-col pt-8 pb-12 md:pb-2 ${
              index === 0 ? "md:border-r md:pr-gutter hairline" : "border-t hairline md:border-t-0 md:pl-gutter"
            }`}
          >
            <p className="type-label text-accent">{path.label}</p>
            <h3 className="type-display mt-4 text-display-md">{path.title}</h3>
            <p className="mt-4 max-w-[40ch] flex-1 text-fg-muted">{path.summary}</p>
            <p className="mt-6 border-t hairline pt-4 text-small">{path.price}</p>
            <ButtonLink
              href={path.href}
              variant={index === 0 ? "primary" : "secondary"}
              className="mt-8 self-start"
            >
              {path.cta}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </Container>
  );
}

/* The five steps in depth ------------------------------------------------- */

function Steps() {
  return (
    <section aria-labelledby="steps-title" className="theme-paper py-section">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-7">
            <SectionLabel index="01">The five steps</SectionLabel>
            <h2 id="steps-title" className="type-display mt-6 text-display-lg">
              Step by step, <span className="italic">both ways.</span>
            </h2>
          </div>
          <p className="text-lede text-fg-muted md:col-span-4 md:col-start-9 md:self-end">
            The same five steps, whether you start from a design or from custom work. Here is
            what each looks like on either path.
          </p>
        </div>

        {/* Column heads, shown where the paths sit side by side */}
        <div
          aria-hidden="true"
          className="type-label mt-16 hidden grid-cols-12 gap-x-gutter text-fg-muted md:mt-24 lg:grid"
        >
          <span className="col-span-5">Step</span>
          <span className="col-span-3 col-start-7">Starting from a design</span>
          <span className="col-span-3 col-start-10">Custom work</span>
        </div>

        <ol className="mt-12 border-t hairline md:mt-16 lg:mt-4">
          {processSteps.map((step, index) => {
            const path = processPaths[index];
            return (
              <li
                key={step.title}
                className="reveal grid gap-8 border-b hairline py-10 md:py-14 lg:grid-cols-12 lg:gap-x-gutter"
              >
                <div className="grid grid-cols-[4rem_1fr] gap-x-4 md:grid-cols-[6rem_1fr] lg:col-span-5">
                  <span aria-hidden="true" className="type-display text-display-lg leading-none text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="type-display text-heading">
                      <span className="sr-only">Step {index + 1}: </span>
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-[36ch] text-fg-muted">{step.detail}</p>
                  </div>
                </div>
                <dl className="grid gap-6 sm:grid-cols-2 sm:gap-x-gutter lg:col-span-6 lg:col-start-7">
                  <div className="border-l-2 border-accent pl-4">
                    <dt className="type-label text-fg-muted lg:sr-only">Starting from a design</dt>
                    <dd className="mt-2 text-small lg:mt-0">{path.design}</dd>
                  </div>
                  <div className="border-l-2 border-fg/25 pl-4">
                    <dt className="type-label text-fg-muted lg:sr-only">Custom work</dt>
                    <dd className="mt-2 text-small lg:mt-0">{path.custom}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

/* Everything in writing --------------------------------------------------- */

function InWriting() {
  return (
    <section aria-labelledby="writing-title" className="py-section">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-8">
            <SectionLabel index="02">Without meetings</SectionLabel>
            <h2 id="writing-title" className="type-display mt-6 text-display-lg">
              No calls required. <span className="italic text-accent">Everything in writing.</span>
            </h2>
          </div>
          <p className="text-lede text-fg-muted md:col-span-4 md:self-end">
            You never need to book a call or attend a meeting. Every decision is written down, so
            nothing depends on memory.
          </p>
        </div>

        <ol className="mt-16 grid border-t hairline sm:grid-cols-2 md:mt-24 lg:grid-cols-4">
          {inWriting.map((item, index) => (
            <li
              key={item.title}
              className={`border-b hairline py-8 sm:pr-gutter lg:border-b-0 ${
                index > 0 ? "lg:border-l lg:pl-gutter" : ""
              } ${index % 2 === 1 ? "sm:border-l sm:pl-gutter lg:pl-gutter" : ""}`}
            >
              <span className="type-label text-accent">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="type-display mt-6 text-heading">{item.title}</h3>
              <p className="mt-3 text-fg-muted">{item.detail}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* Begin ------------------------------------------------------------------- */

function Begin() {
  return (
    <section aria-labelledby="how-begin-title" className="pb-section">
      <Container>
        <div className="border-t hairline pt-section">
          <h2 id="how-begin-title" className="type-display max-w-[14ch] text-display-xl">
            Begin <span className="italic text-accent">whenever</span> you’re ready.
          </h2>
          <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-x-gutter">
            <p className="max-w-[44ch] text-lede text-fg-muted lg:col-span-6">
              Your brief saves as you go, so you can start now and finish later. Still have
              questions?{" "}
              <Link href="/faq" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
                Read the FAQ
              </Link>
              .
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:justify-end">
              <ButtonLink href="/websites">Find your website</ButtonLink>
              <ButtonLink href="/start" variant="secondary">
                Describe your idea
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
