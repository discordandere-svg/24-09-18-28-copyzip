import type {Profile, Line, Project, Product, Category} from './types';
import {grossPrice} from './catalog';
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
export const MAX_LINES=100;
export const MAX_UNITS=20;
const SYSTEM_CATEGORIES=new Set<Product['category']>(['battery','solar','heatpump','charger']);
export const EPEX_SPREAD_EUR_PER_KWH=0.20;
export const EPEX_ROUND_TRIP_EFFICIENCY=0.90;
export function epexCyclesForCapacity(capacity:number):number {
  if(capacity<=10.6)return 300;
  if(capacity<=15.9)return 310;
  if(capacity<=21.2)return 300;
  return 290;
}
export const PRODUCT_SCOPE_RULES={
  battery:{affects:['electricity','solar_self_consumption','grid_import','export','ems'],forbidden:['gas','heating','radiators','heat_demand','ev_consumption']},
  heatpump:{affects:['gas','electricity_consumption','heating'],forbidden:['solar_export','battery_capacity','ev']},
  charger:{affects:['electricity_consumption','solar_usage'],forbidden:['gas','heatpump_savings']},
  solar:{affects:['solar_generation','export','self_consumption'],forbidden:['gas','heating']},
} as const;
/**
 * Keep the plan canonical at every state boundary. A home has one configured
 * system per energy module; its size belongs to the selected catalogue product,
 * not to duplicate rows or a quantity multiplier. Extras may have a quantity,
 * but the same extra product still appears on one quote line only.
 */
export function normalizeLines(lines:Line[]):Line[]{
  const normalized:Line[]=[];
  const systemIndex=new Map<Product['category'],number>();
  const extraIndex=new Map<string,number>();
  for(const source of lines){
    const line={...source,product:{...source.product}};
    if(SYSTEM_CATEGORIES.has(line.product.category)){
      line.quantity=1;
      const index=systemIndex.get(line.product.category);
      if(index===undefined){systemIndex.set(line.product.category,normalized.length);normalized.push(line);}
      else normalized[index]=line; // Latest selection is the user's current choice.
      continue;
    }
    const index=extraIndex.get(line.product.id);
    if(index===undefined){extraIndex.set(line.product.id,normalized.length);normalized.push(line);}
    else normalized[index]={...line,id:normalized[index].id,quantity:Math.min(MAX_UNITS,normalized[index].quantity+line.quantity)};
  }
  return normalized;
}
export function normalizeProject(project:Project):Project{
  return {...project,lines:normalizeLines(project.lines)};
}
export type AddProductOutcome='added'|'already'|'limit';
export function addProduct(project:Project,product:Product):{project:Project;outcome:AddProductOutcome}{
  project=normalizeProject(project);
  const price=grossPrice(product);
  const exact=project.lines.find(line=>line.product.id===product.id&&line.price===price);
  if(exact&&product.category!=='extra')return {project,outcome:'already'};
  if(exact){
    if(exact.quantity>=MAX_UNITS)return {project,outcome:'limit'};
    return {project:normalizeProject({...project,lines:project.lines.map(line=>line.id===exact.id?{...line,quantity:line.quantity+1}:line)}),outcome:'added'};
  }
  const current=product.category==='extra'?undefined:project.lines.find(line=>line.product.category===product.category);
  if(!current&&project.lines.length>=MAX_LINES)return {project,outcome:'limit'};
  const next:Line={id:current?.id??crypto.randomUUID(),product:{...product},quantity:1,price,subsidy:product.subsidy??0,annualCost:current?.annualCost??0,manualBenefit:current?.manualBenefit??0};
  return {project:normalizeProject({...project,lines:current?project.lines.map(line=>line.id===current.id?next:line):[...project.lines,next]}),outcome:'added'};
}
export function profileErrors(p:Profile): string[] {
  const errors:string[]=[];
  // A rounded annual bill may omit part of the implied export. The energy-flow
  // calculation caps direct use at demand; only export above production is invalid.
  if(p.exported>p.solar) errors.push('solar');
  if(p.scop<=0 || p.batteryEfficiency<=0 || p.usableBattery<=0) errors.push('assumptions');
  return errors;
}
export function energyState(p:Profile, lines:Line[]) {
  lines=normalizeLines(lines);
  const count=(kind:Product['category'])=>lines.filter(l=>l.product.category===kind);
  const solarAdded=count('solar').reduce((n,l)=>n+(l.product.panels??0)*(l.product.watts??475)/1000*p.solarYield*l.quantity,0);
  const nominalCapacity=count('battery').reduce((n,l)=>n+(l.product.capacity??0)*l.quantity,0);
  const capacity=nominalCapacity*p.usableBattery/100;
  const hp=count('heatpump');
  // Extra heat pumps do not multiply one home's gas demand.
  const coverage=hp.length ? (hp.some(l=>l.product.heating==='electric') ? 1 : p.hybridCoverage/100) : 0;
  const gasSaved=p.gas*coverage;
  const heatElectricity=gasSaved*p.gasHeat/Math.max(.1,p.scop);
  const homeCharging=count('charger').length>0 ? p.evKwh : 0;
  const demand=p.electricity+heatElectricity+homeCharging;
  const production=p.solar+solarAdded;
  const oldDirect=clamp(p.solar-p.exported,0,p.electricity);
  const direct=Math.min(demand,production,oldDirect+solarAdded*p.solarDirect/100+(heatElectricity+homeCharging)*p.solarDirect/100);
  const surplus=Math.max(0,production-direct);
  const residual=Math.max(0,demand-direct);
  const efficiency=p.batteryEfficiency/100;
  // Solar shifting and market trading consume one physical battery-cycle budget.
  const maxSolarCycles=Math.min(250,p.batteryCycles);
  const solarThroughput=capacity*maxSolarCycles;
  const physicalCycles=epexCyclesForCapacity(nominalCapacity);
  const throughput=nominalCapacity*physicalCycles;
  // Annual export is not a guarantee of usable daily shifting. Without hourly
  // data, use a conservative capacity-dependent utilization factor and a hard
  // cycle limit so the model does not treat the battery as a yearly spreadsheet.
  const utilization=nominalCapacity<=5.3?.65:nominalCapacity<=10.6?.75:nominalCapacity<=15.9?.82:nominalCapacity<=21.2?.88:.92;
  const charged=Math.min(surplus*utilization,solarThroughput,residual/Math.max(.01,efficiency),Math.max(0,production*.96-direct)/Math.max(.01,efficiency));
  const stored=charged*efficiency;
  const grid=Math.max(0,residual-stored);
  const exported=Math.max(0,surplus-charged);
  const matched=p.netMetering ? Math.min(grid,exported) : 0;
  const electricityCost=(grid-matched)*p.electricityRate-(exported-matched)*p.exportRate+p.fixedElectricity;
  const fees=exported>0 ? (p.feeMode==='annual' ? p.fixedExportFee : exported*p.exportFee) : 0;
  const gas=Math.max(0,p.gas-gasSaved);
  const gasCost=gas*p.gasRate+(gas>0?p.fixedGas:0);
  const publicCharging=(p.evKwh-homeCharging)*p.publicChargingRate;
  // Market trading uses only the cycle budget left after solar shifting.
  const tradingCharge=p.dynamic?Math.max(0,throughput-charged):0;
  const epexCycles=nominalCapacity>0?tradingCharge/nominalCapacity:0;
  const tradingMargin=p.dynamic?EPEX_SPREAD_EUR_PER_KWH*EPEX_ROUND_TRIP_EFFICIENCY:0;
  const trading=tradingCharge*tradingMargin;
  const manual=lines.reduce((n,l)=>n+l.manualBenefit*l.quantity,0);
  const maintenance=lines.reduce((n,l)=>n+l.annualCost*l.quantity,0);
  const supplierCost=electricityCost+fees+gasCost+publicCharging;
  return {demand,production,solarAdded,direct,stored,grid,exported,gas,gasSaved,heatElectricity,homeCharging,capacity,nominalCapacity,charged,solarThroughput,throughput,epexCycles,trading,tradingCharge,tradingMargin,fees,maintenance,manual,supplierCost,netCost:supplierCost-trading-manual+maintenance,selfConsumption:production>0?(direct+stored)/production*100:0,autarky:demand>0?Math.min(100,(direct+stored)/demand*100):0};
}
export function validateEnergyResult(p:Profile, lines:Line[]) {
  const errors:string[]=[];const before=energyState(p,[]);const after=energyState(p,lines);
  const has=(kind:Product['category'])=>lines.some(l=>l.product.category===kind);
  if(!has('heatpump')&&Math.abs(after.gasSaved)>1e-6)errors.push('gas-changed-without-heatpump');
  if(!has('charger')&&Math.abs(after.homeCharging)>1e-6)errors.push('ev-changed-without-charger');
  if(!has('solar')&&after.solarAdded!==0)errors.push('solar-added-without-solar-product');
  if(has('battery')&&!after.production&&!p.dynamic&&(after.trading!==0||after.charged!==0))errors.push('battery-value-without-source');
  if(!p.dynamic&&after.trading!==0)errors.push('trading-without-dynamic-contract');
  if(after.selfConsumption<0||after.selfConsumption>100||after.autarky<0||after.autarky>100)errors.push('percentage-out-of-range');
  if(after.grid<0||after.exported<0||after.production<0||after.demand<0)errors.push('negative-energy-flow');
  if(before.selfConsumption===after.selfConsumption&&before.autarky===after.autarky&&has('battery')&&p.solar>0&&p.exported>0&&after.charged>0)errors.push('battery-has-no-visible-impact');
  return errors;
}
const order={solar:0,heatpump:1,charger:2,battery:3,extra:4};
export function calculateProject(project:Project) {
  const {profile:p}=project;const lines=normalizeLines(project.lines);
  const before=energyState(p,[]);
  const after=energyState(p,lines);
  const withoutBatteries=energyState(p,lines.filter(l=>l.product.category!=='battery'));
  const batteryLines=lines.filter(l=>l.product.category==='battery');
  const solarOptimizationValue=batteryLines.length?withoutBatteries.supplierCost-after.supplierCost:0;
  const epexValue=batteryLines.length?Math.max(0,after.trading-withoutBatteries.trading):0;
  const batteryInvestment=batteryLines.reduce((n,l)=>n+((l.price??0)-Math.min(l.price??0,l.subsidy))*l.quantity,0);
  const batteryAnnualValue=withoutBatteries.netCost-after.netCost;
  const batteryPayback=batteryAnnualValue>0?batteryInvestment/batteryAnnualValue:null;
  const missing=lines.filter(l=>l.price===null);
  const gross=lines.reduce((n,l)=>n+(l.price??0)*l.quantity,0);
  const subsidy=lines.reduce((n,l)=>n+Math.min(l.price??0,l.subsidy)*l.quantity,0);
  const investment=gross-subsidy;
  const annual=before.netCost-after.netCost;
  const valid=missing.length===0&&profileErrors(p).length===0;
  const payback=valid&&lines.length>0&&annual>0 ? investment/annual : null;
  let last=before.netCost;
  const sorted=[...lines].sort((a,b)=>order[a.product.category]-order[b.product.category]);
  const prefix:Line[]=[];
  const contributions=sorted.map(line=>{
    prefix.push(line);
    const current=energyState(p,prefix).netCost;
    const benefit=last-current;
    last=current;
    return {line,benefit,investment:((line.price??0)-Math.min(line.price??0,line.subsidy))*line.quantity};
  });
  let cumulative=-investment;
  const projection25=Array.from({length:26},(_,year)=>{
    if(year>0) cumulative+=annual*Math.pow(1+p.annualInflation/100,year-1)*Math.pow(1-p.annualDegradation/100,year-1);
    return {year,value:cumulative};
  });
  // Preserve the existing 15-year chart contract; expose 25 years separately.
  const projection=projection25.slice(0,16);
  const financed=Math.min(investment,Math.max(0,project.finance.amount));
  const months=Math.max(1,project.finance.years*12);
  const rate=project.finance.rate/1200;
  const monthlyPayment=project.finance.enabled ? (rate===0?financed/months:financed*rate/(1-Math.pow(1+rate,-months))) : 0;
  const monthlySavings=annual/12;
  const oldMonthlyCost=before.netCost/12;
  const newMonthlyCost=after.netCost/12;
  const benefit25Years=projection25[25].value;
  const financeCost=project.finance.enabled?monthlyPayment*months-financed:0;
  const validation=validateEnergyResult(p,lines);
  return {before,after,withoutBatteries,missing,gross,subsidy,investment,annual,payback,valid:valid&&validation.length===0,validation,contributions,projection,projection25,benefit25Years,benefit25YearsAfterFinance:benefit25Years-financeCost,monthlySavings,oldMonthlyCost,newMonthlyCost,monthlyCostIncludingFinance:newMonthlyCost+monthlyPayment,financed,monthlyPayment,loanTotal:monthlyPayment*months,monthlyNet:annual/12-monthlyPayment,batteryOptimization:{solarValue:solarOptimizationValue,epexValue,totalAnnualValue:batteryAnnualValue,extraSelfConsumption:after.stored-withoutBatteries.stored,valuePerKwh:after.stored>0?solarOptimizationValue/after.stored:0,operatingAdjustment:batteryAnnualValue-solarOptimizationValue-epexValue,investment:batteryInvestment,payback:batteryPayback}};
}
// Validate imported and persisted data before it reaches either forms or calculations.
export function parseProject(raw:unknown): Project {  if(!raw||typeof raw!=='object') throw new Error('invalid');
  const p=raw as Project;
  const finite=(x:unknown,min=0,max=1e8)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
  if(p.version!==1 || !p.profile || !p.customer || !p.finance || !Array.isArray(p.lines) || !Array.isArray(p.customProducts) || p.lines.length>MAX_LINES || p.customProducts.length>300) throw new Error('invalid');
  const numberKeys=['electricity','solar','exported','electricityRate','exportRate','exportFee','fixedExportFee','fixedElectricity','gas','gasRate','fixedGas','evKwh','publicChargingRate','solarYield','solarDirect','usableBattery','batteryEfficiency','batteryCycles','lowRate','highRate','scop','hybridCoverage','gasHeat','annualInflation','annualDegradation'] as const;
  if(numberKeys.some(k=>!finite(p.profile[k])) || typeof p.profile.dynamic!=='boolean' || typeof p.profile.netMetering!=='boolean' || !['kwh','annual'].includes(p.profile.feeMode)) throw new Error('invalid');
  if(p.profile.solarDirect>100 || p.profile.usableBattery>100 || p.profile.batteryEfficiency>100 || p.profile.hybridCoverage>100 || p.profile.annualDegradation>100 || p.profile.annualInflation>20 || p.profile.batteryCycles>365 || p.profile.scop<.1 || p.profile.scop>10 || p.profile.usableBattery<1 || p.profile.batteryEfficiency<1) throw new Error('invalid');
  const productValid=(v:Product)=>v && ['battery','solar','heatpump','charger','extra'].includes(v.category) && typeof v.id==='string' && v.id.length>0 && typeof v.name==='string' && v.name.length>0 && typeof v.brand==='string' && (v.nameEn===undefined||typeof v.nameEn==='string') && (v.price===null||finite(v.price)) && finite(v.vat,0,100) && ['inclusive','exclusive'].includes(v.priceBasis) && ['capacity','panels','watts','subsidy','phase'].every(k=>v[k as keyof Product]===undefined||finite(v[k as keyof Product])) && (v.heating===undefined||['hybrid','electric'].includes(v.heating)) && (v.power===undefined||typeof v.power==='string') && (v.connection===undefined||typeof v.connection==='string');
  if(p.customProducts.some(v=>!productValid(v))||p.lines.some(l=>!l||!productValid(l.product)||typeof l.id!=='string'||!finite(l.quantity,1,MAX_UNITS)||!Number.isInteger(l.quantity)||(l.price!==null&&!finite(l.price))||!finite(l.subsidy)||!finite(l.annualCost)||!finite(l.manualBenefit))) throw new Error('invalid');
  if(new Set(p.customProducts.map(v=>v.id)).size!==p.customProducts.length) throw new Error('invalid');
  if(['name','address','email','adviser','date','notes'].some(k=>typeof p.customer[k as keyof Project['customer']]!=='string')) throw new Error('invalid');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.customer.date) || Number.isNaN(new Date(p.customer.date).getTime())) throw new Error('invalid');
  if(typeof p.finance.enabled!=='boolean'||!finite(p.finance.amount)||!finite(p.finance.rate,0,30)||!finite(p.finance.years,1,30)||!Number.isInteger(p.finance.years)) throw new Error('invalid');
  const normalized=normalizeProject(p);
  if(new Set(normalized.lines.map(l=>l.id)).size!==normalized.lines.length) throw new Error('invalid');
  return normalized;
}
