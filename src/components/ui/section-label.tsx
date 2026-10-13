type SectionLabelProps = {
  index?: string;
  children: React.ReactNode;
  className?: string;
};

/** Mono eyebrow above a section heading, e.g. "(02) Selected websites". */
export function SectionLabel({ index, children, className = "" }: SectionLabelProps) {
  return (
    <p className={`type-label flex items-baseline gap-3 text-fg-muted ${className}`}>
      {index ? <span className="text-accent">({index})</span> : null}
      <span>{children}</span>
    </p>
  );
}
