import { siteConfig } from "@/config/site";

/**
 * The hero wordmark: large, centred, real text, and the page's h1.
 * Self-contained so the next stage can replace its insides with the
 * interactive water simulation; keep the visible text (or an equivalent
 * accessible name) when it does.
 */
export function Wordmark() {
  return (
    <h1 className="type-display text-center text-[clamp(4rem,0.5rem+17vw,17rem)] leading-[0.85] tracking-[-0.045em]">
      {siteConfig.name}
      <span aria-hidden="true" className="text-accent">
        .
      </span>
    </h1>
  );
}
