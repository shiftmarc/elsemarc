import type { CSSProperties, ReactNode } from "react";
import type { Concept } from "@/content/concepts";
import { BookingFlow, BookingProvider, BookTrigger } from "./booking";
import {
  halden,
  haldenNav,
  nextOpenSlots,
  people,
  principles,
  services,
  steps,
  testimonial,
} from "./content";
import { hanken, sourceSerif } from "./fonts";
import { MobileNav } from "./mobile-nav";

/**
 * Halden Advisory: the full homepage for "The Professional" demonstration
 * concept. A small, independent financial advisory practice. It shares
 * nothing visual with elsemarc or the other demos beyond the demo bar: its
 * own typefaces (Hanken Grotesk, Source Serif 4), a deep harbour palette,
 * ruled tables and a calm 12-column grid, with every road leading to booking.
 */
export function HaldenHomepage({ concept }: { concept: Concept }) {
  const { bg, fg, accent } = concept.palette;
  const style = {
    "--demo-bg": bg,
    "--demo-fg": fg,
    "--demo-accent": accent,
    // A slightly lifted ground for panels, and a deeper one for the footer.
    "--halden-raised": `color-mix(in oklab, ${bg} 90%, ${fg})`,
    "--halden-deep": `color-mix(in oklab, ${bg} 70%, black)`,
    // Focus rings and selection follow the practice, not elsemarc.
    "--accent": accent,
    "--accent-fg": bg,
  } as CSSProperties;

  return (
    <div
      style={style}
      className={`${hanken.variable} ${sourceSerif.variable} relative min-h-dvh bg-demo-bg font-halden-sans text-demo-fg [color-scheme:dark]`}
    >
      <BookingProvider>
        <a
          href="#halden-main"
          className="sr-only z-[60] bg-demo-accent px-4 py-3 text-demo-bg focus:not-sr-only focus:fixed focus:top-14 focus:left-3"
        >
          Skip to content
        </a>
        <Header />
        <main id="halden-main">
          <Hero />
          <Services />
          <Approach />
          <About />
          <Book />
        </main>
        <Footer />
      </BookingProvider>
    </div>
  );
}

/* Layout helpers ---------------------------------------------------------- */

function Frame({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`mx-auto w-full max-w-[82rem] px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>
  );
}

/**
 * The practice's section opener: a numbered label in the left two columns,
 * the heading across the rest. It is what gives the page its ledger rhythm.
 */
function SectionHead({
  id,
  number,
  label,
  children,
  aside,
}: {
  id: string;
  number: string;
  label: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="grid gap-y-5 border-t border-demo-fg/20 pt-6 lg:grid-cols-12 lg:gap-x-8">
      <p className="flex gap-3 text-sm text-demo-fg/65 lg:col-span-3">
        <span className="font-halden-serif text-demo-accent tabular-nums">{number}</span>
        {label}
      </p>
      <h2
        id={id}
        className="max-w-[22ch] text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] leading-[1.05] font-normal tracking-[-0.035em] text-balance lg:col-span-6"
      >
        {children}
      </h2>
      {aside ? (
        <div className="text-demo-fg/75 lg:col-span-3 lg:self-end">{aside}</div>
      ) : null}
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
      →
    </span>
  );
}

const primaryButton =
  "group inline-flex h-13 items-center justify-center gap-3 bg-demo-accent px-7 font-medium text-demo-bg transition-colors hover:bg-demo-fg";

/* Header ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="sticky top-11 z-40 border-b border-demo-fg/12 bg-demo-bg/95">
      <Frame className="flex h-18 items-center gap-8">
        <a href="#top" className="text-lg leading-none tracking-[-0.02em] md:text-xl">
          <span className="font-semibold">{halden.short}</span>{" "}
          <span className="text-demo-fg/60">Advisory</span>
        </a>
        <nav aria-label={halden.name} className="hidden lg:block">
          <ul className="flex gap-8 text-[0.9375rem]">
            {haldenNav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-demo-fg/75 transition-colors hover:text-demo-fg">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-3 md:gap-6">
          <a
            href={halden.phone.href}
            className="hidden text-[0.9375rem] text-demo-fg/75 tabular-nums transition-colors hover:text-demo-fg xl:block"
          >
            {halden.phone.label}
          </a>
          <a
            href="#book"
            className="inline-flex h-11 items-center bg-demo-accent px-4 text-sm font-medium text-demo-bg transition-colors hover:bg-demo-fg sm:px-5"
          >
            <span className="sm:hidden">Book</span>
            <span className="hidden sm:inline">Book a consultation</span>
          </a>
          <MobileNav />
        </div>
      </Frame>
    </header>
  );
}

/* Hero -------------------------------------------------------------------- */

function Hero() {
  const slots = nextOpenSlots(4);
  return (
    <section id="top" aria-labelledby="halden-title" className="relative overflow-hidden">
      {/* A faint ledger of horizontal rules behind the headline */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(4.5rem-1px),color-mix(in_oklab,var(--demo-fg)_5%,transparent)_calc(4.5rem-1px),color-mix(in_oklab,var(--demo-fg)_5%,transparent)_4.5rem)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <Frame className="relative grid gap-y-14 pt-14 pb-16 md:pt-20 lg:grid-cols-12 lg:gap-x-8 lg:pt-28 lg:pb-24">
        <p className="animate-rise flex gap-3 text-sm text-demo-accent lg:col-span-2 lg:pt-4">
          <span className="font-halden-serif italic">Est. in Kingston</span>
        </p>

        <div className="lg:col-span-6">
          <h1
            id="halden-title"
            className="animate-rise text-[clamp(2.75rem,1.4rem+5.4vw,5.5rem)] leading-[1.02] font-normal tracking-[-0.045em] text-balance"
            style={{ "--delay": "100ms" } as CSSProperties}
          >
            Clear financial thinking for independent businesses.
          </h1>
          <p
            className="animate-rise mt-8 max-w-[34rem] text-lg leading-relaxed text-demo-fg/75 md:text-xl"
            style={{ "--delay": "200ms" } as CSSProperties}
          >
            {halden.name} is a small practice that helps owners understand their own numbers,
            plan the year ahead and make decisions with a calm head.
          </p>
          <div
            className="animate-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6"
            style={{ "--delay": "300ms" } as CSSProperties}
          >
            <a href="#book" className={primaryButton}>
              Book a consultation <Arrow />
            </a>
            <a
              href="#services"
              className="inline-flex h-13 items-center justify-center border-b border-demo-fg/30 text-demo-fg/85 transition-colors hover:border-demo-fg hover:text-demo-fg sm:justify-start"
            >
              See services and fees
            </a>
          </div>
        </div>

        {/* Open times, the shortest path to a booking */}
        <aside
          aria-labelledby="halden-open"
          className="animate-rise border border-demo-fg/15 bg-[var(--halden-raised)] lg:col-span-4 lg:self-start"
          style={{ "--delay": "420ms" } as CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-demo-fg/15 px-5 py-4">
            <h2 id="halden-open" className="font-medium">
              Open consultation times
            </h2>
            <span className="text-xs text-demo-fg/55">{halden.timezone}</span>
          </div>
          <ul>
            {slots.map(({ day, time }) => (
              <li key={`${day.id}-${time}`} className="border-b border-demo-fg/10 last:border-b-0">
                <BookTrigger
                  dayId={day.id}
                  time={time}
                  label={`Book ${day.label} ${day.week.toLowerCase()} at ${time}`}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-demo-fg/5"
                >
                  <span className="w-20 text-sm text-demo-fg/60">{day.week}</span>
                  <span className="flex-1">
                    {day.label}, <span className="tabular-nums">{time}</span>
                  </span>
                  <span className="text-demo-accent">
                    <Arrow />
                  </span>
                </BookTrigger>
              </li>
            ))}
          </ul>
          <p className="border-t border-demo-fg/15 px-5 py-4 text-sm text-demo-fg/60">
            The first call is twenty minutes and free of charge. Sample times for the demonstration.
          </p>
        </aside>
      </Frame>

      <Frame className="relative">
        <ul className="grid border-t border-demo-fg/20 text-[0.9375rem] sm:grid-cols-3">
          {[
            ["Fixed fees", "Agreed in writing before we begin"],
            ["Written summaries", "After every working session"],
            ["Your choice of room", "Video, phone or our office"],
          ].map(([title, detail], index) => (
            <li
              key={title}
              className="flex gap-4 border-b border-demo-fg/10 py-5 sm:border-b-0 sm:py-7 sm:pr-6 sm:not-first:border-l sm:not-first:pl-6"
            >
              <span className="font-halden-serif text-demo-accent tabular-nums">0{index + 1}</span>
              <span>
                <span className="block font-medium">{title}</span>
                <span className="block text-demo-fg/60">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </Frame>
    </section>
  );
}

/* Services ---------------------------------------------------------------- */

function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-28 pt-24 md:pt-32">
      <Frame>
        <SectionHead
          id="services-title"
          number="01"
          label="Services and fees"
          aside={<p>Every fee is fixed and agreed before we start. These are sample prices.</p>}
        >
          Four ways to work together, each with a clear end.
        </SectionHead>

        {/* Column heads, shown only where the rows read as a table */}
        <div
          aria-hidden="true"
          className="mt-14 hidden grid-cols-12 gap-x-8 border-b border-demo-fg/20 pb-3 text-xs tracking-[0.1em] text-demo-fg/55 uppercase lg:grid"
        >
          <span className="col-span-5">Service</span>
          <span className="col-span-3">Good for</span>
          <span className="col-span-2">Format</span>
          <span className="col-span-2 text-right">Fee</span>
        </div>

        <ul className="mt-10 lg:mt-0">
          {services.map((service) => (
            <li
              key={service.id}
              className="grid gap-y-4 border-b border-demo-fg/15 py-8 lg:grid-cols-12 lg:gap-x-8 lg:py-9"
            >
              <div className="lg:col-span-5">
                <h3 className="text-xl font-medium tracking-[-0.02em] md:text-2xl">{service.title}</h3>
                <p className="mt-2 max-w-[30rem] leading-relaxed text-demo-fg/70">{service.summary}</p>
                <p className="mt-4 font-halden-serif text-demo-fg/80 italic">
                  You leave with: {service.outcome.charAt(0).toLowerCase() + service.outcome.slice(1)}.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[0.9375rem] lg:col-span-7 lg:grid-cols-7 lg:gap-x-8">
                <div className="col-span-2 lg:col-span-3">
                  <dt className="text-sm text-demo-fg/55 lg:sr-only">Good for</dt>
                  <dd>{service.forWhom}</dd>
                </div>
                <div className="lg:col-span-2">
                  <dt className="text-sm text-demo-fg/55 lg:sr-only">Format</dt>
                  <dd>
                    {service.format}
                    <span className="block text-demo-fg/60 tabular-nums">{service.duration}</span>
                  </dd>
                </div>
                <div className="lg:col-span-2 lg:text-right">
                  <dt className="text-sm text-demo-fg/55 lg:sr-only">Fee</dt>
                  <dd className="font-medium tabular-nums">{service.fee}</dd>
                  <dd className="mt-3">
                    <BookTrigger
                      serviceId={service.id}
                      label={`Book: ${service.title}`}
                      className="group inline-flex items-center gap-2 text-demo-accent hover:text-demo-fg"
                    >
                      Book <Arrow />
                    </BookTrigger>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </Frame>
    </section>
  );
}

/* Approach ---------------------------------------------------------------- */

function Approach() {
  return (
    <section id="approach" aria-labelledby="approach-title" className="scroll-mt-28 pt-24 md:pt-32">
      <Frame>
        <SectionHead id="approach-title" number="02" label="How we work">
          Three steps, in about three weeks.
        </SectionHead>

        {/* The path: a single rule with three stops */}
        <ol className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          <span
            aria-hidden="true"
            className="animate-draw-x absolute top-[0.6875rem] right-0 left-0 hidden h-px bg-demo-accent/50 md:block"
          />
          {steps.map((step, index) => (
            <li key={step.title} className="relative pl-10 md:pl-0">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 grid size-[1.375rem] place-items-center rounded-full border border-demo-accent bg-demo-bg md:relative"
              >
                <span className="size-1.5 rounded-full bg-demo-accent" />
              </span>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-[1.375rem] bottom-[-3rem] left-[0.6875rem] w-px bg-demo-accent/40 md:hidden"
                />
              ) : null}
              <p className="text-sm text-demo-fg/55 md:mt-6">{step.when}</p>
              <h3 className="mt-1 text-xl font-medium tracking-[-0.02em] md:text-2xl">{step.title}</h3>
              <p className="mt-3 max-w-[24rem] leading-relaxed text-demo-fg/70">{step.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-24 grid gap-14 md:mt-32 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-5">
            <h3 className="text-sm text-demo-fg/65">What you can count on</h3>
            <figure className="mt-8">
              <blockquote className="font-halden-serif text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-[1.3] italic">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-6 text-sm text-demo-fg/60">
                {testimonial.author}, {testimonial.business.toLowerCase()}. An illustrative quote.
              </figcaption>
            </figure>
          </div>
          <ul className="grid gap-px self-start bg-demo-fg/12 sm:grid-cols-2 lg:col-span-7">
            {principles.map((principle) => (
              <li key={principle.title} className="bg-demo-bg p-6 sm:p-7">
                <h4 className="font-medium">{principle.title}</h4>
                <p className="mt-2 leading-relaxed text-demo-fg/70">{principle.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </Frame>
    </section>
  );
}

/* About ------------------------------------------------------------------- */

function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-28 pt-24 md:pt-32">
      <Frame>
        <SectionHead
          id="about-title"
          number="03"
          label="The practice"
          aside={<p>Three people, one office, and a deliberately short client list.</p>}
        >
          Small on purpose, so you always speak to the same person.
        </SectionHead>

        <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {people.map((person) => (
            <li key={person.name} className="flex gap-5 lg:flex-col">
              <span
                aria-hidden="true"
                className="grid aspect-[4/5] w-24 shrink-0 place-items-center bg-[var(--halden-raised)] font-halden-serif text-3xl text-demo-accent sm:w-28 lg:w-full lg:max-w-[15rem] lg:text-5xl"
              >
                {person.initials}
              </span>
              <div>
                <h3 className="text-lg font-medium">{person.name}</h3>
                <p className="text-demo-fg/60">{person.role}</p>
                <p className="mt-3 max-w-[22rem] leading-relaxed text-demo-fg/70">{person.bio}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-demo-fg/55">
          Everyone named here is fictional, created for this demonstration.
        </p>
      </Frame>
    </section>
  );
}

/* Book -------------------------------------------------------------------- */

function Book() {
  return (
    <section id="book" aria-labelledby="book-title" className="scroll-mt-28 pt-24 pb-24 md:pt-32 md:pb-32">
      <Frame>
        <SectionHead id="book-title" number="04" label="Book a consultation">
          Choose a service and a time. It takes a minute.
        </SectionHead>

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-x-8">
          <aside className="space-y-8 text-demo-fg/75 lg:col-span-3">
            <div>
              <h3 className="font-medium text-demo-fg">Before you book</h3>
              <p className="mt-2 leading-relaxed">
                If you are not sure where to start, choose the introductory call. It is free and
                there is nothing to prepare.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-demo-fg">Prefer to talk?</h3>
              <p className="mt-2 leading-relaxed">
                <a href={halden.phone.href} className="underline underline-offset-4 hover:text-demo-accent">
                  {halden.phone.label}
                </a>
                <br />
                {halden.hours}
              </p>
            </div>
            <p className="border-l-2 border-demo-accent pl-4 text-sm leading-relaxed">
              This booking flow is a demonstration. It does not book anything, send anything or
              store anything.
            </p>
          </aside>
          <div className="lg:col-span-9">
            <BookingFlow />
          </div>
        </div>
      </Frame>
    </section>
  );
}

/* Footer ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="bg-[var(--halden-deep)] pt-16 pb-10 text-[0.9375rem]">
      <Frame>
        <div className="grid gap-12 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-5">
            <p className="text-2xl tracking-[-0.02em]">
              <span className="font-semibold">{halden.short}</span>{" "}
              <span className="text-demo-fg/60">Advisory</span>
            </p>
            <p className="mt-3 max-w-[22rem] text-demo-fg/65">{halden.tagline}.</p>
          </div>
          <div className="md:col-span-3">
            <h2 className="text-sm text-demo-fg/55">Office</h2>
            <address className="mt-3 not-italic">
              {halden.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-3 text-demo-fg/65">{halden.hours}</p>
          </div>
          <div className="md:col-span-4">
            <h2 className="text-sm text-demo-fg/55">Contact</h2>
            <ul className="mt-3 space-y-1">
              <li>
                <a href={halden.phone.href} className="hover:text-demo-accent">
                  {halden.phone.label}
                </a>
              </li>
              <li>
                <a href={`mailto:${halden.email}`} className="hover:text-demo-accent">
                  {halden.email}
                </a>
              </li>
            </ul>
            <p className="mt-3 text-sm text-demo-fg/55">
              Fictional address, number and email, for demonstration only.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-demo-fg/15 pt-6 text-sm text-demo-fg/55 md:flex-row md:justify-between">
          <p className="max-w-[44rem]">
            {halden.name} is a fictional practice created for an elsemarc demonstration. Nothing
            on this page is financial, tax or legal advice, and no services are offered.
          </p>
          <a href="#top" className="shrink-0 hover:text-demo-fg">
            Back to top ↑
          </a>
        </div>
      </Frame>
    </footer>
  );
}
