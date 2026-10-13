import { NotFoundContent } from "@/components/layout/not-found-content";
import SiteLayout from "./(site)/layout";

// Unmatched URLs render outside the (site) group, so wrap them in its chrome.
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundContent />
    </SiteLayout>
  );
}
