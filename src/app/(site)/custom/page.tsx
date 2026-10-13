import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Custom development",
  description: "Reservations. Payments. Appointments. Customer portals. Automations. Or something nobody’s built before.",
};

export default function CustomDevelopmentPage() {
  return (
    <PagePlaceholder
      eyebrow="Custom development"
      title="What if your website could do more?"
      intro="Reservations. Payments. Appointments. Customer portals. Automations. Or something nobody’s built before."
    />
  );
}
