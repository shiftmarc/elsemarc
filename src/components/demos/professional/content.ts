/**
 * Copy for the Halden Advisory demo. Halden, its people, address and fees are
 * fictional; contact details use reserved numbers and the .example domain.
 * The copy stays general on purpose: it describes how a practice like this
 * works, and never gives advice, promises results or claims credentials.
 */

export const halden = {
  name: "Halden Advisory",
  short: "Halden",
  tagline: "Independent financial advisory for small businesses",
  address: ["Suite 4, 212 Wellington Row", "Kingston, ON"],
  phone: { label: "613 555 0137", href: "tel:+16135550137" },
  email: "hello@halden.example",
  hours: "Monday to Friday, 9:00 – 17:00",
  timezone: "Eastern time",
} as const;

export const haldenNav = [
  { label: "Services", href: "#services" },
  { label: "Approach", href: "#approach" },
  { label: "About", href: "#about" },
] as const;

/* Services ---------------------------------------------------------------- */

export type Service = {
  id: string;
  title: string;
  summary: string;
  forWhom: string;
  format: string;
  duration: string;
  fee: string;
  /** What the visitor leaves with. */
  outcome: string;
};

export const services: Service[] = [
  {
    id: "intro",
    title: "Introductory call",
    summary: "Twenty minutes to describe where things are and decide whether we are the right fit.",
    forWhom: "Anyone considering working with us",
    format: "Video or phone",
    duration: "20 min",
    fee: "No charge",
    outcome: "A plain answer on whether, and how, we can help",
  },
  {
    id: "bookkeeping",
    title: "Bookkeeping review",
    summary: "We read your books with you and explain what they are saying, line by line.",
    forWhom: "Owners who keep their own records",
    format: "In person or video",
    duration: "90 min",
    fee: "$420",
    outcome: "A written summary and a short list of questions to watch",
  },
  {
    id: "year-end",
    title: "Year-end planning",
    summary: "Getting organised before the busy season, so the conversation with your accountant is shorter.",
    forWhom: "Businesses with a year end in the next six months",
    format: "Two sessions",
    duration: "2 × 60 min",
    fee: "$560",
    outcome: "A checklist, a calendar and fewer surprises",
  },
  {
    id: "growth",
    title: "Growth sessions",
    summary: "A standing monthly meeting to work through one decision at a time, with your numbers on the table.",
    forWhom: "Owners weighing a hire, a lease or a new line",
    format: "Monthly, by video",
    duration: "60 min",
    fee: "$300 a month",
    outcome: "Notes after every session, and someone who remembers the last one",
  },
];

export function getService(id: string) {
  return services.find((service) => service.id === id);
}

/* Approach ---------------------------------------------------------------- */

export const steps = [
  {
    title: "A short call",
    detail:
      "You tell us what is on your mind. We listen, ask a few questions and say honestly if someone else would serve you better.",
    when: "Week one",
  },
  {
    title: "A working session",
    detail:
      "We sit down with your actual records, not a questionnaire. Nothing is decided in the room; the point is to see clearly.",
    when: "Week two",
  },
  {
    title: "A written summary",
    detail:
      "Within five working days you receive a few pages in plain language: what we saw, what to consider and what can wait.",
    when: "Week three",
  },
] as const;

export const principles = [
  {
    title: "One fee, agreed in advance",
    detail: "Every engagement has a fixed price written down before we begin. There is no meter running.",
  },
  {
    title: "Nothing to sell you",
    detail: "We are paid by our clients and no one else. You will not be offered a product at the end of a meeting.",
  },
  {
    title: "Plain language",
    detail: "If a term needs explaining, we explain it. If we are not sure, we say so and find out.",
  },
  {
    title: "Your decision",
    detail: "We help you see the options and their trade-offs. What you do next is always yours to choose.",
  },
] as const;

/* People ------------------------------------------------------------------ */

export const people = [
  {
    name: "Ingrid Halden",
    initials: "IH",
    role: "Founder",
    bio: "Spent a long career inside small companies before starting the practice, and still prefers a kitchen table to a boardroom.",
  },
  {
    name: "Tomas Achebe",
    initials: "TA",
    role: "Adviser",
    bio: "Works mostly with trades, studios and shops. Known for turning a shoebox of receipts into a calm afternoon.",
  },
  {
    name: "Mireille Okafor",
    initials: "MO",
    role: "Client coordinator",
    bio: "The first voice you will hear on the phone, and the person who makes sure every summary arrives on time.",
  },
] as const;

export const testimonial = {
  quote:
    "It was the first time anyone walked me through my own numbers without making me feel behind. I left with three things to do, not thirty.",
  author: "A fictional client",
  business: "Owner of a small bakery",
} as const;

/* Booking ----------------------------------------------------------------- */

/** Two working weeks of consultation days. Labels only, so the demo never depends on today's date. */
export const bookingDays = [
  { id: "w1-tue", week: "This week", short: "Tue", label: "Tuesday" },
  { id: "w1-wed", week: "This week", short: "Wed", label: "Wednesday" },
  { id: "w1-thu", week: "This week", short: "Thu", label: "Thursday" },
  { id: "w1-fri", week: "This week", short: "Fri", label: "Friday" },
  { id: "w2-mon", week: "Next week", short: "Mon", label: "Monday" },
  { id: "w2-tue", week: "Next week", short: "Tue", label: "Tuesday" },
  { id: "w2-wed", week: "Next week", short: "Wed", label: "Wednesday" },
  { id: "w2-thu", week: "Next week", short: "Thu", label: "Thursday" },
] as const;

export type BookingDay = (typeof bookingDays)[number];

export const bookingTimes = ["9:00", "10:00", "11:30", "13:30", "15:00", "16:30"] as const;

/** A fixed pattern of taken slots so the calendar looks lived in. */
const taken = new Set([
  "w1-tue 9:00",
  "w1-tue 11:30",
  "w1-tue 13:30",
  "w1-tue 15:00",
  "w1-tue 16:30",
  "w1-wed 9:00",
  "w1-wed 10:00",
  "w1-wed 11:30",
  "w1-wed 13:30",
  "w1-wed 15:00",
  "w1-wed 16:30",
  "w1-thu 10:00",
  "w1-thu 13:30",
  "w1-thu 16:30",
  "w1-fri 9:00",
  "w1-fri 11:30",
  "w1-fri 15:00",
  "w1-fri 16:30",
  "w2-mon 9:00",
  "w2-mon 13:30",
  "w2-tue 10:00",
  "w2-tue 15:00",
  "w2-wed 11:30",
  "w2-thu 9:00",
  "w2-thu 16:30",
]);

export function isTaken(dayId: string, time: string) {
  return taken.has(`${dayId} ${time}`);
}

export function openTimes(dayId: string) {
  return bookingTimes.filter((time) => !isTaken(dayId, time));
}

/** The next few open slots, in calendar order, for the hero card. */
export function nextOpenSlots(count: number) {
  return bookingDays
    .flatMap((day) => openTimes(day.id).map((time) => ({ day, time })))
    .slice(0, count);
}

export const businessTypes = [
  "Sole proprietor",
  "Partnership",
  "Small company, under 10 people",
  "Company, 10 people or more",
  "Not started yet",
] as const;
