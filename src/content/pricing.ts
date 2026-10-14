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
      "Five rounds of revisions",
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
    "Hosting, updates, monitoring and small changes, so your website stays in good shape. Final inclusions and limits will be published before launch.",
  /** The intended areas of cover. Specific inclusions and limits are not final. */
  areas: [
    { title: "Hosting", detail: "Your website hosted by us, included in the plan." },
    { title: "Updates", detail: "Keeping the website’s software current." },
    { title: "Monitoring", detail: "Watching that the website stays up and working." },
    { title: "Small changes", detail: "Minor edits after launch, so you don’t have to make them yourself." },
  ],
};

export const pricingExclusions =
  "The base website price does not include custom features, third-party service charges (such as booking or payment providers), domain registration, or extensive additional work. Anything outside the base is quoted clearly before you commit.";

/** What the base website price does not cover, item by item, for the pricing page. */
export const exclusions = [
  {
    title: "Custom features",
    detail:
      "Bookings, payments, customer accounts, automations and anything else beyond the website itself are custom development, scoped and priced separately.",
  },
  {
    title: "Third-party service charges",
    detail:
      "Booking, payment and similar providers charge their own fees. Those are paid to the providers directly and are not part of our price.",
  },
  {
    title: "Domain registration",
    detail:
      "Your domain name is registered and renewed separately. If you already own one, say so in your brief.",
  },
  {
    title: "Extensive additional work",
    detail:
      "Work well beyond the base, such as more than five pages or substantial changes to a design, is quoted before you commit.",
  },
  {
    title: "Hosting, without the care plan",
    detail:
      "Your website is transferred at launch to a hosting account in your name, and you pay any hosting costs directly to that provider.",
  },
] as const;
