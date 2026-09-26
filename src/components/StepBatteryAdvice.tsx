import React, { useState } from 'react';
import {
  EnergySpecs,
  BatteryProduct,
  CalculationResult,
  HeatPumpProduct,
  AdviceScope,
} from '../types';
import {
  ArrowRight,
  ArrowLeft,
  Calculator,
  Check,
  Flame,
  Battery,
  Euro,
  Clock,
  Percent,
  Sliders,
  Sparkles,
  TrendingUp,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { CalculationDetailModal } from './CalculationDetailModal';
import { PriceAdjustModal } from './PriceAdjustModal';

interface StepBatteryAdviceProps {
  energy: EnergySpecs;
  calculation: CalculationResult;
  scope: AdviceScope;
  allBatteries: BatteryProduct[];
  selectedBattery: BatteryProduct;
  onSelectBattery: (bat: BatteryProduct) => void;
  batteryActive: boolean;
  onToggleBattery: (active: boolean) => void;
  allHeatPumps: HeatPumpProduct[];
  selectedHeatPump: HeatPumpProduct;
  onSelectHeatPump: (hp: HeatPumpProduct) => void;
  heatPumpActive: boolean;
  onToggleHeatPump: (active: boolean) => void;
  onChangeEnergy?: (updated: EnergySpecs) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepBatteryAdvice: React.FC<StepBatteryAdviceProps> = ({
  energy,
  calculation,
  allBatteries,
  selectedBattery,
  onSelectBattery,
  batteryActive,
  onToggleBattery,
  allHeatPumps,
  selectedHeatPump,
  onSelectHeatPump,
  heatPumpActive,
  onToggleHeatPump,
  onChangeEnergy,
  onBack,
  onNext,
}) => {
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const isDynamicScenario = energy.newScenario === 'dynamisch_batterij';
  const bothActive = batteryActive && heatPumpActive;

  // Actieve tier
  const activeTier =
    calculation.batteryTiers.find((t) => t.capacityKwh === selectedBattery.capacityKwh) ||
    calculation.batteryTiers[0];

  return (
    <div className="w-full min-w-0 mx-auto space-y-6">
      {/* 1. Header & Actieknoppen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Stap 2 van 3 • Systeemadvies
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              Slim Energiesysteem
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Geadviseerde Configuratie
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Volledig rekenmodel inclusief slimme uurprijssturing, vermeden terugleverkosten, salderingsafbouw en piekbesparing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-advice-price"
            onClick={() => setIsPriceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-slate-300"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Offerteprijs aanpassen</span>
          </button>
          <button
            type="button"
            id="btn-view-calculation-advice"
            onClick={() => setIsCalcModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-slate-300"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span>Bekijk berekening</span>
          </button>
        </div>
      </div>

      {/* 2. CONTRACT KEUZE (Alleen tonen als batterij actief is) */}
      {batteryActive && (
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Contractkeuze met Thuisbatterij
            </span>
            <span className="text-[11px] text-slate-400">
              Huidig contract blijft altijd apart in de nulmeting
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Huidige nulmeting contract */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Huidig contract (nulmeting):
                </span>
                <div className="font-black text-sm text-slate-900 mt-0.5">
                  {calculation.currentContractLabel}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                Vast uitgangspunt
              </span>
            </div>

            {/* Nieuw scenario keuze */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between gap-2">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                Nieuw scenario:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-scenario-vast"
                  onClick={() => {
                    onChangeEnergy?.({
                      ...energy,
                      newScenario: 'vast_batterij',
                    });
                  }}
                  className={`py-2 px-3 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                    energy.newScenario === 'vast_batterij'
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : 'bg-white text-slate-700 border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  Vast + batterij
                </button>
                <button
                  type="button"
                  id="btn-scenario-dynamic"
                  onClick={() => {
                    onChangeEnergy?.({
                      ...energy,
                      newScenario: 'dynamisch_batterij',
                    });
                  }}
                  className={`py-2 px-3 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                    energy.newScenario === 'dynamisch_batterij'
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : 'bg-white text-slate-700 border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  Dynamisch + HYXIPOWER EMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SYSTEEMSELECTIE: THUISBATTERIJ & WARMTEPOMP */}
      <div className={`grid gap-4 ${bothActive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* A. THUISBATTERIJ SELECTIE */}
        {batteryActive && (
          <div className="p-5 rounded-3xl border-2 border-emerald-600 bg-white shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Battery className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      HYXIPOWER Thuisbatterij
                    </h3>
                    <span className="text-[10px] text-slate-500 block">
                      Slim Energiebeheer (EMS) & EPEX Day-Ahead
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-bold border bg-emerald-50 text-emerald-800 border-emerald-300">
                  Actief
                </span>
              </div>

              {/* 4 Capaciteit Selectie met automatische hogere opbrengsten */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Kies HYXIPOWER capaciteit:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    Grotere capaciteit = substantieel hogere jaarwaarde
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2 sm:gap-2.5">
                  {calculation.batteryTiers.map((tier) => {
                    const isSelected = selectedBattery.capacityKwh === tier.capacityKwh;
                    const batProduct = allBatteries.find((b) => b.capacityKwh === tier.capacityKwh);

                    return (
                      <button
                        key={tier.capacityKwh}
                        type="button"
                        onClick={() => {
                          if (batProduct) onSelectBattery(batProduct);
                        }}
                        className={`p-2.5 text-center rounded-2xl font-bold transition-all cursor-pointer border flex flex-col justify-between min-h-[90px] relative ${
                          isSelected
                            ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-emerald-500'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {tier.isRecommended && (
                          <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-700 text-white'
                          }`}>
                            Aanbevolen
                          </span>
                        )}
                        <div className="pt-1">
                          <div className="text-sm sm:text-base font-black leading-none">{tier.capacityKwh} kWh</div>
                          <div className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                            {tier.maxPowerKw} kW vermogen
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200/40 w-full">
                          <div className={`text-xs font-black tabular-nums ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            € {tier.batteryAnnualValue.toLocaleString('nl-NL')}/jr
                          </div>
                          <div className={`text-[9px] ${isSelected ? 'text-emerald-200/80' : 'text-slate-400'}`}>
                            {tier.paybackYears ? `TVT ~${tier.paybackYears} jr` : 'Hoge ROI'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Systeem Presentatie met specificaties */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-base font-black text-slate-900">
                    HYXIPOWER {selectedBattery.capacityKwh} kWh
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {selectedBattery.targetTag}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Bruikbare Capaciteit:</span>
                    <strong className="text-slate-900 font-black text-sm">{selectedBattery.usableCapacityKwh} kWh</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Jaarwaarde:</span>
                    <strong className="text-emerald-800 font-black text-sm">€ {calculation.batteryAnnualValue.toLocaleString('nl-NL')}</strong>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-950 pt-1">
                  Doelgroep: <span className="font-semibold text-emerald-800">{selectedBattery.targetAudience}</span>
                </div>
              </div>

              {/* Commerciële Pijlers van het Slimme Energiesysteem */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">EPEX Dynamische Arbitrage</div>
                    <div className="text-[11px] text-slate-600">
                      Laden bij goedkope/negatieve uurtarieven en ontladen bij piektarieven (+ €{calculation.pillarEpexOptimizationBenefit.toLocaleString('nl-NL')}/jr).
                    </div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Vermeden Terugleverkosten</div>
                    <div className="text-[11px] text-slate-600">
                      Geen leveranciersboetes meer op zonnestroom; bespaart direct tot €{calculation.pillarAvoidedFeedInBenefit.toLocaleString('nl-NL')}/jr.
                    </div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Piek- & Netkostenbesparing</div>
                    <div className="text-[11px] text-slate-600">
                      Peak shaving van pieken en ontlasting van het netwerk (+ €{calculation.pillarGridPeakSavingsBenefit.toLocaleString('nl-NL')}/jr).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* B. WARMTEPOMP SELECTIE */}
        {heatPumpActive && (
          <div className="p-5 rounded-3xl border-2 border-amber-500 bg-white shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Flame className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Warmtepomp
                    </h3>
                    <span className="text-[10px] text-slate-500 block">
                      Vaillant aroTHERM Plus R290
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-bold border bg-amber-50 text-amber-800 border-amber-300">
                  Actief
                </span>
              </div>

              {/* Type & Vermogen Keuze */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    1. Kies Type Systeem:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = allHeatPumps.find(
                          (hp) => hp.type === 'Hybride' && hp.powerKw === selectedHeatPump.powerKw
                        ) || allHeatPumps.find((hp) => hp.type === 'Hybride');
                        if (target) onSelectHeatPump(target);
                      }}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border flex flex-col items-center ${
                        selectedHeatPump.type === 'Hybride'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>Hybride</span>
                      <span className={`text-[10px] font-normal ${selectedHeatPump.type === 'Hybride' ? 'text-amber-100' : 'text-slate-500'}`}>
                        Behoud cv-ketel
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = allHeatPumps.find(
                          (hp) => hp.type === 'All-electric' && hp.powerKw === selectedHeatPump.powerKw
                        ) || allHeatPumps.find((hp) => hp.type === 'All-electric');
                        if (target) onSelectHeatPump(target);
                      }}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border flex flex-col items-center ${
                        selectedHeatPump.type === 'All-electric'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>All-electric</span>
                      <span className={`text-[10px] font-normal ${selectedHeatPump.type === 'All-electric' ? 'text-amber-100' : 'text-slate-500'}`}>
                        100% gasloos
                      </span>
                    </button>
                  </div>
                </div>

                {/* Vermogen Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      2. Kies Vermogen (Grootte):
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800">
                      SCOP {selectedHeatPump.scop}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {allHeatPumps
                      .filter((hp) => hp.type === selectedHeatPump.type)
                      .map((hp) => {
                        const isSelected = selectedHeatPump.id === hp.id;
                        const isRecommended = hp.powerKw === calculation.recommendedHeatPumpKw;
                        return (
                          <button
                            key={hp.id}
                            type="button"
                            onClick={() => onSelectHeatPump(hp)}
                            className={`py-2 px-2 text-center rounded-xl font-bold text-xs transition-all cursor-pointer border relative ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <div className="text-sm font-black">{hp.powerKw} kW</div>
                            <div className={`text-[10px] font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              {hp.type === 'Hybride'
                                ? hp.powerKw === 5 ? '70% gas' : hp.powerKw === 7 ? '82% gas' : '92% gas'
                                : '100% gas'}
                            </div>
                            {isRecommended && (
                              <div className={`text-[8px] font-black uppercase tracking-tight py-0.5 px-1 rounded mt-1 inline-block ${
                                isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
                              }`}>
                                Aanbevolen
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Impact kaart */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                  <span className="font-black text-slate-900">
                    Vaillant aroTHERM Plus {selectedHeatPump.powerKw} kW ({selectedHeatPump.type})
                  </span>
                  <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
                    SCOP {selectedHeatPump.scop}
                  </span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gasbesparing ({calculation.heatPumpThermalCoveragePercent}% dekking):</span>
                    <strong className="text-emerald-800">
                      -{calculation.gasSavedM3.toLocaleString('nl-NL')} m³ gas/jr
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Vervangend stroomverbruik:</span>
                    <strong className="text-slate-900">
                      +{calculation.heatPumpElectricityUsageKWh.toLocaleString('nl-NL')} kWh/jr
                    </strong>
                  </div>
                  {batteryActive && energy.hasSolarPanels && (
                    <div className="flex justify-between text-[11px] text-emerald-800 font-semibold">
                      <span>• Gedekt uit eigen zon & batterij:</span>
                      <span>{calculation.heatPumpFromSolarAndBatteryKWh.toLocaleString('nl-NL')} kWh/jr</span>
                    </div>
                  )}
                  {batteryActive && energy.hasSolarPanels && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>• Resterende netafname warmtepomp:</span>
                      <span>{calculation.heatPumpFromGridKWh.toLocaleString('nl-NL')} kWh/jr</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between font-black text-slate-900">
                  <span>Netto voordeel warmtepomp:</span>
                  <span className="text-amber-950 text-sm">
                    € {calculation.heatPumpAnnualValue.toLocaleString('nl-NL')} /jaar
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. COMPACTE 5-METRIC OVERZICHT MET COMMERCIËLE KRACHT */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Rendement & Kerncijfers van dit advies
          </span>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            10-Jaars Baten: € {calculation.tenYearTotalBenefit.toLocaleString('nl-NL')}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
          {/* 1. Gekozen systeem */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs h-full min-h-[135px] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              1. Gekozen systeem
            </span>
            <div className="py-1">
              <div className="text-sm font-black text-slate-900 leading-tight">
                {batteryActive
                  ? `${selectedBattery.brand} ${selectedBattery.capacityKwh} kWh`
                  : `Vaillant ${selectedHeatPump.powerKw} kW`}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {bothActive
                  ? `+ Vaillant aroTHERM ${selectedHeatPump.powerKw} kW`
                  : batteryActive
                  ? `${selectedBattery.usableCapacityKwh} kWh bruikbaar`
                  : `${selectedHeatPump.type}`}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-fit">
              {bothActive ? 'Combi-systeem' : batteryActive ? 'Thuisbatterij' : 'Warmtepomp'}
            </span>
          </div>

          {/* 2. Investering (offertebedrag) */}
          <div
            onClick={() => setIsPriceModalOpen(true)}
            className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs h-full min-h-[135px] flex flex-col justify-between cursor-pointer hover:border-emerald-500 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                2. Investering
              </span>
              <Euro className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
            </div>
            <div className="py-1">
              <div className="text-xl font-black text-slate-900 tabular-nums">
                {calculation.totalInvestment !== null && calculation.totalInvestment > 0 ? (
                  `€ ${calculation.totalInvestment.toLocaleString('nl-NL')}`
                ) : (
                  <span className="text-sm text-slate-400 font-bold block leading-snug">
                    Nog invullen
                  </span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 group-hover:text-emerald-700 font-medium transition-colors flex items-center justify-between">
              <span>{calculation.totalInvestment !== null ? 'Netto bedrag' : 'Klik om in te vullen'}</span>
              <span className="underline">wijzig</span>
            </div>
          </div>

          {/* 3. Jaarlijkse waarde */}
          <div className="p-4 rounded-3xl bg-emerald-50/90 border-2 border-emerald-600 shadow-sm h-full min-h-[135px] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
              3. Jaarlijkse waarde
            </span>
            <div className="py-1">
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                € {calculation.totalAnnualBenefit.toLocaleString('nl-NL')}
                <span className="text-xs font-normal text-slate-500"> /jr</span>
              </div>
              <div className="text-xs font-semibold text-emerald-800">
                € {calculation.totalMonthlyBenefit} /mnd voordeel
              </div>
            </div>
            <div className="text-[10px] text-slate-600 truncate">
              {bothActive
                ? `Bat: €${calculation.batteryAnnualValue} • WP: €${calculation.heatPumpAnnualValue}`
                : batteryActive
                ? `Zon + EPEX + Saldering + Piek`
                : 'Netto gasbesparing'}
            </div>
          </div>

          {/* 4. Terugverdientijd */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs h-full min-h-[135px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                4. Terugverdientijd
              </span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="py-1">
              <div className="text-xl font-black text-emerald-950 tabular-nums">
                {calculation.paybackYears !== null ? (
                  `~ ${Math.round(calculation.paybackYears)} jaar`
                ) : (
                  <span className="text-xl text-slate-300 font-bold">-</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-emerald-800 font-semibold">
              {calculation.paybackYears !== null
                ? `Exact ${calculation.paybackYears.toFixed(1)} jaar`
                : 'Na invullen offerte'}
            </div>
          </div>

          {/* 5. ROI (Rendement) */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs h-full min-h-[135px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                5. Rendement (ROI)
              </span>
              <Percent className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="py-1">
              <div className="text-xl font-black text-emerald-700 tabular-nums">
                {calculation.roiPercent !== null ? (
                  `${Math.round(calculation.roiPercent)}% /jr`
                ) : (
                  <span className="text-xl text-slate-300 font-bold">-</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-500">
              {calculation.roiPercent !== null
                ? `${calculation.roiPercent.toFixed(1)}% rendement`
                : 'Na invullen offerte'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Navigatieknoppen */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug naar nulmeting</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <span>Volgende: Resultaat & Rendement</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modals */}
      <PriceAdjustModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        energy={energy}
        onUpdateEnergy={(upd) => onChangeEnergy?.(upd)}
        calculation={calculation}
        selectedBattery={selectedBattery}
        selectedHeatPump={selectedHeatPump}
        batteryActive={batteryActive}
        heatPumpActive={heatPumpActive}
      />
      <CalculationDetailModal
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        calculation={calculation}
        energy={energy}
        selectedBattery={selectedBattery}
        selectedHeatPump={selectedHeatPump}
        batteryActive={batteryActive}
        heatPumpActive={heatPumpActive}
      />
    </div>
  );
};
