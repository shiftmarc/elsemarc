import type { Metadata, Viewport } from "next";
import { DemoBar } from "@/components/demo/demo-bar";
import { HaldenHomepage } from "@/components/demos/professional/halden";
import { getConcept } from "@/content/concepts";

/*
 * Full-screen demo. It lives outside the (site) group so it has no elsemarc
 * header or footer; the demo bar is the only elsemarc chrome.
 */
const concept = getConcept("professional") ?? missingConcept();

function missingConcept(): never {
  throw new Error("The professional concept is missing from content/concepts.");
}

export const metadata: Metadata = {
  title: `${concept.demoName} — ${concept.title} demonstration concept`,
  description: `${concept.demoName} is a fictional independent advisory practice. ${concept.summary}`,
};

export const viewport: Viewport = {
  themeColor: concept.palette.bg,
};

export default function ProfessionalDemoPage() {
  return (
    <>
      <DemoBar concept={concept} />
      <HaldenHomepage concept={concept} />
    </>
  );
}
