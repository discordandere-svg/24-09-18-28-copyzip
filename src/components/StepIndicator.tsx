import React from 'react';
import { Check } from 'lucide-react';
import { AdviceScope } from '../types';

interface StepIndicatorProps {
  currentStep: number;
  scope?: AdviceScope;
  onSelectStep: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  scope = 'battery',
  onSelectStep,
}) => {
  const step2Label =
    scope === 'battery'
      ? '2. Batterijadvies'
      : scope === 'heatpump'
      ? '2. Warmtepompadvies'
      : '2. Systeemadvies';

  const step2Subtitle =
    scope === 'battery'
      ? 'HYXIPOWER Selectie'
      : scope === 'heatpump'
      ? 'Vaillant aroTHERM'
      : 'Batterij & Warmtepomp';

  const steps = [
    { step: 1, label: '1. Nulmeting', subtitle: 'Huidige energiekosten' },
    { step: 2, label: step2Label, subtitle: step2Subtitle },
    { step: 3, label: '3. Resultaat', subtitle: 'Voor & Na vergelijking' },
  ];

  if (currentStep === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white/90 backdrop-blur-xs border-b border-slate-200/80 py-3 px-3 sm:px-6 lg:px-8 no-print">
      <div className="w-full min-w-0 mx-auto">
        <div className="flex items-center justify-between relative">
          {steps.map((s, index) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <React.Fragment key={s.step}>
                <button
                  type="button"
                  id={`step-nav-${s.step}`}
                  onClick={() => onSelectStep(s.step)}
                  className="group relative flex flex-col items-center sm:items-start focus:outline-hidden cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCurrent
                          ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20 ring-4 ring-emerald-600/15'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span>{s.step}</span>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span
                        className={`text-xs font-bold tracking-tight transition-colors ${
                          isCurrent
                            ? 'text-emerald-950 font-black'
                            : isCompleted
                            ? 'text-slate-800'
                            : 'text-slate-500 group-hover:text-slate-800'
                        }`}
                      >
                        {s.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none">
                        {s.subtitle}
                      </span>
                    </div>
                  </div>
                </button>

                {index < steps.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 sm:mx-4 relative overflow-hidden bg-slate-200 rounded-full">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                      style={{
                        width: s.step < currentStep ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
