import type { Metadata } from "next";
import Link from "next/link";
import { OpenLinkedQuestion } from "@/components/faq/open-linked-question";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { ToBeConfirmed } from "@/components/ui/to-be-confirmed";
import { faqGroups, type FaqItem } from "@/content/faq";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "The process, pricing, design, content, revisions, timelines, ownership, hosting and life after launch.",
};

/**
 * Questions are native <details> elements: keyboard and screen-reader
 * accessible without JavaScript. Browsers open them for find-in-page,
 * and OpenLinkedQuestion opens one a link points at.
 */
export default function FaqPage() {
  return (
    <>
      <Container as="section" aria-labelledby="faq-title" className="pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="type-label flex justify-between gap-6 text-fg-muted">
          <p>Frequently asked questions</p>
          <p>{faqGroups.reduce((total, group) => total + group.items.length, 0)} questions</p>
        </div>
        <h1 id="faq-title" className="type-display mt-14 text-display-xl md:mt-20">
          Questions, <span className="text-accent italic">answered.</span>
        </h1>
        <p className="mt-12 max-w-[38ch] text-lede md:mt-20">
          Everything you need to know before you begin, from the first brief to life after launch.
        </p>
      </Container>

      <section aria-label="Questions" className="theme-paper py-section">
        <OpenLinkedQuestion />
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-x-gutter">
          <nav aria-label="Topics" className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <p className="type-label text-fg-muted">Topics</p>
              <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-2 lg:block lg:space-y-1">
                {faqGroups.map((group, index) => (
                  <li key={group.id}>
                    <a href={`#${group.id}`} className="group inline-flex items-baseline gap-3 py-1">
                      <span className="type-label text-fg-muted group-hover:text-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="underline decoration-line decoration-1 underline-offset-4 transition-colors group-hover:text-accent group-hover:decoration-current lg:no-underline">
                        {group.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="space-y-20 md:space-y-28 lg:col-span-8 lg:col-start-5">
            {faqGroups.map((group, index) => (
              <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`}>
                <h2
                  id={`${group.id}-title`}
                  className="type-display flex items-baseline gap-4 text-display-md"
                >
                  <span aria-hidden="true" className="type-label text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {group.title}
                </h2>
                <div className="mt-8 border-t hairline">
                  {group.items.map((item) => (
                    <Question key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="faq-more-title" className="py-section">
        <Container>
          <h2 id="faq-more-title" className="type-display max-w-[16ch] text-display-lg">
            Something we <span className="italic text-accent">haven’t answered?</span>
          </h2>
          <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-x-gutter">
            <p className="max-w-[44ch] text-lede text-fg-muted lg:col-span-6">
              Include it in your brief and it will be answered in writing, along with your scope
              and price. See also{" "}
              <Link href="/pricing" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
                pricing
              </Link>{" "}
              and{" "}
              <Link href="/how-it-works" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
                how it works
              </Link>
              .
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:justify-end">
              <ButtonLink href="/start">Start a project</ButtonLink>
              <ButtonLink href="/websites" variant="secondary">
                Find your website
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function Question({ item }: { item: FaqItem }) {
  return (
    <details id={item.id} className="group border-b hairline">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-6 py-5 text-lede transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{item.question}</span>
        {item.tbc ? (
          <span className="type-label hidden shrink-0 text-accent sm:inline">To be confirmed</span>
        ) : null}
        <span
          aria-hidden="true"
          className="relative grid size-6 shrink-0 place-items-center border border-current opacity-60 group-open:opacity-100"
        >
          <span className="absolute h-px w-2.5 bg-current" />
          <span className="absolute h-2.5 w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
        </span>
      </summary>
      <div className="max-w-[60ch] space-y-4 pb-8 text-fg-muted">
        {item.answer.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {item.tbc ? <ToBeConfirmed>{item.tbc}</ToBeConfirmed> : null}
        {item.links?.length ? (
          <p className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {item.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-small font-medium text-fg underline decoration-1 underline-offset-4 hover:text-accent"
              >
                {link.label} →
              </Link>
            ))}
          </p>
        ) : null}
      </div>
    </details>
  );
}
