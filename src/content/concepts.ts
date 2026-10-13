/**
 * The demonstration website concepts. These are studio concepts,
 * not client projects, and must always be labelled as such.
 */
export type Concept = {
  slug: string;
  index: string;
  title: string;
  summary: string;
};

export const concepts: Concept[] = [
  {
    slug: "restaurant",
    index: "01",
    title: "The Restaurant",
    summary: "A demonstration concept for restaurants, cafés and bars.",
  },
  {
    slug: "studio",
    index: "02",
    title: "The Studio",
    summary: "A demonstration concept for creative and design studios.",
  },
  {
    slug: "boutique",
    index: "03",
    title: "The Boutique",
    summary: "A demonstration concept for independent shops and makers.",
  },
  {
    slug: "professional",
    index: "04",
    title: "The Professional",
    summary: "A demonstration concept for consultants and independent practices.",
  },
];

export function getConcept(slug: string): Concept | undefined {
  return concepts.find((concept) => concept.slug === slug);
}
