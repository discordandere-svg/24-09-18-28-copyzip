import React from 'react';
import { AdviceScope } from '../types';
import { Battery, Flame, Zap, ArrowRight, Check, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

interface StepHomeStartProps {
  onSelectScope: (scope: AdviceScope) => void;
}

export const StepHomeStart: React.FC<StepHomeStartProps> = ({ onSelectScope }) => {
  return (
    <div className="w-full min-w-0 mx-auto space-y-8 py-4 sm:py-8">
      {/* Rustige introductie met commerciële kracht */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Thuisbatterij & Warmtepomp • Slimme Sturing & Salderingsbescherming</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
          Professioneel Tafeladvies Rekenmodel
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Bereken direct de maximale besparing, vermeden terugleverkosten, EPEX dynamische uurprijzen en een aantrekkelijke terugverdientijd voor een HYXIPOWER thuisbatterij of warmtepomp.
        </p>
      </div>

      {/* 3 Keuzepanelen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Optie 1: Alleen Thuisbatterij */}
        <div
          id="choice-battery"
          onClick={() => onSelectScope('battery')}
          className="group relative bg-white rounded-3xl border-2 border-emerald-600/30 hover:border-emerald-600 hover:shadow-xl transition-all p-6 flex flex-col justify-between cursor-pointer ring-1 ring-emerald-500/10"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Battery className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
                Zonnestroom & Opslag
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Alleen thuisbatterij
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Voor huishoudens met zonnepanelen die zonne-overschotten opslaan, terugleverkosten 100% vermijden en profiteren van dynamische uurprijzen.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>HYXIPOWER Thuisbatterij</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>EPEX Day-Ahead & negatieve uren</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Vermeden terugleverkosten boetes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Klaar voor salderingsafbouw 2027</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="w-full py-3 px-4 bg-emerald-800 group-hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Start Batterijadvies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optie 2: Alleen Warmtepomp */}
        <div
          id="choice-heatpump"
          onClick={() => onSelectScope('heatpump')}
          className="group relative bg-white rounded-3xl border border-slate-200 hover:border-amber-600 hover:shadow-lg transition-all p-6 flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-100">
              <Flame className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 block">
                Duurzaam Verwarmen
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Alleen warmtepomp
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Voor huishoudens die fors gas willen besparen of aardgasvrij willen wonen met een Vaillant aroTHERM warmtepomp.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Hybride: 70% tot 92% gasreductie</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>All-electric: 100% gasreductie</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Vaillant aroTHERM Plus (SCOP tot 4.95)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ISDE rijkssubsidie verwerkt</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="w-full py-3 px-4 bg-amber-700 group-hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Start Warmtepompadvies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optie 3: Batterij + Warmtepomp */}
        <div
          id="choice-both"
          onClick={() => onSelectScope('both')}
          className="group relative bg-white rounded-3xl border border-slate-200 hover:border-slate-800 hover:shadow-lg transition-all p-6 flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
              <Zap className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                Gecombineerd Systeem
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Batterij + warmtepomp
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maximale autonomie en laagste energienota: slimme dynamische sturing van warmtepomp via batterijopslag en EPEX arbitrage.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>HYXIPOWER LFP batterij</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Vaillant aroTHERM Plus</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Slimme wintersturing warmtepomp</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hoogste gecombineerde ROI</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="w-full py-3 px-4 bg-slate-900 group-hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Start Combinatieadvies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
