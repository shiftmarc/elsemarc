import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { carePlan, offerings, pricingExclusions } from "@/content/pricing";

export function PricingSummary() {
  return (
    <section aria-labelledby="pricing-title" className="theme-paper py-section">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-7">
            <SectionLabel index="05">Pricing</SectionLabel>
            <h2 id="pricing-title" className="type-display mt-6 text-display-lg">
              Two ways to <span className="italic">begin.</span>
            </h2>
          </div>
          <p className="text-lede text-fg-muted md:col-span-4 md:col-start-9 md:self-end">
            Published prices for websites. Clear, written quotes for everything else.
          </p>
        </div>

        <div className="mt-16 grid border-t hairline md:mt-24 md:grid-cols-2">
          {offerings.map((offering, index) => (
            <article
              key={offering.index}
              aria-labelledby={`offering-${offering.index}`}
              className={`reveal flex flex-col pt-8 pb-12 md:pb-4 ${
                index === 0 ? "md:border-r md:pr-gutter hairline" : "border-t hairline md:border-t-0 md:pl-gutter"
              }`}
            >
              <p className="type-label text-accent">{offering.index}</p>
              <h3 id={`offering-${offering.index}`} className="type-display mt-4 text-heading">
                {offering.title}
              </h3>
              <p className="type-display mt-10 text-display-md">{offering.price}</p>
              <p className="type-label mt-3 text-fg-muted">{offering.priceNote}</p>

              <p className="type-label mt-10 text-fg-muted">{offering.listLabel}</p>
              <ul className="mt-3 flex-1">
                {offering.items.map((item) => (
                  <li key={item} className="flex gap-3 border-b hairline py-3">
                    <span aria-hidden="true" className="text-fg-muted">
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <ButtonLink
                href={offering.cta.href}
                variant={index === 0 ? "primary" : "secondary"}
                className="mt-8 self-start"
              >
                {offering.cta.label}
              </ButtonLink>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-8 border-t hairline pt-8 md:mt-16 md:grid-cols-12 md:gap-x-gutter">
          <div className="md:col-span-4">
            <p className="type-label text-fg-muted">Website care, optional</p>
            <p className="type-display mt-3 text-heading">
              {carePlan.price} <span className="type-label text-fg-muted">{carePlan.priceNote}</span>
            </p>
          </div>
          <p className="text-fg-muted md:col-span-4">{carePlan.summary}</p>
          <div className="md:col-span-4">
            <p className="text-small text-fg-muted">{pricingExclusions}</p>
            <Link
              href="/pricing"
              className="mt-4 inline-block text-small font-medium underline decoration-1 underline-offset-4 hover:text-accent"
            >
              Full pricing details
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
