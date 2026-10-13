import { siteConfig } from "@/config/site";

type WordmarkProps = {
  /** "inline" for the header, "display" for oversized footer use. */
  size?: "inline" | "display";
  className?: string;
};

/**
 * Temporary typographic wordmark. Replace the contents of this component
 * (or swap in an SVG) when the final identity is chosen; every placement
 * in the site renders through here.
 */
export function Wordmark({ size = "inline", className = "" }: WordmarkProps) {
  const sizing =
    size === "display"
      ? "text-display-xl tracking-[-0.045em]"
      : "text-[1.75rem] leading-none tracking-[-0.03em]";

  return (
    <span className={`type-display inline-flex items-baseline ${sizing} ${className}`}>
      <span>{siteConfig.name}</span>
      <span aria-hidden="true" className="text-accent">
        .
      </span>
    </span>
  );
}
