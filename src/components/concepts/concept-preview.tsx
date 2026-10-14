import type { CSSProperties } from "react";
import type { Concept } from "@/content/concepts";
import { cormorant, jost } from "@/components/demos/restaurant/fonts";
import { archivo, geistMono } from "@/components/demos/studio/fonts";
import { figtree, fraunces } from "@/components/demos/boutique/fonts";
import { Vessel } from "@/components/demos/boutique/vessel";
import type { Shape } from "@/components/demos/boutique/content";

/**
 * Typographic previews of each demonstration concept's homepage.
 * Built in markup rather than images so they stay sharp and light.
 * Every size is in container units (cqw), so a preview scales as one piece
 * at any width, like a screenshot would.
 *
 * Temporary: these will be replaced by live previews of the full demos.
 */
export function ConceptPreview({ concept }: { concept: Concept }) {
  const Preview = previews[concept.slug as keyof typeof previews];
  const style = {
    "--demo-bg": concept.palette.bg,
    "--demo-fg": concept.palette.fg,
    "--demo-accent": concept.palette.accent,
  } as CSSProperties;

  return (
    <div
      role="img"
      aria-label={`Preview of ${concept.title}, a demonstration concept for a fictional business called ${concept.demoName}.`}
      style={style}
      className="@container relative aspect-[16/10] w-full overflow-hidden bg-demo-bg text-demo-fg select-none"
    >
      <div aria-hidden="true" className="absolute inset-0">
        {Preview ? <Preview name={concept.demoName} /> : null}
      </div>
    </div>
  );
}

/** Each concept's name set in that concept's typographic voice, for swatches and labels. */
export const conceptNameClass: Record<string, string> = {
  restaurant: "type-display italic",
  studio: "font-black uppercase tracking-[-0.04em] [word-spacing:0.1em]",
  boutique: "type-display tracking-[0.02em]",
  professional: "font-medium tracking-[-0.02em]",
};

type PreviewProps = { name: string };

/* 01 — The Restaurant: nocturnal, italic serif, a plate drawn in rings.
   Set in Ardoise's own Cormorant and Jost so it matches the full demo. */
function RestaurantPreview({ name }: PreviewProps) {
  return (
    <div
      className={`${cormorant.variable} ${jost.variable} absolute inset-0 flex flex-col px-[5cqw] py-[3.6cqw] font-ardoise-sans`}
    >
      <div className="flex items-center justify-between text-[1.35cqw] tracking-[0.12em] uppercase">
        <span className="font-ardoise-display text-[2.2cqw] tracking-normal normal-case italic">
          {name}
        </span>
        <span className="hidden gap-[3cqw] opacity-75 @[20rem]:flex">
          <span>Menu</span>
          <span>Wine</span>
          <span>Private dining</span>
          <span>Visit</span>
        </span>
        <span className="border border-demo-accent px-[1.6cqw] py-[0.8cqw] text-demo-accent">
          Reserve
        </span>
      </div>

      <div className="relative flex flex-1 items-center">
        <div className="relative z-10">
          <p className="text-[1.15cqw] tracking-[0.28em] text-demo-accent uppercase">
            Wood fire · Seasonal · Natural wine
          </p>
          <p className="mt-[1.6cqw] font-ardoise-display text-[15cqw] leading-[0.82] font-light tracking-[-0.045em] italic">
            {name}
          </p>
          <p className="mt-[2.4cqw] max-w-[34cqw] text-[1.7cqw] leading-[1.45] opacity-80">
            A small dining room cooking over embers. Dinner Wednesday to Sunday.
          </p>
        </div>

        {/* The plate */}
        <div className="absolute top-1/2 right-[-9cqw] aspect-square w-[46cqw] -translate-y-1/2 rounded-full border border-demo-fg/20">
          <div className="absolute inset-[9%] rounded-full border border-demo-fg/15" />
          <div className="absolute inset-[24%] rounded-full bg-demo-accent/90" />
          <div className="absolute inset-[38%] rounded-full bg-demo-bg/25" />
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-demo-fg/20 pt-[1.8cqw] text-[1.45cqw]">
        <span className="opacity-75">Tonight · 17:30 – 23:00</span>
        <span className="text-demo-accent">Book a table →</span>
      </div>
    </div>
  );
}

/* 02 — The Studio: strict grid, heavy uppercase grotesk, an index of work.
   Set in Field Office's own Archivo and Geist Mono so it matches the full demo. */
function StudioPreview({ name }: PreviewProps) {
  const [first, ...rest] = name.split(" ");
  return (
    <div
      className={`${archivo.variable} ${geistMono.variable} absolute inset-0 grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-x-[1.6cqw] px-[3.6cqw] py-[3cqw] font-field-sans`}
    >
      <div className="col-span-12 flex justify-between text-[1.3cqw] font-semibold tracking-[0.02em] uppercase">
        <span>{name}</span>
        <span className="flex gap-[2.4cqw]">
          <span>Work</span>
          <span className="opacity-50">Studio</span>
          <span className="opacity-50">Contact</span>
        </span>
      </div>

      <p className="col-span-8 self-end text-[13.5cqw] leading-[0.8] font-black tracking-[-0.065em] uppercase">
        {first}
        <br />
        {rest.join(" ")}
        <span className="text-demo-accent">.</span>
      </p>

      <div className="col-span-4 flex flex-col justify-end gap-[1.6cqw] self-stretch pt-[4cqw]">
        <div className="relative flex-1">
          <div className="absolute inset-0 bg-demo-fg" />
          <div className="absolute right-0 bottom-0 h-[42%] w-[58%] bg-demo-accent" />
        </div>
      </div>

      <ul className="col-span-12 mt-[2.6cqw] grid grid-cols-3 gap-x-[1.6cqw] border-t-[0.25cqw] border-demo-fg pt-[1.2cqw] text-[1.3cqw] leading-tight">
        {[
          ["01", "Harbour Pavilion", "Architecture"],
          ["02", "Linden House", "Interiors"],
          ["03", "Quarry Library", "Identity"],
        ].map(([index, title, kind]) => (
          <li key={index} className="flex gap-[1.2cqw]">
            <span className="font-field-mono opacity-50">{index}</span>
            <span className="font-semibold">{title}</span>
            <span className="ml-auto opacity-50">{kind}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* 03 — The Boutique: centred and soft, objects in arched niches.
   Set in Maison Argile's own Fraunces and Figtree, with the same drawn objects. */
function BoutiquePreview({ name }: PreviewProps) {
  const objects: { title: string; price: string; shape: Shape; glaze: string; niche: string }[] = [
    { title: "Vase no. 3", price: "$68", shape: "vase", glaze: "#e8dac6", niche: "88%" },
    { title: "Low bowl", price: "$42", shape: "bowl", glaze: "#b7b0a4", niche: "100%" },
    { title: "Carafe", price: "$54", shape: "carafe", glaze: "#f2ece2", niche: "88%" },
  ];
  return (
    <div
      className={`${fraunces.variable} ${figtree.variable} absolute inset-0 flex flex-col px-[4.4cqw] py-[3cqw] font-argile-sans`}
    >
      <div className="grid grid-cols-3 items-center text-[1.3cqw]">
        <span className="flex gap-[2.4cqw]">
          <span>Shop</span>
          <span className="opacity-70">The making</span>
        </span>
        <span className="argile-display text-center text-[2.6cqw]">{name}</span>
        <span className="text-right">Bag (0)</span>
      </div>

      <p className="mt-[3cqw] text-center text-[1.1cqw] tracking-[0.2em] uppercase opacity-80">
        Autumn collection · Stoneware &amp; linen
      </p>
      <p className="argile-display mt-[1cqw] text-center text-[6cqw] leading-none italic">
        Objects made slowly.
      </p>

      <ul className="mx-auto mt-[3cqw] grid w-[80%] flex-1 grid-cols-3 items-end gap-[2.4cqw]">
        {objects.map((object, index) => (
          <li key={object.title} className="flex h-full flex-col justify-end">
            <div
              className="flex items-end justify-center rounded-t-full px-[14%] pb-[10%]"
              style={{
                height: object.niche,
                backgroundColor: `color-mix(in oklab, var(--demo-bg) ${index === 1 ? 38 : 66}%, white)`,
              }}
            >
              <Vessel shape={object.shape} color={object.glaze} className="w-[78%]" />
            </div>
            <div className="mt-[0.8cqw] flex justify-between text-[1.25cqw]">
              <span className="argile-display text-[1.45cqw]">{object.title}</span>
              <span className="opacity-80">{object.price}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* 04 — The Professional: calm, structured, one clear action. */
function ProfessionalPreview({ name }: PreviewProps) {
  const [first, ...rest] = name.split(" ");
  return (
    <div className="absolute inset-0 flex flex-col px-[5cqw] py-[3.4cqw]">
      <div className="flex items-center justify-between text-[1.4cqw]">
        <span className="font-semibold tracking-[-0.01em]">
          {first} <span className="font-normal opacity-60">{rest.join(" ")}</span>
        </span>
        <span className="hidden gap-[3cqw] opacity-70 @[20rem]:flex">
          <span>Services</span>
          <span>Approach</span>
          <span>About</span>
        </span>
        <span className="bg-demo-accent px-[1.8cqw] py-[0.9cqw] text-demo-bg">
          Book a consultation
        </span>
      </div>

      <div className="mt-[6cqw] grid grid-cols-12 gap-x-[2cqw]">
        <p className="col-span-2 pt-[1cqw] text-[1.2cqw] tracking-[0.1em] text-demo-accent uppercase">
          Advisory
        </p>
        <div className="col-span-9">
          <p className="text-[6.2cqw] leading-[1.02] font-normal tracking-[-0.04em]">
            Clear financial advice for independent businesses.
          </p>
          <p className="mt-[2.4cqw] flex items-center gap-[2.4cqw] text-[1.45cqw]">
            <span className="opacity-60">Next available consultation · Tuesday, 10:00</span>
            <span className="border-b border-demo-accent pb-[0.2cqw] text-demo-accent">
              Choose a time →
            </span>
          </p>
        </div>
      </div>

      <ul className="mt-auto grid grid-cols-3 gap-x-[2cqw] text-[1.4cqw]">
        {[
          ["Bookkeeping review", "A clear picture of where you stand."],
          ["Tax planning", "Fewer surprises at year end."],
          ["Growth advisory", "Decisions made with real numbers."],
        ].map(([title, detail], index) => (
          <li key={title} className="border-t border-demo-fg/25 pt-[1.4cqw]">
            <span className="text-demo-accent">0{index + 1}</span>
            <p className="mt-[0.8cqw] font-medium">{title}</p>
            <p className="mt-[0.4cqw] opacity-60">{detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const previews = {
  restaurant: RestaurantPreview,
  studio: StudioPreview,
  boutique: BoutiquePreview,
  professional: ProfessionalPreview,
};
