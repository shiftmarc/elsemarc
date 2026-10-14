import type { CSSProperties, ReactNode } from "react";
import type { Concept } from "@/content/concepts";
import { Catalogue } from "./catalogue";
import {
  argileNav,
  formatPrice,
  getProduct,
  hours,
  maison,
  making,
  products,
  questions,
  type Product,
} from "./content";
import { figtree, fraunces } from "./fonts";
import { KilnLetter } from "./kiln-letter";
import { MobileNav } from "./mobile-nav";
import { BagButton, ProductTrigger, ShopProvider } from "./shop";
import { Vessel } from "./vessel";

/**
 * Maison Argile: the full homepage for "The Boutique" demonstration concept.
 * A small shop of handmade stoneware and linen. It shares nothing visual with
 * elsemarc, Ardoise or Field Office beyond the demo bar: its own typefaces
 * (Fraunces, Figtree), a sand and clay palette, soft rounded forms and a
 * quiet, centred rhythm that leaves the room to the objects.
 */
export function MaisonArgileHomepage({ concept }: { concept: Concept }) {
  const { bg, fg, accent } = concept.palette;
  const style = {
    "--demo-bg": bg,
    "--demo-fg": fg,
    "--demo-accent": accent,
    // Lighter grounds for tiles, sheets and alternate sections.
    "--argile-paper": `color-mix(in oklab, ${bg} 38%, white)`,
    "--argile-shell": `color-mix(in oklab, ${bg} 66%, white)`,
    // Focus rings and selection follow the shop, not elsemarc.
    "--accent": accent,
    "--accent-fg": "#fbf6ef",
  } as CSSProperties;

  return (
    <div
      style={style}
      className={`${fraunces.variable} ${figtree.variable} relative min-h-dvh bg-demo-bg font-argile-sans text-demo-fg [color-scheme:light]`}
    >
      <ShopProvider>
        <a
          href="#argile-main"
          className="sr-only z-[60] rounded-full bg-demo-fg px-5 py-3 text-[var(--argile-paper)] focus:not-sr-only focus:fixed focus:top-14 focus:left-3"
        >
          Skip to content
        </a>
        <Header />
        <main id="argile-main">
          <Hero />
          <Shop />
          <Making />
          <Studio />
          <Visit />
        </main>
        <Footer />
      </ShopProvider>
    </div>
  );
}

/* Layout helpers ---------------------------------------------------------- */

function Frame({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[84rem] px-5 md:px-8 lg:px-12 ${className}`}>{children}</div>;
}

/** A quiet, letter-spaced line above a heading. */
function Kicker({ className = "", children }: { className?: string; children: ReactNode }) {
  return <p className={`text-xs tracking-[0.2em] uppercase ${className}`}>{children}</p>;
}

/** Sections sit under the demo bar and the sticky header. */
const anchorOffset = "scroll-mt-[6.75rem]";

/* Header ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="sticky top-11 z-40 border-b border-demo-fg/10 bg-demo-bg">
      <Frame className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div>
          <nav aria-label="Maison Argile" className="hidden md:block">
            <ul className="flex gap-6 text-sm lg:gap-8">
              {argileNav.slice(0, 3).map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="underline-offset-[6px] transition-colors hover:underline hover:decoration-demo-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <MobileNav />
        </div>

        <a href="#top" className="argile-display text-[1.5rem] leading-none whitespace-nowrap md:text-[1.75rem]">
          {maison.name}
        </a>

        <div className="flex items-center justify-end gap-6 text-sm lg:gap-8">
          <a
            href="#visit"
            className="hidden underline-offset-[6px] hover:underline hover:decoration-demo-accent md:inline"
          >
            Visit
          </a>
          <BagButton />
        </div>
      </Frame>
    </header>
  );
}

/* Hero: three niches, three pieces ---------------------------------------- */

const niches = [
  { slug: "vase-no-3", frame: "aspect-[3/4.2]", tone: "bg-[var(--argile-shell)]", delay: "120ms" },
  { slug: "low-bowl", frame: "aspect-[3/4.8]", tone: "bg-[var(--argile-paper)]", delay: "220ms" },
  { slug: "carafe", frame: "aspect-[3/4.2]", tone: "bg-[var(--argile-shell)]", delay: "320ms" },
];

function Hero() {
  return (
    <section id="top" aria-labelledby="argile-title" className="pt-12 pb-24 md:pt-20 md:pb-36">
      <Frame>
        <div className="mx-auto max-w-3xl text-center">
          <Kicker className="animate-rise">Autumn collection · Stoneware &amp; linen</Kicker>
          <h1
            id="argile-title"
            className="argile-display animate-rise mt-5 text-[clamp(3.25rem,1.8rem+7vw,8rem)] leading-[0.95] italic"
            style={{ "--delay": "60ms" } as CSSProperties}
          >
            Objects made slowly.
          </h1>
          <p
            className="animate-rise mx-auto mt-6 max-w-md text-lg leading-relaxed"
            style={{ "--delay": "120ms" } as CSSProperties}
          >
            Stoneware and linen for everyday tables, made by two people in a small studio in the
            Eastern Townships.
          </p>
          <div
            className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4"
            style={{ "--delay": "180ms" } as CSSProperties}
          >
            <a
              href="#shop"
              className="inline-flex h-12 items-center rounded-full bg-demo-fg px-7 text-[var(--argile-paper)] transition-colors hover:bg-demo-accent"
            >
              Shop the collection
            </a>
            <a href="#making" className="underline decoration-demo-fg/30 underline-offset-[6px] hover:decoration-demo-accent">
              How each piece is made
            </a>
          </div>
        </div>

        <ul className="mx-auto mt-16 grid max-w-5xl grid-cols-3 items-end gap-3 sm:gap-5 md:mt-24 lg:gap-10">
          {niches.map((niche) => {
            const product = getProduct(niche.slug) as Product;
            return (
              <li key={niche.slug} className="animate-rise" style={{ "--delay": niche.delay } as CSSProperties}>
                <ProductTrigger slug={product.slug} className="group block w-full text-left">
                  <span
                    className={`flex items-end justify-center rounded-t-full px-[14%] pb-[12%] transition-colors duration-500 group-hover:bg-[var(--argile-paper)] ${niche.frame} ${niche.tone}`}
                  >
                    <Vessel
                      shape={product.shape}
                      color={product.finishes[0].color}
                      className="w-full transition-transform duration-700 ease-out group-hover:-translate-y-2"
                    />
                  </span>
                  <span className="mt-3 flex flex-col gap-0.5 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 md:text-base">
                    <span className="argile-display text-base md:text-xl">{product.name}</span>
                    <span className="tabular-nums text-demo-fg/80">{formatPrice(product.price)}</span>
                  </span>
                </ProductTrigger>
              </li>
            );
          })}
        </ul>
      </Frame>
    </section>
  );
}

/* Shop -------------------------------------------------------------------- */

function Shop() {
  return (
    <section
      id="shop"
      aria-labelledby="shop-title"
      className={`${anchorOffset} rounded-t-[2.5rem] bg-[var(--argile-paper)] pt-20 pb-24 md:rounded-t-[4rem] md:pt-28 md:pb-36`}
    >
      <Frame>
        <div className="grid gap-6 md:grid-cols-2 md:items-end md:gap-12">
          <div>
            <Kicker>The shop · {products.length} pieces</Kicker>
            <h2 id="shop-title" className="argile-display mt-4 text-[clamp(2.5rem,1.6rem+3.6vw,4.75rem)] leading-[1]">
              This season, from the kiln
            </h2>
          </div>
          <p className="max-w-md leading-relaxed md:justify-self-end">
            We fire small batches, about forty pieces at a time. When a batch is gone, the next one
            comes out a little different.
          </p>
        </div>

        <div className="mt-12 md:mt-16">
          <Catalogue />
        </div>
      </Frame>
    </section>
  );
}

/* The making -------------------------------------------------------------- */

function Making() {
  return (
    <section id="making" aria-labelledby="making-title" className={`${anchorOffset} py-24 md:py-36`}>
      <Frame className="grid gap-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-36">
            <Kicker>The making</Kicker>
            <h2 id="making-title" className="argile-display mt-4 text-[clamp(2.5rem,1.6rem+3.4vw,4.5rem)] leading-[1.02]">
              From clay pit to table in about <em>three weeks.</em>
            </h2>
            <p className="mt-6 max-w-sm leading-relaxed">
              Every piece passes through our hands at least six times. That is why it costs what it
              does, and why no two are quite the same.
            </p>
            <Wheel className="mt-12 hidden w-56 md:block" />
          </div>
        </div>

        <ol className="relative md:col-span-6 md:col-start-7">
          <span aria-hidden="true" className="absolute top-3 bottom-3 left-[0.6875rem] w-px bg-demo-fg/20" />
          {making.map((step, index) => (
            <li key={step.title} className="reveal relative grid grid-cols-[1.5rem_1fr] gap-5 pb-12 last:pb-0 md:gap-8 md:pb-16">
              <span
                aria-hidden="true"
                className={`relative mt-2 size-[1.375rem] rounded-full border border-demo-fg/30 ${
                  index === making.length - 1 ? "bg-demo-accent" : "bg-demo-bg"
                }`}
              >
                <span className="absolute inset-[5px] rounded-full bg-demo-fg/25" />
              </span>
              <div>
                <p className="text-sm text-demo-fg/80">{step.day}</p>
                <h3 className="argile-display mt-1 text-[1.875rem] leading-tight md:text-[2.25rem]">{step.title}</h3>
                <p className="mt-3 max-w-md leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Frame>
    </section>
  );
}

/** A potter's wheel seen from above, turning very slowly. */
function Wheel({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className={className}>
      <circle cx="100" cy="100" r="96" fill="var(--argile-shell)" />
      <g className="origin-center [transform-box:fill-box] motion-safe:animate-[spin_24s_linear_infinite]">
        {[80, 64, 48].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgb(58 42 32 / 0.18)" strokeWidth="1" />
        ))}
        <path d="M100 20 A80 80 0 0 1 180 100" fill="none" stroke="var(--demo-accent)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="30" fill="var(--demo-accent)" opacity="0.85" />
      <circle cx="100" cy="100" r="18" fill="var(--demo-bg)" opacity="0.5" />
    </svg>
  );
}

/* Studio: a note from the bench ------------------------------------------- */

function Studio() {
  const notes = ["Clay dug in Saint-Armand", "Linen woven in Québec", "Fired in Sutton"];
  return (
    <section
      id="studio"
      aria-labelledby="studio-title"
      className={`${anchorOffset} bg-[var(--argile-paper)] py-24 md:py-36`}
    >
      <Frame>
        <div className="mx-auto max-w-3xl text-center">
          <Kicker>Our studio</Kicker>
          <h2 id="studio-title" className="sr-only">
            A note from the studio
          </h2>
          <blockquote className="reveal mt-8">
            <p className="argile-display text-[clamp(1.75rem,1.2rem+2.2vw,3rem)] leading-[1.18]">
              “We started Maison Argile in a barn behind the house, with one wheel and a kiln that
              took two days to cool. We still work that way. We make things we would want on our own
              table, and we make them until they feel right in the hand.”
            </p>
            <footer className="mt-10 flex flex-col items-center gap-3">
              <span aria-hidden="true" className="flex -space-x-2">
                {["ÉM", "TR"].map((initials, index) => (
                  <span
                    key={initials}
                    className={`argile-display grid size-12 place-items-center rounded-full text-sm ring-4 ring-[var(--argile-paper)] ${
                      index === 0 ? "bg-demo-accent text-[var(--argile-paper)]" : "bg-[var(--argile-shell)]"
                    }`}
                  >
                    {initials}
                  </span>
                ))}
              </span>
              <cite className="not-italic">
                <span className="argile-display block text-xl italic">{maison.makers}</span>
                <span className="mt-1 block text-sm text-demo-fg/80">
                  Founders, since {maison.founded} · fictional makers
                </span>
              </cite>
            </footer>
          </blockquote>
        </div>

        <ul className="mx-auto mt-16 flex max-w-3xl flex-wrap justify-center gap-2.5 md:mt-20">
          {notes.map((note) => (
            <li key={note} className="rounded-full border border-demo-fg/20 px-4 py-2 text-sm">
              {note}
            </li>
          ))}
        </ul>
      </Frame>
    </section>
  );
}

/* Visit, questions and the kiln letter ------------------------------------ */

function Visit() {
  return (
    <section id="visit" aria-labelledby="visit-title" className={`${anchorOffset} py-24 md:py-36`}>
      <Frame className="grid gap-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <Kicker>Visit</Kicker>
          <h2 id="visit-title" className="argile-display mt-4 text-[clamp(2.5rem,1.6rem+3.4vw,4.5rem)] leading-[1.02]">
            Come and see the kiln.
          </h2>
          <p className="mt-6 max-w-sm leading-relaxed">
            The shop is the front room of the studio. Pick things up, turn them over, and ask us
            anything; there is usually coffee.
          </p>

          <dl className="mt-10 max-w-md divide-y divide-demo-fg/15 border-y border-demo-fg/15">
            {hours.map((row) => (
              <div key={row.days} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:justify-between sm:gap-6">
                <dt>{row.days}</dt>
                <dd className="text-demo-fg/80 sm:text-right">{row.time}</dd>
              </div>
            ))}
          </dl>

          <address className="mt-10 grid gap-6 not-italic sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <p className="text-sm text-demo-fg/80">Studio and shop</p>
              <p className="mt-1">
                {maison.address[0]}
                <br />
                {maison.address[1]}
              </p>
            </div>
            <div>
              <p className="text-sm text-demo-fg/80">Write or call</p>
              <p className="mt-1">
                <a href={`mailto:${maison.email}`} className="break-all underline decoration-demo-fg/30 underline-offset-4 hover:decoration-demo-accent">
                  {maison.email}
                </a>
                <br />
                <a href={maison.phone.href} className="underline decoration-demo-fg/30 underline-offset-4 hover:decoration-demo-accent">
                  {maison.phone.label}
                </a>
              </p>
            </div>
          </address>
        </div>

        <div className="flex flex-col gap-10 lg:col-span-6 lg:col-start-7">
          <div>
            <h3 className="argile-display text-[1.875rem] md:text-[2.25rem]">Questions, answered</h3>
            <div className="mt-5 border-t border-demo-fg/15">
              {questions.map((item) => (
                <details key={item.question} className="group border-b border-demo-fg/15">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-demo-fg/[0.07] transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-lg pb-6 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[var(--argile-shell)] p-6 md:p-9">
            <h3 className="argile-display text-[1.75rem] leading-tight md:text-[2rem]">The kiln letter</h3>
            <p className="mt-2 mb-6 max-w-md leading-relaxed">
              One short email when a firing comes out, so you see new pieces before they reach the
              shop. Four or five a year.
            </p>
            <KilnLetter />
          </div>
        </div>
      </Frame>
    </section>
  );
}

/* Footer ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="rounded-t-[2.5rem] bg-demo-fg pt-16 pb-10 text-[var(--argile-shell)] md:rounded-t-[4rem] md:pt-20">
      <Frame>
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p className="argile-display text-[2.5rem] leading-none text-[var(--argile-paper)]">{maison.name}</p>
            <p className="mt-3">{maison.descriptor}, made in Sutton, Québec.</p>
          </div>
          <nav aria-label="Maison Argile, footer" className="md:col-span-2 md:col-start-7">
            <ul className="space-y-2">
              {argileNav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="underline-offset-4 hover:text-[var(--argile-paper)] hover:underline">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-1 md:col-span-4">
            <p>{maison.address.join(", ")}</p>
            <p>
              <a href={maison.phone.href} className="underline-offset-4 hover:text-[var(--argile-paper)] hover:underline">
                {maison.phone.label}
              </a>
            </p>
            <p>
              <a href={`mailto:${maison.email}`} className="break-all underline-offset-4 hover:text-[var(--argile-paper)] hover:underline">
                {maison.email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-[var(--argile-shell)]/20 pt-6 text-sm md:flex-row md:justify-between">
          <p className="max-w-xl">
            Maison Argile is a fictional shop, created as a demonstration concept. Its makers,
            products, prices and contact details are invented, and nothing is for sale.
          </p>
          <p className="shrink-0">© {maison.founded}–2026 {maison.name}</p>
        </div>
      </Frame>
    </footer>
  );
}
