import Link from "next/link";
import { ConceptPreview } from "@/components/concepts/concept-preview";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { concepts } from "@/content/concepts";

export function SelectedWebsites() {
  return (
    <section id="websites" aria-labelledby="websites-title" className="py-section">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-7">
            <SectionLabel index="01">Selected websites</SectionLabel>
            <h2 id="websites-title" className="type-display mt-6 text-display-lg">
              Four designs, four <span className="italic">identities.</span>
            </h2>
          </div>
          <div className="md:col-span-4 md:col-start-9 md:self-end">
            <p className="text-lede text-fg-muted">
              Each one is a complete starting point, ready to be made your own.
            </p>
            <p className="type-label mt-6 border-l-2 border-accent pl-3 text-fg">
              Demonstration concepts for fictional businesses. Not client work.
            </p>
          </div>
        </div>

        <ol className="mt-20 space-y-24 md:mt-28 md:space-y-36">
          {concepts.map((concept, index) => {
            const flipped = index % 2 === 1;
            return (
              <li
                key={concept.slug}
                id={`concept-${concept.slug}`}
                className="group/card reveal relative grid gap-6 md:grid-cols-12 md:gap-x-gutter md:gap-y-0"
              >
                <figure className={`md:col-span-8 ${flipped ? "md:col-start-5" : ""}`}>
                  <figcaption className="type-label mb-3 flex justify-between gap-4 text-fg-muted">
                    <span className="text-fg">Demonstration concept</span>
                    <span>Homepage preview</span>
                  </figcaption>
                  <div className="overflow-hidden ring-1 ring-line transition-transform duration-700 ease-out-expo group-hover/card:-translate-y-1">
                    <ConceptPreview concept={concept} />
                  </div>
                </figure>

                <div
                  className={`flex flex-col md:col-span-4 md:row-start-1 ${
                    flipped ? "md:col-start-1" : "md:col-start-9"
                  } md:justify-end`}
                >
                  <p className="type-label flex items-center gap-3 text-fg-muted">
                    <span className="text-accent">{concept.index}</span>
                    <span className="h-px w-8 bg-line" aria-hidden="true" />
                    <span>{concept.demoName}</span>
                  </p>
                  <h3 className="type-display mt-4 text-display-md">{concept.title}</h3>
                  <p className="mt-4 max-w-[34ch] text-fg-muted">{concept.direction}</p>
                  <Link
                    href={`/websites/${concept.slug}`}
                    className="mt-6 inline-flex items-center gap-3 self-start text-small font-medium underline decoration-line decoration-1 underline-offset-[6px] transition-colors group-hover/card:text-accent group-hover/card:decoration-current after:absolute after:inset-0 after:content-['']"
                  >
                    View the concept
                    <span className="sr-only">: {concept.title}</span>
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-500 ease-out-expo group-hover/card:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-24 flex flex-col items-start gap-6 border-t hairline pt-8 md:mt-36 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[46ch] text-fg-muted">
            Interactive previews are on the way. Choose a design now and we’ll tailor it to your
            business.
          </p>
          <ButtonLink href="/websites" variant="secondary">
            See the collection
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
