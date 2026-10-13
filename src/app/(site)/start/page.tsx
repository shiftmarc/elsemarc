import type { Metadata } from "next";
import { Suspense } from "react";
import { BriefSoFar } from "@/components/intake/brief-so-far";
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
    >
      <section aria-labelledby="brief-title" className="mt-16 border-t hairline pt-8">
        <h2 id="brief-title" className="type-label mb-8 text-accent">
          Your brief so far
        </h2>
        <Suspense fallback={<p className="text-fg-muted">Loading your brief…</p>}>
          <BriefSoFar />
        </Suspense>
      </section>
    </PagePlaceholder>
  );
}
