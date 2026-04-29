import { useEffect, useState } from 'react';
import { Sparkles, X, ChevronLeft, ChevronRight, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DemoTour } from '@/lib/demoTours';

interface GuidedTourProps {
  tour: DemoTour;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function GuidedTour({ tour, open, onClose, onComplete }: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open, tour.id]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStepIndex(prev => Math.min(prev + 1, tour.steps.length - 1));
      if (e.key === 'ArrowLeft') setStepIndex(prev => Math.max(prev - 1, 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, tour.steps.length]);

  if (!open) return null;

  const total = tour.steps.length;
  const step = tour.steps[stepIndex];
  const isLast = stepIndex === total - 1;
  const isFirst = stepIndex === 0;

  const finish = () => {
    onComplete?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-tour-title"
      data-testid="guided-tour-overlay"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-br from-primary/15 via-card to-secondary/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {tour.audience} • Step {stepIndex + 1} of {total}
                </div>
                <h2 id="guided-tour-title" className="text-lg font-black uppercase tracking-tight truncate">
                  {tour.title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close tour"
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
              data-testid="button-tour-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
              data-testid="tour-progress"
            />
          </div>
        </div>

        <div className="px-6 py-5 space-y-3 max-h-[60dvh] overflow-y-auto">
          <div>
            <h3 className="font-black text-xl text-foreground mb-2" data-testid="tour-step-title">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium" data-testid="tour-step-body">
              {step.body}
            </p>
          </div>

          {step.hint && (
            <div className="flex items-start gap-2 bg-muted/50 border border-border rounded-xl p-3 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="font-medium">{step.hint}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-background/40">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="font-black uppercase tracking-wider text-xs"
            data-testid="button-tour-skip"
          >
            Skip
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFirst}
              onClick={() => setStepIndex(prev => Math.max(prev - 1, 0))}
              className="font-black uppercase tracking-wider"
              data-testid="button-tour-back"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {isLast ? (
              <Button
                type="button"
                size="sm"
                onClick={finish}
                className="font-black uppercase tracking-wider"
                data-testid="button-tour-finish"
              >
                Finish <Check className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setStepIndex(prev => Math.min(prev + 1, total - 1))}
                className="font-black uppercase tracking-wider"
                data-testid="button-tour-next"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
