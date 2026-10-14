/**
 * Copy for the Field Office demo. Field Office, its people, clients, projects
 * and addresses are fictional; contact details use reserved numbers and the
 * .example domain.
 */

export const fieldOffice = {
  name: "Field Office",
  founded: "2014",
  descriptor: "Architecture, interiors and identity",
  address: ["112 Foundry Lane, Unit 4", "Toronto, ON"],
  phone: { label: "416 555 0178", href: "tel:+14165550178" },
  email: "hello@fieldoffice.example",
  newBusiness: "work@fieldoffice.example",
  careers: "jobs@fieldoffice.example",
} as const;

export const fieldNav = [
  { label: "Work", href: "#work" },
  { label: "Index", href: "#index" },
  { label: "Studio", href: "#studio" },
  { label: "Contact", href: "#contact" },
] as const;

export const disciplines = ["Architecture", "Interiors", "Identity", "Exhibition"] as const;
export type Discipline = (typeof disciplines)[number];

export type Plate = "pavilion" | "house" | "library" | "terminal" | "bakehouse" | "observatory";

export type Project = {
  index: string;
  title: string;
  client: string;
  location: string;
  year: string;
  disciplines: Discipline[];
  /** One line, set under the plate. Only featured projects have one. */
  line?: string;
  /** The drawn composition standing in for photography. Featured projects only. */
  plate?: Plate;
};

export const projects: Project[] = [
  {
    index: "01",
    title: "Harbour Pavilion",
    client: "Port Ellery Harbour Trust",
    location: "Port Ellery, NS",
    year: "2026",
    disciplines: ["Architecture"],
    line: "A timber roof on twelve columns, open to the water on every side.",
    plate: "pavilion",
  },
  {
    index: "02",
    title: "Linden House",
    client: "Private client",
    location: "Hamilton, ON",
    year: "2025",
    disciplines: ["Interiors"],
    line: "A 1910 brick house, opened up around one long oak window seat.",
    plate: "house",
  },
  {
    index: "03",
    title: "Quarry Library",
    client: "Quarry Hill Public Library",
    location: "Quarry Hill, ON",
    year: "2025",
    disciplines: ["Identity", "Exhibition"],
    line: "An identity cut from the shelving grid, signage to library cards.",
    plate: "library",
  },
  {
    index: "04",
    title: "Atlas Ferry Terminal",
    client: "Lakeshore Transit Authority",
    location: "Kingsport, ON",
    year: "2024",
    disciplines: ["Architecture", "Identity"],
    line: "One concourse, one sign system, read from the deck of a moving boat.",
    plate: "terminal",
  },
  {
    index: "05",
    title: "Norrow Bakehouse",
    client: "Norrow Bakehouse",
    location: "Toronto, ON",
    year: "2024",
    disciplines: ["Interiors", "Identity"],
    line: "A bakery built around its oven, and a mark built from its loaf.",
    plate: "bakehouse",
  },
  {
    index: "06",
    title: "Saltmarsh Observatory",
    client: "Tidewater Conservancy",
    location: "Cape Morrow, NB",
    year: "2023",
    disciplines: ["Architecture", "Exhibition"],
    line: "A concrete hide on stilts, with one slot cut for the horizon.",
    plate: "observatory",
  },
  {
    index: "07",
    title: "Meridian Type Foundry",
    client: "Meridian Type",
    location: "Montréal, QC",
    year: "2023",
    disciplines: ["Identity"],
  },
  {
    index: "08",
    title: "Calder Street Offices",
    client: "Calder & Wray",
    location: "Toronto, ON",
    year: "2022",
    disciplines: ["Interiors"],
  },
  {
    index: "09",
    title: "Tidewater Biennale",
    client: "Tidewater Arts Council",
    location: "Saint Andrews, NB",
    year: "2022",
    disciplines: ["Exhibition", "Identity"],
  },
  {
    index: "10",
    title: "Ostrander Hall",
    client: "Ostrander College",
    location: "Peterborough, ON",
    year: "2021",
    disciplines: ["Architecture", "Interiors"],
  },
  {
    index: "11",
    title: "North Lot Market",
    client: "City of Kingsport",
    location: "Kingsport, ON",
    year: "2021",
    disciplines: ["Architecture"],
  },
  {
    index: "12",
    title: "Grey Wharf Gallery",
    client: "Grey Wharf Foundation",
    location: "Halifax, NS",
    year: "2020",
    disciplines: ["Exhibition", "Interiors"],
  },
];

export const featured = projects.filter((project) => project.plate);

export const services: { discipline: Discipline; items: string[] }[] = [
  {
    discipline: "Architecture",
    items: ["Public and cultural buildings", "Pavilions and small structures", "Adaptive reuse", "Feasibility studies"],
  },
  {
    discipline: "Interiors",
    items: ["Homes", "Workplaces", "Restaurants and retail", "Furniture and joinery"],
  },
  {
    discipline: "Identity",
    items: ["Visual identity", "Wayfinding and signage", "Typography", "Print and digital"],
  },
  {
    discipline: "Exhibition",
    items: ["Exhibition design", "Installations", "Graphics and catalogues"],
  },
];

export const people = [
  { name: "Ines Valk", role: "Founding partner, architecture" },
  { name: "Tomas Reid", role: "Partner, identity" },
  { name: "Mara Okafor", role: "Associate, interiors" },
  { name: "Jun Ashby", role: "Architect" },
  { name: "Priya Lund", role: "Designer" },
  { name: "Felix Moreau", role: "Studio manager" },
] as const;

export const figures = [
  ["2014", "Founded, in a former foundry on the east side"],
  ["18", "Architects, designers and one very patient manager"],
  ["140+", "Projects completed, from door handles to ferry terminals"],
] as const;
