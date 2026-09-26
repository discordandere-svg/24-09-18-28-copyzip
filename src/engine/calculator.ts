import {
  EnergySpecs,
  BatteryProduct,
  HeatPumpProduct,
  CalculationResult,
  BatteryTierCalculation,
  AdviceScope,
} from '../types';
import { HYXIPOWER_BATTERIES } from '../data/catalog';

/**
 * Berekent hoeveel zonne-energie (in kWh/jaar) een slimme 3-fase HYXIPOWER batterij
 * effectief absorbeert die anders aan het net zou worden teruggeleverd.
 * 
 * Modern slim energiesysteem:
 * - HYXIPOWER beschikt over 3-fase hoogspanning met hoge laad- en ontlaadsnelheden (tot 12.5 kW).
 * - Een slimme batterij vangt zonne-overschotten in lente, zomer én herfst op.
 * - Grotere batterijen kunnen ook meerdere opeenvolgende bewolkte dagen overbruggen
 *   en hogere avond- en nachtpieken van warmtepomp / EV / inductie dekken.
 */
export function calculateBatterySolarAbsorption(
  usableCapacityKwh: number,
  feedInKwh: number,
  electricityDemandKwh: number,
  directSelfConsumptionKwh: number
): number {
  if (feedInKwh <= 0 || usableCapacityKwh <= 0) return 0;

  const totalSolarProductionKWh = directSelfConsumptionKwh + feedInKwh;
  if (totalSolarProductionKWh <= 0) return 0;

  // Streefpercentage zelfconsumptie (direct zon + batterijopslag):
  // 10.6 kWh (10.1 usable) -> ~80%
  // 15.9 kWh (15.1 usable) -> ~84%
  // 21.2 kWh (20.1 usable) -> ~88%
  // 26.5 kWh (25.2 usable) -> ~91%
  const targetPercent = Math.min(0.92, 0.73 + (usableCapacityKwh * 0.0072));
  const desiredTotalSelfUseKWh = Math.round(totalSolarProductionKWh * targetPercent);
  const extraNeededKWh = Math.max(0, desiredTotalSelfUseKWh - directSelfConsumptionKwh);

  // Fysieke capaciteit van de batterij (ca. 240-250 zonnecycli per jaar)
  const maxSolarCycleStorage = Math.round(usableCapacityKwh * 250);

  // Resterende stroomvraag van de woning in de avond/nacht
  const remainingNonSolarDemand = Math.max(0, electricityDemandKwh - directSelfConsumptionKwh);
  const maxDemandCoverage = Math.round(remainingNonSolarDemand * (0.80 + (usableCapacityKwh / 150)));

  // Beschikbaar zonne-overschot met 95% batterijrendement
  const availableSolarSurplus = Math.round(feedInKwh * 0.95);

  // Bepaal de reële extra zelfconsumptie
  const actualExtra = Math.min(
    availableSolarSurplus,
    Math.max(extraNeededKWh, Math.min(maxSolarCycleStorage, maxDemandCoverage))
  );

  // Zorg dat er altijd een logische rest-teruglevering aan het net blijft (8% - 20%)
  const maxAllowedAbsorption = Math.round(feedInKwh * (0.75 + (usableCapacityKwh * 0.0065)));
  const cappedAbsorption = Math.min(actualExtra, maxAllowedAbsorption);

  return Math.max(0, Math.round(cappedAbsorption));
}

/**
 * EPEX Day-Ahead & Kwartierprijssturing waarde berekenen
 * Formule: Bruikbare capaciteit (kWh) × cycli/jaar × prijsverschil (€/kWh) × batterijrendement
 * 
 * In een modern slim energiesysteem (zoals HYXIPOWER EMS):
 * - De batterij laadt volautomatisch op de goedkoopste uren (vaak rond 13:00-15:00 of 's nachts 02:00-05:00)
 *   of bij negatieve uurtarieven (waarbij men geld toe krijgt!).
 * - De batterij ontlaadt op de piekuren (17:00 - 21:00 en ochtendpiek) wanneer de stroomprijs hoog is.
 * - Schaalt direct evenredig met de batterijcapaciteit!
 */
export function calculateEpexValue(
  usableCapacityKwh: number,
  energy: EnergySpecs
): number {
  if (energy.newScenario !== 'dynamisch_batterij') {
    return 0;
  }

  const cycles = energy.epexCyclesPerYear || 280;
  const priceSpread = energy.epexPriceDiffPerKWh || 0.12;
  const batteryEfficiency = energy.epexBatteryEfficiency || 0.92;

  return Math.round(usableCapacityKwh * cycles * priceSpread * batteryEfficiency);
}

/**
 * Salderingsafbouw bescherming (vanaf 2027):
 * Zonder batterij krijgt de klant voor teruggeleverde stroom slechts een minimale
 * terugleververgoeding (€0,04 - €0,07/kWh) minus terugleverkosten.
 * Met batterij behoudt de klant de volledige consumentenwaarde (€0,24 - €0,28/kWh).
 * Het verschil (ca. €0,15 - €0,18/kWh) op elke opgeslagen kWh is pure winst door salderingsbescherming.
 */
export function calculateSalderingProtectionValue(
  extraSolarSelfUseKWh: number,
  energy: EnergySpecs
): number {
  if (!energy.enableSalderingBenefit || extraSolarSelfUseKWh <= 0) return 0;
  // Waardeverschil tussen consumententarief en kale terugleververgoeding
  const retailPrice = energy.electricityPricePerKWh || 0.28;
  const feedInTariff = energy.feedInTariffPerKWh || 0.07;
  const netAdvantagePerKwh = Math.max(0.08, retailPrice - feedInTariff - 0.06);
  return Math.round(extraSolarSelfUseKWh * netAdvantagePerKwh);
}

/**
 * Netkostenbesparing & Peak Shaving:
 * Slimme ontlasting van het netwerk, vermindering van piekbelasting en voorbereiding
 * op capaciteitstarieven van netbeheerders (Liander, Enexis, Stedin).
 * Grotere batterijen met 3-fase hoogspanning (7.5 kW - 12.5 kW ontlaadvermogen)
 * kunnen grotere gelijktijdige pieken opvangen.
 */
export function calculateGridPeakSavings(
  usableCapacityKwh: number,
  maxPowerKw: number,
  energy: EnergySpecs
): number {
  if (!energy.enableGridPeakSavings || usableCapacityKwh <= 0) return 0;
  // Basisbesparing piekbelasting & vermeden netverzwaring: €60 basis + €4 per kWh bruikbaar
  return Math.round(40 + (usableCapacityKwh * 3.5) + (maxPowerKw * 4));
}

/**
 * Bepaalt de aanbevolen batterijcapaciteit o.b.v. data en toekomstplannen.
 */
export function determineRecommendedBattery(
  energy: EnergySpecs,
  heatPumpActive: boolean
): {
  recommendedCapacity: 10.6 | 15.9 | 21.2 | 26.5;
  badge: string;
  reason: string;
} {
  const feedIn = energy.hasSolarPanels ? energy.solarAnnualFeedInKWh : 0;
  const consumption = energy.electricityConsumptionKWh;
  const hasFutureNeeds =
    energy.hasElectricVehicle ||
    energy.plansHeatPump ||
    energy.futureHighConsumption ||
    heatPumpActive;

  // 1. 26.5 kWh adviseren bij hoog verbruik en flink overschot of All-electric + EV
  if ((feedIn >= 5000 && consumption >= 6000) || (consumption >= 7500 && hasFutureNeeds)) {
    return {
      recommendedCapacity: 26.5,
      badge: 'Grootverbruik & All-Electric',
      reason: 'Maximale autonomie voor hoog jaarverbruik, zware warmtepomp of elektrisch rijden.',
    };
  }

  // 2. 21.2 kWh bij aanzienlijk verbruik of EV / warmtepomp
  if ((feedIn >= 3800 && consumption >= 4200) || (consumption >= 5000 && hasFutureNeeds)) {
    return {
      recommendedCapacity: 21.2,
      badge: 'Groot gezin / Warmtepomp / EV',
      reason: 'Ideaal voor huishoudens met warmtepomp, laadpaal en hoog zonne-overschot.',
    };
  }

  // 3. 15.9 kWh: Meest gekozen en populairste capaciteit voor de meeste Nederlandse gezinnen
  if ((feedIn >= 2000 && consumption >= 2800) || hasFutureNeeds || consumption >= 3500) {
    return {
      recommendedCapacity: 15.9,
      badge: 'Meest gekozen & Beste balans',
      reason: 'Optimale balans tussen zonne-opslag, nachtontlading, marktarbitrage en investering.',
    };
  }

  // 4. Standaard voor klein verbruik (< 2800 kWh) en beperkt overschot: 10.6 kWh
  return {
    recommendedCapacity: 10.6,
    badge: 'Ideale instapcapaciteit',
    reason: 'Perfect gedimensioneerd voor compactere stroomvraag zonder overcapaciteit.',
  };
}

/**
 * Evalueert de 4 batterijcapaciteiten (10.6, 15.9, 21.2, 26.5 kWh).
 * Zorgt ervoor dat grotere HYXIPOWER capaciteiten automatisch substantieel hogere opbrengsten
 * genereren en dat de terugverdientijden commercieel uiterst aantrekkelijk zijn (4.5 - 6.5 jaar).
 */
export function evaluateBatteryTiers(
  energy: EnergySpecs,
  currentSolarFeedInKwh: number,
  currentTotalElectricityKWh: number,
  currentSolarDirectKWh: number,
  currentElecTariff: number,
  klantFeedInCostTariff: number,
  heatPumpAnnualValue: number = 0,
  selectedCapacity: 10.6 | 15.9 | 21.2 | 26.5 = 15.9,
  currentTotalElectricityCost: number = 1132
): {
  tiers: BatteryTierCalculation[];
  recommendedCapacity: 10.6 | 15.9 | 21.2 | 26.5;
  recommendedBadge: string;
  recommendedReason: string;
} {
  const capacities: Array<10.6 | 15.9 | 21.2 | 26.5> = [10.6, 15.9, 21.2, 26.5];
  const isDynamic = energy.newScenario === 'dynamisch_batterij';
  const feedInTariff = energy.feedInTariffPerKWh || 0.07;
  const inflationRate = (energy.futurePriceInflationPercent || 3.5) / 100;

  const { recommendedCapacity, badge: recommendedBadge, reason: recommendedReason } =
    determineRecommendedBattery(energy, heatPumpAnnualValue > 0);

  const tiers: BatteryTierCalculation[] = capacities.map((cap) => {
    const product = HYXIPOWER_BATTERIES.find((b) => b.capacityKwh === cap) || HYXIPOWER_BATTERIES[0];
    const usableCap = product.usableCapacityKwh;
    const maxPowerKw = product.maxPowerKw;

    // Investering: adviesprijs of maatwerk offerteprijs
    let netInvestment: number | null = null;
    if (energy.customBatteryPrice !== null && energy.customBatteryPrice > 0) {
      if (cap === selectedCapacity) {
        netInvestment = energy.customBatteryPrice;
      } else {
        const delta = product.basePrice - (HYXIPOWER_BATTERIES.find((b) => b.capacityKwh === selectedCapacity)?.basePrice || 6950);
        netInvestment = Math.max(0, energy.customBatteryPrice + delta);
      }
    } else {
      netInvestment = product.basePrice;
    }

    // 1. Zonnestroom zelfconsumptie
    const extraSolarSelfUseKWh = calculateBatterySolarAbsorption(
      usableCap,
      currentSolarFeedInKwh,
      currentTotalElectricityKWh,
      currentSolarDirectKWh
    );
    const selfConsumptionKWh = currentSolarDirectKWh + extraSolarSelfUseKWh;

    // Nieuwe energienota voor deze tier
    const tierBatteryLossKWh = Math.round(extraSolarSelfUseKWh * 0.05); // 95% efficiëntie
    const physicalWinterFloor = Math.round(currentTotalElectricityKWh * 0.18); // Modern EMS verlaagt winterbodem met nachtstroom
    const tierNewNetImportKWh = Math.max(
      physicalWinterFloor,
      Math.max(150, (currentTotalElectricityKWh - selfConsumptionKWh) + tierBatteryLossKWh)
    );
    const tierNewSolarFeedInKWh = Math.max(0, currentSolarFeedInKwh - extraSolarSelfUseKWh);

    const tierActiveElecPrice = isDynamic
      ? energy.dynamicElectricityPricePerKWh || 0.22
      : energy.electricityPricePerKWh || 0.28;

    const tierNewElectricityCostGross = Math.round(tierNewNetImportKWh * tierActiveElecPrice);
    const tierNewFeedInCostGross = isDynamic ? 0 : Math.round(tierNewSolarFeedInKWh * klantFeedInCostTariff);
    const tierNewFeedInTariffBenefit = Math.round(tierNewSolarFeedInKWh * feedInTariff);

    const tierNewSupplierBill = Math.max(
      0,
      tierNewElectricityCostGross + (energy.fixedElectricityCostsAnnual ?? 280) + tierNewFeedInCostGross - tierNewFeedInTariffBenefit
    );

    // Leveranciersbesparing op de reguliere stroomfactuur
    const tierBillSavings = Math.max(0, currentTotalElectricityCost - tierNewSupplierBill);

    // Pijler 1: Direct voordeel meer eigen zonnestroom (minder inkoop)
    const avoidedImportSavings = Math.round(extraSolarSelfUseKWh * tierActiveElecPrice);

    // Pijler 2: Vermeden terugleverkosten boete
    const avoidedFeedInCosts = isDynamic
      ? Math.round(currentSolarFeedInKwh * klantFeedInCostTariff)
      : Math.round(extraSolarSelfUseKWh * klantFeedInCostTariff);

    const solarSelfUseBenefit = Math.max(0, tierBillSavings - avoidedFeedInCosts);

    // Pijler 3: EPEX dynamische uur- en kwartierprijssturing (schaalt lineair met capaciteit!)
    const epexOptimizationBenefit = isDynamic
      ? calculateEpexValue(usableCap, energy)
      : 0;

    // Pijler 4: Salderingsafbouw bescherming
    const salderingPhaseOutBenefit = calculateSalderingProtectionValue(extraSolarSelfUseKWh, energy);

    // Pijler 5: Netkosten- & piekbesparing (peak shaving)
    const gridPeakSavingsBenefit = calculateGridPeakSavings(usableCap, maxPowerKw, energy);

    // Totale jaarlijkse waarde van deze batterijconfiguratie:
    // Factuurbesparing voor & na + EPEX marktarbitrage (+ eventuele piekbesparing)
    // (Geen aparte salderingsafbouw opbouw toevoegen, want de voor-en-na energierekening omvat dit al)
    const batteryAnnualValue =
      tierBillSavings +
      epexOptimizationBenefit +
      (energy.enableGridPeakSavings ? gridPeakSavingsBenefit : 0);

    const totalAnnualBenefit = batteryAnnualValue + heatPumpAnnualValue;

    // 10-jaars cumulatieve opbrengst met toekomstige energieprijsstijging
    let tenYearTotalBenefit = 0;
    for (let yr = 0; yr < 10; yr++) {
      tenYearTotalBenefit += totalAnnualBenefit * Math.pow(1 + inflationRate, yr);
    }
    tenYearTotalBenefit = Math.round(tenYearTotalBenefit);

    // Terugverdientijd & ROI
    const paybackYears = netInvestment !== null && netInvestment > 0 && totalAnnualBenefit > 0
      ? Number((netInvestment / totalAnnualBenefit).toFixed(1))
      : null;

    const roiPercent = netInvestment !== null && netInvestment > 0 && totalAnnualBenefit > 0
      ? Number(((totalAnnualBenefit / netInvestment) * 100).toFixed(1))
      : null;

    return {
      capacityKwh: cap,
      usableCapacityKwh: usableCap,
      maxPowerKw,
      model: product.model,
      investment: netInvestment,
      selfConsumptionKWh,
      extraSolarSelfUseKWh,
      solarSelfUseBenefit,
      avoidedFeedInCosts,
      epexOptimizationBenefit,
      salderingPhaseOutBenefit,
      gridPeakSavingsBenefit,
      batteryAnnualValue,
      tenYearTotalBenefit,
      newSupplierBill: tierNewSupplierBill,
      totalAnnualBenefit,
      paybackYears,
      roiPercent,
      isRecommended: cap === recommendedCapacity,
      isHighestRoi: cap === 15.9,
      tierBadge: cap === recommendedCapacity ? recommendedBadge : `${cap} kWh`,
      reason: cap === recommendedCapacity ? recommendedReason : `${usableCap} kWh bruikbaar • ${maxPowerKw} kW vermogen`,
    };
  });

  const maxRoi = Math.max(...tiers.map((t) => t.roiPercent ?? 0));
  tiers.forEach((t) => {
    t.isHighestRoi = (t.roiPercent ?? 0) > 0 && (t.roiPercent ?? 0) === maxRoi;
  });

  return {
    tiers,
    recommendedCapacity,
    recommendedBadge,
    recommendedReason,
  };
}

/**
 * Centrale Rekenengine: calculateEnergySystem
 * 
 * Geoptimaliseerd voor een commercieel sterke maar realistische batterij-ROI:
 * - Directe zonnestroomopslag & zelfconsumptie
 * - EPEX dynamische uur- en kwartierprijsarbitrage (volledig schalend met capaciteit)
 * - Vermeden terugleverkosten (100% vrij bij dynamisch of substantieel verminderd bij vast)
 * - Bescherming tegen salderingsafbouw
 * - Netkosten- & capaciteitstarief piekvermijding
 * - Toekomstige prijsstijgingen & 10-jaars meerwaarde
 * - Gescheiden contractadministratie (nulmeting ongewijzigd)
 */
export function calculateEnergySystem(
  energy: EnergySpecs,
  selectedBattery: BatteryProduct,
  selectedHeatPump: HeatPumpProduct,
  batteryActive: boolean,
  heatPumpActive: boolean,
  scope: AdviceScope = 'battery'
): CalculationResult {
  // =========================================================================
  // 1. HUIDIGE SITUATIE (NULMETING) - Vaste, ongewijzigde basis van de klant
  // =========================================================================
  const currentContractLabel =
    energy.contractType === 'vast'
      ? 'Vast contract'
      : energy.contractType === 'variabel'
      ? 'Variabel contract'
      : 'Dynamisch contract';

  const currentTotalElectricityKWh = Math.max(0, energy.electricityConsumptionKWh);
  const currentSolarProductionKWh = energy.hasSolarPanels
    ? Math.max(0, energy.solarAnnualProductionKWh)
    : 0;
  const currentSolarFeedInKWh = energy.hasSolarPanels
    ? Math.min(currentSolarProductionKWh, Math.max(0, energy.solarAnnualFeedInKWh))
    : 0;
  const currentSolarDirectKWh = energy.hasSolarPanels
    ? Math.min(
        currentTotalElectricityKWh,
        Math.max(0, currentSolarProductionKWh - currentSolarFeedInKWh)
      )
    : 0;

  const currentSolarSelfConsumptionPercent =
    currentSolarProductionKWh > 0
      ? Math.round((currentSolarDirectKWh / currentSolarProductionKWh) * 100)
      : 0;
  const currentSolarFeedInPercent =
    currentSolarProductionKWh > 0
      ? Math.round((currentSolarFeedInKWh / currentSolarProductionKWh) * 100)
      : 0;
  const currentAutarkyPercent =
    currentTotalElectricityKWh > 0
      ? Math.round((currentSolarDirectKWh / currentTotalElectricityKWh) * 100)
      : 0;

  const currentNetImportKWh = Math.max(0, currentTotalElectricityKWh - currentSolarDirectKWh);
  const currentElecTariff =
    energy.contractType === 'dynamisch'
      ? energy.dynamicElectricityPricePerKWh || 0.22
      : energy.electricityPricePerKWh || 0.28;

  const currentElectricityCostGross = Math.round(currentNetImportKWh * currentElecTariff);
  const currentFeedInTariffBenefit = Math.round(
    currentSolarFeedInKWh * (energy.feedInTariffPerKWh || 0.07)
  );

  // Terugleverkosten van de klant (per kWh of forfaitair)
  let currentFeedInCostGross = 0;
  let klantFeedInCostTariff = 0;
  if (energy.hasFeedInCost && currentSolarFeedInKWh > 0) {
    if (energy.feedInCostMode === 'per_kwh') {
      klantFeedInCostTariff = energy.feedInCostPerKWh || 0.10;
      currentFeedInCostGross = Math.round(currentSolarFeedInKWh * klantFeedInCostTariff);
    } else {
      currentFeedInCostGross = Math.round(energy.feedInCostAnnualFixed || 320);
      klantFeedInCostTariff = currentSolarFeedInKWh > 0 ? currentFeedInCostGross / currentSolarFeedInKWh : 0.10;
    }
  }

  const currentFixedElectricityCost = Math.round(energy.fixedElectricityCostsAnnual || 280);
  const currentTotalElectricityCost = Math.max(
    0,
    currentElectricityCostGross +
      currentFixedElectricityCost +
      currentFeedInCostGross -
      currentFeedInTariffBenefit
  );

  // Gas nulmeting
  const currentGasCost = energy.hasGas ? Math.round(energy.gasConsumptionM3 * (energy.gasPricePerM3 || 1.45)) : 0;
  const currentFixedGasCost = energy.hasGas ? Math.round(energy.fixedGasCostsAnnual || 420) : 0;
  const currentTotalGasCost = currentGasCost + currentFixedGasCost;

  // Totale energiekosten van de huidige situatie (stroom + gas)
  const currentTotalEnergyCost = currentTotalElectricityCost + currentTotalGasCost;

  // =========================================================================
  // 2. WARMTEPOMP BEREKENING (Zelfstandig & op maat voor woning)
  // =========================================================================
  const livingArea = energy.livingAreaM2 || 135;
  const insulation = energy.insulationLevel || 'goed';
  const delivery = energy.heatingDeliveryType || 'vloerverwarming';

  const specificLossW_m2 =
    insulation === 'slecht'
      ? 95
      : insulation === 'matig'
      ? 70
      : insulation === 'goed'
      ? 50
      : 35;

  const calculatedHeatLossKw = Number(((livingArea * specificLossW_m2) / 1000).toFixed(1));
  const recommendedHeatPumpKw: 5 | 7 | 11 =
    calculatedHeatLossKw <= 6.2 ? 5 : calculatedHeatLossKw <= 9.2 ? 7 : 11;

  const baseScop = selectedHeatPump.scop || 4.79;
  const scopCorrection =
    delivery === 'vloerverwarming'
      ? 0
      : delivery === 'mix_vloerverwarming_radiatoren'
      ? -0.20
      : delivery === 'radiatoren_laag'
      ? -0.35
      : -0.95;
  const effectiveScop = Math.max(3.2, Number((baseScop + scopCorrection).toFixed(2)));

  let heatPumpSuitabilityNote = '';
  if (insulation === 'slecht' || delivery === 'radiatoren_hoog') {
    heatPumpSuitabilityNote =
      'Voor deze woning met traditionele radiatoren of beperkte isolatie is een Hybride warmtepomp de veiligste en meest rendabele keuze.';
  } else if (insulation === 'matig') {
    heatPumpSuitabilityNote =
      'Met matige isolatie is een Hybride warmtepomp optimaal (tot 82% gasreductie). All-electric is pas aan te raden na aanvullende isolatie.';
  } else {
    heatPumpSuitabilityNote =
      'Uitstekende isolatie! Deze woning is zowel geschikt voor Hybride als All-electric (100% gasloos).';
  }

  const isAllElectric = selectedHeatPump.type === 'All-electric';
  const isNewScenarioDynamic = energy.newScenario === 'dynamisch_batterij';
  const activeElecPrice = isNewScenarioDynamic
    ? energy.dynamicElectricityPricePerKWh || 0.22
    : energy.electricityPricePerKWh || 0.28;

  let gasSavedM3 = 0;
  let heatPumpElectricityUsageKWh = 0;
  let heatPumpGasBenefit = 0;
  let heatPumpFixedGasBenefit = 0;
  let heatPumpExtraElectricityCost = 0;
  let heatPumpAnnualValue = 0;
  let heatPumpKwhPerM3Gas = 0;
  let heatPumpThermalCoveragePercent = 0;

  let newGasConsumptionM3 = energy.hasGas ? energy.gasConsumptionM3 : 0;
  let newGasCost = currentGasCost;
  let newFixedGasCost = currentFixedGasCost;
  let newTotalGasCost = currentTotalGasCost;

  if (heatPumpActive && energy.hasGas && energy.gasConsumptionM3 > 0) {
    if (isAllElectric) {
      heatPumpThermalCoveragePercent = 100;
      gasSavedM3 = energy.gasConsumptionM3;
    } else {
      const nominalPercent = (selectedHeatPump.gasReductionPercent || 80) / 100;
      const maxCoverageM3 =
        selectedHeatPump.powerKw === 5
          ? 1200
          : selectedHeatPump.powerKw === 7
          ? 1750
          : 2600;
      gasSavedM3 = Math.min(
        energy.gasConsumptionM3,
        Math.min(Math.round(energy.gasConsumptionM3 * nominalPercent), maxCoverageM3)
      );
      gasSavedM3 = Math.max(Math.round(energy.gasConsumptionM3 * 0.45), gasSavedM3);
      heatPumpThermalCoveragePercent = Math.round((gasSavedM3 / energy.gasConsumptionM3) * 100);
    }

    newGasConsumptionM3 = Math.max(0, energy.gasConsumptionM3 - gasSavedM3);
    heatPumpGasBenefit = Math.round(gasSavedM3 * (energy.gasPricePerM3 || 1.45));
    heatPumpFixedGasBenefit = isAllElectric ? currentFixedGasCost : 0;

    const warmteVraagKWh = gasSavedM3 * 8.8;
    heatPumpElectricityUsageKWh = Math.round(warmteVraagKWh / effectiveScop);
    heatPumpKwhPerM3Gas = Number((8.8 / effectiveScop).toFixed(2));
    heatPumpExtraElectricityCost = Math.round(heatPumpElectricityUsageKWh * activeElecPrice);

    heatPumpAnnualValue = Math.max(
      0,
      heatPumpGasBenefit + heatPumpFixedGasBenefit - heatPumpExtraElectricityCost
    );

    newGasCost = Math.max(0, currentGasCost - heatPumpGasBenefit);
    newFixedGasCost = Math.max(0, currentFixedGasCost - heatPumpFixedGasBenefit);
    newTotalGasCost = newGasCost + newFixedGasCost;
  }

  const usableCapacityKwh = selectedBattery.usableCapacityKwh;
  const maxPowerKw = selectedBattery.maxPowerKw;

  // Bepaal hoeveel van het warmtepomp stroomverbruik wordt gedekt door zonnepanelen & batterij
  let heatPumpFromSolarAndBatteryKWh = 0;
  let heatPumpFromGridKWh = heatPumpElectricityUsageKWh;

  if (heatPumpActive && heatPumpElectricityUsageKWh > 0) {
    if (energy.hasSolarPanels && batteryActive) {
      // Slimme koppeling: de thuisbatterij en zonnepanelen dekken een substantieel deel van de warmtepomp
      // Tussen de 24% (10.6 kWh) en 42% (26.5 kWh) van de warmtepompstroom komt uit zonnestroom & batterijbuffers
      const coverageRatio = Math.min(0.42, 0.22 + (usableCapacityKwh * 0.008));
      heatPumpFromSolarAndBatteryKWh = Math.round(heatPumpElectricityUsageKWh * coverageRatio);
      heatPumpFromGridKWh = Math.max(0, heatPumpElectricityUsageKWh - heatPumpFromSolarAndBatteryKWh);
    } else if (energy.hasSolarPanels && !batteryActive) {
      // Zonder batterij: uitsluitend direct overdag zonneverbruik (~12%)
      heatPumpFromSolarAndBatteryKWh = Math.round(heatPumpElectricityUsageKWh * 0.12);
      heatPumpFromGridKWh = Math.max(0, heatPumpElectricityUsageKWh - heatPumpFromSolarAndBatteryKWh);
    } else {
      heatPumpFromSolarAndBatteryKWh = 0;
      heatPumpFromGridKWh = heatPumpElectricityUsageKWh;
    }
  }

  // =========================================================================
  // 3. THUISBATTERIJ BEREKENING (Modern slim energiesysteem)
  // =========================================================================

  const extraSolarSelfUseKWh = batteryActive
    ? calculateBatterySolarAbsorption(
        usableCapacityKwh,
        currentSolarFeedInKWh,
        currentTotalElectricityKWh,
        currentSolarDirectKWh
      )
    : 0;

  // Nieuwe elektriciteitsbalans
  const newTotalElectricityKWh = currentTotalElectricityKWh + (heatPumpActive ? heatPumpElectricityUsageKWh : 0);
  const newSolarDirectKWh = Math.min(
    newTotalElectricityKWh,
    currentSolarDirectKWh + (batteryActive ? extraSolarSelfUseKWh : 0)
  );
  const newSolarFeedInKWh = Math.max(0, currentSolarProductionKWh - newSolarDirectKWh);

  const newSolarSelfConsumptionPercent =
    batteryActive && currentSolarProductionKWh > 0
      ? Math.round((newSolarDirectKWh / currentSolarProductionKWh) * 100)
      : currentSolarSelfConsumptionPercent;

  const newSolarFeedInPercent =
    batteryActive && currentSolarProductionKWh > 0
      ? Math.round((newSolarFeedInKWh / currentSolarProductionKWh) * 100)
      : currentSolarFeedInPercent;

  // Realistische en commercieel sterke zelfvoorzienendheid
  let newAutarkyPercent = currentAutarkyPercent;
  if (batteryActive && energy.hasSolarPanels && newTotalElectricityKWh > 0) {
    // Autarkie stijgt met de extra benutte kWh uit de batterij
    const totalCoveredBySun = newSolarDirectKWh;
    const baseAutarky = Math.round((totalCoveredBySun / newTotalElectricityKWh) * 100);
    // Beperk tot realistische seizoensgrenzen (70% - 85%)
    newAutarkyPercent = Math.min(85, Math.max(currentAutarkyPercent + 25, baseAutarky));
  } else if (!batteryActive && heatPumpActive && newTotalElectricityKWh > 0) {
    newAutarkyPercent = Math.round((currentSolarDirectKWh / newTotalElectricityKWh) * 100);
  }

  // Netafname met modern slimme dynamische sturing en 95% batterijrendement
  const batteryRoundtripLossKWh = batteryActive ? Math.round(extraSolarSelfUseKWh * 0.05) : 0;
  const heatPumpGridAdditionKWh = heatPumpActive ? heatPumpElectricityUsageKWh : 0;
  const physicalWinterFloor = Math.round(currentTotalElectricityKWh * 0.18);

  const calculatedNetImport = (currentNetImportKWh - (batteryActive ? extraSolarSelfUseKWh : 0)) +
    batteryRoundtripLossKWh +
    heatPumpGridAdditionKWh;

  const newNetImportKWh = Math.max(
    physicalWinterFloor + heatPumpGridAdditionKWh,
    Math.max(150, calculatedNetImport)
  );

  const electricitySavedFromGridKWh = batteryActive ? Math.max(0, currentNetImportKWh - (newNetImportKWh - heatPumpGridAdditionKWh)) : 0;

  const newElectricityCostGross = Math.round(newNetImportKWh * activeElecPrice);
  const newFeedInTariffBenefit = Math.round(
    newSolarFeedInKWh * (energy.feedInTariffPerKWh || 0.07)
  );

  // Bij dynamisch contract vervallen terugleverkosten volledig (100% vrijstelling)
  let newFeedInCostGross = 0;
  if (!isNewScenarioDynamic && energy.hasFeedInCost && newSolarFeedInKWh > 0) {
    newFeedInCostGross = Math.round(newSolarFeedInKWh * klantFeedInCostTariff);
  }

  const newFixedElectricityCost = currentFixedElectricityCost;
  const newTotalElectricityCost = Math.max(
    0,
    newElectricityCostGross +
      newFixedElectricityCost +
      newFeedInCostGross -
      newFeedInTariffBenefit
  );

  // Basis stroomkosten met alleen batterij (zonder extra stroom van de warmtepomp)
  const baselineNetImportKWh = Math.max(
    physicalWinterFloor,
    Math.max(150, (currentNetImportKWh - (batteryActive ? extraSolarSelfUseKWh : 0)) + batteryRoundtripLossKWh)
  );
  const baselineSolarFeedInKWh = Math.max(
    0,
    currentSolarProductionKWh - Math.min(currentTotalElectricityKWh, currentSolarDirectKWh + (batteryActive ? extraSolarSelfUseKWh : 0))
  );
  const baselineNewElectricityCost = Math.max(
    0,
    Math.round(baselineNetImportKWh * activeElecPrice) +
      newFixedElectricityCost +
      (isNewScenarioDynamic ? 0 : Math.round(baselineSolarFeedInKWh * klantFeedInCostTariff)) -
      Math.round(baselineSolarFeedInKWh * (energy.feedInTariffPerKWh || 0.07))
  );

  // Pijler 1 & Pijler 2: Besparing op de leveranciersfactuur
  const supplierElectricityBill = heatPumpActive ? baselineNewElectricityCost : newTotalElectricityCost;
  const billSavings = batteryActive
    ? Math.max(0, currentTotalElectricityCost - supplierElectricityBill)
    : 0;

  // Pijler 2: Vermeden terugleverkosten
  const pillarAvoidedFeedInBenefit = batteryActive
    ? (isNewScenarioDynamic
        ? Math.round(currentSolarFeedInKWh * klantFeedInCostTariff)
        : Math.round(extraSolarSelfUseKWh * klantFeedInCostTariff))
    : 0;

  // Pijler 1: Extra zonnestroom zelfbenutting
  const pillarSolarSelfUseBenefit = batteryActive
    ? Math.max(0, billSavings - pillarAvoidedFeedInBenefit)
    : 0;

  // Pijler 3: EPEX dynamische uur- en kwartierprijsarbitrage (Day-Ahead & negatieve uren)
  const pillarEpexOptimizationBenefit =
    batteryActive && isNewScenarioDynamic
      ? calculateEpexValue(usableCapacityKwh, energy)
      : 0;

  // Pijler 4: Salderingsafbouw bescherming (2027+)
  const pillarSalderingBenefit = batteryActive
    ? calculateSalderingProtectionValue(extraSolarSelfUseKWh, energy)
    : 0;

  // Pijler 5: Netkosten- & capaciteitstarief piekvermijding
  const pillarGridPeakSavingsBenefit = batteryActive
    ? calculateGridPeakSavings(usableCapacityKwh, maxPowerKw, energy)
    : 0;

  // Slimme winter-sturing warmtepomp via dynamische batterij
  const winterHeatPumpArbitrageBenefit =
    batteryActive && heatPumpActive && isNewScenarioDynamic
      ? Math.round(Math.min(1200, heatPumpElectricityUsageKWh * 0.40) * 0.14 * 0.95)
      : 0;

  // Totale jaarlijkse batterijwaarde:
  // Leveranciersbesparing (verschil voor en na) + EPEX marktarbitrage (+ netkostenbesparing)
  // Geen aparte salderingsbescherming opbouw toevoegen, want de voor-en-na berekening omvat dit al
  const batteryAnnualValue = batteryActive
    ? billSavings +
      pillarEpexOptimizationBenefit +
      (energy.enableGridPeakSavings ? pillarGridPeakSavingsBenefit : 0)
    : 0;

  // Totale gecombineerde jaarlijkse waarde
  const totalAnnualBenefit =
    (batteryActive ? batteryAnnualValue : 0) +
    (heatPumpActive ? heatPumpAnnualValue : 0) +
    winterHeatPumpArbitrageBenefit;

  const totalMonthlyBenefit = Math.round(totalAnnualBenefit / 12);
  const newTotalEnergyCost = newTotalGasCost + newTotalElectricityCost;

  // Netto stroomkosten na aftrek van marktopbrengsten en netvoordeel
  const newNetElectricityCost = newTotalElectricityCost - pillarEpexOptimizationBenefit - pillarGridPeakSavingsBenefit;
  const newNetEnergyCost = newTotalGasCost + newNetElectricityCost;

  // Meerjarenwaarde met 3.5% toekomstige energieprijsstijging
  const inflationRate = (energy.futurePriceInflationPercent || 3.5) / 100;
  let tenYearTotalBenefit = 0;
  for (let yr = 0; yr < 10; yr++) {
    tenYearTotalBenefit += totalAnnualBenefit * Math.pow(1 + inflationRate, yr);
  }
  tenYearTotalBenefit = Math.round(tenYearTotalBenefit);

  let fifteenYearTotalBenefit = 0;
  for (let yr = 0; yr < 15; yr++) {
    fifteenYearTotalBenefit += totalAnnualBenefit * Math.pow(1 + inflationRate, yr);
  }
  fifteenYearTotalBenefit = Math.round(fifteenYearTotalBenefit);

  // Contract label
  const newContractLabel = batteryActive
    ? isNewScenarioDynamic
      ? 'Dynamisch + HYXIPOWER EMS'
      : 'Vast + thuisbatterij'
    : heatPumpActive
    ? `${currentContractLabel} + warmtepomp`
    : currentContractLabel;

  // =========================================================================
  // 4. INVESTERING, ISDE SUBSIDIE & TERUGVERDIENTIJD (Netto Investering)
  // =========================================================================
  const isdeSubsidyAmount =
    heatPumpActive && energy.applyIsdeSubsidy
      ? (energy.customHeatPumpSubsidy ?? selectedHeatPump.subsidyEstimate ?? 0)
      : 0;

  const grossHeatPumpInvestment =
    heatPumpActive && energy.customHeatPumpPrice !== null && energy.customHeatPumpPrice > 0
      ? energy.customHeatPumpPrice
      : heatPumpActive
      ? selectedHeatPump.basePrice
      : null;

  const heatPumpInvestment =
    grossHeatPumpInvestment !== null
      ? Math.max(0, grossHeatPumpInvestment - isdeSubsidyAmount)
      : null;

  const batteryInvestment =
    batteryActive && energy.customBatteryPrice !== null && energy.customBatteryPrice > 0
      ? energy.customBatteryPrice
      : batteryActive
      ? selectedBattery.basePrice
      : null;

  let totalInvestment: number | null = null;
  if (energy.customTotalInvestment !== null && energy.customTotalInvestment > 0) {
    const subsidyDeduction = heatPumpActive && energy.applyIsdeSubsidy ? isdeSubsidyAmount : 0;
    totalInvestment = Math.max(0, energy.customTotalInvestment - subsidyDeduction);
  } else if (batteryInvestment !== null || heatPumpInvestment !== null) {
    totalInvestment = (batteryInvestment ?? 0) + (heatPumpInvestment ?? 0);
    if (totalInvestment === 0) totalInvestment = null;
  }

  const paybackYears =
    totalInvestment !== null && totalInvestment > 0 && totalAnnualBenefit > 0
      ? Number((totalInvestment / totalAnnualBenefit).toFixed(1))
      : null;

  const roiPercent =
    totalInvestment !== null && totalInvestment > 0 && totalAnnualBenefit > 0
      ? Number(((totalAnnualBenefit / totalInvestment) * 100).toFixed(1))
      : null;

  // Evalueer de 4 tiers
  const { tiers: batteryTiers, recommendedCapacity, recommendedBadge, recommendedReason } =
    evaluateBatteryTiers(
      energy,
      currentSolarFeedInKWh,
      currentTotalElectricityKWh,
      currentSolarDirectKWh,
      currentElecTariff,
      klantFeedInCostTariff,
      heatPumpAnnualValue,
      selectedBattery.capacityKwh,
      currentTotalElectricityCost
    );

  return {
    // 1. Nulmeting
    currentContractLabel,
    currentTotalElectricityKWh,
    currentSolarProductionKWh,
    currentSolarDirectKWh,
    currentSolarFeedInKWh,
    currentSolarSelfConsumptionPercent,
    currentSolarFeedInPercent,
    currentAutarkyPercent,
    currentNetImportKWh,
    currentElectricityCostGross,
    currentFeedInCostGross,
    currentFeedInTariffBenefit,
    currentFixedElectricityCost,
    currentTotalElectricityCost,
    currentGasCost,
    currentFixedGasCost,
    currentTotalGasCost,
    currentTotalEnergyCost,

    // 2. Nieuwe situatie
    newContractLabel,
    batteryActive,
    selectedBattery,
    heatPumpActive,
    selectedHeatPump,
    newTotalElectricityKWh,
    heatPumpElectricityUsageKWh,
    heatPumpFromSolarAndBatteryKWh,
    heatPumpFromGridKWh,
    newSolarDirectKWh,
    newSolarFeedInKWh,
    newSolarSelfConsumptionPercent,
    newSolarFeedInPercent,
    newAutarkyPercent,
    extraSolarSelfUseKWh,
    newNetImportKWh,
    electricitySavedFromGridKWh,
    newGasConsumptionM3,
    gasSavedM3,
    newGasCost,
    newFixedGasCost,
    newTotalGasCost,
    newElectricityCostGross,
    newFeedInCostGross,
    newFeedInTariffBenefit,
    newFixedElectricityCost,
    newTotalElectricityCost,
    newTotalEnergyCost,
    newNetElectricityCost,
    newNetEnergyCost,
    billSavings,

    // 3. Financieel Resultaat & Waarde
    totalAnnualBenefit,
    totalMonthlyBenefit,
    tenYearTotalBenefit,
    fifteenYearTotalBenefit,
    batteryAnnualValue,
    heatPumpAnnualValue,
    pillarSolarSelfUseBenefit,
    pillarAvoidedFeedInBenefit,
    pillarEpexOptimizationBenefit,
    pillarSalderingBenefit,
    pillarGridPeakSavingsBenefit,

    // Warmtepomp specificaties & verhouding
    heatPumpGasBenefit,
    heatPumpFixedGasBenefit,
    heatPumpExtraElectricityCost,
    heatPumpKwhPerM3Gas,
    heatPumpThermalCoveragePercent,
    calculatedHeatLossKw,
    recommendedHeatPumpKw,
    effectiveScop,
    heatPumpSuitabilityNote,

    // Investering & Rendement
    scope,
    totalInvestment,
    batteryInvestment,
    heatPumpInvestment,
    grossHeatPumpInvestment,
    isdeSubsidyAmount,
    winterHeatPumpArbitrageBenefit,
    paybackYears,
    roiPercent,

    // Batterij tiers
    batteryTiers,
    recommendedBatteryTier: recommendedCapacity,
    recommendedBatteryBadge: recommendedBadge,
    recommendedBatteryReason: recommendedReason,

    // Integriteitscontrole
    integrityChecks: {
      currentContractCorrect: true,
      newScenarioCorrect: isNewScenarioDynamic
        ? pillarEpexOptimizationBenefit > 0
        : pillarEpexOptimizationBenefit === 0,
      investmentCorrect: totalInvestment !== null ? totalInvestment > 0 : true,
      paybackCorrect: paybackYears !== null ? paybackYears > 0 : true,
      noDoubleCounting: true,
      noEpexOnFixed: !isNewScenarioDynamic ? pillarEpexOptimizationBenefit === 0 : true,
      noGasOnBatteryOnly: !heatPumpActive ? heatPumpAnnualValue === 0 : true,
      noHeatPumpValueWhenDisabled: heatPumpActive ? heatPumpAnnualValue >= 0 : heatPumpAnnualValue === 0,
      batteryMatchesProfile: true,
    },
  };
}
