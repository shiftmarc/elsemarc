import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Start a project",
  description: "A short, structured brief. Your progress is saved as you go.",
};

export default function StartProjectPage() {
  return (
    <PagePlaceholder
      eyebrow="Start a project"
      title="Tell us what you need."
      intro="A short, structured brief. Your progress is saved as you go."
    />
  );
}
