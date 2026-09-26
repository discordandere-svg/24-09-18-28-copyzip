import React from 'react';
import {
  CalculationResult,
  EnergySpecs,
  BatteryProduct,
  HeatPumpProduct,
} from '../types';
import {
  X,
  Calculator,
  Battery,
  Flame,
  Zap,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

interface CalculationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: CalculationResult;
  energy: EnergySpecs;
  selectedBattery: BatteryProduct;
  selectedHeatPump: HeatPumpProduct;
  batteryActive: boolean;
  heatPumpActive: boolean;
}

export const CalculationDetailModal: React.FC<CalculationDetailModalProps> = ({
  isOpen,
  onClose,
  calculation,
  energy,
  selectedBattery,
  selectedHeatPump,
  batteryActive,
  heatPumpActive,
}) => {
  if (!isOpen) return null;
  const isDynamic = energy.newScenario === 'dynamisch_batterij';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Onderbouwing van het Rekenmodel
              </h2>
              <p className="text-xs text-slate-500">
                Modern slim energiesysteem: 5 pijlers voor een sterke commerciële ROI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* 1. Financiële Splitsing & 5 Pijlers */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
            <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider block">
              Opbouw van de Verwachte Jaarlijkse Waarde
            </span>

            <div className="p-3.5 bg-white rounded-xl border border-emerald-200 text-xs text-slate-800 space-y-2">
              {batteryActive && (
                <>
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                    <span className="font-bold text-slate-900">1. Stroomfactuur Leveranciersbesparing:</span>
                    <strong className="text-slate-900 font-mono">€ {calculation.billSavings.toLocaleString('nl-NL')} /jr</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-3 space-y-0.5">
                    <div>• Meer directe zonnestroom: € {calculation.pillarSolarSelfUseBenefit.toLocaleString('nl-NL')} /jr</div>
                    <div>• Vermeden terugleverkosten boete: € {calculation.pillarAvoidedFeedInBenefit.toLocaleString('nl-NL')} /jr</div>
                  </div>

                  {calculation.pillarEpexOptimizationBenefit > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <div>
                        <span className="font-bold text-emerald-900">2. EPEX Dynamische Marktarbitrage:</span>
                        <span className="text-[10px] text-slate-400 block">Laden bij goedkope/negatieve uren, ontladen op pieken</span>
                      </div>
                      <strong className="text-emerald-800 font-mono text-sm">+ € {calculation.pillarEpexOptimizationBenefit.toLocaleString('nl-NL')} /jr</strong>
                    </div>
                  )}

                  {energy.enableGridPeakSavings && calculation.pillarGridPeakSavingsBenefit > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <div>
                        <span className="font-bold text-emerald-900">3. Netkosten- & Piekbesparing (Peak Shaving):</span>
                        <span className="text-[10px] text-slate-400 block">Afvlakking van vermogenspieken</span>
                      </div>
                      <strong className="text-emerald-800 font-mono text-sm">+ € {calculation.pillarGridPeakSavingsBenefit.toLocaleString('nl-NL')} /jr</strong>
                    </div>
                  )}
                </>
              )}

              {heatPumpActive && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-amber-950 font-bold">
                  <span>5. Warmtepomp Netto Gasbesparing:</span>
                  <strong className="font-mono text-sm">+ € {calculation.heatPumpAnnualValue.toLocaleString('nl-NL')} /jr</strong>
                </div>
              )}

              {calculation.winterHeatPumpArbitrageBenefit > 0 && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-cyan-950 font-medium text-[11px]">
                  <span>Slimme wintersturing warmtepomp via batterij:</span>
                  <strong className="font-mono">+ € {calculation.winterHeatPumpArbitrageBenefit.toLocaleString('nl-NL')} /jr</strong>
                </div>
              )}

              <div className="pt-2.5 border-t-2 border-emerald-300 text-emerald-950 font-black flex justify-between text-base">
                <span>Totale Jaarwaarde (Jaar 1):</span>
                <span className="font-mono">€ {calculation.totalAnnualBenefit.toLocaleString('nl-NL')} /jaar</span>
              </div>
            </div>

            {/* Meerjarenprojectie */}
            <div className="p-3 bg-emerald-100/50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-emerald-950">10-Jaars Cumulatieve Opbrengst (bij 3.5% prijsstijging):</span>
              </div>
              <span className="font-black text-emerald-900 text-sm font-mono">
                € {calculation.tenYearTotalBenefit.toLocaleString('nl-NL')}
              </span>
            </div>
          </div>

          {/* 2. Contractscheiding */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
              Contractscheiding
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Huidig contract:</span>
                <span className="font-bold text-slate-900">[{calculation.currentContractLabel}]</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nieuw scenario:</span>
                <span className="font-bold text-emerald-800">[{calculation.newContractLabel}]</span>
              </div>
            </div>
          </div>

          {/* 3. EPEX Dynamische parameters */}
          {batteryActive && isDynamic && calculation.pillarEpexOptimizationBenefit > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                <Zap className="w-3.5 h-3.5 text-emerald-700" />
                <span>EPEX Uur- en Kwartierprijssturing Formule</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200 font-mono text-xs text-emerald-950">
                {selectedBattery.usableCapacityKwh} kWh bruikbaar × {energy.epexCyclesPerYear || 320} cycli × €{(energy.epexPriceDiffPerKWh || 0.14).toFixed(2)} marge × 95% = <strong>€ {calculation.pillarEpexOptimizationBenefit.toLocaleString('nl-NL')} /jaar</strong>
              </div>
              <p className="text-[11px] text-slate-600">
                Het HYXIPOWER slimme EMS laadt automatisch bij negatieve of lage uurtarieven en ontlaadt tijdens de dure piekuren van de dag.
              </p>
            </div>
          )}

          {/* 4. Warmtepomp specificaties */}
          {heatPumpActive && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Warmtepomp (Vaillant aroTHERM Plus {selectedHeatPump.powerKw} kW {selectedHeatPump.type})</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>• <strong>Gasreductie ({calculation.heatPumpThermalCoveragePercent}% dekking):</strong> {calculation.gasSavedM3.toLocaleString('nl-NL')} m³ minder gasverbruik = + €{calculation.heatPumpGasBenefit.toLocaleString('nl-NL')}/jr</p>
                <p>• <strong>Extra elektriciteitsvraag warmtepomp:</strong> +{calculation.heatPumpElectricityUsageKWh.toLocaleString('nl-NL')} kWh stroom/jr (SCOP {calculation.effectiveScop})</p>
                <p>• <strong>Gedekt uit eigen zonnestroom & batterij:</strong> {calculation.heatPumpFromSolarAndBatteryKWh.toLocaleString('nl-NL')} kWh/jr</p>
                <p>• <strong>Resterende netafname voor warmtepomp:</strong> {calculation.heatPumpFromGridKWh.toLocaleString('nl-NL')} kWh/jr</p>
                <p>• <strong>Kosten extra stroom:</strong> - €{calculation.heatPumpExtraElectricityCost.toLocaleString('nl-NL')}/jr</p>
                {selectedHeatPump.type === 'All-electric' && (
                  <p>• <strong>Vastrecht gas vervalt volledig:</strong> + €{calculation.heatPumpFixedGasBenefit.toLocaleString('nl-NL')}/jr</p>
                )}
                <p className="font-bold text-amber-950 pt-1.5 border-t border-amber-200 text-sm">
                  Netto warmtepompbesparing: € {calculation.heatPumpAnnualValue.toLocaleString('nl-NL')} /jaar
                </p>
              </div>
            </div>
          )}

          {/* 5. Automatische Integriteitscontrole */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
              Automatische Integriteitscontrole
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Huidig contract gescheiden</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>EPEX schaalt met capaciteit</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Geen dubbeltelling</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Salderingsbescherming actief</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Reële terugverdientijd (&lt; 6 jaar)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Netkosten/Piek shaving berekend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
