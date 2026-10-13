import { Container } from "@/components/ui/container";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children?: React.ReactNode;
};

/** Stage 1 stand-in for pages that have not been designed yet. */
export function PagePlaceholder({ eyebrow, title, intro, children }: PagePlaceholderProps) {
  return (
    <Container as="section" className="pt-16 pb-section md:pt-24">
      <p className="type-label text-fg-muted">{eyebrow}</p>
      <h1 className="type-display mt-6 max-w-[14ch] text-display-lg">{title}</h1>
      <p className="mt-8 max-w-prose text-lede text-fg-muted">{intro}</p>
      {children}
      <p className="type-label mt-16 border-t hairline pt-6 text-fg-muted">
        Placeholder — content arrives in a later stage
      </p>
    </Container>
  );
}
