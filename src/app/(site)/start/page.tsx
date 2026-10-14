import type { Metadata } from "next";
import { Suspense } from "react";
import { IntakeForm } from "@/components/intake/intake-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "A short, structured brief for a website or custom development. Your progress is saved as you go, and no call or meeting is needed.",
};

export default function StartProjectPage() {
  return (
    <Container as="section" aria-labelledby="start-title" className="pt-10 pb-section md:pt-16">
      <div className="type-label flex justify-between gap-6 text-fg-muted">
        <p>Start a project</p>
        <p className="text-right">Saved as you go</p>
      </div>
      <div className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-12 lg:items-end lg:gap-x-gutter">
        <h1 id="start-title" className="type-display text-display-lg lg:col-span-7">
          Tell us what <span className="text-accent italic">you need.</span>
        </h1>
        <ul className="space-y-2 text-fg-muted lg:col-span-4 lg:col-start-9">
          {[
            "A few minutes, one step at a time",
            "Saved in this browser, so you can come back",
            "No calls, meetings or payment",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="text-accent">
                —
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16 md:mt-24">
        <Suspense
          fallback={
            <p role="status" className="border-t hairline pt-8 text-fg-muted">
              Loading your brief…
            </p>
          }
        >
          <IntakeForm />
        </Suspense>
      </div>
    </Container>
  );
}
