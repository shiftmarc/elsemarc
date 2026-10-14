import type { CSSProperties, ReactNode } from "react";
import type { Shape } from "./content";

/*
 * Drawn objects that stand in for product photography. Each silhouette is an
 * SVG mask over a CSS-lit glaze, so a piece reads as soft and rounded rather
 * than flat, with a fleck of iron in stoneware and a weave in linen. Masks
 * need no ids, so any number can share a page or sit inside a dialog.
 * Everything is drawn on a 120 × 140 board with the ground at y = 130.
 */

type ShapeDrawing = {
  /** Silhouette markup, used as the mask. */
  body: string;
  /** Rims, lids and wicks drawn over the glaze. */
  overlay?: ReactNode;
  /** Half-width of the contact shadow. */
  shadow: number;
  texture?: "stoneware" | "linen";
};

const rim = "rgb(40 24 14 / 0.26)";
const line = "rgb(40 24 14 / 0.18)";

function bud(cx: number, top: number, r: number) {
  return `<rect x='${cx - 3.5}' y='${top}' width='7' height='${130 - r - top}' rx='3'/><circle cx='${cx}' cy='${130 - r}' r='${r}'/>`;
}

const drawings: Record<Shape, ShapeDrawing> = {
  vase: {
    body: "<path d='M48 18h24c0 10-4 14-4 22c0 8 24 18 24 52c0 24-14 38-32 38s-32-14-32-38c0-34 24-44 24-52c0-8-4-12-4-22z'/>",
    overlay: <ellipse cx="60" cy="18.5" rx="11.5" ry="2.4" fill={rim} />,
    shadow: 30,
  },
  bowl: {
    body: "<path d='M12 84h96c0 26-20 46-48 46s-48-20-48-46z'/><ellipse cx='60' cy='84' rx='48' ry='8'/>",
    overlay: <ellipse cx="60" cy="84.6" rx="44" ry="6" fill={rim} />,
    shadow: 40,
  },
  carafe: {
    body: "<path d='M52 20h16v30c0 6 22 16 22 48c0 20-12 32-30 32s-30-12-30-32c0-32 22-42 22-48z'/>",
    overlay: <ellipse cx="60" cy="20.4" rx="7.5" ry="2" fill={rim} />,
    shadow: 28,
  },
  buds: {
    body: bud(34, 74, 13) + bud(60, 50, 17) + bud(87, 90, 11),
    overlay: (
      <>
        <ellipse cx="34" cy="74.4" rx="3" ry="1" fill={rim} />
        <ellipse cx="60" cy="50.4" rx="3" ry="1" fill={rim} />
        <ellipse cx="87" cy="90.4" rx="3" ry="1" fill={rim} />
      </>
    ),
    shadow: 46,
  },
  tumblers: {
    body:
      "<path d='M26 70h30l-3 54c-.3 4-3 6-6 6h-12c-3 0-5.7-2-6-6z'/>" +
      "<path d='M62 60h30l-3 64c-.3 4-3 6-6 6h-12c-3 0-5.7-2-6-6z'/>",
    overlay: (
      <>
        <ellipse cx="41" cy="70.6" rx="14" ry="2.2" fill={rim} />
        <ellipse cx="77" cy="60.6" rx="14" ry="2.2" fill={rim} />
      </>
    ),
    shadow: 40,
  },
  plate: {
    body: "<circle cx='60' cy='80' r='50'/>",
    overlay: (
      <>
        <circle cx="60" cy="80" r="35" fill="rgb(40 24 14 / 0.06)" />
        <circle cx="60" cy="80" r="35" fill="none" stroke={line} strokeWidth="1.5" />
      </>
    ),
    shadow: 30,
  },
  jar: {
    body:
      "<path d='M30 60c0-6 4-10 10-10h40c6 0 10 4 10 10v54c0 10-6 16-16 16h-28c-10 0-16-6-16-16z'/>" +
      "<path d='M32 50c0-8 12-13 28-13s28 5 28 13z'/><circle cx='60' cy='33' r='5.5'/>",
    overlay: <rect x="31" y="49.2" width="58" height="2" rx="1" fill={rim} />,
    shadow: 34,
  },
  napkins: {
    body:
      "<rect x='18' y='108' width='84' height='22' rx='5'/>" +
      "<rect x='22' y='92' width='78' height='18' rx='5'/>" +
      "<rect x='26' y='78' width='72' height='16' rx='5'/>",
    overlay: (
      <>
        <rect x="22" y="107.5" width="78" height="1.5" fill={line} />
        <rect x="26" y="91.5" width="72" height="1.5" fill={line} />
        <rect x="74" y="78" width="1" height="52" fill="rgb(40 24 14 / 0.08)" />
      </>
    ),
    shadow: 44,
    texture: "linen",
  },
  taper: {
    body:
      "<path d='M26 123c0-6 15-10 34-10s34 4 34 10-15 7-34 7-34-1-34-7z'/>" +
      "<rect x='53' y='72' width='14' height='46' rx='4'/><rect x='46' y='63' width='28' height='11' rx='4'/>",
    overlay: (
      <>
        <rect x="54.5" y="14" width="11" height="50" rx="2.5" fill="#f4eee4" />
        <rect x="54.5" y="14" width="3" height="50" rx="1.5" fill="rgb(255 255 255 / 0.5)" />
        <path d="M60 14v-5" stroke="#3a2a20" strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="60" cy="121" rx="26" ry="4" fill={rim} />
      </>
    ),
    shadow: 36,
  },
};

const textures = {
  // Thresholded noise: sparse iron flecks, irregular like real stoneware.
  stoneware: `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
      "<filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='7'/>" +
      "<feColorMatrix values='0 0 0 0 0.23  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 5 -3.4'/></filter>" +
      "<rect width='160' height='160' filter='url(#f)'/></svg>",
  )}") 0 0 / 160px 160px`,
  linen:
    "repeating-linear-gradient(0deg, rgb(40 24 14 / 0.07) 0 1px, transparent 1px 3px), " +
    "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.12) 0 1px, transparent 1px 4px)",
};

/** Soft top-left light, a cooler shade down the right, and the glaze beneath. */
function lit(color: string, texture: keyof typeof textures) {
  return [
    textures[texture],
    "radial-gradient(110% 80% at 30% 22%, rgb(255 255 255 / 0.38), transparent 58%)",
    "linear-gradient(90deg, transparent 48%, rgb(30 16 8 / 0.22))",
    color,
  ].join(", ");
}

export function Vessel({
  shape,
  color,
  className = "",
}: {
  shape: Shape;
  color: string;
  className?: string;
}) {
  const drawing = drawings[shape];
  const mask = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'>${drawing.body}</svg>`,
  )}")`;
  const glaze: CSSProperties = {
    background: lit(color, drawing.texture ?? "stoneware"),
    maskImage: mask,
    WebkitMaskImage: mask,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  };

  return (
    <div aria-hidden="true" className={`relative aspect-[6/7] ${className}`}>
      <svg viewBox="0 0 120 140" className="absolute inset-0 size-full blur-[1.5px]">
        <ellipse cx="60" cy="130.5" rx={drawing.shadow} ry="3.6" fill="rgb(40 24 14 / 0.2)" />
      </svg>
      <div className="absolute inset-0" style={glaze} />
      {drawing.overlay ? (
        <svg viewBox="0 0 120 140" className="absolute inset-0 size-full">
          {drawing.overlay}
        </svg>
      ) : null}
    </div>
  );
}
