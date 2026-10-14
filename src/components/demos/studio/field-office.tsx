import type { CSSProperties, ReactNode } from "react";
import type { Concept } from "@/content/concepts";
import {
  featured,
  fieldNav,
  fieldOffice,
  figures,
  people,
  projects,
  services,
  type Plate,
  type Project,
} from "./content";
import { archivo, geistMono } from "./fonts";
import { MobileNav } from "./mobile-nav";
import { ProjectIndex } from "./project-index";

/**
 * Field Office: the full homepage for "The Studio" demonstration concept.
 * It deliberately shares nothing visual with elsemarc or Ardoise beyond the
 * demo bar: its own typefaces (Archivo, Geist Mono), palette, grid and voice.
 * Work comes first; the studio describes itself only once the work has spoken.
 */
export function FieldOfficeHomepage({ concept }: { concept: Concept }) {
  const style = {
    "--demo-bg": concept.palette.bg,
    "--demo-fg": concept.palette.fg,
    "--demo-accent": concept.palette.accent,
    // Focus rings and selection follow the studio, not elsemarc.
    "--accent": concept.palette.accent,
    "--accent-fg": concept.palette.bg,
  } as CSSProperties;

  return (
    <div
      style={style}
      className={`${archivo.variable} ${geistMono.variable} relative min-h-dvh bg-demo-bg font-field-sans text-demo-fg [color-scheme:light]`}
    >
      <a
        href="#field-main"
        className="sr-only z-[60] bg-demo-accent px-4 py-3 font-semibold text-demo-bg focus:not-sr-only focus:fixed focus:top-14 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="field-main">
        <Hero />
        <Work />
        <Index />
        <Studio />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

/* Layout helpers ---------------------------------------------------------- */

/** The 12-column grid every section hangs from. */
function Grid({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`mx-auto grid w-full max-w-[110rem] grid-cols-4 gap-x-4 px-4 md:grid-cols-12 md:gap-x-5 md:px-6 ${className}`}>
      {children}
    </div>
  );
}

/** Small monospaced metadata: indices, captions, years. */
function Meta({ className = "", children }: { className?: string; children: ReactNode }) {
  return <span className={`font-field-mono text-[0.6875rem] leading-snug uppercase ${className}`}>{children}</span>;
}

/** A section opens on a heavy rule, a number and a name, never a headline. */
function SectionHead({
  id,
  number,
  title,
  aside,
}: {
  id: string;
  number: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="col-span-full flex items-baseline justify-between gap-4 border-t-2 border-demo-fg pt-3">
      <h2 id={id} className="flex items-baseline gap-3 text-sm font-bold uppercase md:gap-5">
        <Meta className="font-normal opacity-60">({number})</Meta>
        {title}
      </h2>
      {aside ? <Meta className="text-right opacity-60">{aside}</Meta> : null}
    </div>
  );
}

/** Sections sit under the demo bar and the sticky header. */
const anchorOffset = "scroll-mt-[6.25rem]";

/* Header ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="sticky top-11 z-40 border-b border-demo-fg/20 bg-demo-bg">
      <Grid className="h-14 items-center">
        <a
          href="#top"
          className="col-span-2 flex items-center gap-2 text-[1.0625rem] font-black tracking-[-0.04em] whitespace-nowrap uppercase [word-spacing:0.12em] md:col-span-3"
        >
          <span aria-hidden="true" className="size-2.5 bg-demo-accent" />
          {fieldOffice.name}
        </a>
        <p className="hidden lg:col-span-3 lg:block">
          <Meta className="opacity-60">{fieldOffice.descriptor}</Meta>
        </p>
        <nav aria-label="Field Office" className="hidden md:col-span-6 md:block lg:col-span-4">
          <ul className="flex gap-6 text-sm font-semibold">
            {fieldNav.map((item, index) => (
              <li key={item.href}>
                <a href={item.href} className="group inline-flex items-baseline gap-1.5">
                  <Meta className="opacity-50">{String(index + 1).padStart(2, "0")}</Meta>
                  <span className="underline-offset-4 group-hover:underline">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="col-span-2 flex justify-end md:col-span-3 lg:col-span-2">
          <a
            href="#contact"
            className="hidden h-9 items-center bg-demo-fg px-3 text-sm font-semibold whitespace-nowrap text-demo-bg transition-colors hover:bg-demo-accent md:inline-flex"
          >
            Start a project
          </a>
          <MobileNav />
        </div>
      </Grid>
    </header>
  );
}

/* Hero -------------------------------------------------------------------- */

function Hero() {
  const facts: [string, ReactNode][] = [
    ["Practice", fieldOffice.descriptor],
    ["Since", `${fieldOffice.founded}, ${fieldOffice.address[1].split(",")[0]}`],
    ["Now", "7 projects on site and in the studio"],
  ];

  return (
    <section id="top" aria-labelledby="field-title" className="pt-6 pb-10 md:pt-8 md:pb-16">
      <Grid>
        <h1
          id="field-title"
          className="animate-rise col-span-full text-[clamp(4.5rem,21.5vw,22rem)] leading-[0.8] font-black tracking-[-0.065em] whitespace-nowrap uppercase [font-stretch:105%] md:text-[12.4vw] md:leading-[0.85]"
        >
          Field
          <br className="md:hidden" />
          <span className="hidden md:inline"> </span>
          Office<span className="text-demo-accent">.</span>
        </h1>

        <dl
          className="animate-rise col-span-full mt-8 grid grid-cols-2 gap-x-4 gap-y-5 border-t-2 border-demo-fg pt-3 md:mt-12 md:grid-cols-12 md:gap-x-5"
          style={{ "--delay": "160ms" } as CSSProperties}
        >
          {facts.map(([term, detail], index) => (
            <div key={term} className="md:col-span-3">
              <dt>
                <Meta className="opacity-60">
                  ({String.fromCharCode(65 + index)}) {term}
                </Meta>
              </dt>
              <dd className="mt-1 max-w-[16rem] text-sm leading-snug font-semibold">{detail}</dd>
            </div>
          ))}
          <div className="flex items-end md:col-span-3 md:justify-end">
            <a href="#work" className="group inline-flex items-center gap-2 text-sm font-semibold">
              Selected work
              <span
                aria-hidden="true"
                className="inline-grid size-7 place-items-center bg-demo-accent text-demo-bg transition-transform group-hover:translate-y-0.5"
              >
                ↓
              </span>
            </a>
          </div>
        </dl>
      </Grid>
    </section>
  );
}

/* Work -------------------------------------------------------------------- */

/** Where each featured project sits on the grid, and the shape of its plate. */
const workLayout: Record<Plate, { cell: string; frame: string }> = {
  pavilion: { cell: "md:col-span-12", frame: "aspect-[4/3] md:aspect-[21/9]" },
  house: { cell: "md:col-span-5", frame: "aspect-[4/5]" },
  library: { cell: "md:col-span-7 md:self-end", frame: "aspect-[4/3]" },
  terminal: { cell: "md:col-span-8", frame: "aspect-[3/2]" },
  bakehouse: { cell: "md:col-span-4 md:self-end", frame: "aspect-square" },
  observatory: { cell: "md:col-span-10 md:col-start-3", frame: "aspect-[4/3] md:aspect-[21/9]" },
};

function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className={`${anchorOffset} pb-24 md:pb-40`}>
      <Grid className="gap-y-14 md:gap-y-24">
        <SectionHead
          id="work-title"
          number="01"
          title="Selected work"
          aside={`${featured.length} of ${projects.length} · 2023–2026`}
        />
        {featured.map((project) => (
          <ProjectCard key={project.index} project={project} />
        ))}
      </Grid>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const plate = project.plate ?? "pavilion";
  const layout = workLayout[plate];

  return (
    <article aria-labelledby={`project-${project.index}`} className={`reveal col-span-full ${layout.cell}`}>
      <div
        role="img"
        aria-label={`Drawing standing in for photography of ${project.title}, a fictional project.`}
        className={`@container relative overflow-hidden bg-[color-mix(in_oklab,var(--demo-fg)_7%,var(--demo-bg))] ${layout.frame}`}
      >
        <div aria-hidden="true" className="absolute inset-0">
          <PlateDrawing plate={plate} />
        </div>
        <Meta className="absolute top-3 left-3 bg-demo-bg px-1.5 py-0.5">{project.index}</Meta>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <h3
          id={`project-${project.index}`}
          className="text-xl leading-tight font-extrabold tracking-[-0.03em] md:text-2xl"
        >
          {project.title}
        </h3>
        <Meta className="pt-1.5 text-right opacity-60 lg:order-last">{project.year}</Meta>
        <p className="col-span-full text-sm leading-snug opacity-70 lg:col-span-1 lg:pt-1">
          {project.line}
        </p>
      </div>
      <p className="mt-2">
        <Meta className="opacity-60">
          {project.disciplines.join(" / ")} — {project.location}
        </Meta>
      </p>
    </article>
  );
}

/*
 * Plates: flat drawings in the studio's three colours that stand in for
 * project photography. Sizes are in container units so each scales as one.
 */
function PlateDrawing({ plate }: { plate: Plate }) {
  switch (plate) {
    case "pavilion":
      return (
        <>
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-demo-accent" />
          <div className="absolute inset-x-0 bottom-[30%] h-[1.2cqw] bg-demo-fg" />
          <div className="absolute right-[12%] bottom-[31%] left-[12%] flex h-[30%] justify-between px-[3%]">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="h-full w-[0.7cqw] bg-demo-fg" />
            ))}
          </div>
          <div className="absolute top-[36%] right-[8%] left-[8%] h-[3.4cqw] bg-demo-fg" />
          <div className="absolute top-[34.6%] right-[8%] left-[8%] h-[0.4cqw] bg-demo-fg/40" />
          {/* Reflection */}
          <div className="absolute right-[12%] bottom-[8%] left-[12%] flex h-[22%] justify-between px-[3%] opacity-40">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="h-full w-[0.7cqw] bg-demo-bg [mask-image:linear-gradient(black,transparent)]" />
            ))}
          </div>
        </>
      );

    case "house":
      return (
        <div className="absolute inset-x-[16%] top-[14%] bottom-0 flex flex-col">
          <div className="h-[22%] bg-demo-fg [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
          <div className="grid flex-1 grid-cols-3 grid-rows-4 gap-[5cqw] bg-demo-fg p-[7cqw]">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className={i === 7 ? "bg-demo-accent" : i === 10 ? "row-span-1 bg-demo-bg/80" : "bg-demo-bg/90"}
              />
            ))}
          </div>
        </div>
      );

    case "library": {
      const spines = [62, 80, 70, 88, 54, 76, 92, 68, 84, 58, 74, 90, 66, 82, 60, 78];
      return (
        <div className="absolute inset-[9%] flex flex-col justify-between">
          {[0, 1, 2].map((shelf) => (
            <div key={shelf} className="flex h-[28%] items-end gap-[0.9cqw] border-b-[1.2cqw] border-demo-fg">
              {spines.map((_, i) => {
                const height = spines[(i + shelf * 5) % spines.length];
                const accent = shelf === 1 && i === 6;
                return (
                  <span
                    key={i}
                    style={{ height: `${height}%` }}
                    className={`flex-1 ${accent ? "bg-demo-accent" : i % 4 === 0 ? "bg-demo-fg/60" : "bg-demo-fg"}`}
                  />
                );
              })}
            </div>
          ))}
          <span className="absolute top-[-4%] right-0 font-field-mono text-[2.6cqw] font-medium">Q—0347</span>
        </div>
      );
    }

    case "terminal":
      return (
        <div className="absolute inset-0 grid grid-cols-[1fr_2fr] bg-demo-fg text-demo-bg">
          <div className="flex flex-col justify-between bg-demo-accent p-[5cqw]">
            <span className="text-[30cqw] leading-[0.75] font-black tracking-[-0.06em]">A</span>
            <span className="font-field-mono text-[2.4cqw] uppercase">Gate</span>
          </div>
          <div className="flex flex-col justify-between p-[5cqw]">
            <span className="text-[22cqw] leading-[0.7] font-black">→</span>
            <span>
              <span className="block text-[5.8cqw] leading-[0.95] font-extrabold tracking-[-0.04em] [font-stretch:75%] uppercase">
                Ferries to
                <br />
                Wolfe Point
              </span>
              <span className="mt-[2cqw] block font-field-mono text-[2.4cqw] uppercase opacity-60">
                Departs :15 and :45
              </span>
            </span>
          </div>
        </div>
      );

    case "bakehouse":
      return (
        <>
          <div className="absolute inset-x-[14%] top-[18%] bottom-[18%] rounded-t-full bg-demo-fg" />
          <div className="absolute inset-x-[30%] top-[46%] bottom-[18%] rounded-t-full bg-demo-accent" />
          <div className="absolute inset-x-0 bottom-0 h-[18%] bg-demo-fg/80" />
          <span className="absolute right-[6%] bottom-[5%] text-[6cqw] font-black tracking-[-0.05em] text-demo-bg uppercase">
            Norrow
          </span>
        </>
      );

    case "observatory":
      return (
        <>
          <div className="absolute inset-x-0 top-[62%] h-[0.5cqw] bg-demo-fg/40" />
          <div className="absolute inset-x-0 bottom-0 h-[24%] bg-[color-mix(in_oklab,var(--demo-fg)_16%,var(--demo-bg))]" />
          <div className="absolute bottom-[24%] left-[34%] flex h-[22%] w-[32%] justify-between px-[8%]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-full w-[0.9cqw] bg-demo-fg" />
            ))}
          </div>
          <div className="absolute top-[30%] left-[30%] h-[24%] w-[40%] bg-demo-fg">
            <div className="absolute inset-x-[10%] top-[38%] h-[16%] bg-demo-accent" />
          </div>
        </>
      );
  }
}

/* Index ------------------------------------------------------------------- */

function Index() {
  return (
    <section
      id="index"
      aria-labelledby="index-title"
      className={`${anchorOffset} pb-24 md:pb-40`}
    >
      <Grid className="gap-y-10">
        <SectionHead id="index-title" number="02" title="Index" aside="Every project since 2020" />
        <div className="col-span-full">
          <ProjectIndex />
        </div>
      </Grid>
    </section>
  );
}

/* Studio ------------------------------------------------------------------ */

function Studio() {
  return (
    <section id="studio" aria-labelledby="studio-title" className={`${anchorOffset} pb-24 md:pb-40`}>
      <Grid className="gap-y-14 md:gap-y-20">
        <SectionHead id="studio-title" number="03" title="Studio" aside={`Est. ${fieldOffice.founded}`} />

        <p className="reveal col-span-full text-[clamp(1.875rem,1.1rem+3.4vw,4.75rem)] leading-[0.98] font-extrabold tracking-[-0.045em] md:col-span-10">
          We design buildings, the rooms inside them and the signs that explain them,{" "}
          <span className="text-demo-accent">with the same hands at every scale.</span>
        </p>

        <div className="col-span-full grid gap-6 text-[0.9375rem] leading-relaxed md:col-span-5 md:col-start-8 md:grid-cols-2 md:gap-5">
          <p>
            Field Office is a studio of eighteen in a former foundry on Toronto’s east side. Every
            project is led by a partner from first sketch to the last screw.
          </p>
          <p className="opacity-70">
            We work for public bodies, cultural institutions and a few private clients each
            year. Most of our work comes from people we have worked with before.
          </p>
        </div>

        <dl className="col-span-full grid grid-cols-1 border-t border-demo-fg/20 sm:grid-cols-3">
          {figures.map(([value, label]) => (
            <div
              key={value}
              className="reveal border-b border-demo-fg/20 py-5 sm:border-b-0 sm:border-l sm:px-5 sm:first:border-l-0 sm:first:pl-0"
            >
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block text-[clamp(3.5rem,2rem+5vw,7.5rem)] leading-[0.85] font-black tracking-[-0.06em]">
                  {value}
                </span>
                <span className="mt-3 block max-w-[18rem] text-sm opacity-70">{label}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="col-span-full">
          <h3 className="flex items-baseline gap-3 border-b-2 border-demo-fg pb-3 text-sm font-bold uppercase">
            <Meta className="font-normal opacity-60">(03.1)</Meta>
            What we do
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 pt-5 md:grid-cols-4 md:gap-x-5">
            {services.map((service) => (
              <div key={service.discipline}>
                <h4 className="text-lg font-extrabold tracking-[-0.02em]">{service.discipline}</h4>
                <ul className="mt-2 space-y-1 text-sm opacity-70">
                  {service.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-full">
          <div className="flex items-baseline justify-between gap-4 border-b-2 border-demo-fg pb-3">
            <h3 className="flex items-baseline gap-3 text-sm font-bold uppercase">
              <Meta className="font-normal opacity-60">(03.2)</Meta>
              People
            </h3>
            <Meta className="opacity-60">Fictional, like the studio</Meta>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 pt-5 sm:grid-cols-3 md:grid-cols-6 md:gap-x-5">
            {people.map((person, index) => (
              <li key={person.name}>
                <Portrait name={person.name} lead={index < 2} />
                <p className="mt-3 font-extrabold tracking-[-0.02em]">{person.name}</p>
                <p className="text-sm opacity-60">{person.role}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm">
            We are hiring an intermediate architect.{" "}
            <a
              href={`mailto:${fieldOffice.careers}`}
              className="font-semibold underline underline-offset-4 hover:text-demo-accent"
            >
              {fieldOffice.careers}
            </a>
          </p>
        </div>
      </Grid>
    </section>
  );
}

/** A monogram tile in place of a photograph of a person who does not exist. */
function Portrait({ name, lead }: { name: string; lead: boolean }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("");
  return (
    <div
      aria-hidden="true"
      className={`@container relative aspect-[4/5] ${lead ? "bg-demo-fg text-demo-bg" : "bg-[color-mix(in_oklab,var(--demo-fg)_9%,var(--demo-bg))]"}`}
    >
      <span className="absolute bottom-[6cqw] left-[7cqw] text-[34cqw] leading-[0.8] font-black tracking-[-0.07em]">
        {initials}
      </span>
      {lead ? <span className="absolute top-[7cqw] right-[7cqw] size-[8cqw] bg-demo-accent" /> : null}
    </div>
  );
}

/* Contact ----------------------------------------------------------------- */

function Contact() {
  const lines: [string, ReactNode][] = [
    [
      "New projects",
      <a key="new" href={`mailto:${fieldOffice.newBusiness}`} className="break-all underline-offset-4 hover:underline">
        {fieldOffice.newBusiness}
      </a>,
    ],
    [
      "Everything else",
      <a key="general" href={`mailto:${fieldOffice.email}`} className="break-all underline-offset-4 hover:underline">
        {fieldOffice.email}
      </a>,
    ],
    [
      "Telephone",
      <a key="tel" href={fieldOffice.phone.href} className="underline-offset-4 hover:underline">
        {fieldOffice.phone.label}
      </a>,
    ],
    ["Studio", fieldOffice.address.join(", ")],
  ];

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className={`${anchorOffset} bg-demo-accent pt-3 pb-16 text-demo-bg md:pb-24`}
    >
      <Grid className="gap-y-12 md:gap-y-16">
        <div className="col-span-full flex items-baseline justify-between gap-4 border-t-2 border-demo-bg pt-3">
          <p className="flex items-baseline gap-3 text-sm font-bold uppercase md:gap-5">
            <Meta className="font-normal opacity-70">(04)</Meta>
            Contact
          </p>
          <Meta className="text-right opacity-70">Booking from spring 2027</Meta>
        </div>

        <h2
          id="contact-title"
          className="col-span-full text-[clamp(3.5rem,14vw,15rem)] leading-[0.82] font-black tracking-[-0.065em] uppercase"
        >
          Start a<br />
          project
        </h2>

        <p className="col-span-full max-w-md text-lg leading-snug font-semibold md:col-span-4">
          Send us a site, a brief or a single drawing. A partner reads every message and replies
          within the week.
        </p>

        <dl className="col-span-full grid gap-x-5 gap-y-6 sm:grid-cols-2 md:col-span-7 md:col-start-6 md:grid-cols-2">
          {lines.map(([term, detail]) => (
            <div key={term} className="border-t border-demo-bg/40 pt-3">
              <dt>
                <Meta className="opacity-70">{term}</Meta>
              </dt>
              <dd className="mt-1 text-lg leading-snug font-bold tracking-[-0.01em]">{detail}</dd>
            </div>
          ))}
        </dl>
      </Grid>
    </section>
  );
}

/* Footer ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="bg-demo-fg pt-6 pb-8 text-demo-bg">
      <Grid className="gap-y-10">
        <p
          aria-hidden="true"
          className="col-span-full text-[clamp(3rem,15.5vw,16rem)] leading-[0.8] font-black tracking-[-0.065em] uppercase"
        >
          Field Office<span className="text-demo-accent">.</span>
        </p>
        <nav aria-label="Field Office, footer" className="col-span-2 md:col-span-3">
          <ul className="space-y-1 text-sm font-semibold">
            {fieldNav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="underline-offset-4 hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="col-span-2 text-sm md:col-span-3">
          <p>{fieldOffice.address[0]}</p>
          <p>{fieldOffice.address[1]}</p>
          <p className="mt-3">
            <a href={fieldOffice.phone.href} className="underline-offset-4 hover:underline">
              {fieldOffice.phone.label}
            </a>
          </p>
        </div>
        <p className="col-span-full text-sm opacity-60 md:col-span-4 md:col-start-9">
          Field Office is a fictional studio, created as a demonstration concept. Its projects,
          clients, people and contact details are invented.
        </p>
        <div className="col-span-full flex justify-between border-t border-demo-bg/20 pt-4">
          <Meta className="opacity-60">© {fieldOffice.founded}–2026 {fieldOffice.name}</Meta>
          <a href="#top" className="font-field-mono text-[0.6875rem] uppercase underline-offset-4 hover:underline">
            Back to top ↑
          </a>
        </div>
      </Grid>
    </footer>
  );
}
