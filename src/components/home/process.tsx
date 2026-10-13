import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { processSteps } from "@/content/process";

export function Process() {
  return (
    <section aria-labelledby="process-title" className="theme-paper pb-section">
      <Container>
        <div className="border-t hairline pt-section">
          <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
            <div className="md:col-span-7">
              <SectionLabel index="06">Process</SectionLabel>
              <h2 id="process-title" className="type-display mt-6 text-display-lg">
                Five steps. <span className="italic">No meetings needed.</span>
              </h2>
            </div>
            <p className="text-lede text-fg-muted md:col-span-4 md:col-start-9 md:self-end">
              The whole process is designed to be completed online, at your pace. No calls or
              meetings needed.
            </p>
          </div>

          <ol className="mt-16 grid gap-px md:mt-24 md:grid-cols-5 md:gap-x-6">
            {processSteps.map((step, index) => (
              <li
                key={step.title}
                className="reveal grid grid-cols-[3.5rem_1fr] gap-x-4 border-t hairline py-6 md:block md:pt-6 md:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="type-display text-display-md leading-none text-accent md:block"
                >
                  {index + 1}
                </span>
                <div className="md:mt-10">
                  <h3 className="font-medium text-lede">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-small text-fg-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
