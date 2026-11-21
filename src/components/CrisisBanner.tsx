import { PhoneCall, X } from 'lucide-react';
import { CRISIS_RESOURCES } from '../utils/safety';

interface CrisisBannerProps {
  matchedSignals?: string[];
  onDismiss?: () => void;
  compact?: boolean;
}

export function CrisisBanner({ matchedSignals = [], onDismiss, compact = false }: CrisisBannerProps) {
  return (
    <div
      role="alert"
      data-testid="crisis-safety-banner"
      className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-900">
            <PhoneCall className="h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
            <span>Immediate human support is available 24/7</span>
          </div>
          <p className="text-sm leading-relaxed text-red-950/90">
            MindMate is an AI wellness tool and cannot provide emergency care. If you are feeling overwhelmed, unsafe, or thinking about hurting yourself, please connect with a trained crisis counselor right now.
          </p>
          {matchedSignals.length > 0 && !compact && (
            <p className="text-xs text-red-800">
              Safety guardrail triggered · Detected signal: {matchedSignals.join(', ')}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss crisis support banner"
            className="rounded-lg p-1.5 text-red-800 transition-colors hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2.5 border-t border-red-200/80 pt-3 sm:grid-cols-3">
        {CRISIS_RESOURCES.map((resource) => (
          <div key={resource.name} className="space-y-0.5 text-xs">
            <div className="font-semibold text-red-950">{resource.name}</div>
            <div className="font-mono font-medium text-red-800 tabular-nums">{resource.contact}</div>
            <div className="text-red-900/75">
              {resource.region} · {resource.availability}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
