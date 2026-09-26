import {
  BatteryProduct,
  HeatPumpProduct,
  EnergySpecs,
  CustomerData,
} from '../types';

export const DEFAULT_ENERGY_SPECS: EnergySpecs = {
  // 1. Huidig contract (onafhankelijk uitgangspunt nulmeting)
  contractType: 'vast',

  // Stroomverbruik & Zonnepanelen
  electricityConsumptionKWh: 4500,
  hasSolarPanels: true,
  solarAnnualProductionKWh: 5000,
  solarAnnualFeedInKWh: 3200,
  electricityPricePerKWh: 0.28,
  feedInTariffPerKWh: 0.07,

  // Terugleverkosten huidige leverancier
  hasFeedInCost: true,
  feedInCostMode: 'per_kwh',
  feedInCostPerKWh: 0.10,
  feedInCostAnnualFixed: 320,

  // Vaste lasten stroom
  fixedElectricityCostsAnnual: 280,

  // Woning & Gas (uitsluitend getoond/berekend bij warmtepomp)
  homeType: 'twee_onder_een_kap',
  livingAreaM2: 135,
  insulationLevel: 'goed',
  heatingDeliveryType: 'vloerverwarming',
  hasGas: true,
  gasConsumptionM3: 1550,
  gasPricePerM3: 1.45,
  fixedGasCostsAnnual: 420,

  // 2. Nieuw Scenario: altijd gescheiden
  newScenario: 'dynamisch_batterij',
  dynamicElectricityPricePerKWh: 0.22,

  // EPEX Day-Ahead & Dynamische sturing parameters
  // Reëel marktgemiddelde: 280 cycli/jaar, €0,12/kWh gemiddeld prijsverschil, 92% systeemrendement
  epexPriceDiffPerKWh: 0.12,
  epexCyclesPerYear: 280,
  epexBatteryEfficiency: 0.92,

  // Modern slim energiesysteem: salderingsafbouw en netkostenoptimalisatie
  enableSalderingBenefit: true,
  enableGridPeakSavings: true,
  futurePriceInflationPercent: 3.5,

  // Investeringen: NOOIT automatisch tonen. Standaard null ("Investering nog invullen")
  customBatteryPrice: null,
  customHeatPumpPrice: null,
  customTotalInvestment: null,
  applyIsdeSubsidy: true,
  customHeatPumpSubsidy: null,

  // Toekomstwensen voor batterijselectie
  hasElectricVehicle: false,
  plansHeatPump: false,
  futureHighConsumption: false,
  hasBackupPower: false,
};

export const HYXIPOWER_BATTERIES: BatteryProduct[] = [
  {
    id: 'hyxipower-10-6-3f',
    brand: 'HYXIPOWER',
    model: 'HYXIPOWER 10.6 kWh',
    capacityKwh: 10.6,
    usableCapacityKwh: 10.1,
    phase: '3-fase',
    maxPowerKw: 5.0,
    basePrice: 5450,
    efficiencyPercent: 95,
    targetTag: 'Kleine verbruikers',
    targetAudience: 'Voor kleine verbruikers (tot ca. 3.500 kWh/jr)',
  },
  {
    id: 'hyxipower-15-9-3f',
    brand: 'HYXIPOWER',
    model: 'HYXIPOWER 15.9 kWh',
    capacityKwh: 15.9,
    usableCapacityKwh: 15.1,
    phase: '3-fase',
    maxPowerKw: 7.5,
    basePrice: 6950,
    efficiencyPercent: 95,
    targetTag: 'Meest gekozen',
    targetAudience: 'Voor gemiddelde huishoudens & warmtepomp (3.500 - 5.500 kWh/jr)',
  },
  {
    id: 'hyxipower-21-2-3f',
    brand: 'HYXIPOWER',
    model: 'HYXIPOWER 21.2 kWh',
    capacityKwh: 21.2,
    usableCapacityKwh: 20.1,
    phase: '3-fase',
    maxPowerKw: 10.0,
    basePrice: 8450,
    efficiencyPercent: 95,
    targetTag: 'Met elektrische auto',
    targetAudience: 'Voor huishoudens met elektrische auto of warmtepomp (5.500 - 8.000 kWh/jr)',
  },
  {
    id: 'hyxipower-26-5-3f',
    brand: 'HYXIPOWER',
    model: 'HYXIPOWER 26.5 kWh',
    capacityKwh: 26.5,
    usableCapacityKwh: 25.2,
    phase: '3-fase',
    maxPowerKw: 12.5,
    basePrice: 9950,
    efficiencyPercent: 95,
    targetTag: 'Maximaal / All-Electric',
    targetAudience: 'Maximale autonomie: zware verbruikers (warmtepomp + EV of > 8.000 kWh/jr)',
  },
];

export const VAILLANT_HEATPUMPS: HeatPumpProduct[] = [
  {
    id: 'vaillant-5kw-hybrid',
    brand: 'Vaillant',
    model: 'aroTHERM Plus 5 kW',
    type: 'Hybride',
    powerKw: 5,
    scop: 4.85,
    basePrice: 5250,
    gasReductionPercent: 68,
    subsidyEstimate: 2925,
    recommendedFor: 'Tussenwoningen & compacte hoekwoningen (gasverbruik tot ~1.200 m³)',
  },
  {
    id: 'vaillant-7kw-hybrid',
    brand: 'Vaillant',
    model: 'aroTHERM Plus 7 kW',
    type: 'Hybride',
    powerKw: 7,
    scop: 4.70,
    basePrice: 5950,
    gasReductionPercent: 75,
    subsidyEstimate: 3375,
    recommendedFor: 'Meest gekozen: 2-onder-1-kap & hoekwoningen (gasverbruik 1.200 - 2.000 m³)',
  },
  {
    id: 'vaillant-11kw-hybrid',
    brand: 'Vaillant',
    model: 'aroTHERM Plus 11 kW',
    type: 'Hybride',
    powerKw: 11,
    scop: 4.55,
    basePrice: 7250,
    gasReductionPercent: 82,
    subsidyEstimate: 4125,
    recommendedFor: 'Vrijstaande woningen & hoog gasverbruik (>2.000 m³)',
  },
  {
    id: 'vaillant-5kw-alle',
    brand: 'Vaillant',
    model: 'aroTHERM Plus 5 kW',
    type: 'All-electric',
    powerKw: 5,
    scop: 4.90,
    basePrice: 7950,
    gasReductionPercent: 100,
    subsidyEstimate: 2925,
    recommendedFor: 'Zeer goed geïsoleerde woningen (A-label) tot 1.200 m³ gas',
  },
  {
    id: 'vaillant-7kw-alle',
    brand: 'Vaillant',
    model: 'aroTHERM Plus 7 kW',
    type: 'All-electric',
    powerKw: 7,
    scop: 4.75,
    basePrice: 8950,
    gasReductionPercent: 100,
    subsidyEstimate: 3375,
    recommendedFor: 'Gemiddelde eengezinswoningen en 2-onder-1-kap tot 2.000 m³ gas',
  },
  {
    id: 'vaillant-11kw-alle',
    brand: 'Vaillant',
    model: 'aroTHERM Plus 11 kW',
    type: 'All-electric',
    powerKw: 11,
    scop: 4.55,
    basePrice: 10850,
    gasReductionPercent: 100,
    subsidyEstimate: 4125,
    recommendedFor: 'Grote vrijstaande woningen, woonboerderijen en villa’s (>2.000 m³)',
  },
];

export const DEFAULT_CUSTOMER_DATA: CustomerData = {
  name: 'Familie Jansen',
  address: 'Dorpsstraat 42',
  zipCode: '3981 AA',
  city: 'Bunnik',
  reportDate: new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
  advisorName: 'SolarFast Adviseur',
};
