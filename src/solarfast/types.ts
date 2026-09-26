export type Category = 'battery' | 'solar' | 'heatpump' | 'charger' | 'extra';
export type Page = 'home' | 'products' | 'how' | 'hyxi' | 'finance' | 'about' | 'faq' | 'builder';
export interface Product {
  id: string; category: Category; brand: string; name: string; nameEn?: string;
  price: number | null; vat: number; priceBasis: 'inclusive' | 'exclusive';
  capacity?: number; phase?: number; panels?: number; watts?: number;
  heating?: 'hybrid' | 'electric'; power?: string; subsidy?: number;
  backup?: boolean; connection?: string;
}
export interface Line {
  id: string; product: Product; quantity: number; price: number | null; subsidy: number;
  annualCost: number; manualBenefit: number;
}
export interface Profile {
  electricity: number; solar: number; exported: number; electricityRate: number;
  exportRate: number; exportFee: number; fixedExportFee: number; feeMode: 'kwh' | 'annual';
  fixedElectricity: number; gas: number; gasRate: number; fixedGas: number;
  evKwh: number; publicChargingRate: number; dynamic: boolean; netMetering: boolean;
  solarYield: number; solarDirect: number; usableBattery: number; batteryEfficiency: number;
  batteryCycles: number; lowRate: number; highRate: number;
  scop: number; hybridCoverage: number; gasHeat: number;
  annualInflation: number; annualDegradation: number;
}
export interface Project {
  version: 1; profile: Profile; lines: Line[]; customProducts: Product[];
  customer: {name: string; address: string; email: string; adviser: string; date: string; notes: string};
  finance: {enabled: boolean; amount: number; rate: number; years: number};
}
