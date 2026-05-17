'use client';

import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Drawer title shown in the header (e.g., "Admin Help"). */
  title: string;
  /** Optional one-line subtitle below the title. */
  subtitle?: string;
  /** Sections + paragraphs of help content. */
  children: ReactNode;
  /**
   * Anchor section ID to scroll into view when the drawer opens.
   * Wire this from inline `?` icons next to ambiguous controls
   * (e.g., `<button onClick={() => open('founding')}>?</button>` →
   * drawer opens scrolled to `id="help-section-founding"`).
   */
  initialSection?: string;
}

/**
 * Reusable Help drawer shell.
 *
 * Three behavior modes based on viewport:
 *   - <1100px: centered modal with backdrop, body scroll locked
 *   - ≥1100px: pushes the page (in-flow flex sibling, 320px)
 *   - ≥1280px (xl): pushes the page at 420px
 *
 * Used by both the admin sidebar (Help → AdminHelpContent) and the barber
 * dashboard sidebar (Help → BarberHelpContent). The shell handles
 * positioning, sidebar-aware centering, the X button, Esc-to-close, and
 * body-scroll lock. Content is whatever children you pass in.
 *
 * Layout placement: render this as the right-most child of the layout's
 * outer flex container, after <main>. When `open=true` it occupies a
 * fixed-width slot in the flex flow (push mode) or overlays (modal mode);
 * when `open=false` it returns null.
 */
export function HelpDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  initialSection,
}: HelpDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll on overlay sizes only.
  useEffect(() => {
    if (!open) return;
    const isOverlay = window.matchMedia('(max-width: 1099px)').matches;
    if (!isOverlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Scroll the anchor into view when the drawer opens with a section
  useEffect(() => {
    if (!open || !initialSection) return;
    const id = `help-section-${initialSection}`;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [open, initialSection]);

  if (!open) return null;

  const isOverlay =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches;

  return (
    <>
      {/* Backdrop — overlay sizes only, click to close */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm min-[1100px]:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role={isOverlay ? 'dialog' : 'complementary'}
        aria-label={title}
        aria-modal={isOverlay ? true : undefined}
        className="
          fixed left-[calc(50%+2rem)] top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-6rem)] max-w-lg max-h-[85vh] rounded-lg border border-border bg-card flex flex-col shadow-2xl
          min-[1100px]:relative min-[1100px]:left-auto min-[1100px]:top-auto min-[1100px]:translate-x-0 min-[1100px]:translate-y-0 min-[1100px]:inset-auto min-[1100px]:z-auto min-[1100px]:w-[320px] min-[1100px]:max-w-none min-[1100px]:max-h-none min-[1100px]:rounded-none min-[1100px]:border-y-0 min-[1100px]:border-r-0 min-[1100px]:shadow-none min-[1100px]:shrink-0 min-[1100px]:sticky min-[1100px]:top-16 min-[1100px]:h-[calc(100vh-4rem)]
          xl:w-[420px]
        "
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose} aria-label="Close help">
            ✕
          </Button>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 text-sm">
          {children}
        </div>
      </aside>
    </>
  );
}
