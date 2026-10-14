/**
 * Copy and catalogue for the Maison Argile demo. The shop, its makers, its
 * products and its contact details are fictional; the phone number is a
 * reserved 555 number and email uses the .example domain. Nothing is for sale.
 */

export const maison = {
  name: "Maison Argile",
  descriptor: "Handmade stoneware and linen",
  founded: "2019",
  makers: "Élodie Marchand and Tomás Reyes",
  address: ["48 rue du Moulin", "Sutton, QC"],
  phone: { label: "450 555 0142", href: "tel:+14505550142" },
  email: "bonjour@maisonargile.example",
  freeShippingFrom: 150,
} as const;

export const argileNav = [
  { label: "Shop", href: "#shop" },
  { label: "The making", href: "#making" },
  { label: "Our studio", href: "#studio" },
  { label: "Visit", href: "#visit" },
] as const;

export const categories = ["Vessels", "Table", "Linen & light"] as const;
export type Category = (typeof categories)[number];

/** The drawn silhouettes that stand in for product photography. */
export type Shape =
  | "vase"
  | "bowl"
  | "carafe"
  | "buds"
  | "tumblers"
  | "plate"
  | "jar"
  | "napkins"
  | "taper";

export type Glaze = { name: string; color: string };

/** Glazes and cloths, shared across the catalogue. */
export const glazes = {
  oat: { name: "Oat", color: "#e8dac6" },
  ash: { name: "Ash", color: "#b7b0a4" },
  iron: { name: "Iron", color: "#6e3d29" },
  celadon: { name: "Celadon", color: "#a7b39d" },
  raw: { name: "Raw clay", color: "#b0673f" },
  milk: { name: "Milk", color: "#f2ece2" },
  charcoal: { name: "Charcoal", color: "#4b423c" },
  flax: { name: "Natural flax", color: "#cdbb9f" },
  rust: { name: "Rust", color: "#9a4f31" },
} satisfies Record<string, Glaze>;

export type Product = {
  slug: string;
  name: string;
  price: number;
  category: Category;
  shape: Shape;
  /** The first is shown by default. */
  finishes: Glaze[];
  /** One line, under the name in the catalogue. */
  line: string;
  description: string;
  dimensions: string;
  care: string;
  /** Stock or lead time. Illustrative only. */
  availability: string;
  /** Shown first in the catalogue's "Featured" order. */
  featured?: boolean;
};

export const products: Product[] = [
  {
    slug: "vase-no-3",
    name: "Vase no. 3",
    price: 68,
    category: "Vessels",
    shape: "vase",
    finishes: [glazes.oat, glazes.iron, glazes.celadon],
    line: "A full belly and a narrow neck, for one branch.",
    description:
      "Thrown in two parts and joined at the shoulder. The neck is narrow enough to hold a single branch upright, so it never needs arranging.",
    dimensions: "24 cm tall, 13 cm across",
    care: "Watertight. Hand wash; the unglazed foot can be scrubbed.",
    availability: "4 in the studio",
    featured: true,
  },
  {
    slug: "low-bowl",
    name: "Low bowl",
    price: 42,
    category: "Table",
    shape: "bowl",
    finishes: [glazes.ash, glazes.oat, glazes.charcoal],
    line: "For fruit on the counter, or salad for four.",
    description:
      "Wide and shallow, with a rim turned thin so it feels light in the hand. The glaze pools darker in the well, where it is thickest.",
    dimensions: "26 cm across, 8 cm deep",
    care: "Dishwasher safe. Not for the oven.",
    availability: "Made to order, ships in 3 weeks",
    featured: true,
  },
  {
    slug: "carafe",
    name: "Carafe",
    price: 54,
    category: "Table",
    shape: "carafe",
    finishes: [glazes.milk, glazes.celadon],
    line: "Holds a litre of water for the bedside or the table.",
    description:
      "A tall neck that pours without dripping, and a body wide enough to keep water cool. Pairs with the tumblers.",
    dimensions: "22 cm tall, 1 litre",
    care: "Dishwasher safe. Rinse with vinegar now and then.",
    availability: "6 in the studio",
    featured: true,
  },
  {
    slug: "bud-vases",
    name: "Bud vases, set of three",
    price: 46,
    category: "Vessels",
    shape: "buds",
    finishes: [glazes.raw, glazes.oat],
    line: "Three small bottles for whatever is in the garden.",
    description:
      "Three heights from one lump of clay. Line them up on a sill, or scatter them down a long table.",
    dimensions: "9, 12 and 15 cm tall",
    care: "Watertight. Use a bottle brush.",
    availability: "Last 2 sets",
  },
  {
    slug: "tumblers",
    name: "Tumblers, pair",
    price: 38,
    category: "Table",
    shape: "tumblers",
    finishes: [glazes.celadon, glazes.milk, glazes.charcoal],
    line: "Two cups, a little uneven on purpose.",
    description:
      "No two are exactly alike: one is always a touch taller. They nest for the cupboard and sit well in the hand.",
    dimensions: "9 and 11 cm tall, 250 ml",
    care: "Dishwasher safe.",
    availability: "8 pairs in the studio",
  },
  {
    slug: "serving-plate",
    name: "Serving plate",
    price: 72,
    category: "Table",
    shape: "plate",
    finishes: [glazes.oat, glazes.iron],
    line: "A wide, flat plate for bread, cheese or a roast.",
    description:
      "Rolled out by hand and dried slowly over a week so it stays flat. Heavy enough to feel generous.",
    dimensions: "34 cm across",
    care: "Dishwasher safe. Warm, not hot, in the oven.",
    availability: "Made to order, ships in 4 weeks",
    featured: true,
  },
  {
    slug: "lidded-jar",
    name: "Lidded jar",
    price: 58,
    category: "Vessels",
    shape: "jar",
    finishes: [glazes.charcoal, glazes.ash],
    line: "For salt, coffee or the things that need a lid.",
    description:
      "The lid is thrown with the jar and fired on it, so it fits only its own pot. A small knob for lifting with one finger.",
    dimensions: "14 cm tall, 11 cm across",
    care: "Hand wash.",
    availability: "3 in the studio",
  },
  {
    slug: "linen-napkins",
    name: "Linen napkins, set of four",
    price: 36,
    category: "Linen & light",
    shape: "napkins",
    finishes: [glazes.flax, glazes.rust, glazes.milk],
    line: "Stonewashed linen that softens with every wash.",
    description:
      "Woven in Québec and hemmed in our studio. Washed before they leave, so they arrive already soft.",
    dimensions: "45 × 45 cm each",
    care: "Machine wash warm. Line dry and leave unironed.",
    availability: "In stock",
  },
  {
    slug: "taper-holder",
    name: "Taper holder",
    price: 28,
    category: "Linen & light",
    shape: "taper",
    finishes: [glazes.iron, glazes.oat],
    line: "One candle, one wide dish to catch the wax.",
    description:
      "A short column on a wide saucer, sized for standard dinner tapers. Comes with one beeswax candle.",
    dimensions: "11 cm tall, 12 cm across",
    care: "Wax lifts off once frozen for an hour.",
    availability: "5 in the studio",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(amount: number) {
  return `$${amount.toFixed(0)}`;
}

/** How a pot is made, from bag of clay to the shop shelf. */
export const making = [
  {
    day: "Day 1",
    title: "Wedge and throw",
    text: "Clay from a pit near Saint-Armand is kneaded by hand, then thrown on the wheel in batches of about forty.",
  },
  {
    day: "Days 2–3",
    title: "Trim",
    text: "Once leather-hard, each piece is turned upside down and its foot carved. This is where it gets lighter.",
  },
  {
    day: "Days 4–10",
    title: "Dry slowly",
    text: "Under cloth, then on open shelves. Rushing here is how pots crack, so we don’t.",
  },
  {
    day: "Day 11",
    title: "First firing",
    text: "A bisque firing to 1000 °C turns clay into something you can hold without fear.",
  },
  {
    day: "Days 12–14",
    title: "Glaze and fire again",
    text: "Dipped by hand, then fired to 1260 °C. The kiln decides the last ten per cent.",
  },
] as const;

export const hours = [
  { days: "Thursday – Friday", time: "11:00 – 17:00" },
  { days: "Saturday", time: "10:00 – 17:00" },
  { days: "Sunday", time: "12:00 – 16:00" },
  { days: "Monday – Wednesday", time: "In the studio, closed to visitors" },
] as const;

export const questions = [
  {
    question: "How long does shipping take?",
    answer:
      "Pieces in the studio leave within three working days, wrapped in recycled paper and wool. Made-to-order pieces ship when they come out of the kiln; we write to tell you when.",
  },
  {
    question: "Will mine look exactly like the picture?",
    answer:
      "No, and that is the point. Every piece is thrown by hand, so sizes vary by a centimetre or so and glazes shift from kiln to kiln.",
  },
  {
    question: "Can I return something?",
    answer:
      "Yes, within 30 days if it is unused. If anything arrives broken, send us a photo and we will make you another.",
  },
  {
    question: "Do you take commissions?",
    answer:
      "For restaurants and cafés, a few times a year. Write to us with the number of pieces and when you need them.",
  },
] as const;
