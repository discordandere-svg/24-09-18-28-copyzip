import React, { useState } from 'react';
import { EnergySpecs } from '../types';
import { X, Check, RotateCcw, SlidersHorizontal, Zap, ShieldAlert, TrendingUp, CalendarDays } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  energy: EnergySpecs;
  onSave: (updated: EnergySpecs) => void;
  onResetAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  energy,
  onSave,
  onResetAll,
}) => {
  if (!isOpen) return null;

  const [localEnergy, setLocalEnergy] = useState<EnergySpecs>({ ...energy });

  const handleSave = () => {
    onSave(localEnergy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Marktparameters & EPEX
              </h3>
              <p className="text-xs text-slate-500">
                Modern slim energiesysteem: rekenfactoren voor commerciële ROI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instellingen */}
        <div className="space-y-4 text-xs max-h-[65vh] overflow-y-auto pr-1">
          {/* Dynamische stroomprijs na batterij */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <label htmlFor="dynamic-price-input" className="text-xs font-bold text-slate-800 block">
              Gemiddelde dynamische inkoopprijs met slimme sturing (€/kWh)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">€</span>
              <input
                id="dynamic-price-input"
                type="number"
                step="0.01"
                min="0.10"
                max="0.80"
                value={localEnergy.dynamicElectricityPricePerKWh}
                onChange={(e) =>
                  setLocalEnergy({
                    ...localEnergy,
                    dynamicElectricityPricePerKWh: Number(e.target.value),
                  })
                }
                className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Standaard: € 0,22 /kWh (door inkoop op dal- en negatieve uren)
            </span>
          </div>

          {/* EPEX Parameters */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-emerald-700" />
              <span>EPEX Dynamische Uur- en Kwartierprijzen</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Formule: <code className="bg-white/80 px-1 py-0.5 rounded text-emerald-950 font-mono text-[10px]">capaciteit × cycli × spread × rendement</code>
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="space-y-1">
                <label htmlFor="epex-diff-input" className="text-[10px] font-bold text-slate-700 block">
                  Spread (€/kWh)
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-500">€</span>
                  <input
                    id="epex-diff-input"
                    type="number"
                    step="0.01"
                    min="0.08"
                    max="0.25"
                    value={localEnergy.epexPriceDiffPerKWh}
                    onChange={(e) =>
                      setLocalEnergy({
                        ...localEnergy,
                        epexPriceDiffPerKWh: Number(e.target.value),
                      })
                    }
                    className="w-full pl-5 pr-1 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 tabular-nums"
                  />
                </div>
                <span className="text-[9px] text-slate-500 block">€ 0,10 - € 0,18</span>
              </div>

              <div className="space-y-1">
                <label htmlFor="epex-cycles-input" className="text-[10px] font-bold text-slate-700 block">
                  Cycli/jaar
                </label>
                <input
                  id="epex-cycles-input"
                  type="number"
                  step="10"
                  min="100"
                  max="365"
                  value={localEnergy.epexCyclesPerYear}
                  onChange={(e) =>
                    setLocalEnergy({
                      ...localEnergy,
                      epexCyclesPerYear: Number(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 tabular-nums"
                />
                <span className="text-[9px] text-slate-500 block">320 cycli</span>
              </div>

              <div className="space-y-1">
                <label htmlFor="epex-eff-input" className="text-[10px] font-bold text-slate-700 block">
                  Rendement
                </label>
                <div className="relative">
                  <input
                    id="epex-eff-input"
                    type="number"
                    step="1"
                    min="70"
                    max="99"
                    value={Math.round(localEnergy.epexBatteryEfficiency * 100)}
                    onChange={(e) =>
                      setLocalEnergy({
                        ...localEnergy,
                        epexBatteryEfficiency: Number(e.target.value) / 100,
                      })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 tabular-nums pr-5"
                  />
                  <span className="absolute right-1.5 top-1.5 text-[10px] font-bold text-slate-500">%</span>
                </div>
                <span className="text-[9px] text-slate-500 block">95%</span>
              </div>
            </div>
          </div>

          {/* Salderingsafbouw & Piekbesparing Toggles */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Slimme Optimalisaties
            </div>

            <label className="flex items-center justify-between cursor-pointer p-1">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Salderingsafbouw bescherming (2027+)</span>
                <span className="text-[10px] text-slate-500">Waardeert zelf opgeslagen zonnestroom tegen consumentenwaarde</span>
              </div>
              <input
                type="checkbox"
                checked={localEnergy.enableSalderingBenefit}
                onChange={(e) => setLocalEnergy({ ...localEnergy, enableSalderingBenefit: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-1 border-t border-slate-200/60 pt-2">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Netkosten- & Piekbesparing</span>
                <span className="text-[10px] text-slate-500">Peak shaving en besparing op toekomstig capaciteitstarief</span>
              </div>
              <input
                type="checkbox"
                checked={localEnergy.enableGridPeakSavings}
                onChange={(e) => setLocalEnergy({ ...localEnergy, enableGridPeakSavings: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          {/* Toekomstige Energieprijsstijging */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="inflation-input" className="text-xs font-bold text-slate-800 block">
                Verwachte energieprijsstijging per jaar
              </label>
              <span className="text-xs font-black text-emerald-700">{localEnergy.futurePriceInflationPercent || 3.5}%</span>
            </div>
            <input
              id="inflation-input"
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={localEnergy.futurePriceInflationPercent || 3.5}
              onChange={(e) => setLocalEnergy({ ...localEnergy, futurePriceInflationPercent: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Gebruikt voor de 10-jaars en 15-jaars cumulatieve vermogensopbouw.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onResetAll();
              onClose();
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Herstel</span>
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Opslaan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
