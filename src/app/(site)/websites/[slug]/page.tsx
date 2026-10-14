import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConceptPreview } from "@/components/concepts/concept-preview";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { ButtonLink } from "@/components/ui/button-link";
import { concepts, getConcept } from "@/content/concepts";

export function generateStaticParams() {
  return concepts.map((concept) => ({ slug: concept.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/websites/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const concept = getConcept(slug);
  return concept ? { title: concept.title, description: concept.summary } : {};
}

export default async function WebsiteDemoPage({ params }: PageProps<"/websites/[slug]">) {
  const { slug } = await params;
  const concept = getConcept(slug);
  if (!concept) notFound();

  return (
    <PagePlaceholder
      eyebrow={`${concept.index} — Demonstration concept`}
      title={concept.title}
      intro={concept.summary}
    >
      {concept.demoHref ? (
        <section aria-label="Full demonstration" className="mt-16 grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <Link
            href={concept.demoHref}
            className="block ring-1 ring-line transition-transform duration-700 ease-out-expo hover:-translate-y-1 md:col-span-8"
          >
            <span className="sr-only">Open the full demo of {concept.demoName}</span>
            <ConceptPreview concept={concept} />
          </Link>
          <div className="flex flex-col items-start gap-6 md:col-span-4 md:justify-end">
            <p className="text-fg-muted">
              See {concept.demoName} as a complete homepage, full screen, the way a visitor would.
            </p>
            <ButtonLink href={concept.demoHref}>Open the full demo</ButtonLink>
          </div>
        </section>
      ) : null}
    </PagePlaceholder>
  );
}
