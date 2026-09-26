import React from 'react';
import { SlidersHorizontal, RotateCcw, FileText, Home, ShieldCheck } from 'lucide-react';
import { SolarFastLogo } from './brand/Logos';

interface HeaderProps {
  currentStep: number;
  onGoHome: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onGoToReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onGoHome,
  onOpenSettings,
  onReset,
  onGoToReport,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all no-print shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="w-full min-w-0 mx-auto px-3 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-left focus:outline-hidden"
            title="Ga naar start"
          >
            <SolarFastLogo variant="full" />
          </button>
        </div>

        {/* Actieknoppen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoHome}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              currentStep === 0
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 font-black'
                : 'text-slate-700 hover:text-emerald-900 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200'
            }`}
            title="Startpagina"
          >
            <Home className="w-3.5 h-3.5 text-emerald-700" />
            <span>Start</span>
          </button>

          <button
            type="button"
            onClick={onGoToReport}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-emerald-800 text-white border border-emerald-900 font-black shadow-xs'
                : 'text-slate-700 hover:text-emerald-900 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200'
            }`}
            title="Bekijk de Voor & Na resultaten"
          >
            <FileText className={`w-3.5 h-3.5 ${currentStep === 3 ? 'text-white' : 'text-emerald-700'}`} />
            <span className="hidden sm:inline">Resultaat (Voor & Na)</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Markttarieven en parameters aanpassen"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Parameters & EPEX</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Wilt u de invoer herstellen naar de standaardwaarden?')) {
                onReset();
              }
            }}
            className="flex items-center gap-1 px-2 py-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-xs"
            title="Herstart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Herstart</span>
          </button>
        </div>
      </div>
    </header>
  );
};
