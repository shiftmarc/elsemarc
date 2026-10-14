import type { Metadata, Viewport } from "next";
import { DemoBar } from "@/components/demo/demo-bar";
import { MaisonArgileHomepage } from "@/components/demos/boutique/maison-argile";
import { getConcept } from "@/content/concepts";

/*
 * Full-screen demo. It lives outside the (site) group so it has no elsemarc
 * header or footer; the demo bar is the only elsemarc chrome.
 */
const concept = getConcept("boutique") ?? missingConcept();

function missingConcept(): never {
  throw new Error("The boutique concept is missing from content/concepts.");
}

export const metadata: Metadata = {
  title: `${concept.demoName} — ${concept.title} demonstration concept`,
  description: `${concept.demoName} is a fictional shop of handmade objects. ${concept.summary}`,
};

export const viewport: Viewport = {
  themeColor: concept.palette.bg,
};

export default function BoutiqueDemoPage() {
  return (
    <>
      <DemoBar concept={concept} />
      <MaisonArgileHomepage concept={concept} />
    </>
  );
}
