import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Websites from $999 CAD. Custom development, individually priced.",
};

export default function PricingPage() {
  return (
    <PagePlaceholder
      eyebrow="Pricing"
      title="Clear prices, in writing."
      intro="Websites from $999 CAD. Custom development, individually priced."
    />
  );
}
