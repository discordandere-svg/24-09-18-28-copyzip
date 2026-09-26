import React, { useState } from 'react';
import {
  CustomerData,
  CalculationResult,
  EnergySpecs,
  BatteryProduct,
  HeatPumpProduct,
} from '../types';
import {
  Printer,
  ArrowLeft,
  Edit2,
  Check,
  Sun,
  Battery,
  Euro,
  ArrowUpRight,
} from 'lucide-react';
import { SolarFastLogo, HyxiPowerLogo } from './brand/Logos';

interface StepOfficialReportProps {
  customer: CustomerData;
  calculation: CalculationResult;
  energy: EnergySpecs;
  selectedBattery: BatteryProduct;
  selectedHeatPump: HeatPumpProduct;
  batteryActive: boolean;
  heatPumpActive: boolean;
  onUpdateCustomer: (updated: CustomerData) => void;
  onBack: () => void;
}

export const StepOfficialReport: React.FC<StepOfficialReportProps> = ({
  customer,
  calculation,
  energy,
  selectedBattery,
  selectedHeatPump,
  batteryActive,
  heatPumpActive,
  onUpdateCustomer,
  onBack,
}) => {
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [localCustomer, setLocalCustomer] = useState<CustomerData>(customer);
  const isDynamic = energy.newScenario === 'dynamisch_batterij';

  const handlePrint = () => {
    window.print();
  };

  const handleSaveCustomer = () => {
    onUpdateCustomer(localCustomer);
    setIsEditingCustomer(false);
  };

  // 1. Waarde Thuisbatterij (afgerond op hele euro's)
  const batteryAnnualValue = Math.round(calculation.batteryAnnualValue);
  const heatPumpAnnualValue = heatPumpActive ? Math.round(calculation.heatPumpAnnualValue) : 0;
  const totalCombinedAnnualBenefit = batteryAnnualValue + heatPumpAnnualValue;

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

  // Synchrone vergelijkingsrijen
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
      leftDesc: 'Aandeel direct in woning gebruikt',
      leftValue: `${currentSelfConsumptionPercent}%`,
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Zelfverbruik',
      rightDesc: 'Verhoogd door opslag en slim gebruik',
      rightValue: `${currentSelfConsumptionPercent}% → ${newSelfConsumptionPercent}%`,
      rightSub: `+${selfConsumptionDiffPercent}% verhoging`,
      rightHighlight: true,
    },
    {
      id: 'direct-self-use-kwh',
      leftTitle: 'Direct zelfverbruik',
      leftDesc: 'Aandeel verbruik direct door zon gedekt',
      leftValue: `${directSelfUseKWh.toLocaleString('nl-NL')} kWh`,
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Direct zelfverbruik',
      rightDesc: 'Aandeel verbruik direct door zon gedekt',
      rightValue: `${directSelfUseKWh.toLocaleString('nl-NL')} kWh`,
      rightSub: null,
      rightHighlight: false,
    },
    {
      id: 'feedin-or-stored',
      leftTitle: 'Teruglevering aan net',
      leftDesc: 'Overschot teruggeleverd aan het elektriciteitsnet',
      leftValue: `${currentFeedInKWh.toLocaleString('nl-NL')} kWh`,
      leftSub: calculation.currentFeedInCostGross > 0 ? `€ ${calculation.currentFeedInCostGross.toLocaleString('nl-NL')}/jr terugleverkosten` : null,
      leftHighlight: true,
      rightTitle: 'Zelf gebruikt i.p.v. teruggeleverd',
      rightDesc: 'Overschot opgeslagen en zelf gebruikt',
      rightValue: `+${batteryStoredKWh.toLocaleString('nl-NL')} kWh`,
      rightSub: `+${batteryStoredKWh.toLocaleString('nl-NL')} kWh zelf benut`,
      rightHighlight: true,
    },
    {
      id: 'autarky',
      leftTitle: 'Zelfvoorzienendheid',
      leftDesc: 'Energiebehoefte gedekt door eigen opwek',
      leftValue: `${currentAutarkyPercent}%`,
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Zelfvoorzienendheid',
      rightDesc: 'Sterk verhoogd door opgeslagen zonne-energie',
      rightValue: `${currentAutarkyPercent}% → ${newAutarkyPercent}%`,
      rightSub: `+${autarkyDiffPercent}% onafhankelijker`,
      rightHighlight: true,
    },
    {
      id: 'net-import',
      leftTitle: 'Netstroom inkoop',
      leftDesc: 'Aankoop elektriciteit van leverancier',
      leftValue: `${currentNetImportKWh.toLocaleString('nl-NL')} kWh`,
      leftSub: null,
      leftHighlight: true,
      rightTitle: 'Netstroom inkoop',
      rightDesc: 'Sterk verminderd door inzet thuisbatterij',
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
      rightDesc: 'Laden bij lage uurprijzen, ontladen bij piektarief',
      rightValue: `+€ ${dynamicOptimizationAnnual.toLocaleString('nl-NL')} /jr`,
      rightSub: 'extra financieel voordeel',
      rightHighlight: true,
    },
    {
      id: 'feedin-costs',
      leftTitle: 'Terugleverkosten',
      leftDesc: calculation.currentFeedInCostGross > 0 ? 'Kosten berekend door vaste leverancier' : 'Niet van toepassing in huidige situatie',
      leftValue: calculation.currentFeedInCostGross > 0 ? `€ ${calculation.currentFeedInCostGross.toLocaleString('nl-NL')}/jr` : '—',
      leftSub: null,
      leftHighlight: false,
      rightTitle: 'Terugleverkosten',
      rightDesc: 'Niet van toepassing binnen dynamisch systeem',
      rightValue: '—',
      rightSub: 'Geen boetes of terugleverkosten',
      rightHighlight: false,
    },
  ];

  return (
    <div className="w-full min-w-0 mx-auto space-y-6">
      {/* 1. Actiebalk bovenaan (no-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            Adviesrapport • Tafelversie
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Klantadviesrapport
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duidelijk en overtuigend energierapport met transparante Voor & Na vergelijking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingCustomer(!isEditingCustomer)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Klantgegevens</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Afdrukken / PDF</span>
          </button>
        </div>
      </div>

      {/* Bewerk Klantgegevens Formulier (no-print) */}
      {isEditingCustomer && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
            Klantgegevens bewerken
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Klantnaam
              </label>
              <input
                type="text"
                value={localCustomer.name}
                onChange={(e) => setLocalCustomer({ ...localCustomer, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Adres
              </label>
              <input
                type="text"
                value={localCustomer.address}
                onChange={(e) => setLocalCustomer({ ...localCustomer, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Postcode & Plaats
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localCustomer.zipCode}
                  onChange={(e) => setLocalCustomer({ ...localCustomer, zipCode: e.target.value })}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Postcode"
                />
                <input
                  type="text"
                  value={localCustomer.city}
                  onChange={(e) => setLocalCustomer({ ...localCustomer, city: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Plaats"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Adviseur
              </label>
              <input
                type="text"
                value={localCustomer.advisorName}
                onChange={(e) => setLocalCustomer({ ...localCustomer, advisorName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSaveCustomer}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Opslaan in rapport</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPACT RAPPORT: PAGINA 1 */}
      {/* ========================================================================= */}
      <div
        id="report-page-1"
        className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Header met logo en klantgegevens */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-5">
          <div>
            <SolarFastLogo size="md" />
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              SolarFast Tafeladvies • Erkend Energieadviseur
            </div>
          </div>
          <div className="text-right text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900">{customer.name || 'Familie Jansen'}</div>
            <div>{customer.address}</div>
            <div>{customer.zipCode} {customer.city}</div>
            <div className="text-slate-400 text-[10px] mt-1 pt-1 border-t border-slate-200">
              Datum: {customer.reportDate} • Adviseur: {customer.advisorName}
            </div>
          </div>
        </div>

        {/* Titel */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
            Pagina 1 • Tafeladvies & Vergelijking
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Energieadvies & Investeringsvoorstel
          </h2>
          <p className="text-xs text-slate-500">
            Opgesteld voor {customer.name || 'de opdrachtgever'} conform gevalideerde energienormen.
          </p>
        </div>

        {/* 1. VISUELE VERGELIJKING: 🔴 HUIDIG vs 🟢 MET BATTERIJ - EXACT SYNCHROON NAAST ELKAAR & MEESCHALEND */}
        <div className="bg-slate-50/50 rounded-3xl border border-slate-200 p-3.5 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4">
          {/* Kolom Headers (Exact synchroon naast elkaar, schaalt mee) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 items-stretch">
            {/* Header Links: Huidig */}
            <div className="p-2.5 sm:p-3.5 lg:p-4 rounded-xl sm:rounded-2xl bg-rose-50/70 border-2 border-rose-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 shrink-0" />
                    <h3 className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wider text-rose-950">
                      Huidig
                    </h3>
                  </div>
                  <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-rose-800 bg-rose-100/90 px-1.5 sm:px-2 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">
                    Vast contract
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] lg:text-xs text-rose-800 font-medium mt-1 leading-snug">
                  Met batterij stapt u over naar dynamisch — maximaal rendement
                </p>
              </div>
            </div>

            {/* Header Rechts: Met batterij */}
            <div className="p-2.5 sm:p-3.5 lg:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 border-2 border-emerald-500 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
                    <h3 className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wider text-emerald-950">
                      Met batterij
                    </h3>
                  </div>
                  <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-emerald-950 bg-emerald-100 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-300 whitespace-nowrap">
                    Dynamisch + batterij
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] lg:text-xs text-emerald-800 font-semibold mt-1 leading-snug">
                  HYXiPower {selectedBattery.capacityKwh} kWh opslagsysteem met AI-sturing
                </p>
              </div>
            </div>
          </div>

          {/* Synchrone Rijen: Links en Rechts synchroon naast elkaar, schaalt mee */}
          <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
            {comparisonRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 items-stretch"
              >
                {/* Linker Kaart (Huidig) */}
                <div
                  className={`p-2 sm:p-2.5 lg:p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2.5 h-full ${
                    row.leftHighlight
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="min-w-0 pr-1 sm:pr-2">
                    <span className="font-bold text-slate-800 block text-[10px] sm:text-xs lg:text-sm break-words leading-tight">
                      {row.leftTitle}
                    </span>
                    <span className="text-[8.5px] sm:text-[10px] lg:text-[11px] text-slate-500 block leading-tight mt-0.5">
                      {row.leftDesc}
                    </span>
                  </div>
                  <div className="text-left sm:text-right shrink-0 mt-0.5 sm:mt-0 pt-0.5 sm:pt-0 border-t sm:border-t-0 border-rose-100 sm:border-transparent">
                    <span
                      className={`text-xs sm:text-sm lg:text-base font-bold tabular-nums block ${
                        row.leftHighlight ? 'text-rose-900' : 'text-slate-900'
                      }`}
                    >
                      {row.leftValue}
                    </span>
                    {row.leftSub && (
                      <span className="text-[8.5px] sm:text-[10px] text-rose-700 font-semibold block mt-0.5">
                        {row.leftSub}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rechter Kaart (Met batterij) */}
                <div
                  className={`p-2 sm:p-2.5 lg:p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2.5 h-full ${
                    row.rightHighlight
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-white border-emerald-200'
                  }`}
                >
                  <div className="min-w-0 pr-1 sm:pr-2">
                    <span className="font-bold text-emerald-950 block text-[10px] sm:text-xs lg:text-sm break-words leading-tight">
                      {row.rightTitle}
                    </span>
                    <span className="text-[8.5px] sm:text-[10px] lg:text-[11px] text-emerald-800/80 block leading-tight mt-0.5">
                      {row.rightDesc}
                    </span>
                  </div>
                  <div className="text-left sm:text-right shrink-0 mt-0.5 sm:mt-0 pt-0.5 sm:pt-0 border-t sm:border-t-0 border-emerald-100 sm:border-transparent">
                    <span
                      className={`text-xs sm:text-sm lg:text-base font-bold tabular-nums block ${
                        row.rightHighlight ? 'text-emerald-950' : 'text-slate-900'
                      }`}
                    >
                      {row.rightValue}
                    </span>
                    {row.rightSub && (
                      <span className="text-[8.5px] sm:text-[10px] text-emerald-700 font-bold flex items-center sm:justify-end gap-0.5 mt-0.5">
                        <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
                        <span>{row.rightSub}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Kosten Totaal Rij */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 items-stretch pt-2">
              <div className="p-2.5 sm:p-3.5 lg:p-4 rounded-xl sm:rounded-2xl bg-white border-2 border-rose-200 flex flex-col justify-between">
                <span className="text-[8.5px] sm:text-[10px] font-bold uppercase text-slate-500 block">
                  {heatPumpActive ? 'Huidige totale energiekosten' : 'Huidige stroomkosten'}
                </span>
                <div className="text-sm sm:text-xl lg:text-2xl font-black text-rose-900 tabular-nums mt-0.5">
                  € {currentCost.toLocaleString('nl-NL')}
                  <span className="text-[10px] sm:text-xs font-normal text-slate-500"> /jaar</span>
                </div>
                <div className="text-[8.5px] sm:text-[10px] text-slate-500 mt-0.5">
                  ca. € {Math.round(currentCost / 12)} per maand aan energiekosten
                </div>
              </div>

              <div className="p-2.5 sm:p-3.5 lg:p-4 rounded-xl sm:rounded-2xl bg-white border-2 border-emerald-500 flex flex-col justify-between">
                <span className="text-[8.5px] sm:text-[10px] font-bold uppercase text-emerald-800 block">
                  {heatPumpActive ? 'Nieuwe totale energiekosten' : 'Nieuwe stroomkosten'}
                </span>
                <div className="text-sm sm:text-xl lg:text-2xl font-black text-emerald-950 tabular-nums mt-0.5">
                  € {newCost.toLocaleString('nl-NL')}
                  <span className="text-[10px] sm:text-xs font-normal text-slate-500"> /jaar</span>
                </div>
                <div className="text-[8.5px] sm:text-[10px] text-emerald-800 font-bold flex flex-col sm:flex-row sm:items-center sm:justify-between mt-0.5 gap-0.5">
                  <span>ca. € {Math.round(newCost / 12)} /mnd</span>
                  <span className="font-mono text-emerald-700">
                    Besparing: € {totalCombinedAnnualBenefit.toLocaleString('nl-NL')} /jr
                  </span>
                </div>
              </div>
            </div>

            {/* Toelichtingsblokken */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 items-stretch pt-1">
              <div className="p-2.5 sm:p-3 rounded-xl bg-rose-100/70 border border-rose-200 text-[9.5px] sm:text-[11px] lg:text-xs text-rose-900 leading-relaxed font-medium">
                “Uw zonnepanelen produceren vooral overdag energie. Een groot deel wordt teruggeleverd omdat u deze energie niet direct gebruikt. Op momenten dat u later energie nodig heeft, koopt u opnieuw stroom van het net.”
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-100/70 border border-emerald-200 text-[9.5px] sm:text-[11px] lg:text-xs text-emerald-950 leading-relaxed font-medium">
                “De thuisbatterij bewaart uw overtollige zonnestroom en maakt deze beschikbaar wanneer uw woning energie nodig heeft, zoals in de avond en nacht.”
              </div>
            </div>
          </div>
        </div>

        {/* 2. WAT VERANDERT ER VOOR U? (3 DUIDELIJKE PILAREN) */}
        <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xs space-y-4">
          <div className="border-b border-slate-800 pb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Klantwaarde in 15 seconden
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              Wat verandert er voor u?
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pilaar 1: Meer rendement */}
            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Meer rendement uit uw zonnepanelen</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                U gebruikt meer van uw eigen opgewekte energie in plaats van deze terug te leveren.
              </p>
            </div>

            {/* Pilaar 2: Eigen energie beschikbaar */}
            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <Battery className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Uw eigen energie beschikbaar wanneer u deze nodig heeft</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Overdag opgeslagen energie wordt gebruikt wanneer de zon niet schijnt.
              </p>
            </div>

            {/* Pilaar 3: Lagere energiekosten */}
            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                <Euro className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Lagere energiekosten en minder afhankelijkheid</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                U koopt minder stroom van uw energieleverancier.
              </p>
            </div>
          </div>

          {/* Samenvatting onderaan */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-emerald-300 font-bold">
              “U verandert van energie terugleveren naar energie slim zelf gebruiken.”
            </span>
            <span className="text-slate-400 text-[11px]">
              Totaal voordeel: <strong className="text-white font-mono">€ {totalCombinedAnnualBenefit.toLocaleString('nl-NL')} /jaar</strong>
            </span>
          </div>
        </div>

        {/* 3. Financieel Resultaat & Investeringskaders */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 h-full flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Investering:
            </span>
            <div className="text-base sm:text-lg font-black text-slate-900 tabular-nums py-0.5">
              {calculation.totalInvestment !== null && calculation.totalInvestment > 0
                ? `€ ${calculation.totalInvestment.toLocaleString('nl-NL')}`
                : 'Nog invullen'}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {calculation.totalInvestment !== null ? 'Offertebedrag' : 'Vast te stellen'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 h-full flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Terugverdientijd:
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-950 tabular-nums py-0.5">
              {calculation.paybackYears !== null ? (
                <>~ {Math.round(calculation.paybackYears)} jaar</>
              ) : (
                '-'
              )}
            </div>
            <span className="text-[10px] text-emerald-800 font-semibold block">
              {calculation.paybackYears !== null ? `${calculation.paybackYears.toFixed(1)} jr berekend` : 'Na invullen offerte'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 h-full flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Jaarlijks voordeel:
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-700 tabular-nums py-0.5">
              € {totalCombinedAnnualBenefit.toLocaleString('nl-NL')}
            </div>
            <span className="text-[10px] text-slate-400 block">
              ca. € {Math.round(totalCombinedAnnualBenefit / 12)} per maand
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 h-full flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Gekozen systeem:
            </span>
            <div className="text-xs sm:text-sm font-black text-slate-900 py-0.5 leading-tight">
              {batteryActive ? `HYXIPOWER ${selectedBattery.capacityKwh} kWh` : `Vaillant ${selectedHeatPump.powerKw} kW`}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {batteryActive && heatPumpActive
                ? `+ Vaillant ${selectedHeatPump.powerKw} kW WP`
                : batteryActive
                ? `${selectedBattery.usableCapacityKwh} kWh bruikbaar`
                : selectedHeatPump.type}
            </span>
          </div>
        </div>

        {/* Handtekeningenblok */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-700">
          <div className="space-y-8">
            <span className="font-bold block">Voor akkoord opdrachtgever:</span>
            <div className="border-b border-slate-300 w-3/4 pt-4" />
            <div className="text-[10px] text-slate-400">Handtekening {customer.name}</div>
          </div>
          <div className="space-y-8">
            <span className="font-bold block">SolarFast adviseur:</span>
            <div className="border-b border-slate-300 w-3/4 pt-4" />
            <div className="text-[10px] text-slate-400">Handtekening {customer.advisorName}</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COMPACT RAPPORT: PAGINA 2 */}
      {/* ========================================================================= */}
      <div
        id="report-page-2"
        className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page"
      >
        <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
              Pagina 2 • Technische Energiebalans & Aannames
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Energiebalans & Rekenverantwoording
            </h3>
          </div>
          <HyxiPowerLogo size="sm" />
        </div>

        {/* 1. Energiebalans Tabel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 block">
              1. Energiebalans
            </span>
            <span className="text-[10px] text-slate-400 sm:hidden">
              Veeg horizontaal voor details →
            </span>
          </div>
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full min-w-[520px] sm:min-w-full text-left text-xs sm:text-sm divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5 sm:p-3">Onderdeel</th>
                  <th className="p-2.5 sm:p-3">Huidige situatie</th>
                  <th className="p-2.5 sm:p-3">Nieuwe situatie</th>
                  <th className="p-2.5 sm:p-3 text-right">Verschil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="p-2.5 sm:p-3 font-bold text-slate-800">Totale stroomvraag woning</td>
                  <td className="p-2.5 sm:p-3 text-slate-600">{calculation.currentTotalElectricityKWh.toLocaleString('nl-NL')} kWh</td>
                  <td className="p-2.5 sm:p-3 font-bold text-slate-900">{calculation.newTotalElectricityKWh.toLocaleString('nl-NL')} kWh</td>
                  <td className="p-2.5 sm:p-3 text-right font-bold text-slate-700">
                    {heatPumpActive ? `+${calculation.heatPumpElectricityUsageKWh.toLocaleString('nl-NL')} kWh (WP)` : '0 kWh'}
                  </td>
                </tr>
                {energy.hasSolarPanels && (
                  <>
                    <tr>
                      <td className="p-2.5 sm:p-3 font-bold text-slate-800">Direct eigen zonnestroomverbruik (overdag)</td>
                      <td className="p-2.5 sm:p-3 text-slate-600">
                        {calculation.currentSolarDirectKWh.toLocaleString('nl-NL')} kWh ({calculation.currentSolarSelfConsumptionPercent}%)
                      </td>
                      <td className="p-2.5 sm:p-3 font-bold text-slate-900">
                        {calculation.currentSolarDirectKWh.toLocaleString('nl-NL')} kWh
                      </td>
                      <td className="p-2.5 sm:p-3 text-right font-medium text-slate-500">
                        0 kWh
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 sm:p-3 font-bold text-slate-800">Via thuisbatterij ('s avonds & 's nachts benut)</td>
                      <td className="p-2.5 sm:p-3 text-slate-400">
                        0 kWh (geen batterij)
                      </td>
                      <td className="p-2.5 sm:p-3 font-bold text-emerald-800">
                        {calculation.extraSolarSelfUseKWh.toLocaleString('nl-NL')} kWh
                      </td>
                      <td className="p-2.5 sm:p-3 text-right font-black text-emerald-700">
                        +{calculation.extraSolarSelfUseKWh.toLocaleString('nl-NL')} kWh
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/40 font-bold">
                      <td className="p-2.5 sm:p-3 text-emerald-950 font-bold">Totale eigen zonnestroombenutting</td>
                      <td className="p-2.5 sm:p-3 text-slate-700">
                        {calculation.currentSolarDirectKWh.toLocaleString('nl-NL')} kWh ({calculation.currentSolarSelfConsumptionPercent}%)
                      </td>
                      <td className="p-2.5 sm:p-3 text-emerald-800 font-bold">
                        {calculation.newSolarDirectKWh.toLocaleString('nl-NL')} kWh ({calculation.newSolarSelfConsumptionPercent}%)
                      </td>
                      <td className="p-2.5 sm:p-3 text-right font-black text-emerald-700">
                        +{calculation.extraSolarSelfUseKWh.toLocaleString('nl-NL')} kWh
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 sm:p-3 font-bold text-slate-800">Teruglevering aan het net</td>
                      <td className="p-2.5 sm:p-3 text-slate-600">{calculation.currentSolarFeedInKWh.toLocaleString('nl-NL')} kWh</td>
                      <td className="p-2.5 sm:p-3 font-bold text-slate-800">{calculation.newSolarFeedInKWh.toLocaleString('nl-NL')} kWh</td>
                      <td className="p-2.5 sm:p-3 text-right font-bold text-emerald-700">
                        -{calculation.extraSolarSelfUseKWh.toLocaleString('nl-NL')} kWh
                      </td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="p-2.5 sm:p-3 font-bold text-slate-800">Netafname elektriciteit</td>
                  <td className="p-2.5 sm:p-3 text-slate-600">{calculation.currentNetImportKWh.toLocaleString('nl-NL')} kWh</td>
                  <td className="p-2.5 sm:p-3 font-bold text-slate-800">{calculation.newNetImportKWh.toLocaleString('nl-NL')} kWh</td>
                  <td className="p-2.5 sm:p-3 text-right font-bold text-slate-700">
                    {calculation.newNetImportKWh - calculation.currentNetImportKWh > 0
                      ? `+${(calculation.newNetImportKWh - calculation.currentNetImportKWh).toLocaleString('nl-NL')} kWh`
                      : `-${(calculation.currentNetImportKWh - calculation.newNetImportKWh).toLocaleString('nl-NL')} kWh`}
                  </td>
                </tr>
                {heatPumpActive && energy.hasGas && (
                  <tr>
                    <td className="p-2.5 sm:p-3 font-bold text-slate-800">Aardgasverbruik</td>
                    <td className="p-2.5 sm:p-3 text-slate-600">{energy.gasConsumptionM3.toLocaleString('nl-NL')} m³</td>
                    <td className="p-2.5 sm:p-3 font-bold text-slate-800">{calculation.newGasConsumptionM3.toLocaleString('nl-NL')} m³</td>
                    <td className="p-2.5 sm:p-3 text-right font-black text-emerald-700">
                      -{calculation.gasSavedM3.toLocaleString('nl-NL')} m³ ({selectedHeatPump.type === 'All-electric' ? '100%' : '80%'})
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Aannames & Rekenparameters */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            2. Gebruikte Aannames & Rekenparameters
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px] uppercase">
                Stroom- en Gastarieven
              </span>
              <p className="text-[11px]">
                Stroomprijs huidig: € {energy.electricityPricePerKWh.toFixed(2)}/kWh. Terugleververgoeding: € {energy.feedInTariffPerKWh.toFixed(2)}/kWh.
                {energy.hasGas && ` Gasprijs: € ${energy.gasPricePerM3.toFixed(2)}/m³ (vastrecht € ${energy.fixedGasCostsAnnual}/jr).`}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px] uppercase">
                EPEX Dynamisch & Slimme Sturing
              </span>
              <p className="text-[11px]">
                {isDynamic
                  ? `Dynamisch contract: sturing op goedkope/negatieve uren en ontladen op pieken. Vermijdt 100% terugleverkosten en beschermt tegen salderingsafbouw.`
                  : `Vast contractscenario: besparing door hogere zelfconsumptie en vermeden terugleverkosten.`}
              </p>
            </div>
            {heatPumpActive && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px] uppercase">
                  Warmtepomp (Vaillant aroTHERM Plus)
                </span>
                <p className="text-[11px]">
                  SCOP {selectedHeatPump.scop} (NEN 7120 normering). Gasreductie: {selectedHeatPump.type === 'All-electric' ? '100% (vervangt cv-ketel)' : '80% (hybride)'}.
                  Extra elektriciteit: warmtevraag ({calculation.gasSavedM3 * 8.8} kWh) / {calculation.effectiveScop} = {calculation.heatPumpElectricityUsageKWh} kWh.
                </p>
              </div>
            )}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px] uppercase">
                Batterijsysteem & Fiscus
              </span>
              <p className="text-[11px]">
                HYXIPOWER LFP batterijtechnologie (6.000+ cycli, 10 jaar fabrieksgarantie).
                0% btw-tarief van toepassing op residentiële thuisbatterijen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigatie (no-print) */}
      <div className="flex justify-between pt-2 no-print">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug naar Resultaat</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Afdrukken of Opslaan als PDF</span>
        </button>
      </div>
    </div>
  );
};
