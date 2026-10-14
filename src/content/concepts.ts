/**
 * The demonstration website concepts. These are studio concepts,
 * not client projects, and must always be labelled as such.
 * Business names are fictional and exist only to make the demos realistic.
 */
export type Concept = {
  slug: string;
  index: string;
  title: string;
  summary: string;
  /** The fictional business the demo is designed for. */
  demoName: string;
  /** One line describing the design direction. */
  direction: string;
  /** Identity colours, used by previews and swatches regardless of site theme. */
  palette: { bg: string; fg: string; accent: string };
  /** The kinds of business the design is made for. */
  suits: string[];
  /** What the demo homepage shows off, for the collection's spec sheet. */
  highlights: string[];
  /** The demo's typefaces, display first. */
  typefaces: string;
  /** Full-screen demo homepage, once it has been built. */
  demoHref?: string;
};

export const concepts: Concept[] = [
  {
    slug: "restaurant",
    index: "01",
    title: "The Restaurant",
    summary: "A demonstration concept for restaurants, cafés and bars.",
    demoName: "Ardoise",
    direction: "Warm, nocturnal and unhurried. Reservations front and centre.",
    palette: { bg: "#2a1714", fg: "#f0e3cc", accent: "#d4a457" },
    suits: ["Restaurants", "Cafés", "Wine bars", "Bakeries"],
    highlights: ["Table reservations", "Seasonal menu", "Private dining", "Hours and location"],
    typefaces: "Cormorant & Jost",
    demoHref: "/demo/restaurant",
  },
  {
    slug: "studio",
    index: "02",
    title: "The Studio",
    summary: "A demonstration concept for creative and design studios.",
    demoName: "Field Office",
    direction: "Rigorous grid, heavy grotesk, work first and words second.",
    palette: { bg: "#e8e8e3", fg: "#111111", accent: "#2747e6" },
    suits: ["Design studios", "Architects", "Photographers", "Agencies"],
    highlights: ["Featured work", "Filterable project index", "Studio profile", "Contact"],
    typefaces: "Archivo & Geist Mono",
    demoHref: "/demo/studio",
  },
  {
    slug: "boutique",
    index: "03",
    title: "The Boutique",
    summary: "A demonstration concept for independent shops and makers.",
    demoName: "Maison Argile",
    direction: "Soft, tactile and quiet, so the objects can speak.",
    palette: { bg: "#dcc7b1", fg: "#3a2a20", accent: "#8c4a2c" },
    suits: ["Independent shops", "Makers", "Florists", "Galleries"],
    highlights: ["Product catalogue", "Product details", "Shopping bag", "Newsletter sign-up"],
    typefaces: "Fraunces & Figtree",
    demoHref: "/demo/boutique",
  },
  {
    slug: "professional",
    index: "04",
    title: "The Professional",
    summary: "A demonstration concept for consultants and independent practices.",
    demoName: "Halden Advisory",
    direction: "Measured and trustworthy, with a clear path to booking.",
    palette: { bg: "#11222a", fg: "#e7ecea", accent: "#9fc4b5" },
    suits: ["Consultants", "Advisers", "Coaches", "Independent practices"],
    highlights: ["Consultation booking", "Services and fees", "Approach", "Team profiles"],
    typefaces: "Hanken Grotesk & Source Serif",
    demoHref: "/demo/professional",
  },
];

export function getConcept(slug: string): Concept | undefined {
  return concepts.find((concept) => concept.slug === slug);
}
