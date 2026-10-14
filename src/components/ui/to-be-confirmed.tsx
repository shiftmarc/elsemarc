import type { ReactNode } from "react";

/**
 * A deliberately visible gap: content that depends on a business decision
 * not yet made. Search the codebase for <ToBeConfirmed> before launch; none
 * should remain.
 */
export function ToBeConfirmed({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`border border-dashed border-accent/70 px-4 py-3 ${className}`}>
      <p className="type-label flex items-center gap-2 text-accent">
        <span aria-hidden="true" className="size-1.5 bg-accent" />
        To be confirmed
      </p>
      {children ? <p className="mt-2 text-small text-fg-muted">{children}</p> : null}
    </div>
  );
}
