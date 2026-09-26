import React, { useState } from 'react';
import { EnergySpecs, CalculationResult, BatteryProduct, HeatPumpProduct } from '../types';
import { X, Check, RotateCcw, Euro, Sparkles } from 'lucide-react';

interface PriceAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  energy: EnergySpecs;
  onUpdateEnergy: (updated: EnergySpecs) => void;
  calculation: CalculationResult;
  selectedBattery: BatteryProduct;
  selectedHeatPump: HeatPumpProduct;
  batteryActive: boolean;
  heatPumpActive: boolean;
}

export const PriceAdjustModal: React.FC<PriceAdjustModalProps> = ({
  isOpen,
  onClose,
  energy,
  onUpdateEnergy,
  calculation,
  selectedBattery,
  selectedHeatPump,
  batteryActive,
  heatPumpActive,
}) => {
  if (!isOpen) return null;

  const [batteryPrice, setBatteryPrice] = useState<number | ''>(
    energy.customBatteryPrice !== null && energy.customBatteryPrice !== undefined
      ? energy.customBatteryPrice
      : ''
  );
  const [heatPumpPrice, setHeatPumpPrice] = useState<number | ''>(
    energy.customHeatPumpPrice !== null && energy.customHeatPumpPrice !== undefined
      ? energy.customHeatPumpPrice
      : ''
  );
  const [applyIsde, setApplyIsde] = useState<boolean>(
    energy.applyIsdeSubsidy !== undefined ? energy.applyIsdeSubsidy : true
  );
  const [customTotal, setCustomTotal] = useState<number | ''>(
    energy.customTotalInvestment !== null && energy.customTotalInvestment !== undefined
      ? energy.customTotalInvestment
      : ''
  );

  const isdeSubsidy = heatPumpActive ? selectedHeatPump.subsidyEstimate : 0;
  const rawHp = heatPumpPrice !== '' ? Number(heatPumpPrice) : null;
  const netHp = rawHp !== null ? (applyIsde ? Math.max(0, rawHp - isdeSubsidy) : rawHp) : null;
  const netBat = batteryPrice !== '' ? Number(batteryPrice) : null;

  const liveCalculatedTotal =
    (batteryActive && netBat !== null ? netBat : 0) +
    (heatPumpActive && netHp !== null ? netHp : 0);

  const effectiveTotal =
    customTotal !== ''
      ? (applyIsde && heatPumpActive ? Math.max(0, Number(customTotal) - isdeSubsidy) : Number(customTotal))
      : (liveCalculatedTotal > 0 ? liveCalculatedTotal : null);

  const handleSave = () => {
    const numBat = batteryActive && batteryPrice !== '' ? Number(batteryPrice) : null;
    const numHp = heatPumpActive && heatPumpPrice !== '' ? Number(heatPumpPrice) : null;
    let numTotal = customTotal !== '' ? Number(customTotal) : null;

    if (numTotal === null && (numBat !== null || numHp !== null)) {
      numTotal = (numBat ?? 0) + (numHp ?? 0);
      if (numTotal === 0) numTotal = null;
    }

    onUpdateEnergy({
      ...energy,
      customBatteryPrice: numBat,
      customHeatPumpPrice: numHp,
      customTotalInvestment: numTotal,
      applyIsdeSubsidy: applyIsde,
    });
    onClose();
  };

  const handleReset = () => {
    setBatteryPrice('');
    setHeatPumpPrice('');
    setCustomTotal('');
    onUpdateEnergy({
      ...energy,
      customBatteryPrice: null,
      customHeatPumpPrice: null,
      customTotalInvestment: null,
      applyIsdeSubsidy: true,
    });
  };

  const handleUseCatalogPrices = () => {
    if (batteryActive) setBatteryPrice(selectedBattery.basePrice);
    if (heatPumpActive) setHeatPumpPrice(selectedHeatPump.basePrice);
    setCustomTotal('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Euro className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Investering & Offerteprijs
              </h3>
              <p className="text-xs text-slate-500">
                Rendement berekend o.b.v. reële netto investering
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

        {/* Input velden */}
        <div className="space-y-3.5 text-xs">
          {batteryActive && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="price-battery-input" className="text-xs font-bold text-slate-800 block">
                  Offertebedrag {selectedBattery.brand} {selectedBattery.capacityKwh} kWh
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  0% btw (vrijstelling)
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">€</span>
                <input
                  id="price-battery-input"
                  type="number"
                  step="50"
                  value={batteryPrice}
                  onChange={(e) => setBatteryPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Investering nog invullen"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Standaard adviesprijs: € {selectedBattery.basePrice.toLocaleString('nl-NL')}</span>
                <button
                  type="button"
                  onClick={() => setBatteryPrice(selectedBattery.basePrice)}
                  className="text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  Vul adviesprijs in
                </button>
              </div>
            </div>
          )}

          {heatPumpActive && (
            <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="price-hp-input" className="text-xs font-bold text-amber-950 block">
                  Bruto offertebedrag warmtepomp ({selectedHeatPump.powerKw} kW {selectedHeatPump.type})
                </label>
                <button
                  type="button"
                  onClick={() => setHeatPumpPrice(selectedHeatPump.basePrice)}
                  className="text-[10px] text-amber-800 hover:underline font-bold cursor-pointer"
                >
                  Vul adviesprijs in (€ {selectedHeatPump.basePrice.toLocaleString('nl-NL')})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-amber-800">€</span>
                <input
                  id="price-hp-input"
                  type="number"
                  step="50"
                  value={heatPumpPrice}
                  onChange={(e) => setHeatPumpPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Investering nog invullen"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-black text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* ISDE Subsidie regeling */}
              <div className="p-2.5 bg-white rounded-xl border border-amber-200 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyIsde}
                    onChange={(e) => setApplyIsde(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    ISDE rijkssubsidie verrekenen (RVO)
                  </span>
                </label>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pl-6">
                  <span>Subsidiebedrag: <strong className="text-emerald-700">- € {isdeSubsidy.toLocaleString('nl-NL')}</strong></span>
                  {rawHp !== null && (
                    <span>Netto klant: <strong className="text-slate-900 font-black">€ {netHp?.toLocaleString('nl-NL')}</strong></span>
                  )}
                </div>
              </div>
            </div>
          )}

          {batteryActive && heatPumpActive && (
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
              <label htmlFor="price-custom-total-input" className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                <span>Gecombineerde totaalinvestering (optioneel)</span>
                <span className="text-[10px] text-emerald-800 font-medium">Combinatiedeal</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-emerald-800">€</span>
                <input
                  id="price-custom-total-input"
                  type="number"
                  placeholder={liveCalculatedTotal > 0 ? `Berekend netto: € ${liveCalculatedTotal.toLocaleString('nl-NL')}` : 'Totaalbedrag invullen'}
                  value={customTotal}
                  onChange={(e) => setCustomTotal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-black text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live weergave */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Netto investering klant:</span>
              <span className="text-xl font-black text-emerald-400 tabular-nums">
                {effectiveTotal !== null && effectiveTotal > 0
                  ? `€ ${effectiveTotal.toLocaleString('nl-NL')}`
                  : 'Investering nog invullen'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Terugverdientijd:</span>
              <span className="text-base font-black text-white tabular-nums">
                {effectiveTotal !== null && effectiveTotal > 0 && calculation.totalAnnualBenefit > 0
                  ? `~ ${(effectiveTotal / calculation.totalAnnualBenefit).toFixed(1)} jaar`
                  : '-'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Rendement (ROI):</span>
              <span className="text-base font-black text-emerald-300 tabular-nums">
                {effectiveTotal !== null && effectiveTotal > 0 && calculation.totalAnnualBenefit > 0
                  ? `${((calculation.totalAnnualBenefit / effectiveTotal) * 100).toFixed(1)}% /jr`
                  : '-'}
              </span>
            </div>
          </div>
          {heatPumpActive && applyIsde && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
              <span>Inclusief aftrek van € {isdeSubsidy.toLocaleString('nl-NL')} ISDE rijkssubsidie</span>
              <span className="text-emerald-400 font-bold">Netto investering</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Herstel leeg</span>
            </button>
            <button
              type="button"
              onClick={handleUseCatalogPrices}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer underline"
            >
              Vul adviesprijzen in
            </button>
          </div>
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
              <span>Toepassen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
