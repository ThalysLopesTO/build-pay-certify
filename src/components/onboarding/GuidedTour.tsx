import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export interface TourStep {
  /** CSS selector of the element to highlight. Omit for a centered step. */
  selector?: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

const HOLE_PADDING = 8;
const TOOLTIP_WIDTH = 320;

/**
 * Lightweight, dependency-free product tour: dims the screen, spotlights the
 * target element with an orange outline, and shows a tooltip with arrows +
 * Back / Next / Skip. Targets are matched by CSS selector (use data-tour="…").
 */
export const GuidedTour: React.FC<GuidedTourProps> = ({ steps, open, onClose, onFinish }) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => { if (open) setIndex(0); }, [open]);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step?.selector) { setRect(null); return; }
    const el = document.querySelector(step.selector) as HTMLElement | null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // On step change: scroll target into view, then measure (a couple of times as
  // the smooth scroll settles).
  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = step.selector ? (document.querySelector(step.selector) as HTMLElement | null) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    measure();
    const t1 = setTimeout(measure, 220);
    const t2 = setTimeout(measure, 460);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open, index, step, measure]);

  // Keep the spotlight glued to the element while scrolling/resizing.
  useEffect(() => {
    if (!open) return;
    const handler = () => measure();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [open, measure]);

  if (!open || !step) return null;

  const isLast = index === steps.length - 1;
  const next = () => { if (isLast) { onFinish?.(); onClose(); } else setIndex(i => i + 1); };
  const back = () => setIndex(i => Math.max(0, i - 1));

  // Tooltip placement
  const placement = step.placement ?? 'bottom';
  const tip: React.CSSProperties = { width: TOOLTIP_WIDTH };
  if (rect) {
    const cx = rect.left + rect.width / 2;
    const clampX = (x: number) => Math.min(Math.max(x, 12), window.innerWidth - TOOLTIP_WIDTH - 12);
    if (placement === 'bottom') { tip.top = rect.bottom + 14; tip.left = clampX(cx - TOOLTIP_WIDTH / 2); }
    else if (placement === 'top') { tip.top = rect.top - 14; tip.left = clampX(cx - TOOLTIP_WIDTH / 2); tip.transform = 'translateY(-100%)'; }
    else if (placement === 'right') { tip.top = Math.max(rect.top, 12); tip.left = rect.right + 14; }
    else { tip.top = Math.max(rect.top, 12); tip.left = rect.left - 14; tip.transform = 'translateX(-100%)'; }
  } else {
    tip.top = '50%'; tip.left = '50%'; tip.transform = 'translate(-50%, -50%)';
  }

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      {/* Click blocker (transparent) */}
      <div className="absolute inset-0" />

      {/* Dim + spotlight */}
      {rect ? (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - HOLE_PADDING,
            left: rect.left - HOLE_PADDING,
            width: rect.width + HOLE_PADDING * 2,
            height: rect.height + HOLE_PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)',
            outline: '2px solid rgba(249, 115, 22, 0.95)',
            outlineOffset: 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/65" />
      )}

      {/* Tooltip */}
      <div className="absolute bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-150" style={tip}>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600" aria-label="Close tour">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-500">
          {index === 0 && <Sparkles className="h-3.5 w-3.5" />}
          Step {index + 1} of {steps.length}
        </div>
        <h3 className="text-base font-bold text-slate-900 mt-1.5">{step.title}</h3>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{step.body}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1 mt-4">
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-orange-500' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <button onClick={onClose} className="text-xs font-medium text-slate-400 hover:text-slate-600">Skip</button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button onClick={back} className="h-8 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            <button onClick={next} className="h-8 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold inline-flex items-center gap-1">
              {isLast ? 'Finish' : 'Next'} {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default GuidedTour;
