import { useEffect } from "react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional sticky footer (e.g. save/cancel buttons). */
  footer?: ReactNode;
}

/**
 * Mobile-first sheet/modal. On phones it slides up as a near-full-height
 * sheet; on larger screens it centres as a card. Closes on Escape / backdrop.
 */
export default function Modal({ open, title, onClose, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative animate-pop w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-cream sm:rounded-xl2 rounded-t-xl2 shadow-lift">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line shrink-0">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="btn-ghost px-3 py-2 -mr-2" aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4 grow">{children}</div>
        {footer && (
          <footer className="px-5 py-4 border-t border-line bg-cream/95 shrink-0 [padding-bottom:calc(1rem+var(--safe-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
