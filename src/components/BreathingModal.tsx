import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Wind, X } from 'lucide-react';

interface BreathingModalProps {
  open: boolean;
  onClose: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale';

const PHASE_CONFIG: Record<BreathPhase, { label: string; seconds: number; instruction: string; next: BreathPhase }> = {
  inhale: {
    label: 'Breathe in',
    seconds: 4,
    instruction: 'Inhale slowly through your nose.',
    next: 'hold',
  },
  hold: {
    label: 'Hold gently',
    seconds: 4,
    instruction: 'Let your shoulders relax downward.',
    next: 'exhale',
  },
  exhale: {
    label: 'Breathe out',
    seconds: 6,
    instruction: 'Exhale steadily and release tension.',
    next: 'inhale',
  },
};

const GROUNDING_STEPS = [
  '5 things you can see right now',
  '4 physical surfaces you can touch',
  '3 distinct sounds in the room',
  '2 scents or subtle air sensations',
  '1 slow breath and a kind thought for yourself',
];

export function BreathingModal({ open, onClose }: BreathingModalProps) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(PHASE_CONFIG.inhale.seconds);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!open || !running) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }
        const nextPhase = PHASE_CONFIG[phase].next;
        if (phase === 'exhale') {
          setCyclesCompleted((count) => count + 1);
        }
        setPhase(nextPhase);
        return PHASE_CONFIG[nextPhase].seconds;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open, running, phase]);

  if (!open) {
    return null;
  }

  const current = PHASE_CONFIG[phase];
  const scaleClass =
    !running
      ? 'scale-100'
      : phase === 'inhale'
        ? 'scale-110'
        : phase === 'hold'
          ? 'scale-110'
          : 'scale-95';

  const handleReset = () => {
    setRunning(false);
    setPhase('inhale');
    setSecondsLeft(PHASE_CONFIG.inhale.seconds);
    setCyclesCompleted(0);
    setCheckedSteps([]);
  };

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breathing-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 id="breathing-modal-title" className="text-xl font-semibold text-slate-900">
              Guided 4-4-6 Breathing & Grounding
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              A longer exhale helps signal calm to your nervous system.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close breathing exercise"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
            <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
              <Wind className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>4s Inhale · 4s Hold · 6s Exhale</span>
            </div>

            <div className="my-5 flex h-36 w-36 items-center justify-center">
              <div
                className={`flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-teal-700/30 bg-teal-50 transition-transform duration-1000 ease-out ${scaleClass}`}
              >
                <span className="font-display text-3xl font-semibold text-teal-900 tabular-nums">
                  {secondsLeft}s
                </span>
                <span className="mt-0.5 text-xs font-medium text-teal-800">{current.label}</span>
              </div>
            </div>

            <p className="min-h-[2.5rem] text-sm text-slate-700">{current.instruction}</p>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRunning((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0"
              >
                {running ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    <span>Start Cadence</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset breathing cadence"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500 tabular-nums">
              Completed cycles: {cyclesCompleted}
            </p>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">5-4-3-2-1 Sensory Check</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Check off each anchor as you notice it around you to bring attention back to the present.
              </p>
              <ul className="mt-4 space-y-2.5">
                {GROUNDING_STEPS.map((step, index) => {
                  const checked = checkedSteps.includes(index);
                  return (
                    <li key={step}>
                      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStep(index)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                        />
                        <span className={checked ? 'text-slate-400 line-through' : 'text-slate-800'}>
                          {step}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-3 text-xs text-slate-500 tabular-nums">
              {checkedSteps.length} of {GROUNDING_STEPS.length} grounding anchors noticed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
