/**
 * Offerings and prices. All amounts are in Canadian dollars.
 * Shared by the homepage summary and the pricing page.
 */
export type Offering = {
  index: string;
  title: string;
  price: string;
  priceNote: string;
  listLabel: string;
  items: string[];
  cta: { label: string; href: string };
};

export const offerings: Offering[] = [
  {
    index: "01",
    title: "Beautiful by design",
    price: "From $999",
    priceNote: "CAD, per website",
    listLabel: "Includes",
    items: [
      "Professional customisation of a selected design",
      "Up to five pages",
      "Mobile-responsive development",
      "Basic SEO",
      "Contact form",
      "Two rounds of revisions",
      "Deployment assistance",
    ],
    cta: { label: "Choose a design", href: "/websites" },
  },
  {
    index: "02",
    title: "Built to do more",
    price: "Individually priced",
    priceNote: "Scoped in writing before work begins",
    listLabel: "For example",
    items: [
      "Booking engines",
      "Payment systems",
      "Customer portals",
      "Dashboards",
      "Business automations",
      "Custom web applications",
      "Third-party integrations",
    ],
    cta: { label: "Describe your project", href: "/start" },
  },
];

export const carePlan = {
  price: "From $59",
  priceNote: "CAD / month",
  summary:
    "Updates, monitoring and small changes, so your website stays in good shape. Final inclusions and limits will be published before launch.",
};

export const pricingExclusions =
  "The base website price does not include custom features, third-party service charges (such as booking or payment providers), domain registration, or extensive additional work. Anything outside the base is quoted clearly before you commit.";
