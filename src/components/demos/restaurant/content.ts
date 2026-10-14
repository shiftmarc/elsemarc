/**
 * Copy for the Ardoise demo. Ardoise, its people, address and dishes are
 * fictional; contact details use reserved numbers and the .example domain.
 */

export const ardoise = {
  name: "Ardoise",
  tagline: "Wood fire · Seasonal · Natural wine",
  address: ["48 rue des Braises", "Montréal, QC"],
  phone: { label: "514 555 0142", href: "tel:+15145550142" },
  email: "table@ardoise.example",
  events: "events@ardoise.example",
} as const;

export const ardoiseNav = [
  { label: "Menu", href: "#menu" },
  { label: "Wine", href: "#wine" },
  { label: "Private dining", href: "#private-dining" },
  { label: "Visit", href: "#visit" },
] as const;

export type Dish = { name: string; detail: string; price: string };

export const menuCourses: { title: string; note: string; dishes: Dish[] }[] = [
  {
    title: "To begin",
    note: "Small, cold and raw",
    dishes: [
      { name: "Oysters", detail: "Fermented green tomato, smoked oil", price: "24" },
      { name: "Charred leeks", detail: "Hazelnut, brown-butter vinaigrette", price: "17" },
      { name: "Beef tartare", detail: "Ember-roasted shallot, rye crisps", price: "22" },
      { name: "Burrata", detail: "Roasted plums, black pepper honey", price: "19" },
    ],
  },
  {
    title: "From the fire",
    note: "Oak and maple, nothing else",
    dishes: [
      { name: "Half chicken", detail: "Morel jus, grilled sourdough", price: "38" },
      { name: "Whole branzino", detail: "Fennel, preserved lemon, herbs", price: "44" },
      { name: "Coal-roasted squash", detail: "White miso, toasted seeds", price: "29" },
      { name: "Dry-aged ribeye, for two", detail: "Bone marrow butter, bitter leaves", price: "120" },
    ],
  },
  {
    title: "To finish",
    note: "Whatever the embers have left",
    dishes: [
      { name: "Burnt honey tart", detail: "Crème fraîche", price: "14" },
      { name: "Ember-baked apple", detail: "Salted caramel, oat crumble", price: "13" },
      { name: "Three Québec cheeses", detail: "Quince, walnut bread", price: "18" },
    ],
  },
];

export const wineByTheGlass = [
  { name: "Pet-nat rosé", origin: "Loire, France", price: "15" },
  { name: "Skin-contact Pinot Gris", origin: "Prince Edward County, Ontario", price: "17" },
  { name: "Gamay, whole cluster", origin: "Beaujolais, France", price: "16" },
  { name: "Cabernet Franc", origin: "Niagara, Ontario", price: "18" },
] as const;

export const hours = [
  { days: "Monday – Tuesday", time: "Closed" },
  { days: "Wednesday – Thursday", time: "17:30 – 22:30" },
  { days: "Friday – Saturday", time: "17:30 – 23:00" },
  { days: "Sunday", time: "17:00 – 22:00" },
] as const;

/** Reservation widget options. Availability is illustrative only. */
export const reservationDays = ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const reservationTimes = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:30", "21:00"] as const;
export const partySizes = [1, 2, 3, 4, 5, 6] as const;

/** A few slots shown as taken so the widget feels real. Deterministic, no data. */
export function isSlotTaken(day: string, time: string, party: number) {
  const seed = day.length * 7 + Number(time.replace(":", "")) + party * 13;
  return seed % 5 === 0;
}
