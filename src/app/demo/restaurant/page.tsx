import type { Metadata, Viewport } from "next";
import { DemoBar } from "@/components/demo/demo-bar";
import { ArdoiseHomepage } from "@/components/demos/restaurant/ardoise";
import { getConcept } from "@/content/concepts";

/*
 * Full-screen demo. It lives outside the (site) group so it has no elsemarc
 * header or footer; the demo bar is the only elsemarc chrome.
 */
const concept = getConcept("restaurant") ?? missingConcept();

function missingConcept(): never {
  throw new Error("The restaurant concept is missing from content/concepts.");
}

export const metadata: Metadata = {
  title: `${concept.demoName} — ${concept.title} demonstration concept`,
  description: `${concept.demoName} is a fictional restaurant. ${concept.summary}`,
};

export const viewport: Viewport = {
  themeColor: concept.palette.bg,
};

export default function RestaurantDemoPage() {
  return (
    <>
      <DemoBar concept={concept} />
      <ArdoiseHomepage concept={concept} />
    </>
  );
}
