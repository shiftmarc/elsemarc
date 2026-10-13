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
