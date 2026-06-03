import type { Person } from "../types";
import { deriveStatus, toneClasses } from "../utils/statusUtils";

interface Props {
  person: Person;
  size?: "sm" | "md";
}

/** Colour + label badge. Never relies on colour alone — the text label is
 *  always present for accessibility. */
export default function StatusBadge({ person, size = "md" }: Props) {
  const { label, tone } = deriveStatus(person);
  const c = toneClasses[tone];
  return (
    <span
      className={`chip ${c.chipBg} ${c.chipText} ${size === "sm" ? "text-xs px-2.5 py-0.5" : ""}`}
    >
      <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
      {label}
    </span>
  );
}
