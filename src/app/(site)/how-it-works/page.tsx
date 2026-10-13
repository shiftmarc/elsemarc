import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "How it works",
  description: "Choose a design or describe your idea, receive a clear scope and price, and launch — without unnecessary meetings.",
};

export default function HowItWorksPage() {
  return (
    <PagePlaceholder
      eyebrow="How it works"
      title="Designed to be done online."
      intro="Choose a design or describe your idea, receive a clear scope and price, and launch — without unnecessary meetings."
    />
  );
}
