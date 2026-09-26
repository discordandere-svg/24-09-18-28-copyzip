import React, { useState, useEffect } from 'react';
import { EnergySpecs, HeatPumpProduct, InsulationLevel, HeatingDeliveryType } from '../types';
import { Flame, X, Check, Euro, Zap, Sun, Battery, ArrowRight } from 'lucide-react';

interface WarmtepompConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  energy: EnergySpecs;
  onUpdateEnergy: (updated: EnergySpecs) => void;
  allHeatPumps: HeatPumpProduct[];
  selectedHeatPump: HeatPumpProduct;
  onSelectHeatPump: (hp: HeatPumpProduct) => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

export const WarmtepompConfigModal: React.FC<WarmtepompConfigModalProps> = ({
  isOpen,
  onClose,
  energy,
  onUpdateEnergy,
  allHeatPumps,
  selectedHeatPump,
  onSelectHeatPump,
  onActivate,
  onDeactivate,
}) => {
  const [localArea, setLocalArea] = useState<number>(energy.livingAreaM2 || 135);
  const [localInsulation, setLocalInsulation] = useState<InsulationLevel>(energy.insulationLevel || 'goed');
  const [localDelivery, setLocalDelivery] = useState<HeatingDeliveryType>(energy.heatingDeliveryType || 'vloerverwarming');
  const [localGas, setLocalGas] = useState<number>(energy.gasConsumptionM3 || 1550);
  const [localType, setLocalType] = useState<'Hybride' | 'All-electric'>(selectedHeatPump.type || 'Hybride');
  const [selectedKw, setSelectedKw] = useState<5 | 7 | 11>(selectedHeatPump.powerKw || 7);
  const [localPrice, setLocalPrice] = useState<number | ''>(
    energy.customHeatPumpPrice !== null && energy.customHeatPumpPrice !== undefined
      ? energy.customHeatPumpPrice
      : selectedHeatPump.basePrice
  );
  const [applyIsde, setApplyIsde] = useState<boolean>(
    energy.applyIsdeSubsidy !== undefined ? energy.applyIsdeSubsidy : true
  );

  useEffect(() => {
    if (isOpen) {
      setLocalArea(energy.livingAreaM2 || 135);
      setLocalInsulation(energy.insulationLevel || 'goed');
      setLocalDelivery(energy.heatingDeliveryType || 'vloerverwarming');
      setLocalGas(energy.gasConsumptionM3 > 0 ? energy.gasConsumptionM3 : 1550);
      setLocalType(selectedHeatPump.type);
      setSelectedKw(selectedHeatPump.powerKw);
      setLocalPrice(
        energy.customHeatPumpPrice !== null && energy.customHeatPumpPrice !== undefined
          ? energy.customHeatPumpPrice
          : selectedHeatPump.basePrice
      );
      setApplyIsde(energy.applyIsdeSubsidy !== undefined ? energy.applyIsdeSubsidy : true);
    }
  }, [isOpen, energy, selectedHeatPump]);

  if (!isOpen) return null;

  // Berekend transmissieverlies (indicatie kW warmtevraag)
  const insulationFactor = {
    slecht: 0.08,
    matig: 0.06,
    goed: 0.045,
    zeer_goed: 0.035,
  }[localInsulation];

  const calculatedLossKw = Math.round(localArea * insulationFactor * 10) / 10;

  // Bepaal automatisch aanbevolen vermogen
  let recommendedKw: 5 | 7 | 11 = 7;
  if (calculatedLossKw <= 5.8) recommendedKw = 5;
  else if (calculatedLossKw <= 8.8) recommendedKw = 7;
  else recommendedKw = 11;

  // Huidige kandidaat warmtepomp
  const candidateHp =
    allHeatPumps.find((hp) => hp.type === localType && hp.powerKw === selectedKw) ||
    allHeatPumps.find((hp) => hp.type === localType) ||
    allHeatPumps[0];

  // SCOP berekening o.b.v. afgiftesysteem
  const scopCorrection =
    localDelivery === 'vloerverwarming'
      ? 0
      : localDelivery === 'mix_vloerverwarming_radiatoren'
      ? -0.20
      : localDelivery === 'radiatoren_laag'
      ? -0.35
      : -0.95;

  const effectiveScop = Math.max(3.2, Number((candidateHp.scop + scopCorrection).toFixed(2)));

  // Berekende gasbesparing en extra stroomvraag
  const gasSavedM3 =
    localType === 'All-electric'
      ? localGas
      : Math.min(localGas, Math.round(localGas * ((candidateHp.gasReductionPercent || 80) / 100)));

  const warmteVraagKWh = gasSavedM3 * 8.8;
  const extraStroomKWh = Math.round(warmteVraagKWh / effectiveScop);

  // Hoeveel haalt hij uit zonnepanelen en batterij?
  let gedektZonEnBatterijKWh = 0;
  let restNetKWh = extraStroomKWh;
  const hasBatterySelected = true; // Standaard actief of geconfigureerd

  if (energy.hasSolarPanels) {
    // Met batterij dekt een slim systeem 24% - 40% van de warmtepomp jaarenergie via dagbuffers & tussenseizoenen
    const coverageRatio = hasBatterySelected ? 0.32 : 0.12;
    gedektZonEnBatterijKWh = Math.round(extraStroomKWh * coverageRatio);
    restNetKWh = Math.max(0, extraStroomKWh - gedektZonEnBatterijKWh);
  }

  // ISDE subsidie
  const isdeSubsidy = candidateHp.subsidyEstimate || 2850;
  const rawPrice = localPrice !== '' ? Number(localPrice) : candidateHp.basePrice;
  const netPrice = applyIsde ? Math.max(0, rawPrice - isdeSubsidy) : rawPrice;

  const handleTypeOrKwChange = (newType: 'Hybride' | 'All-electric', newKw: 5 | 7 | 11) => {
    setLocalType(newType);
    setSelectedKw(newKw);
    const newHp = allHeatPumps.find((hp) => hp.type === newType && hp.powerKw === newKw) || candidateHp;
    if (localPrice === '' || localPrice === candidateHp.basePrice) {
      setLocalPrice(newHp.basePrice);
    }
  };

  const handleApply = () => {
    const targetHp =
      allHeatPumps.find((hp) => hp.type === localType && hp.powerKw === selectedKw) ||
      candidateHp;

    const numPrice = localPrice !== '' ? Number(localPrice) : targetHp.basePrice;

    onSelectHeatPump(targetHp);
    onUpdateEnergy({
      ...energy,
      hasGas: true,
      livingAreaM2: localArea,
      insulationLevel: localInsulation,
      heatingDeliveryType: localDelivery,
      gasConsumptionM3: localGas,
      customHeatPumpPrice: numPrice,
      applyIsdeSubsidy: applyIsde,
    });
    onActivate();
    onClose();
  };

  const handleDisable = () => {
    onDeactivate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold border border-amber-200">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Warmtepomp Dimensionering & Investering
              </h2>
              <p className="text-xs text-slate-500">
                Bereken exact hoeveel stroom nodig is en wat er uit zonnepanelen & batterij wordt gehaald.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulier velden */}
        <div className="space-y-4 text-xs">
          {/* 1. Woonoppervlakte & Huidig Gasverbruik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Woonoppervlakte van de woning (m²)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="40"
                  max="600"
                  value={localArea}
                  onChange={(e) => setLocalArea(Math.max(40, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="text-slate-500 font-semibold shrink-0">m²</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Huidig aardgasverbruik (m³/jaar)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="200"
                  max="8000"
                  step="50"
                  value={localGas}
                  onChange={(e) => setLocalGas(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="text-slate-500 font-semibold shrink-0">m³/jr</span>
              </div>
            </div>
          </div>

          {/* 2. Isolatiegraad */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Isolatiegraad van de woning
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'slecht', label: 'Slecht', desc: 'Enkel glas' },
                { id: 'matig', label: 'Matig', desc: 'Deels geïsoleerd' },
                { id: 'goed', label: 'Goed', desc: 'Dubbel/spouw' },
                { id: 'zeer_goed', label: 'Zeer goed', desc: 'HR++ / nieuw' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLocalInsulation(item.id as InsulationLevel)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    localInsulation === item.id
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Afgiftesysteem: INCLUSIEF RADIATOREN MET MIX VLOERVERWARMING */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Afgiftesysteem (verwarming & temperatuur)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { id: 'vloerverwarming', label: 'Vloerverwarming', desc: 'Lage temp (~35°C)' },
                { id: 'mix_vloerverwarming_radiatoren', label: 'Mix: Vloer + Radiatoren', desc: 'Vloer b.g. + rad. boven (~40°C)' },
                { id: 'radiatoren_laag', label: 'LTV radiatoren', desc: 'Middentemp (~45°C)' },
                { id: 'radiatoren_hoog', label: 'Traditioneel', desc: 'Hoge temp (~65°C)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLocalDelivery(item.id as HeatingDeliveryType)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    localDelivery === item.id
                      ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold ring-1 ring-amber-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Type & Vermogen keuze */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                  Berekend warmteverlies: ca. {calculatedLossKw} kW • SCOP: {effectiveScop}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Advies: Vaillant aroTHERM Plus {recommendedKw} kW
                </span>
              </div>
              <span className="text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg">
                ISDE Subsidie € {isdeSubsidy.toLocaleString('nl-NL')}
              </span>
            </div>

            {/* Systeem Type Keuze */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeOrKwChange('Hybride', selectedKw)}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  localType === 'Hybride'
                    ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>Hybride</div>
                <div className={`text-[10px] font-normal ${localType === 'Hybride' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Behoud cv-ketel (~80% gasbesparing)
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeOrKwChange('All-electric', selectedKw)}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  localType === 'All-electric'
                    ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>All-electric</div>
                <div className={`text-[10px] font-normal ${localType === 'All-electric' ? 'text-amber-100' : 'text-slate-500'}`}>
                  100% gasloos (vervangt cv-ketel)
                </div>
              </button>
            </div>

            {/* Vermogensopties */}
            <div className="grid grid-cols-3 gap-2">
              {([5, 7, 11] as const).map((kw) => {
                const isRec = kw === recommendedKw;
                const isSelected = kw === selectedKw;
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handleTypeOrKwChange(localType, kw)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-white border-amber-700 text-amber-950 font-black ring-2 ring-amber-600'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {isRec && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black bg-amber-700 text-white px-1.5 py-0.2 rounded-full shadow-2xs">
                        Aanbevolen
                      </span>
                    )}
                    <div className="text-sm font-black">{kw} kW</div>
                    <div className="text-[10px] text-slate-500">aroTHERM Plus</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. INVOEREN VAN HET INVESTERINGSBEDRAG (USER REQUEST) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-hp-price-input" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Euro className="w-4 h-4 text-slate-600" />
                <span>Investeringsbedrag Warmtepomp Offerte (€ bruto)</span>
              </label>
              <button
                type="button"
                onClick={() => setLocalPrice(candidateHp.basePrice)}
                className="text-[11px] text-emerald-800 hover:underline font-bold cursor-pointer"
              >
                Gebruik adviesprijs (€ {candidateHp.basePrice.toLocaleString('nl-NL')})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">€</span>
              <input
                id="modal-hp-price-input"
                type="number"
                step="50"
                value={localPrice}
                onChange={(e) => setLocalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Voer investeringsbedrag in"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyIsde}
                  onChange={(e) => setApplyIsde(e.target.checked)}
                  className="w-4 h-4 text-emerald-700 rounded-sm focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  ISDE rijkssubsidie aftrekken (-€ {isdeSubsidy.toLocaleString('nl-NL')})
                </span>
              </label>
              <div className="text-xs text-right font-black text-slate-900">
                Netto investering klant: <span className="text-emerald-800 font-mono">€ {netPrice.toLocaleString('nl-NL')}</span>
              </div>
            </div>
          </div>

          {/* 6. BEREKENING: HOEVEEL STROOM NODIG & HOEVEEL UIT BATTERIJ / ZON (USER REQUEST) */}
          <div className="p-4 bg-emerald-950 text-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Berekende Stroombehoefte & Zonne-integratie
              </span>
              <span className="text-[11px] font-semibold text-emerald-200">
                SCOP {effectiveScop} • {gasSavedM3.toLocaleString('nl-NL')} m³ minder gas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-emerald-900/60 rounded-xl border border-emerald-800/80 space-y-0.5">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">1. Extra stroomvraag WP</span>
                <div className="text-base font-black text-white font-mono">
                  +{extraStroomKWh.toLocaleString('nl-NL')} kWh
                  <span className="text-[10px] font-normal text-emerald-300"> /jaar</span>
                </div>
                <span className="text-[10px] text-emerald-300 block">
                  Berekend o.b.v. woning & afgiftesysteem
                </span>
              </div>

              <div className="p-2.5 bg-emerald-900/60 rounded-xl border border-emerald-800/80 space-y-0.5">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">2. Uit Zon & Batterij</span>
                <div className="text-base font-black text-emerald-300 font-mono">
                  {energy.hasSolarPanels ? (
                    <>
                      {gedektZonEnBatterijKWh.toLocaleString('nl-NL')} kWh
                      <span className="text-[10px] font-normal text-emerald-300"> (32%)</span>
                    </>
                  ) : (
                    <span className="text-xs font-normal text-emerald-400">Geen zonnepanelen</span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-300 block">
                  {energy.hasSolarPanels ? 'Benut via zonne-energie & buffer' : 'Stroom 100% van het net'}
                </span>
              </div>

              <div className="p-2.5 bg-emerald-900/60 rounded-xl border border-emerald-800/80 space-y-0.5">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">3. Resterend van het Net</span>
                <div className="text-base font-black text-white font-mono">
                  {restNetKWh.toLocaleString('nl-NL')} kWh
                  <span className="text-[10px] font-normal text-emerald-300"> /jaar</span>
                </div>
                <span className="text-[10px] text-emerald-300 block">
                  Inkoop tijdens winter & daluren
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actieknoppen */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
          <button
            type="button"
            onClick={handleDisable}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
          >
            Toch niet nodig (Uitschakelen)
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Warmtepomp toewijzen & opslaan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
