import React, { useState } from 'react';
import {
  CalculationResult,
  EnergySpecs,
  BatteryProduct,
  HeatPumpProduct,
  AdviceScope,
} from '../types';
import {
  ArrowLeft,
  Calculator,
  Sliders,
  Battery,
  Flame,
  Printer,
  Check,
  ShieldCheck,
  Sun,
  Euro,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { PriceAdjustModal } from './PriceAdjustModal';
import { CalculationDetailModal } from './CalculationDetailModal';
import { WarmtepompConfigModal } from './WarmtepompConfigModal';

interface StepCustomerResultProps {
  calculation: CalculationResult;
  energy: EnergySpecs;
  scope: AdviceScope;
  onUpdateEnergy: (updated: EnergySpecs) => void;
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
  onBack: () => void;
  onNext?: () => void;
}

export const StepCustomerResult: React.FC<StepCustomerResultProps> = ({
  calculation,
  energy,
  onUpdateEnergy,
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
  onBack,
}) => {
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isHeatPumpModalOpen, setIsHeatPumpModalOpen] = useState(false);

  // 1. Waarde Thuisbatterij (afgerond op hele euro's)
  const batteryAnnualValue = Math.round(calculation.batteryAnnualValue);

  // 2. Besparing Warmtepomp (afgerond op hele euro's)
  const heatPumpAnnualValue = heatPumpActive ? Math.round(calculation.heatPumpAnnualValue) : 0;

  // 3. Totaal Gecombineerd Voordeel (altijd exact de som!)
  const totalCombinedAnnualBenefit = batteryAnnualValue + heatPumpAnnualValue;
  const totalCombinedMonthlyBenefit = Math.round(totalCombinedAnnualBenefit / 12);

  // Onderbouwing Thuisbatterij
  const batteryDirectSelfUseBenefit = Math.round(calculation.billSavings);
  const batterySmartTradingBenefit = batteryAnnualValue - batteryDirectSelfUseBenefit;

  // Stroom- en energiekosten (als warmtepomp UIT staat tonen we puur stroomkosten voor batterij!)
  const currentCost = heatPumpActive
    ? Math.round(calculation.currentTotalEnergyCost)
    : Math.round(calculation.currentTotalElectricityCost);

  const newCost = heatPumpActive
    ? Math.round(calculation.newTotalEnergyCost)
    : Math.round(calculation.newTotalElectricityCost);

  // Variabelen voor de vergelijkingskaarten
  const solarProduction = energy.hasSolarPanels ? calculation.currentSolarProductionKWh : 0;
  const currentSelfConsumptionPercent = energy.hasSolarPanels ? calculation.currentSolarSelfConsumptionPercent : 0;
  const newSelfConsumptionPercent = energy.hasSolarPanels ? calculation.newSolarSelfConsumptionPercent : 0;
  const selfConsumptionDiffPercent = Math.max(0, newSelfConsumptionPercent - currentSelfConsumptionPercent);

  const directSelfUseKWh = energy.hasSolarPanels ? calculation.currentSolarDirectKWh : 0;
  const currentFeedInKWh = energy.hasSolarPanels ? calculation.currentSolarFeedInKWh : 0;
  const batteryStoredKWh = calculation.extraSolarSelfUseKWh;
  const currentAutarkyPercent = calculation.currentAutarkyPercent;
  const newAutarkyPercent = calculation.newAutarkyPercent;
  const autarkyDiffPercent = Math.max(0, newAutarkyPercent - currentAutarkyPercent);

  const currentNetImportKWh = calculation.currentNetImportKWh;
  const newNetImportKWh = calculation.newNetImportKWh;
  const netImportReductionKWh = Math.max(0, currentNetImportKWh - newNetImportKWh);

  // Slimme marktoptimalisatie / dynamisch
  const dynamicOptimizationAnnual = Math.round(
    calculation.pillarEpexOptimizationBenefit > 0
      ? calculation.pillarEpexOptimizationBenefit
      : batterySmartTradingBenefit
  );

  const handleHeatPumpClick = () => {
    if (heatPumpActive) {
      onToggleHeatPump(false);
    } else {
      setIsHeatPumpModalOpen(true);
    }
  };

  // Vergelijkingsrijen die precies synchroon naast elkaar worden getoond
  const comparisonRows = [
    {
      id: 'solar',
      leftTitle: 'Totale zonneopbrengst',
      leftDesc: 'Uw jaarlijkse opwek via zonnepanelen',
      leftValue: energy.hasSolarPanels ? `${solarProduction.toLocaleString('nl-NL')} kWh` : '0 kWh',
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Totale zonneopbrengst',
      rightDesc: 'Gelijk aan de huidige situatie',
      rightValue: energy.hasSolarPanels ? `${solarProduction.toLocaleString('nl-NL')} kWh` : '0 kWh',
      rightSub: null,
      rightHighlight: false,
    },
    {
      id: 'self-consumption-pct',
      leftTitle: 'Zelfverbruik',
      leftDesc: 'Aandeel van opgewekte zonne-energie dat direct in de woning wordt gebruikt',
      leftValue: `${currentSelfConsumptionPercent}%`,
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Zelfverbruik',
      rightDesc: 'Verhoogd door opslag en geoptimaliseerd gebruik van zonne-energie',
      rightValue: `${currentSelfConsumptionPercent}% → ${newSelfConsumptionPercent}%`,
      rightSub: `+${selfConsumptionDiffPercent}% verhoging`,
      rightHighlight: true,
    },
    {
      id: 'direct-self-use-kwh',
      leftTitle: 'Direct zelfverbruik',
      leftDesc: 'Aandeel van uw totale verbruik dat direct door zonne-energie wordt gedekt',
      leftValue: `${directSelfUseKWh.toLocaleString('nl-NL')} kWh`,
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Direct zelfverbruik',
      rightDesc: 'Aandeel van uw totale verbruik dat direct door zonne-energie wordt gedekt',
      rightValue: `${directSelfUseKWh.toLocaleString('nl-NL')} kWh`,
      rightSub: null,
      rightHighlight: false,
    },
    {
      id: 'feedin-or-stored',
      leftTitle: 'Teruglevering aan net',
      leftDesc: 'Overschot aan zonne-energie wordt teruggeleverd aan het elektriciteitsnet',
      leftValue: `${currentFeedInKWh.toLocaleString('nl-NL')} kWh`,
      leftSub: calculation.currentFeedInCostGross > 0 ? `€ ${calculation.currentFeedInCostGross.toLocaleString('nl-NL')}/jr terugleverkosten` : null,
      leftHighlight: true,
      rightTitle: 'Zelf gebruikt i.p.v. teruggeleverd',
      rightDesc: 'Overschot aan zonne-energie wordt opgeslagen en zelf gebruikt in plaats van teruggeleverd',
      rightValue: `+${batteryStoredKWh.toLocaleString('nl-NL')} kWh`,
      rightSub: `+${batteryStoredKWh.toLocaleString('nl-NL')} kWh zelf benut`,
      rightHighlight: true,
    },
    {
      id: 'autarky',
      leftTitle: 'Zelfvoorzienendheid',
      leftDesc: 'Mate waarin uw energiebehoefte wordt gedekt door eigen opwek',
      leftValue: `${currentAutarkyPercent}%`,
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Zelfvoorzienendheid',
      rightDesc: 'Sterk verhoogd door gebruik van opgeslagen en lokaal opgewekte energie',
      rightValue: `${currentAutarkyPercent}% → ${newAutarkyPercent}%`,
      rightSub: `+${autarkyDiffPercent}% onafhankelijker`,
      rightHighlight: true,
    },
    {
      id: 'net-import',
      leftTitle: 'Netstroom inkoop',
      leftDesc: 'Aankoop van elektriciteit van het net wanneer opwek onvoldoende is',
      leftValue: `${currentNetImportKWh.toLocaleString('nl-NL')} kWh`,
      leftSub: null,
      leftHighlight: true,
      rightTitle: 'Netstroom inkoop',
      rightDesc: 'Sterk verminderd door inzet van opgeslagen zonne-energie',
      rightValue: `${newNetImportKWh.toLocaleString('nl-NL')} kWh`,
      rightSub: `-${netImportReductionKWh.toLocaleString('nl-NL')} kWh minder van net`,
      rightHighlight: true,
    },
    {
      id: 'market-optimization',
      leftTitle: 'Slimme marktoptimalisatie',
      leftDesc: 'Niet actief in de huidige situatie',
      leftValue: '€ 0/jr',
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Slimme marktoptimalisatie',
      rightDesc: 'Energie wordt geladen bij lage uurprijzen en ingezet of teruggeleverd bij hoge marktprijzen',
      rightValue: `+€ ${dynamicOptimizationAnnual.toLocaleString('nl-NL')} /jr`,
      rightSub: 'extra financieel voordeel',
      rightHighlight: true,
    },
    {
      id: 'feedin-costs',
      leftTitle: 'Terugleverkosten',
      leftDesc: calculation.currentFeedInCostGross > 0 ? 'Boete op teruglevering door vaste leverancier' : 'Niet van toepassing in de huidige situatie',
      leftValue: calculation.currentFeedInCostGross > 0 ? `€ ${calculation.currentFeedInCostGross.toLocaleString('nl-NL')}/jr` : '—',
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Terugleverkosten',
      rightDesc: 'Niet van toepassing binnen dynamisch aangestuurd energiesysteem',
      rightValue: '—',
      rightSub: 'Geen boetes of terugleverkosten',
      rightHighlight: false,
    },
  ];

  return (
    <div className="w-full min-w-0 mx-auto space-y-6 pb-8">
      {/* 1. Header & Knoppen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            <span>Stap 3 van 3</span>
            <span>•</span>
            <span>Klantoverzicht & Rendement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
            Overzicht & Rendement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Heldere vergelijking van uw huidige situatie en de situatie na verduurzaming.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPriceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-slate-300"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Offerteprijs</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCalcModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-slate-300"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span>Rekenmodel</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printen / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Systeemschakelaar (Capaciteit & Warmtepomp) */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Battery className="w-4 h-4 text-emerald-700" />
          <span>Systeemkeuze aan tafel:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {allBatteries.map((bat) => {
            const isSelected = batteryActive && selectedBattery.capacityKwh === bat.capacityKwh;
            return (
              <button
                key={bat.capacityKwh}
                type="button"
                onClick={() => {
                  if (!batteryActive) onToggleBattery(true);
                  onSelectBattery(bat);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{bat.capacityKwh} kWh</span>
                {isSelected && <Check className="w-3 h-3 text-emerald-300" />}
              </button>
            );
          })}

          <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

          {/* Warmtepomp toggle optioneel */}
          <button
            type="button"
            onClick={handleHeatPumpClick}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              heatPumpActive
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Warmtepomp {heatPumpActive ? 'Aan' : '+ Toevoegen'}</span>
          </button>
        </div>
      </div>

      {/* 3. Hoofdwaarde: Grote Financiële Samenvatting */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-emerald-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Linkerkant: Uw totale jaarlijkse voordeel */}
          <div className="space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">
              Uw totale jaarlijkse voordeel
            </span>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
                € {totalCombinedAnnualBenefit.toLocaleString('nl-NL')}
              </span>
              <span className="text-lg font-medium text-emerald-200">/jaar</span>
              <span className="text-sm font-semibold text-emerald-300 bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-700/60">
                ca. € {totalCombinedMonthlyBenefit} per maand
              </span>
            </div>

            {/* Transparante 100% sluitende opbouw */}
            <div className="pt-1">
              <div className="text-[11px] font-semibold text-emerald-200 mb-1.5">
                Opbouw van uw jaarlijkse voordeel:
              </div>
              <div className={`grid grid-cols-1 ${heatPumpActive ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2.5`}>
                {/* 1. Thuisbatterij */}
                <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-800">
                  <div className="text-[11px] text-emerald-300 font-medium flex items-center justify-between">
                    <span>Thuisbatterij ({selectedBattery.capacityKwh} kWh):</span>
                  </div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    € {batteryAnnualValue.toLocaleString('nl-NL')} /jr
                  </div>
                  <div className="text-[10px] text-emerald-200/80 mt-0.5">
                    Zelfverbruik + slimme sturing
                  </div>
                </div>

                {/* 2. Warmtepomp (ALLEEN ALS ACTIEF) */}
                {heatPumpActive && (
                  <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-800">
                    <div className="text-[11px] text-amber-300 font-medium flex items-center justify-between">
                      <span>Warmtepomp ({selectedHeatPump.type}):</span>
                    </div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">
                      € {heatPumpAnnualValue.toLocaleString('nl-NL')} /jr
                    </div>
                    <div className="text-[10px] text-emerald-200/80 mt-0.5">
                      Gasbesparing minus stroom
                    </div>
                  </div>
                )}

                {/* 3. Totaal gecombineerd */}
                <div className="p-3 rounded-xl bg-emerald-800/80 border border-emerald-700">
                  <div className="text-[11px] text-white font-bold flex items-center justify-between">
                    <span>Totaal gecombineerd:</span>
                  </div>
                  <div className="text-lg font-black text-emerald-200 font-mono mt-0.5">
                    € {totalCombinedAnnualBenefit.toLocaleString('nl-NL')} /jr
                  </div>
                  <div className="text-[10px] text-emerald-200/90 mt-0.5">
                    {heatPumpActive ? 'Batterij + Warmtepomp' : 'Volledig systeemvoordeel'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rechterkant: Investering & Terugverdientijd */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-emerald-800/80 pt-4 lg:pt-0 lg:pl-6">
            <div className="text-center p-3.5 sm:p-4 rounded-2xl bg-emerald-900/60 border border-emerald-800 min-w-[125px]">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Investering</span>
              <span className="text-lg sm:text-xl font-black text-white tabular-nums block mt-0.5">
                {calculation.totalInvestment !== null && calculation.totalInvestment > 0
                  ? `€ ${calculation.totalInvestment.toLocaleString('nl-NL')}`
                  : 'Op aanvraag'}
              </span>
              <span className="text-[10px] text-emerald-300 block mt-0.5">
                {calculation.isdeSubsidyAmount > 0 ? 'Na ISDE subsidie' : 'All-in incl. montage'}
              </span>
            </div>

            <div className="text-center p-3.5 sm:p-4 rounded-2xl bg-emerald-900/60 border border-emerald-800 min-w-[125px]">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Terugverdientijd</span>
              <span className="text-lg sm:text-xl font-black text-emerald-300 tabular-nums block mt-0.5">
                {calculation.paybackYears !== null ? `${calculation.paybackYears.toFixed(1)} jaar` : '-'}
              </span>
              <span className="text-[10px] text-emerald-200 block mt-0.5">
                {calculation.roiPercent !== null ? `ca. ${Math.round(calculation.roiPercent)}% jaarrendement` : 'Gunstig rendement'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISUELE VERGELIJKING: 🔴 HUIDIG (VAST) vs 🟢 MET BATTERIJ (DYNAMISCH) - RESPONDEREND & MEESCHALEND OP MOBIEL, LAPTOP & GROOT SCHERM */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-3.5 sm:p-5 md:p-6 lg:p-7 space-y-3.5 sm:space-y-4">
        {/* Kolom Headers (Altijd exact synchroon naast elkaar, schaalt mee) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 items-stretch">
          {/* Header Links: Huidig */}
          <div className="p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-rose-50/70 border-2 border-rose-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 shrink-0" />
                  <h2 className="text-xs sm:text-base lg:text-lg font-black uppercase tracking-wider text-rose-950">
                    Huidig
                  </h2>
                </div>
                <span className="text-[9px] sm:text-[11px] lg:text-xs font-bold text-rose-800 bg-rose-100/90 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">
                  Vast contract
                </span>
              </div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-rose-800 font-medium mt-1 leading-snug">
                Met batterij stapt u over naar dynamisch — maximaal rendement
              </p>
            </div>
          </div>

          {/* Header Rechts: Met batterij */}
          <div className="p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-emerald-50 border-2 border-emerald-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
                  <h2 className="text-xs sm:text-base lg:text-lg font-black uppercase tracking-wider text-emerald-950">
                    Met batterij
                  </h2>
                </div>
                <span className="text-[9px] sm:text-[11px] lg:text-xs font-bold text-emerald-950 bg-emerald-100 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-emerald-300 whitespace-nowrap">
                  Dynamisch + batterij
                </span>
              </div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-emerald-800 font-semibold mt-1 leading-snug">
                HYXiPower {selectedBattery.capacityKwh} kWh opslagsysteem met AI-sturing
              </p>
            </div>
          </div>
        </div>

        {/* Synchrone Rijen: Links en Rechts in identieke hoogte per rij, schaalt mee */}
        <div className="space-y-2 sm:space-y-2.5 pt-0.5 sm:pt-1">
          {comparisonRows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 items-stretch"
            >
              {/* Linker Kaart (Huidig) */}
              <div
                className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 h-full transition-all ${
                  row.leftHighlight
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-slate-50/80 border-slate-200/90'
                }`}
              >
                <div className="min-w-0 pr-1 sm:pr-2">
                  <span className="font-bold text-slate-800 block text-[10px] sm:text-xs md:text-sm lg:text-base break-words leading-tight">
                    {row.leftTitle}
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] md:text-xs lg:text-sm text-slate-500 block leading-tight mt-0.5 sm:mt-1">
                    {row.leftDesc}
                  </span>
                </div>
                <div className="text-left sm:text-right shrink-0 mt-0.5 sm:mt-0 pt-0.5 sm:pt-0 border-t sm:border-t-0 border-rose-100 sm:border-transparent">
                  <span
                    className={`text-xs sm:text-sm md:text-base lg:text-lg font-black tabular-nums block ${
                      row.leftHighlight ? 'text-rose-900' : 'text-slate-900'
                    }`}
                  >
                    {row.leftValue}
                  </span>
                  {row.leftSub && (
                    <span className="text-[8.5px] sm:text-[10px] md:text-xs text-rose-700 font-semibold block mt-0.5">
                      {row.leftSub}
                    </span>
                  )}
                </div>
              </div>

              {/* Rechter Kaart (Met batterij) */}
              <div
                className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 h-full transition-all ${
                  row.rightHighlight
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-white border-emerald-200'
                }`}
              >
                <div className="min-w-0 pr-1 sm:pr-2">
                  <span className="font-bold text-emerald-950 block text-[10px] sm:text-xs md:text-sm lg:text-base break-words leading-tight">
                    {row.rightTitle}
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] md:text-xs lg:text-sm text-emerald-800/80 block leading-tight mt-0.5 sm:mt-1">
                    {row.rightDesc}
                  </span>
                </div>
                <div className="text-left sm:text-right shrink-0 mt-0.5 sm:mt-0 pt-0.5 sm:pt-0 border-t sm:border-t-0 border-emerald-100 sm:border-transparent">
                  <span
                    className={`text-xs sm:text-sm md:text-base lg:text-lg font-black tabular-nums block ${
                      row.rightHighlight ? 'text-emerald-950' : 'text-slate-900'
                    }`}
                  >
                    {row.rightValue}
                  </span>
                  {row.rightSub && (
                    <span className="text-[8.5px] sm:text-[10px] md:text-xs text-emerald-700 font-bold flex items-center sm:justify-end gap-0.5 mt-0.5">
                      <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      <span>{row.rightSub}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Kosten Totaal Rij (Precies naast elkaar) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 items-stretch pt-2">
            {/* Linker Kosten Kaart */}
            <div className="p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-rose-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[8.5px] sm:text-[10px] lg:text-xs font-bold uppercase text-slate-500 block">
                {heatPumpActive ? 'Huidige energiekosten' : 'Huidige stroomkosten'}
              </span>
              <div className="text-sm sm:text-2xl lg:text-3xl font-black text-rose-900 tabular-nums mt-0.5 sm:mt-1">
                € {currentCost.toLocaleString('nl-NL')}
                <span className="text-[10px] sm:text-xs font-normal text-slate-500"> /jaar</span>
              </div>
              <div className="text-[8.5px] sm:text-[11px] lg:text-xs text-slate-500 mt-1">
                ca. € {Math.round(currentCost / 12)} /mnd
              </div>
            </div>

            {/* Rechter Kosten Kaart */}
            <div className="p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-emerald-500 shadow-2xs flex flex-col justify-between">
              <span className="text-[8.5px] sm:text-[10px] lg:text-xs font-bold uppercase text-emerald-800 block">
                {heatPumpActive ? 'Nieuwe energiekosten' : 'Nieuwe stroomkosten'}
              </span>
              <div className="text-sm sm:text-2xl lg:text-3xl font-black text-emerald-950 tabular-nums mt-0.5 sm:mt-1">
                € {newCost.toLocaleString('nl-NL')}
                <span className="text-[10px] sm:text-xs font-normal text-slate-500"> /jaar</span>
              </div>
              <div className="text-[8.5px] sm:text-[11px] lg:text-xs text-emerald-800 font-bold flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 gap-0.5">
                <span>ca. € {Math.round(newCost / 12)} /mnd</span>
                <span className="font-mono text-emerald-700">
                  Voordeel: € {totalCombinedAnnualBenefit.toLocaleString('nl-NL')} /jr
                </span>
              </div>
            </div>
          </div>

          {/* Korte Toelichting Rij (Precies naast elkaar) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 items-stretch pt-1">
            <div className="p-2.5 sm:p-3.5 lg:p-4.5 rounded-xl sm:rounded-2xl bg-rose-100/70 border border-rose-200 text-[9.5px] sm:text-xs lg:text-sm text-rose-900 leading-relaxed font-medium">
              “Uw zonnepanelen produceren vooral overdag energie. Een groot deel wordt teruggeleverd omdat u deze energie niet direct gebruikt. Op momenten dat u later energie nodig heeft, koopt u opnieuw stroom van het net.”
            </div>
            <div className="p-2.5 sm:p-3.5 lg:p-4.5 rounded-xl sm:rounded-2xl bg-emerald-100/70 border border-emerald-200 text-[9.5px] sm:text-xs lg:text-sm text-emerald-950 leading-relaxed font-medium">
              “De thuisbatterij bewaart uw overtollige zonnestroom en maakt deze beschikbaar wanneer uw woning energie nodig heeft, zoals in de avond en nacht.”
            </div>
          </div>
        </div>
      </div>

      {/* 5. WAT VERANDERT ER VOOR U? (3 DUIDELIJKE PILAREN) */}
      <div className="p-5 sm:p-6 bg-slate-900 text-white rounded-3xl shadow-lg space-y-4 border border-slate-800">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Klantwaarde in 15 seconden
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              Wat verandert er voor u?
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            Jaarvoordeel: € {totalCombinedAnnualBenefit.toLocaleString('nl-NL')} /jaar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Pilaar 1: Meer rendement */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Meer rendement uit uw zonnepanelen</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              U gebruikt meer van uw eigen opgewekte energie in plaats van deze terug te leveren.
            </p>
          </div>

          {/* Pilaar 2: Eigen energie beschikbaar */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
              <Battery className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Uw eigen energie beschikbaar wanneer u deze nodig heeft</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Overdag opgeslagen energie wordt gebruikt wanneer de zon niet schijnt.
            </p>
          </div>

          {/* Pilaar 3: Lagere energiekosten */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
              <Euro className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Lagere energiekosten en minder afhankelijkheid</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              U koopt minder stroom van uw energieleverancier.
            </p>
          </div>
        </div>

        {/* Samenvatting onderaan */}
        <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-emerald-300 font-bold text-sm">
            “U verandert van energie terugleveren naar energie slim zelf gebruiken.”
          </span>
          <span className="text-slate-400 text-xs">
            {heatPumpActive
              ? `Batterij (€ ${batteryAnnualValue.toLocaleString('nl-NL')}) + Warmtepomp (€ ${heatPumpAnnualValue.toLocaleString('nl-NL')}) = € ${totalCombinedAnnualBenefit.toLocaleString('nl-NL')}/jr`
              : `Totale jaarlijkse baten: € ${batteryAnnualValue.toLocaleString('nl-NL')} per jaar`}
          </span>
        </div>
      </div>

      {/* 6. Actieknoppen onderaan */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Voorbereid op de toekomst
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Optimaal voorbereid op veranderende marktomstandigheden en afbouw van de salderingsregeling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Terug naar advies</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Klantoverzicht Printen</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <PriceAdjustModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        energy={energy}
        onUpdateEnergy={onUpdateEnergy}
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
      <WarmtepompConfigModal
        isOpen={isHeatPumpModalOpen}
        onClose={() => setIsHeatPumpModalOpen(false)}
        energy={energy}
        onUpdateEnergy={onUpdateEnergy}
        allHeatPumps={allHeatPumps}
        selectedHeatPump={selectedHeatPump}
        onSelectHeatPump={onSelectHeatPump}
        onActivate={() => onToggleHeatPump(true)}
        onDeactivate={() => onToggleHeatPump(false)}
      />
    </div>
  );
};
