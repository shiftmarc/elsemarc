/**
 * What a website can do beyond looking good. Used by the homepage
 * "Beyond the website" section and the functionality explorer, and later
 * by the custom development page and the project intake.
 */

/** Capabilities shown in "Beyond the website". The id selects its illustration. */
export type Capability = {
  id: "reservations" | "payments" | "appointments" | "portals" | "automations" | "unknown";
  title: string;
  description: string;
};

export const capabilities: Capability[] = [
  {
    id: "reservations",
    title: "Reservations",
    description:
      "Live availability, party sizes and confirmations, without a phone ringing during service.",
  },
  {
    id: "payments",
    title: "Payments",
    description:
      "Deposits, invoices, gift cards or full checkout, handled securely by an established payment provider.",
  },
  {
    id: "appointments",
    title: "Appointments",
    description:
      "Clients choose a time that suits them. Your calendar stays accurate and reminders go out on their own.",
  },
  {
    id: "portals",
    title: "Customer portals",
    description:
      "A private place for your customers to see orders, documents and progress, so they don’t need to ask.",
  },
  {
    id: "automations",
    title: "Automations",
    description:
      "The repetitive work between tools and inboxes, done quietly in the background every time.",
  },
  {
    id: "unknown",
    title: "Something nobody’s built before",
    description:
      "If you can describe it, we can usually build it. Start with the idea; the details come later.",
  },
];

/**
 * Options in the functionality explorer. The ids are stored in the intake
 * draft, so treat them as stable: rename labels freely, never ids.
 */
export const functionOptions = [
  { id: "reservations", label: "Take reservations" },
  { id: "payments", label: "Accept payments" },
  { id: "appointments", label: "Book appointments" },
  { id: "products", label: "Sell products" },
  { id: "customers", label: "Manage customers" },
  { id: "quotes", label: "Generate quotes" },
  { id: "accounts", label: "Create customer accounts" },
  { id: "automation", label: "Automate repetitive tasks" },
  { id: "integrations", label: "Connect existing software" },
  { id: "other", label: "Something entirely different" },
] as const;

export type FunctionId = (typeof functionOptions)[number]["id"];

const functionIds = new Set<string>(functionOptions.map((option) => option.id));

export function isFunctionId(value: unknown): value is FunctionId {
  return typeof value === "string" && functionIds.has(value);
}

export function functionLabel(id: FunctionId): string {
  return functionOptions.find((option) => option.id === id)?.label ?? id;
}

/* Custom development ------------------------------------------------------ */

/** Illustrations available to CapabilitySpecimen: every capability, plus a few for the custom page. */
export type SpecimenId = Capability["id"] | "dashboards" | "integrations" | "applications";

/**
 * The kinds of custom work, for the custom development page. Each maps to the
 * functionality option it adds to the visitor's brief.
 */
export type BuildKind = {
  id: string;
  title: string;
  description: string;
  /** Typical pieces, to make the category concrete. */
  pieces: string[];
  specimen: SpecimenId;
  /** The explorer option this kind adds to the intake draft. */
  functionId: FunctionId;
};

export const buildKinds: BuildKind[] = [
  {
    id: "booking",
    title: "Booking engines",
    description:
      "Tables, appointments, classes or rentals, with real availability. Customers choose a time; your calendar stays right.",
    pieces: ["Live availability", "Confirmations and reminders", "Deposits and cancellations", "Staff calendars"],
    specimen: "appointments",
    functionId: "appointments",
  },
  {
    id: "payments",
    title: "Payment systems",
    description:
      "Checkout, deposits, invoices, subscriptions or gift cards, processed by an established payment provider rather than anything home-made.",
    pieces: ["Checkout and receipts", "Deposits and invoices", "Subscriptions", "Refunds"],
    specimen: "payments",
    functionId: "payments",
  },
  {
    id: "portals",
    title: "Customer portals",
    description:
      "A private, signed-in space where customers find their orders, documents and progress without having to ask.",
    pieces: ["Secure sign-in", "Orders and status", "Shared documents", "Messages"],
    specimen: "portals",
    functionId: "accounts",
  },
  {
    id: "dashboards",
    title: "Dashboards",
    description:
      "The numbers and lists you check every morning, in one place: bookings, orders, customers, whatever your business runs on.",
    pieces: ["Daily summaries", "Customer records", "Exports", "Roles for staff"],
    specimen: "dashboards",
    functionId: "customers",
  },
  {
    id: "automations",
    title: "Business automations",
    description:
      "The copying, sending and reminding between your inbox and your tools, done the same way every time without anyone remembering to.",
    pieces: ["Emails that send themselves", "Follow-ups", "Scheduled reports", "Data kept in sync"],
    specimen: "automations",
    functionId: "automation",
  },
  {
    id: "integrations",
    title: "Third-party integrations",
    description:
      "Your website talking to the software you already pay for, so information is entered once and appears everywhere it should.",
    pieces: ["Calendars", "Accounting", "Email and newsletters", "Stock and inventory"],
    specimen: "integrations",
    functionId: "integrations",
  },
  {
    id: "applications",
    title: "Custom web applications",
    description:
      "When the thing you need does not exist yet: quoting tools, job trackers, member areas, internal systems. Built for how you actually work.",
    pieces: ["Your own workflow", "Several kinds of user", "Forms and records", "Room to grow"],
    specimen: "applications",
    functionId: "other",
  },
];

/** What makes a custom project larger or smaller. Shown where custom work is priced. */
export const priceFactors = [
  "How many kinds of user it serves, and what each can do",
  "The number of screens, forms and steps involved",
  "Software it needs to connect to, and how well documented that software is",
  "Payments, personal data or anything that needs extra care",
  "Existing information to move across",
  "How quickly it needs to be ready",
] as const;
