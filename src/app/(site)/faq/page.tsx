import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Everything you need to know before you begin.",
};

export default function FaqPage() {
  return (
    <PagePlaceholder
      eyebrow="Frequently asked questions"
      title="Questions, answered."
      intro="Everything you need to know before you begin."
    />
  );
}
