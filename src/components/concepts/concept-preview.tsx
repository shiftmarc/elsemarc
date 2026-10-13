import type { CSSProperties } from "react";
import type { Concept } from "@/content/concepts";

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

/* 01 — The Restaurant: nocturnal, italic serif, a plate drawn in rings. */
function RestaurantPreview({ name }: PreviewProps) {
  return (
    <div className="absolute inset-0 flex flex-col px-[5cqw] py-[3.6cqw]">
      <div className="flex items-center justify-between text-[1.35cqw] tracking-[0.12em] uppercase">
        <span className="type-display text-[2.2cqw] tracking-normal normal-case italic">
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
          <p className="type-label text-[1.25cqw] text-demo-accent">
            Wood fire · Seasonal · Natural wine
          </p>
          <p className="type-display mt-[1.6cqw] text-[15cqw] leading-[0.82] tracking-[-0.04em] italic">
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

/* 02 — The Studio: strict grid, heavy uppercase grotesk, an index of work. */
function StudioPreview({ name }: PreviewProps) {
  const [first, ...rest] = name.split(" ");
  return (
    <div className="absolute inset-0 grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-x-[1.6cqw] px-[3.6cqw] py-[3cqw] font-sans">
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
            <span className="opacity-50">{index}</span>
            <span className="font-semibold">{title}</span>
            <span className="ml-auto opacity-50">{kind}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* 03 — The Boutique: centred and soft, objects as simple sculpted forms. */
function BoutiquePreview({ name }: PreviewProps) {
  const objects = [
    { title: "Vase no. 3", price: "$68", shape: "rounded-t-full h-[78%] w-[52%]" },
    { title: "Low bowl", price: "$42", shape: "rounded-b-full h-[34%] w-[74%]" },
    { title: "Carafe", price: "$54", shape: "rounded-[40%_40%_12%_12%] h-[64%] w-[36%]" },
  ];
  return (
    <div className="absolute inset-0 flex flex-col px-[4.4cqw] py-[3cqw]">
      <div className="grid grid-cols-3 items-center text-[1.3cqw] tracking-[0.14em] uppercase">
        <span className="flex gap-[2.4cqw]">
          <span>Shop</span>
          <span className="opacity-60">Journal</span>
        </span>
        <span className="type-display text-center text-[2.6cqw] tracking-[0.02em] normal-case">
          {name}
        </span>
        <span className="text-right">Bag (0)</span>
      </div>

      <p className="type-display mt-[3.4cqw] text-center text-[5.4cqw] leading-none tracking-[-0.02em] italic">
        Objects made slowly.
      </p>
      <p className="mt-[1.2cqw] text-center text-[1.3cqw] tracking-[0.14em] uppercase opacity-70">
        Autumn collection · Stoneware
      </p>

      <ul className="mt-[3.2cqw] grid flex-1 grid-cols-3 gap-[2cqw]">
        {objects.map((object, index) => (
          <li key={object.title} className="flex flex-col">
            <div
              className="relative flex flex-1 items-end justify-center"
              style={{ backgroundColor: `color-mix(in oklab, var(--demo-bg) ${88 - index * 6}%, white)` }}
            >
              <div className={`mb-[12%] bg-demo-accent ${object.shape}`} style={{ opacity: 0.55 + index * 0.15 }} />
            </div>
            <div className="mt-[1cqw] flex justify-between text-[1.35cqw]">
              <span>{object.title}</span>
              <span className="opacity-70">{object.price}</span>
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
