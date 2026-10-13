import type { Metadata } from "next";
import Link from "next/link";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { concepts } from "@/content/concepts";

export const metadata: Metadata = {
  title: "Website collection",
  description: "A curated collection of website designs, ready to make your own.",
};

export default function WebsitesPage() {
  return (
    <PagePlaceholder
      eyebrow="Website collection"
      title="Find your website."
      intro="A curated collection of designs, each ready to be made your own."
    >
      <ul className="mt-16 border-t hairline">
        {concepts.map((concept) => (
          <li key={concept.slug} className="border-b hairline">
            <Link
              href={`/websites/${concept.slug}`}
              className="group flex items-baseline gap-6 py-6"
            >
              <span className="type-label text-fg-muted">{concept.index}</span>
              <span className="type-display text-heading transition-colors group-hover:text-accent">
                {concept.title}
              </span>
              <span className="type-label ml-auto hidden text-fg-muted sm:inline">
                Demonstration concept
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PagePlaceholder>
  );
}
