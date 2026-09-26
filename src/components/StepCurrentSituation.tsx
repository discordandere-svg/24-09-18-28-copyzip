import React from 'react';
import { EnergySpecs, EnergyContractType, CalculationResult, AdviceScope, HomeType } from '../types';
import {
  Zap,
  Sun,
  Flame,
  ArrowRight,
  Battery,
  Layers,
  AlertTriangle,
  Home,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';

interface StepCurrentSituationProps {
  energy: EnergySpecs;
  calculation: CalculationResult;
  scope: AdviceScope;
  onChangeScope: (scope: AdviceScope) => void;
  onChange: (updated: EnergySpecs) => void;
  onNext: () => void;
}

export const StepCurrentSituation: React.FC<StepCurrentSituationProps> = ({
  energy,
  calculation,
  scope,
  onChangeScope,
  onChange,
  onNext,
}) => {
  const update = <K extends keyof EnergySpecs>(key: K, value: EnergySpecs[K]) => {
    onChange({ ...energy, [key]: value });
  };

  const showGasSection = scope !== 'battery';

  return (
    <div className="w-full min-w-0 mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            Stap 1 van 3 • Nulmeting
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Huidige Energiesituatie
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bepaal het huidige energiecontract en verbruik als betrouwbaar uitgangspunt voor de berekening.
          </p>
        </div>
        <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-200">
          <span className="text-[11px] uppercase font-bold text-slate-500 block">Huidige jaarkosten</span>
          <span className="text-2xl font-black text-slate-900 tabular-nums">
            € {calculation.currentTotalEnergyCost.toLocaleString('nl-NL')}
            <span className="text-xs font-normal text-slate-500"> /jaar</span>
          </span>
          <span className="text-[11px] text-slate-500 block">
            ca. € {Math.round(calculation.currentTotalEnergyCost / 12).toLocaleString('nl-NL')} /mnd ({calculation.currentContractLabel})
          </span>
        </div>
      </div>

      {/* 1. ADVIESSCOPE SELECTIE */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
          Adviesonderwerp
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onChangeScope('battery')}
            className={`p-3 rounded-2xl text-center border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              scope === 'battery'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            <Battery className="w-4 h-4 text-emerald-600" />
            <span>Alleen thuisbatterij</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeScope('heatpump')}
            className={`p-3 rounded-2xl text-center border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              scope === 'heatpump'
                ? 'border-amber-700 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Alleen warmtepomp</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeScope('both')}
            className={`p-3 rounded-2xl text-center border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              scope === 'both'
                ? 'border-slate-800 bg-slate-900 text-white'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Batterij + Warmtepomp</span>
          </button>
        </div>
      </div>

      {/* 2. HUIDIG CONTRACT (Vast / Variabel / Dynamisch) - STRIKT GESCHEIDEN */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Huidig contract van de klant
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Het huidige contract blijft het vaste uitgangspunt voor de nulmeting.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(
            [
              { type: 'vast', label: 'Vast contract' },
              { type: 'variabel', label: 'Variabel contract' },
              { type: 'dynamisch', label: 'Dynamisch contract' },
            ] as const
          ).map((item) => {
            const isSelected = energy.contractType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => update('contractType', item.type as EnergyContractType)}
                className={`py-2.5 px-2 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STROOMVERBRUIK & PRIJS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Stroomverbruik & Leveringstarief
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Jaarlijks stroomverbruik (kWh)
            </label>
            <input
              type="number"
              step="50"
              value={energy.electricityConsumptionKWh || ''}
              onChange={(e) => update('electricityConsumptionKWh', Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 tabular-nums"
              placeholder="bijv. 4500"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Huidig stroomtarief (€/kWh all-in)
            </label>
            <input
              type="number"
              step="0.01"
              value={energy.electricityPricePerKWh || ''}
              onChange={(e) => update('electricityPricePerKWh', Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 tabular-nums"
              placeholder="0.28"
            />
          </div>
        </div>
      </div>

      {/* 4. ZONNEPANELEN, OVERSCHOT & TERUGLEVERKOSTEN */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Zonnepanelen & Teruglevering
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={energy.hasSolarPanels}
              onChange={(e) => update('hasSolarPanels', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700">Zonnepanelen aanwezig</span>
          </label>
        </div>

        {energy.hasSolarPanels && (
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Jaarlijkse opwek (kWh)
                </label>
                <input
                  type="number"
                  step="50"
                  value={energy.solarAnnualProductionKWh || ''}
                  onChange={(e) => update('solarAnnualProductionKWh', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  placeholder="bijv. 5000"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Teruglevering aan het net (kWh)
                </label>
                <input
                  type="number"
                  step="50"
                  value={energy.solarAnnualFeedInKWh || ''}
                  onChange={(e) => update('solarAnnualFeedInKWh', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  placeholder="bijv. 3200"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Terugleververgoeding (€/kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={energy.feedInTariffPerKWh || ''}
                  onChange={(e) => update('feedInTariffPerKWh', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  placeholder="0.07"
                />
              </div>
            </div>

            {/* BEREKENING: HOEVEEL % LEVERT DE KLANT TERUG? */}
            {energy.solarAnnualProductionKWh > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                    Berekende Teruglever- & Zelfverbruikverdeling:
                  </span>
                  <span className="text-xs font-black text-amber-900 tabular-nums">
                    {calculation.currentSolarFeedInPercent}% teruglevering
                  </span>
                </div>
                {/* Visuele balk */}
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, calculation.currentSolarSelfConsumptionPercent))}%` }}
                      className="bg-emerald-600 h-full transition-all"
                      title={`Direct eigen verbruik: ${calculation.currentSolarSelfConsumptionPercent}%`}
                    />
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, calculation.currentSolarFeedInPercent))}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`Teruglevering aan het net: ${calculation.currentSolarFeedInPercent}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-emerald-800 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                      Direct eigen verbruik: {calculation.currentSolarSelfConsumptionPercent}% ({calculation.currentSolarDirectKWh.toLocaleString('nl-NL')} kWh)
                    </span>
                    <span className="text-amber-900 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Teruglevering aan net: {calculation.currentSolarFeedInPercent}% ({calculation.currentSolarFeedInKWh.toLocaleString('nl-NL')} kWh)
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-amber-950 leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200/70">
                  <strong>Conclusie voor de klant:</strong> U wekt {energy.solarAnnualProductionKWh.toLocaleString('nl-NL')} kWh op, maar levert maar liefst <strong>{calculation.currentSolarFeedInPercent}%</strong> terug aan het net. Met een HYXIPOWER thuisbatterij en slimme sturing stijgt uw eigen zonnebenutting naar <strong>80% - 90%</strong> en levert u nog slechts 10% - 20% terug tegen vermeden terugleverkosten!
                </div>
              </div>
            )}

            {/* Terugleverkosten Heffing */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={energy.hasFeedInCost}
                  onChange={(e) => update('hasFeedInCost', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-slate-800">
                    Huidige energieleverancier rekent terugleverkosten / boete
                  </span>
                </div>
              </label>
              {energy.hasFeedInCost && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 font-medium">Tarief (€/kWh):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={energy.feedInCostPerKWh || ''}
                    onChange={(e) => update('feedInCostPerKWh', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 text-right tabular-nums bg-white"
                    placeholder="0.10"
                  />
                  {calculation.currentFeedInCostGross > 0 && (
                    <span className="text-[11px] font-black text-amber-900 bg-amber-100/90 px-2 py-1 rounded-md border border-amber-200">
                      = - € {calculation.currentFeedInCostGross} /jr
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. WONINGKENMERKEN & GASVERBRUIK (RELEVANT VOOR WARMTEPOMP) */}
      {showGasSection && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Woningkenmerken & Warmteprofiel
                </span>
                <span className="text-[11px] text-slate-500">
                  Nauwkeurige dimensionering van warmteverlies en warmtepompvermogen
                </span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={energy.hasGas}
                onChange={(e) => update('hasGas', e.target.checked)}
                className="w-4 h-4 rounded text-amber-700 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">Aardgasaansluiting actief</span>
            </label>
          </div>

          {/* Woningtype & Oppervlakte */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                Type woning
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                {(
                  [
                    { type: 'vrijstaand', label: 'Vrijstaand' },
                    { type: 'twee_onder_een_kap', label: '2-onder-1-kap' },
                    { type: 'hoekwoning', label: 'Hoekwoning' },
                    { type: 'tussenwoning', label: 'Tussenwoning' },
                    { type: 'appartement', label: 'Appartement' },
                  ] as const
                ).map((w) => (
                  <button
                    key={w.type}
                    type="button"
                    onClick={() => update('homeType', w.type as HomeType)}
                    className={`py-2 px-1 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                      energy.homeType === w.type
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                Woonoppervlakte (m²)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="40"
                  max="600"
                  step="5"
                  value={energy.livingAreaM2 || ''}
                  onChange={(e) => update('livingAreaM2', Math.max(20, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 tabular-nums"
                  placeholder="135"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">m²</span>
              </div>
            </div>
          </div>

          {/* Isolatiegraad */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
              Isolatiegraad van de woning
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'slecht', title: 'Slecht', desc: 'Voor 1975 • Enkel glas / ongeïsoleerd' },
                { id: 'matig', title: 'Matig', desc: '1975 - 1991 • Dubbel glas / basis spouw' },
                { id: 'goed', title: 'Goed', desc: '1992 - 2014 • Spouw + dak + HR-glas' },
                { id: 'zeer_goed', title: 'Uitstekend', desc: 'Vanaf 2015 • HR++ / Triple • A-label' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => update('insulationLevel', lvl.id as any)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    (energy.insulationLevel || 'goed') === lvl.id
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{lvl.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{lvl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Afgiftesysteem */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
              Afgiftesysteem (Verwarming)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'vloerverwarming', title: 'Vloerverwarming', desc: 'Lage temperatuur (~35°C) • Hoogste SCOP' },
                { id: 'mix_vloerverwarming_radiatoren', title: 'Mix: Vloer + Radiatoren', desc: 'Vloer b.g. + radiatoren boven (~40°C)' },
                { id: 'radiatoren_laag', title: 'LTV radiatoren / convectoren', desc: 'Middentemperatuur (~45°C)' },
                { id: 'radiatoren_hoog', title: 'Traditionele radiatoren', desc: 'Hoge temperatuur (~65°C)' },
              ].map((sys) => (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => update('heatingDeliveryType', sys.id as any)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    (energy.heatingDeliveryType || 'vloerverwarming') === sys.id
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{sys.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{sys.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Gasverbruik & Tarief */}
          {energy.hasGas && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Gasverbruik (m³/jaar)
                </label>
                <input
                  type="number"
                  step="25"
                  value={energy.gasConsumptionM3 || ''}
                  onChange={(e) => update('gasConsumptionM3', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 tabular-nums"
                  placeholder="bijv. 1550"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Gasprijs (€/m³)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={energy.gasPricePerM3 || ''}
                  onChange={(e) => update('gasPricePerM3', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 tabular-nums"
                  placeholder="1.45"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Vastrecht gas (€/jaar)
                </label>
                <input
                  type="number"
                  step="10"
                  value={energy.fixedGasCostsAnnual || ''}
                  onChange={(e) => update('fixedGasCostsAnnual', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 tabular-nums"
                  placeholder="420"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TOEKOMSTWENSEN VOOR ACCURATE BATTERIJSELECTIE */}
      {scope !== 'heatpump' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Toekomstwensen & verbruikers
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Selectie van batterijcapaciteit wordt gebaseerd op het profiel en deze wensen.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <label className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
              energy.hasElectricVehicle
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <div className="font-bold">Elektrische auto (EV)</div>
                <div className="text-[10px] text-slate-500">Nachtelijke laadvraag</div>
              </div>
              <input
                type="checkbox"
                checked={energy.hasElectricVehicle}
                onChange={(e) => update('hasElectricVehicle', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
            <label className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
              energy.futureHighConsumption
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <div className="font-bold">Uitbreiding verbruik</div>
                <div className="text-[10px] text-slate-500">Inductie / airco / groei</div>
              </div>
              <input
                type="checkbox"
                checked={energy.futureHighConsumption}
                onChange={(e) => update('futureHighConsumption', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
            <label className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
              energy.hasBackupPower
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <div className="font-bold">Noodstroom (EPS)</div>
                <div className="text-[10px] text-slate-500">&lt;20ms omschakeling</div>
              </div>
              <input
                type="checkbox"
                checked={energy.hasBackupPower}
                onChange={(e) => update('hasBackupPower', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* 7. NULMETING SAMENVATTINGSBALK */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Nulmeting Klantsituatie
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-0.5">
            € {calculation.currentTotalEnergyCost.toLocaleString('nl-NL')}
            <span className="text-xs font-normal text-slate-400"> /jaar</span>
            <span className="text-xs text-slate-300 font-medium ml-2">
              (ca. € {Math.round(calculation.currentTotalEnergyCost / 12).toLocaleString('nl-NL')} /mnd)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Huidig contract: {calculation.currentContractLabel} • Netafname: {calculation.currentNetImportKWh.toLocaleString('nl-NL')} kWh
            {showGasSection && energy.hasGas && energy.gasConsumptionM3 > 0
              ? ` • Gas: ${energy.gasConsumptionM3.toLocaleString('nl-NL')} m³`
              : ''}
            {calculation.currentFeedInCostGross > 0
              ? ` • Terugleverkosten: € ${calculation.currentFeedInCostGross.toLocaleString('nl-NL')}`
              : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-xs"
        >
          <span>Naar Systeemadvies</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
