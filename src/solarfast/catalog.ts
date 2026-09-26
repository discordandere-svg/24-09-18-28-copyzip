import type {Product, Profile, Project} from './types';
const batteries: Product[] = [];
function battery(brand: string, capacity: number, phase: number, price: number, allIn = false, suffix = '') {
  batteries.push({id:`bat-${brand}-${capacity}-${phase}-${allIn}-${suffix}`.replaceAll(' ','-'), category:'battery',brand, name:`${brand} ${suffix ? suffix+' ' : ''}${capacity.toLocaleString('nl-NL')} kWh${allIn ? ' ALL-IN' : ''}`,nameEn:`${brand} ${suffix ? suffix+' ' : ''}${capacity} kWh${allIn ? ' ALL-IN' : ''}`,capacity,phase,price,vat:21,priceBasis:'inclusive',backup:brand==='HYXiPOWER' && allIn,connection:brand==='HYXiPOWER'&&phase===1 ? 'Frank' : undefined});
}
[[5.3,4500],[10.6,5250],[15.9,6950]].forEach(([c,p])=>battery('HYXiPOWER',c,1,p));
[[10.6,7250],[15.9,8500],[21.2,9500],[26.5,10500]].forEach(([c,p])=>battery('HYXiPOWER',c,3,p,true));
[[10.6,6290],[15.9,7450],[21.2,8450],[26.5,9450]].forEach(([c,p])=>battery('HYXiPOWER',c,3,p));
[[7.1,5500],[10.6,6250],[14.2,7000],[17.75,7750],[21.3,8500]].forEach(([c,p])=>battery('Dyness',c,3,p,false,'Tower S3'));
[[18.6,8750],[9.3,6500]].forEach(([c,p])=>battery('AlphaESS',c,3,p,false,'+ 10 kW'));
[[10.2,7200],[15.3,8500],[20.4,9800],[25.5,10990]].forEach(([c,p])=>battery('KSTAR',c,3,p,true));
[[5.1,4950],[10.2,5950],[15.3,7500]].forEach(([c,p])=>battery('KSTAR',c,1,p,true));
const solarPrices: Record<string, (number|null)[]> = {
  'Panelen op batterij':[null,null,2100,2450,2800,3150,3350,3685,4020,4225,4550,4875,5200,5355,5670,5700,6000],
  'Stringomvormer':[2650,3150,3350,3600,3840,4200,4400,4595,4990,5320,5710,5850,6090,6250,6650,6950,7250],
  'Hoymiles':[2890,3450,3710,4020,4320,4740,5000,5255,5710,6100,6550,6750,7050,7270,7730,8090,8450],
  'Enphase IQ8HC':[2600,3100,3300,3550,3790,4150,4350,4545,4940,5270,5660,5800,6040,6200,6600,6900,7200],
};
const solar: Product[] = Object.entries(solarPrices).flatMap(([system,prices],index)=>prices.map((price,i)=>({id:`solar-${index}-${i+4}`,category:'solar' as const,brand:'LONGi',name:`${i+4} panelen · ${system}`,nameEn:`${i+4} panels · ${system==='Panelen op batterij'?'Battery connection':system==='Stringomvormer'?'String inverter':system}`,panels:i+4,watts:475,price,priceBasis:'inclusive' as const,vat:0,connection:system})));
const heatpumpRows: [string,string,'hybrid'|'electric',string,number,number][] = [
 ['Vaillant','aroTHERM pro 115/7.1 A · 200L · 400V','electric','11',13203,3700],
 ['Vaillant','aroTHERM pro 115/7.1 A · 400V','hybrid','11',9209.70,2475],
 ['Vaillant','aroTHERM pro 55/7.1 A · 200L · 230V','electric','5',11758.50,1125],
 ['Vaillant','aroTHERM pro 55/7.1 A · 230V','hybrid','5',7630.20,1125],
 ['Vaillant','aroTHERM pro 75/7.1 A · 200L · 230V','electric','7',12069,1575],
 ['Vaillant','aroTHERM pro 75/7.1 A · 230V','hybrid','7',8075.70,1575],
 ['WeHeat','Blackbird P60 · R290','hybrid','6–9',9132.75,1350],
 ['WeHeat','Blackbird P60 · 200L · R290','electric','8–11',13702.50,1350],
 ['WeHeat','Blackbird P80 · R290','hybrid','8–11',9612,1800],
 ['WeHeat','Blackbird P80 · 200L · R290','electric','8–11',14242.50,3025],
 ['WeHeat','Flint P40 · R290','electric','4–6',10800,1125],
 ['WeHeat','Flint P40 · Solo / Hybrid indoor unit · R290','hybrid','4–6',6547.50,1125],
 ['WeHeat','Sparrow P60 · R290','electric','6–9',13344.75,1350],
 ['WeHeat','Sparrow P60 · R290','hybrid','6–9',8775,1350],
];
const heatpumps: Product[] = heatpumpRows.map(([brand,name,heating,power,price,subsidy],i)=>({id:`hp-${i}`,category:'heatpump',brand,name:`${brand} ${name}`,heating,power,price,subsidy,vat:21,priceBasis:'exclusive'}));
export const catalog: Product[] = [...batteries,...solar,...heatpumps,
 {id:'zaptec-1',category:'charger',brand:'Zaptec',name:'Zaptec Go 2 · 1-fase',nameEn:'Zaptec Go 2 · single-phase',phase:1,price:1700,vat:21,priceBasis:'exclusive'},
 {id:'zaptec-3',category:'charger',brand:'Zaptec',name:'Zaptec Go 2 · 3-fase',nameEn:'Zaptec Go 2 · three-phase',phase:3,price:1900,vat:21,priceBasis:'exclusive'},
];
export const grossPrice = (p: Product) => p.price === null ? null : Math.round(p.price*(p.priceBasis==='exclusive' ? 1+p.vat/100 : 1)*100)/100;
export const defaultProfile: Profile = {electricity:4500,solar:5000,exported:3200,electricityRate:.28,exportRate:.07,exportFee:.10,fixedExportFee:320,feeMode:'kwh',fixedElectricity:280,gas:1550,gasRate:1.45,fixedGas:420,evKwh:0,publicChargingRate:.50,dynamic:false,netMetering:false,solarYield:850,solarDirect:35,usableBattery:90,batteryEfficiency:95,batteryCycles:200,lowRate:.18,highRate:.32,scop:4.78,hybridCoverage:80,gasHeat:8.8,annualInflation:2,annualDegradation:0};
export function emptyProject(): Project {
  const now=new Date();
  const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  return {version:1,profile:{...defaultProfile},lines:[],customProducts:[],customer:{name:'',address:'',email:'',adviser:'',date,notes:''},finance:{enabled:false,amount:0,rate:0,years:10}};
}
