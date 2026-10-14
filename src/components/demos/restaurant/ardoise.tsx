import type { CSSProperties, ReactNode } from "react";
import type { Concept } from "@/content/concepts";
import {
  ardoise,
  ardoiseNav,
  hours,
  menuCourses,
  wineByTheGlass,
} from "./content";
import { cormorant, jost } from "./fonts";
import { MobileNav } from "./mobile-nav";
import { Reservation } from "./reservation";

/**
 * Ardoise: the full homepage for "The Restaurant" demonstration concept.
 * It deliberately shares nothing visual with elsemarc beyond the demo bar:
 * its own typefaces (Cormorant, Jost), palette, grid and voice.
 */
export function ArdoiseHomepage({ concept }: { concept: Concept }) {
  const style = {
    "--demo-bg": concept.palette.bg,
    "--demo-fg": concept.palette.fg,
    "--demo-accent": concept.palette.accent,
    // Focus rings and selection follow the restaurant, not elsemarc.
    "--accent": concept.palette.accent,
    "--accent-fg": concept.palette.bg,
  } as CSSProperties;

  return (
    <div
      style={style}
      className={`${cormorant.variable} ${jost.variable} relative min-h-dvh bg-demo-bg font-ardoise-sans text-demo-fg [color-scheme:dark]`}
    >
      <a
        href="#ardoise-main"
        className="sr-only z-[60] bg-demo-accent px-4 py-3 text-demo-bg focus:not-sr-only focus:fixed focus:top-14 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="ardoise-main">
        <Hero />
        <About />
        <Menu />
        <Wine />
        <PrivateDining />
        <Reserve />
        <Visit />
      </main>
      <Footer />
      <Grain />
    </div>
  );
}

/* Layout helpers ---------------------------------------------------------- */

function Frame({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[88rem] px-5 md:px-10 ${className}`}>{children}</div>;
}

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[0.6875rem] tracking-[0.28em] text-demo-accent uppercase ${className}`}>
      {children}
    </p>
  );
}

const sectionTitle = "font-ardoise-display font-light italic leading-[0.9] tracking-[-0.02em]";
/** Sections sit under the demo bar and the sticky header. */
const anchorOffset = "scroll-mt-28";

/* Header ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="sticky top-11 z-40 border-b border-demo-fg/10 bg-demo-bg/95">
      <Frame className="flex h-16 items-center justify-between gap-6">
        <a href="#top" className="font-ardoise-display text-[1.75rem] leading-none italic">
          {ardoise.name}
        </a>
        <nav aria-label="Ardoise" className="hidden md:block">
          <ul className="flex gap-10 text-[0.6875rem] tracking-[0.24em] uppercase">
            {ardoiseNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-demo-fg/75 transition-colors hover:text-demo-accent"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-5">
          <a
            href="#reserve"
            className="inline-flex h-10 items-center border border-demo-accent px-4 text-[0.6875rem] tracking-[0.24em] text-demo-accent uppercase transition-colors hover:bg-demo-accent hover:text-demo-bg md:px-5"
          >
            Reserve
          </a>
          <MobileNav />
        </div>
      </Frame>
    </header>
  );
}

/* Hero -------------------------------------------------------------------- */

function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="ardoise-title"
      className="relative isolate flex min-h-[calc(100svh-6.75rem)] flex-col overflow-hidden"
    >
      {/* Ember glow rising from below */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[radial-gradient(ellipse_at_70%_110%,color-mix(in_oklab,var(--demo-accent)_28%,transparent),transparent_65%)]"
      />
      <Plate className="absolute top-[8%] right-[-38vw] -z-10 w-[92vw] opacity-60 md:top-1/2 md:right-[-8vw] md:w-[min(52vw,46rem)] md:-translate-y-1/2 md:opacity-100" />

      <Frame className="flex flex-1 flex-col justify-end pt-16 pb-10 md:justify-center md:pb-16">
        <Eyebrow className="animate-rise">{ardoise.tagline}</Eyebrow>
        <h1
          id="ardoise-title"
          className="animate-rise mt-6 font-ardoise-display text-[clamp(5.5rem,24vw,20rem)] leading-[0.78] font-light tracking-[-0.045em] italic"
          style={{ "--delay": "120ms" } as CSSProperties}
        >
          {ardoise.name}
        </h1>
        <p
          className="animate-rise mt-8 max-w-[24rem] text-lg leading-relaxed text-demo-fg/80 md:text-xl"
          style={{ "--delay": "240ms" } as CSSProperties}
        >
          A small dining room cooking over embers. Dinner Wednesday to Sunday.
        </p>
        <div
          className="animate-rise mt-10 flex flex-wrap gap-3"
          style={{ "--delay": "360ms" } as CSSProperties}
        >
          <a
            href="#reserve"
            className="inline-flex h-13 items-center bg-demo-accent px-7 text-xs tracking-[0.22em] text-demo-bg uppercase transition-colors hover:bg-demo-fg"
          >
            Book a table
          </a>
          <a
            href="#menu"
            className="inline-flex h-13 items-center border border-demo-fg/30 px-7 text-xs tracking-[0.22em] uppercase transition-colors hover:border-demo-fg"
          >
            See the menu
          </a>
        </div>
      </Frame>

      <Frame>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t border-demo-fg/15 py-5 text-sm">
          <span className="text-demo-fg/70">
            Tonight <span className="text-demo-accent">·</span> 17:30 – 23:00
          </span>
          <span className="text-demo-fg/70">{ardoise.address.join(", ")}</span>
        </div>
      </Frame>
    </section>
  );
}

/** The signature mark: a plate seen from above, drawn in rings. */
function Plate({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`aspect-square ${className}`}>
      <div className="relative size-full">
        <div className="absolute inset-0 rounded-full border border-demo-fg/20" />
        <div className="absolute inset-[3%] rounded-full border border-dashed border-demo-fg/10 motion-safe:animate-[spin_180s_linear_infinite]" />
        <div className="absolute inset-[9%] rounded-full border border-demo-fg/15 bg-demo-fg/[0.025]" />
        <div className="absolute inset-[24%] rounded-full bg-[radial-gradient(circle_at_38%_34%,color-mix(in_oklab,var(--demo-accent)_80%,white),var(--demo-accent)_45%,color-mix(in_oklab,var(--demo-accent)_55%,var(--demo-bg))_100%)] shadow-[0_0_120px_-10px_color-mix(in_oklab,var(--demo-accent)_45%,transparent)]" />
        <div className="absolute inset-[38%] rounded-full bg-demo-bg/25" />
        {/* Garnish */}
        <div className="absolute top-[30%] left-[58%] size-[3.5%] rounded-full bg-demo-fg/80" />
        <div className="absolute top-[63%] left-[34%] size-[2.4%] rounded-full bg-demo-fg/70" />
        <div className="absolute top-[56%] left-[66%] size-[1.6%] rounded-full bg-demo-bg/60" />
      </div>
    </div>
  );
}

/* About ------------------------------------------------------------------- */

function About() {
  const facts = [
    ["34", "seats, and a counter facing the hearth"],
    ["1", "fire of oak and maple, lit at noon"],
    ["140", "wines, most of them made naturally"],
  ];

  return (
    <section aria-labelledby="about-title" className="py-28 md:py-44">
      <Frame className="grid gap-14 md:grid-cols-12 md:gap-x-10">
        <div className="md:col-span-7">
          <Eyebrow>The room</Eyebrow>
          <h2 id="about-title" className={`${sectionTitle} reveal mt-6 text-[clamp(2.75rem,6.5vw,6rem)]`}>
            Everything passes through the fire, or waits patiently beside it.
          </h2>
        </div>
        <div className="reveal space-y-6 text-lg leading-relaxed text-demo-fg/75 md:col-span-4 md:col-start-9 md:self-end">
          <p>
            Chef Élise Marchand cooks on a single hearth in the middle of the room. The menu is
            written each afternoon, once the farmers have been and gone.
          </p>
          <p>
            Come for a glass at the counter or stay for the whole evening. We keep a few seats
            for walk-ins every night.
          </p>
        </div>

        <dl className="grid gap-10 border-t border-demo-fg/15 pt-10 sm:grid-cols-3 md:col-span-12 md:mt-10">
          {facts.map(([value, label]) => (
            <div key={label} className="reveal">
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block font-ardoise-display text-7xl leading-none font-light text-demo-accent italic md:text-8xl">
                  {value}
                </span>
                <span className="mt-3 block max-w-[16rem] text-demo-fg/70">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Frame>
    </section>
  );
}

/* Menu -------------------------------------------------------------------- */

function Menu() {
  return (
    <section
      id="menu"
      aria-labelledby="menu-title"
      className={`${anchorOffset} border-t border-demo-fg/10 bg-[color-mix(in_oklab,var(--demo-bg)_88%,black)] py-28 md:py-40`}
    >
      <Frame>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>This week</Eyebrow>
            <h2 id="menu-title" className={`${sectionTitle} mt-6 text-[clamp(4rem,11vw,10rem)]`}>
              The menu
            </h2>
          </div>
          <p className="max-w-xs text-demo-fg/65">
            Written each afternoon and changed without notice. Dishes to share, in any order.
          </p>
        </div>

        <div className="mt-16 grid gap-16 md:mt-24 md:grid-cols-3 md:gap-10">
          {menuCourses.map((course) => (
            <div key={course.title} className="reveal">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-demo-accent/40 pb-4">
                <h3 className="font-ardoise-display text-3xl whitespace-nowrap italic">{course.title}</h3>
                <span className="text-[0.6875rem] tracking-[0.2em] text-demo-fg/50 uppercase">
                  {course.note}
                </span>
              </div>
              <ul>
                {course.dishes.map((dish) => (
                  <li key={dish.name} className="border-b border-demo-fg/10 py-5">
                    <div className="flex items-baseline gap-4">
                      <span className="font-ardoise-display text-[1.375rem] leading-snug font-medium">
                        {dish.name}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex-1 translate-y-[-0.3em] border-b border-dotted border-demo-fg/20"
                      />
                      <span className="text-demo-accent tabular-nums">
                        <span className="sr-only">$</span>
                        {dish.price}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-demo-fg/60">{dish.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="reveal mt-20 grid gap-8 border border-demo-accent/40 p-8 md:mt-28 md:grid-cols-12 md:items-center md:p-12">
          <div className="md:col-span-7">
            <Eyebrow>For the whole table</Eyebrow>
            <p className="mt-4 font-ardoise-display text-4xl leading-tight italic md:text-5xl">
              Le feu, seven courses from the hearth.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-6 md:col-span-4 md:col-start-9">
            <div>
              <dt className="text-sm text-demo-fg/60">Per guest</dt>
              <dd className="mt-1 font-ardoise-display text-5xl text-demo-accent">$118</dd>
            </div>
            <div>
              <dt className="text-sm text-demo-fg/60">Wine pairing</dt>
              <dd className="mt-1 font-ardoise-display text-5xl">$78</dd>
            </div>
          </dl>
        </div>
      </Frame>
    </section>
  );
}

/* Wine -------------------------------------------------------------------- */

function Wine() {
  return (
    <section id="wine" aria-labelledby="wine-title" className={`${anchorOffset} py-28 md:py-44`}>
      <Frame className="grid gap-16 md:grid-cols-12 md:gap-x-10">
        <div className="md:col-span-5">
          <Eyebrow>The cellar</Eyebrow>
          <h2 id="wine-title" className={`${sectionTitle} mt-6 text-[clamp(3rem,7vw,6.5rem)]`}>
            We pour what we’d drink at home.
          </h2>
          <figure className="mt-12 border-l border-demo-accent pl-6">
            <blockquote className="text-lg leading-relaxed text-demo-fg/75">
              “Small growers, low intervention, and a few bottles we’ve been saving for the
              right table. Ask us what we’re excited about tonight.”
            </blockquote>
            <figcaption className="mt-4 text-[0.6875rem] tracking-[0.24em] text-demo-fg/50 uppercase">
              Théo Lavoie, sommelier
            </figcaption>
          </figure>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <div className="relative flex items-end justify-between border-b border-demo-fg/15 pb-6">
            <h3 className="font-ardoise-display text-3xl italic">By the glass</h3>
            <span className="text-[0.6875rem] tracking-[0.2em] text-demo-fg/50 uppercase">
              6 oz
            </span>
          </div>
          <ul>
            {wineByTheGlass.map((wine, index) => (
              <li
                key={wine.name}
                className="reveal grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 border-b border-demo-fg/10 py-6"
              >
                <span className="font-ardoise-display text-demo-fg/40 italic">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-ardoise-display text-2xl font-medium">{wine.name}</span>
                  <span className="mt-1 block text-sm text-demo-fg/60">{wine.origin}</span>
                </span>
                <span className="text-demo-accent tabular-nums">
                  <span className="sr-only">$</span>
                  {wine.price}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-demo-fg/60">
            The full list runs to 140 bottles, from $48. Corkage $35, one bottle per table.
          </p>
        </div>
      </Frame>
    </section>
  );
}

/* Private dining ---------------------------------------------------------- */

function PrivateDining() {
  return (
    <section
      id="private-dining"
      aria-labelledby="private-title"
      className={`${anchorOffset} overflow-hidden bg-demo-fg py-28 text-demo-bg md:py-40`}
    >
      <Frame className="grid items-center gap-16 md:grid-cols-12 md:gap-x-10">
        <div className="md:col-span-5">
          <p className="text-[0.6875rem] tracking-[0.28em] uppercase opacity-60">Private dining</p>
          <h2 id="private-title" className={`${sectionTitle} mt-6 text-[clamp(3rem,7vw,6.5rem)]`}>
            La grande table
          </h2>
          <p className="mt-8 max-w-md text-lg leading-relaxed opacity-75">
            One long oak table behind the hearth, for up to fourteen guests. Set menus from $95
            a guest, with the cellar open to you.
          </p>
          <a
            href={`mailto:${ardoise.events}`}
            className="mt-10 inline-flex h-13 items-center gap-3 bg-demo-bg px-7 text-xs tracking-[0.22em] text-demo-fg uppercase transition-colors hover:bg-[color-mix(in_oklab,var(--demo-bg)_80%,var(--demo-accent))]"
          >
            Plan an evening <span aria-hidden="true">→</span>
          </a>
        </div>
        <LongTable className="md:col-span-6 md:col-start-7" />
      </Frame>
    </section>
  );
}

/** Fourteen places around one table, seen from above. */
function LongTable({ className = "" }: { className?: string }) {
  const side = Array.from({ length: 6 });
  const seat = "aspect-square w-[11%] rounded-full border border-demo-bg/30";
  return (
    <div aria-hidden="true" className={`reveal ${className}`}>
      <div className="relative mx-auto flex aspect-[5/3] max-w-xl flex-col justify-between py-[2%]">
        <div className="flex justify-around px-[10%]">
          {side.map((_, i) => (
            <span key={i} className={seat} />
          ))}
        </div>
        <div className="absolute inset-x-[8%] top-1/2 flex h-[42%] -translate-y-1/2 items-center justify-around rounded-[2px] bg-demo-bg px-[3%]">
          {side.map((_, i) => (
            <span
              key={i}
              className="aspect-square w-[8%] rounded-full border border-demo-fg/25 bg-[radial-gradient(circle,var(--demo-accent)_0_32%,transparent_34%)]"
            />
          ))}
        </div>
        <span className={`${seat} absolute top-1/2 left-0 -translate-y-1/2`} />
        <span className={`${seat} absolute top-1/2 right-0 -translate-y-1/2`} />
        <div className="flex justify-around px-[10%]">
          {side.map((_, i) => (
            <span key={i} className={seat} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Reserve ----------------------------------------------------------------- */

function Reserve() {
  return (
    <section id="reserve" aria-labelledby="reserve-title" className={`${anchorOffset} py-28 md:py-44`}>
      <Frame className="grid gap-14 md:grid-cols-12 md:gap-x-10">
        <div className="md:col-span-4">
          <Eyebrow>Reservations</Eyebrow>
          <h2 id="reserve-title" className={`${sectionTitle} mt-6 text-[clamp(3.25rem,7vw,6.5rem)]`}>
            Reserve a table.
          </h2>
          <p className="mt-8 max-w-sm leading-relaxed text-demo-fg/70">
            Bookings open thirty days ahead. For parties of seven or more, or anything we should
            know before you arrive, call us at{" "}
            <a href={ardoise.phone.href} className="whitespace-nowrap text-demo-fg underline underline-offset-4 hover:text-demo-accent">
              {ardoise.phone.label}
            </a>
            .
          </p>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <Reservation />
        </div>
      </Frame>
    </section>
  );
}

/* Visit ------------------------------------------------------------------- */

function Visit() {
  return (
    <section
      id="visit"
      aria-labelledby="visit-title"
      className={`${anchorOffset} border-t border-demo-fg/10 py-28 md:py-40`}
    >
      <Frame className="grid gap-16 md:grid-cols-12 md:gap-x-10">
        <div className="md:col-span-5">
          <Eyebrow>Visit</Eyebrow>
          <h2 id="visit-title" className={`${sectionTitle} mt-6 text-[clamp(3rem,6.5vw,6rem)]`}>
            {ardoise.address[0]}
          </h2>
          <p className="mt-4 text-lg text-demo-fg/70">{ardoise.address[1]}</p>
          <p className="mt-8 max-w-sm leading-relaxed text-demo-fg/70">
            Two minutes from the canal. Look for the slate sign and the glow in the window.
          </p>
        </div>

        <div className="grid gap-12 sm:grid-cols-2 md:col-span-6 md:col-start-7">
          <div>
            <h3 className="text-[0.6875rem] tracking-[0.24em] text-demo-fg/50 uppercase">Hours</h3>
            <dl className="mt-5">
              {hours.map((row) => (
                <div key={row.days} className="border-b border-demo-fg/10 py-3">
                  <dt className="text-demo-fg/70">{row.days}</dt>
                  <dd className={`font-ardoise-display text-xl ${row.time === "Closed" ? "text-demo-fg/40 italic" : ""}`}>
                    {row.time}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-[0.6875rem] tracking-[0.24em] text-demo-fg/50 uppercase">Contact</h3>
            <ul className="mt-5 space-y-3 text-lg">
              <li>
                <a href={ardoise.phone.href} className="hover:text-demo-accent">
                  {ardoise.phone.label}
                </a>
              </li>
              <li>
                <a href={`mailto:${ardoise.email}`} className="break-all hover:text-demo-accent">
                  {ardoise.email}
                </a>
              </li>
            </ul>
            <p className="mt-8 text-sm leading-relaxed text-demo-fg/60">
              Step-free entrance and an accessible washroom. Gift cards at the bar.
            </p>
          </div>
        </div>
      </Frame>
    </section>
  );
}

/* Footer ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="overflow-hidden border-t border-demo-fg/10 pt-20">
      <Frame>
        <p
          aria-hidden="true"
          className="font-ardoise-display text-[clamp(5rem,27vw,26rem)] leading-[0.75] font-light tracking-[-0.05em] text-demo-accent/90 italic"
        >
          {ardoise.name}
        </p>
        <div className="mt-12 flex flex-col gap-4 border-t border-demo-fg/15 py-8 text-sm text-demo-fg/60 md:flex-row md:justify-between">
          <p>
            {ardoise.address.join(", ")} · {ardoise.phone.label}
          </p>
          <p>Ardoise is a fictional restaurant, created as a demonstration concept.</p>
        </div>
      </Frame>
    </footer>
  );
}

/** A fine film grain over everything, so flat colour reads as paper and light. */
function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 opacity-[0.07] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
