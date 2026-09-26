export type EnergyContractType = 'vast' | 'variabel' | 'dynamisch';
export type NewScenarioType = 'vast_batterij' | 'dynamisch_batterij';
export type AdviceScope = 'battery' | 'heatpump' | 'both';
export type FeedInCostMode = 'per_kwh' | 'vast_jaarlijks';
export type HomeType = 'vrijstaand' | 'twee_onder_een_kap' | 'hoekwoning' | 'tussenwoning' | 'appartement';
export type InsulationLevel = 'slecht' | 'matig' | 'goed' | 'zeer_goed';
export type HeatingDeliveryType = 'vloerverwarming' | 'mix_vloerverwarming_radiatoren' | 'radiatoren_laag' | 'radiatoren_hoog';

export interface EnergySpecs {
  // 1. Huidig contract (onafhankelijk en gescheiden gehouden)
  contractType: EnergyContractType;

  // Stroomverbruik & Zonnepanelen
  electricityConsumptionKWh: number;
  hasSolarPanels: boolean;
  solarAnnualProductionKWh: number;
  solarAnnualFeedInKWh: number;
  electricityPricePerKWh: number; // bijv. €0,28 /kWh
  feedInTariffPerKWh: number; // terugleververgoeding, bijv. €0,07 /kWh

  // Terugleverkosten huidige leverancier
  hasFeedInCost: boolean;
  feedInCostMode: FeedInCostMode;
  feedInCostPerKWh: number; // bijv. €0,10 /kWh
  feedInCostAnnualFixed: number;

  // Vaste lasten stroom
  fixedElectricityCostsAnnual: number; // Standaard €280 /jaar

  // Woning & Gas (uitsluitend zichtbaar/berekend bij warmtepomp)
  homeType: HomeType;
  livingAreaM2: number; // Woonoppervlakte in m2
  insulationLevel: InsulationLevel; // Isolatiegraad van de woning
  heatingDeliveryType: HeatingDeliveryType; // Afgiftesysteem: vloerverwarming, LTV of traditioneel
  hasGas: boolean;
  gasConsumptionM3: number;
  gasPricePerM3: number;
  fixedGasCostsAnnual: number; // Standaard €420 /jaar (aansluiting & vastrecht)

  // 2. Nieuw Scenario: altijd gescheiden van huidig contract
  // 'vast_batterij': [Vast + batterij]
  // 'dynamisch_batterij': [Dynamisch + slimme batterijoptimalisatie]
  newScenario: NewScenarioType;
  dynamicElectricityPricePerKWh: number; // bijv. €0,24 /kWh

  // EPEX parameters (formule: bruikbare capaciteit × cycli × prijsverschil × rendement)
  // Modern energiesysteem: 320 cycli, €0,13 - €0,15/kWh marge (standaard €0,14), 95% rendement
  epexPriceDiffPerKWh: number;
  epexCyclesPerYear: number;
  epexBatteryEfficiency: number;

  // Modern slim energiesysteem optimalisaties
  enableSalderingBenefit: boolean; // Bescherming tegen salderingsafbouw (vanaf 2027)
  enableGridPeakSavings: boolean; // Netkostenbesparing / capaciteitstarief piekvermijding
  futurePriceInflationPercent: number; // Toekomstige jaarlijkse prijsstijging (standaard 3%)

  // Investeringen: standaard null ("Investering nog invullen")
  customBatteryPrice: number | null;
  customHeatPumpPrice: number | null;
  customTotalInvestment: number | null;
  applyIsdeSubsidy: boolean; // Of ISDE subsidie wordt verrekend in de netto investering & ROI
  customHeatPumpSubsidy: number | null; // Optioneel handmatig subsidiebedrag

  // Toekomstwensen voor batterijselectie
  hasElectricVehicle: boolean;
  plansHeatPump: boolean;
  futureHighConsumption: boolean;
  hasBackupPower: boolean; // Optionele noodstroom EPS (<20ms)
}

export interface BatteryProduct {
  id: string;
  brand: 'HYXIPOWER';
  model: string;
  capacityKwh: 10.6 | 15.9 | 21.2 | 26.5;
  usableCapacityKwh: number;
  phase: string;
  maxPowerKw: number; // Continu laad/ontlaadvermogen
  basePrice: number;
  efficiencyPercent: number;
  targetTag?: string;
  targetAudience?: string;
}

export interface HeatPumpProduct {
  id: string;
  brand: 'Vaillant';
  model: string;
  type: 'Hybride' | 'All-electric';
  powerKw: 5 | 7 | 11;
  scop: number; // bijv. 4.95, 4.79, 4.60
  basePrice: number;
  gasReductionPercent: number; // bijv. 70%, 82%, 92% bij hybride; 100% bij all-electric
  subsidyEstimate: number; // ISDE indicatie
  recommendedFor?: string;
}

export interface BatteryTierCalculation {
  capacityKwh: 10.6 | 15.9 | 21.2 | 26.5;
  usableCapacityKwh: number;
  maxPowerKw: number;
  model: string;
  investment: number | null;
  selfConsumptionKWh: number;
  extraSolarSelfUseKWh: number;
  solarSelfUseBenefit: number; // Pijler 1: Meer eigen zonnestroom
  avoidedFeedInCosts: number; // Pijler 2: Vermeden terugleverkosten / boetes
  epexOptimizationBenefit: number; // Pijler 3: EPEX dynamische uur- & kwartierprijssturing
  salderingPhaseOutBenefit: number; // Pijler 4: Bescherming salderingsafbouw
  gridPeakSavingsBenefit: number; // Pijler 5: Netkosten- & piekbesparing
  batteryAnnualValue: number; // Totale jaarwaarde van de batterij
  tenYearTotalBenefit: number; // 10-jaars opbrengst inclusief prijsindexatie
  newSupplierBill: number;
  totalAnnualBenefit: number;
  paybackYears: number | null;
  roiPercent: number | null;
  isRecommended: boolean;
  isHighestRoi: boolean;
  tierBadge: string;
  reason: string;
}

export interface CalculationResult {
  // 1. HUIDIGE SITUATIE (NULMETING)
  currentContractLabel: string;
  currentTotalElectricityKWh: number;
  currentSolarProductionKWh: number;
  currentSolarDirectKWh: number;
  currentSolarFeedInKWh: number;
  currentSolarSelfConsumptionPercent: number;
  currentSolarFeedInPercent: number; // Hoeveel % van de opwek wordt teruggeleverd
  currentAutarkyPercent: number; // Zelfvoorzienendheid nu: eigen zon / stroomvraag
  currentNetImportKWh: number;
  currentElectricityCostGross: number;
  currentFeedInCostGross: number;
  currentFeedInTariffBenefit: number;
  currentFixedElectricityCost: number;
  currentTotalElectricityCost: number;
  currentGasCost: number;
  currentFixedGasCost: number;
  currentTotalGasCost: number;
  currentTotalEnergyCost: number;

  // 2. NIEUWE SITUATIE
  newContractLabel: string;
  batteryActive: boolean;
  selectedBattery: BatteryProduct;
  heatPumpActive: boolean;
  selectedHeatPump: HeatPumpProduct;
  newTotalElectricityKWh: number;
  heatPumpElectricityUsageKWh: number;
  heatPumpFromSolarAndBatteryKWh: number; // Hoeveel WP-stroom gedekt wordt uit zonnestroom & batterij
  heatPumpFromGridKWh: number; // Resterende WP-stroom van het net
  newSolarDirectKWh: number;
  newSolarFeedInKWh: number;
  newSolarSelfConsumptionPercent: number;
  newSolarFeedInPercent: number; // Hoeveel % van de opwek nu nog wordt teruggeleverd
  newAutarkyPercent: number; // Zelfvoorzienendheid met batterij (+ warmtepomp)
  extraSolarSelfUseKWh: number;
  newNetImportKWh: number;
  electricitySavedFromGridKWh: number; // Vermindering van netstroomafname
  newGasConsumptionM3: number;
  gasSavedM3: number;
  newGasCost: number;
  newFixedGasCost: number;
  newTotalGasCost: number;
  newElectricityCostGross: number;
  newFeedInCostGross: number;
  newFeedInTariffBenefit: number;
  newFixedElectricityCost: number;
  newTotalElectricityCost: number;
  newTotalEnergyCost: number;
  newNetElectricityCost: number;
  newNetEnergyCost: number;
  billSavings: number;

  // 3. FINANCIEEL RESULTAAT & VERWACHTE WAARDE (Modern slim energiesysteem)
  totalAnnualBenefit: number;
  totalMonthlyBenefit: number;
  tenYearTotalBenefit: number; // 10-jaars cumulatief met inflatie
  fifteenYearTotalBenefit: number; // 15-jaars (garantieperiode)

  // Pijler-uitsplitsing
  batteryAnnualValue: number;
  heatPumpAnnualValue: number;
  pillarSolarSelfUseBenefit: number;
  pillarAvoidedFeedInBenefit: number;
  pillarEpexOptimizationBenefit: number;
  pillarSalderingBenefit: number;
  pillarGridPeakSavingsBenefit: number;

  // Warmtepomp specificaties & verhouding
  heatPumpGasBenefit: number;
  heatPumpFixedGasBenefit: number;
  heatPumpExtraElectricityCost: number;
  heatPumpKwhPerM3Gas: number; // Hoeveel kWh stroom per bespaarde m3 gas
  heatPumpThermalCoveragePercent: number; // Dekking van de warmtevraag in %
  calculatedHeatLossKw: number; // Berekend thermisch transmissieverlies in kW
  recommendedHeatPumpKw: 5 | 7 | 11; // Aanbevolen vermogen o.b.v. m2 en isolatie
  effectiveScop: number; // Reële seizoens-SCOP gecorrigeerd voor afgiftesysteem
  heatPumpSuitabilityNote: string; // Professioneel advies over hybride vs all-electric geschiktheid

  // Scope & Investering
  scope: AdviceScope;
  totalInvestment: number | null; // Netto investering waarop ROI berekend is
  batteryInvestment: number | null;
  heatPumpInvestment: number | null; // Netto investering warmtepomp (na subsidie)
  grossHeatPumpInvestment: number | null; // Bruto offertebedrag warmtepomp
  isdeSubsidyAmount: number; // ISDE overheidssubsidie bedrag
  winterHeatPumpArbitrageBenefit: number; // Slimme winter-sturing warmtepomp via dynamische batterij
  paybackYears: number | null;
  roiPercent: number | null;

  // Batterij advies selectie
  batteryTiers: BatteryTierCalculation[];
  recommendedBatteryTier: 10.6 | 15.9 | 21.2 | 26.5;
  recommendedBatteryBadge: string;
  recommendedBatteryReason: string;

  // Automatische integriteitscontrole (Eindcontrole)
  integrityChecks: {
    currentContractCorrect: boolean;
    newScenarioCorrect: boolean;
    investmentCorrect: boolean;
    paybackCorrect: boolean;
    noDoubleCounting: boolean;
    noEpexOnFixed: boolean;
    noGasOnBatteryOnly: boolean;
    noHeatPumpValueWhenDisabled: boolean;
    batteryMatchesProfile: boolean;
  };
}

export interface CustomerData {
  name: string;
  address: string;
  zipCode: string;
  city: string;
  reportDate: string;
  advisorName: string;
}
