import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
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
    />
  );
}
