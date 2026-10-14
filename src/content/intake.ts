/**
 * Options and steps for the project intake at /start. Option values are
 * stored in the visitor's draft, so treat them as stable: rename labels
 * freely, never values.
 */

export type Option<T extends string = string> = { value: T; label: string; hint?: string };

/* Paths ------------------------------------------------------------------- */

export const intakePaths = [
  {
    value: "website",
    label: "A website",
    hint: "Start from a design in the collection, customised for your business. From $999 CAD.",
  },
  {
    value: "custom",
    label: "Custom development",
    hint: "Bookings, payments, portals, automations or something new. Individually priced.",
  },
] as const satisfies readonly Option[];

export type IntakePath = (typeof intakePaths)[number]["value"];

/* Standard website -------------------------------------------------------- */

export const businessCategories = [
  { value: "restaurant", label: "Restaurant, café or bar" },
  { value: "studio", label: "Creative or design studio" },
  { value: "shop", label: "Shop or maker" },
  { value: "professional", label: "Consultant or professional services" },
  { value: "health", label: "Health and wellness" },
  { value: "trades", label: "Trades and home services" },
  { value: "events", label: "Events and hospitality" },
  { value: "other", label: "Something else" },
] as const satisfies readonly Option[];

export const pageOptions = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "services", label: "Services" },
  { value: "menu", label: "Menu" },
  { value: "work", label: "Work or portfolio" },
  { value: "products", label: "Products" },
  { value: "team", label: "Team" },
  { value: "faq", label: "FAQ" },
  { value: "contact", label: "Contact" },
] as const satisfies readonly Option[];

/** Pages included in the base website price. */
export const includedPages = 5;

export const yesNo = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const satisfies readonly Option[];

export const logoOptions = [
  { value: "yes", label: "Yes, I have a logo" },
  { value: "in-progress", label: "It’s being made" },
  { value: "no", label: "Not yet" },
] as const satisfies readonly Option[];

export const colourOptions = [
  { value: "design", label: "Keep the design’s colours" },
  { value: "brand", label: "Use my brand colours" },
  { value: "open", label: "Open to suggestions" },
] as const satisfies readonly Option[];

export const contentOptions = [
  { value: "ready", label: "Ready to send" },
  { value: "partial", label: "Partly written" },
  { value: "none", label: "Not yet" },
] as const satisfies readonly Option[];

export const imageOptions = [
  { value: "own", label: "I have my own photos" },
  { value: "some", label: "I have some" },
  { value: "none", label: "None yet" },
] as const satisfies readonly Option[];

export const domainOptions = [
  { value: "own", label: "I already own a domain" },
  { value: "need", label: "I need one" },
  { value: "unsure", label: "I’m not sure" },
] as const satisfies readonly Option[];

/* Custom development ------------------------------------------------------ */

export const userOptions = [
  { value: "customers", label: "My customers" },
  { value: "public", label: "The general public" },
  { value: "staff", label: "My staff or team" },
  { value: "me", label: "Just me" },
  { value: "partners", label: "Partners or suppliers" },
] as const satisfies readonly Option[];

export const budgetOptions = [
  { value: "under-2500", label: "Under $2,500" },
  { value: "2500-5000", label: "$2,500 – $5,000" },
  { value: "5000-10000", label: "$5,000 – $10,000" },
  { value: "10000-25000", label: "$10,000 – $25,000" },
  { value: "over-25000", label: "Over $25,000" },
  { value: "unsure", label: "Not sure yet" },
] as const satisfies readonly Option[];

export const timelineOptions = [
  { value: "soon", label: "As soon as possible" },
  { value: "1-2-months", label: "Within 1–2 months" },
  { value: "3-6-months", label: "Within 3–6 months" },
  { value: "flexible", label: "No fixed date" },
] as const satisfies readonly Option[];

/* Steps ------------------------------------------------------------------- */

export const websiteSteps = [
  { id: "design", title: "Design" },
  { id: "business", title: "Your business" },
  { id: "pages", title: "Pages and content" },
  { id: "brand", title: "Brand" },
  { id: "details", title: "Domain and details" },
  { id: "review", title: "Review" },
] as const;

export const customSteps = [
  { id: "project", title: "Your project" },
  { id: "functionality", title: "Functionality" },
  { id: "people", title: "Users and software" },
  { id: "budget", title: "Budget and timeline" },
  { id: "contact", title: "Your details" },
  { id: "review", title: "Review" },
] as const;

export type WebsiteStepId = (typeof websiteSteps)[number]["id"];
export type CustomStepId = (typeof customSteps)[number]["id"];
export type StepId = WebsiteStepId | CustomStepId;

export function stepsFor(path: IntakePath) {
  return path === "website" ? websiteSteps : customSteps;
}

export function labelOf(options: readonly Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
