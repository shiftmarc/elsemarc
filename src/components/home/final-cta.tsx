import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="py-section">
      <Container>
        <h2 id="final-title" className="type-display reveal text-display-xl">
          Your next website should be <span className="italic text-accent">extraordinary.</span>
        </h2>
        <div className="mt-12 flex flex-col gap-3 sm:flex-row md:mt-16">
          <ButtonLink href="/websites">Find your website</ButtonLink>
          <ButtonLink href="/custom" variant="secondary">
            Build something different
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
