import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
};

const variants = {
  primary:
    "bg-accent text-accent-fg hover:bg-fg hover:text-surface",
  secondary:
    "border border-current text-fg hover:bg-fg hover:text-surface",
};

/** Link styled as a button. Square-edged by design: no pills. */
export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`group inline-flex min-h-12 items-center gap-3 px-5 text-small font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
