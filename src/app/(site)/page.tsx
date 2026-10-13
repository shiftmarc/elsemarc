import { BeyondTheWebsite } from "@/components/home/beyond-the-website";
import { FinalCta } from "@/components/home/final-cta";
import { FunctionalityExplorer } from "@/components/home/functionality-explorer";
import { Hero } from "@/components/home/hero";
import { Imagination } from "@/components/home/imagination";
import { PricingSummary } from "@/components/home/pricing-summary";
import { Process } from "@/components/home/process";
import { SelectedWebsites } from "@/components/home/selected-websites";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SelectedWebsites />
      <BeyondTheWebsite />
      <FunctionalityExplorer />
      <Imagination />
      <PricingSummary />
      <Process />
      <FinalCta />
    </>
  );
}
