import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { ButtonLink } from "@/components/ui/button-link";

export function NotFoundContent() {
  return (
    <PagePlaceholder
      eyebrow="404"
      title="This page doesn’t exist."
      intro="The link may be out of date, or the page may have moved."
    >
      <ButtonLink href="/" className="mt-10">
        Back to the beginning
      </ButtonLink>
    </PagePlaceholder>
  );
}
