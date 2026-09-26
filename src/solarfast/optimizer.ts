import {catalog,grossPrice} from './catalog';
import {calculateProject,normalizeLines,normalizeProject,profileErrors} from './engine';
import type {Line,Product,Project,Profile} from './types';

export type Goal='solar'|'battery'|'heatpump'|'charger';
export type AdvicePreference='return'|'balance'|'independence';
export type AdviceScenario={products:Product[];lines:Line[];investment:number;annual:number;roi:number;score:number;futureValue:number;independence:number;sustainability:number;sizing:number;comfort:number;payback:number|null;eligible:boolean;reason:string;increments:{category:Goal;investment:number;annual:number;roi:number;payback:number|null}[];result:ReturnType<typeof calculateProject>};
export function rankAdviceScenarios(scenarios:AdviceScenario[],preference:AdvicePreference):AdviceScenario[]{
 const independence=(s:AdviceScenario)=>s.result.after.autarky/100*.6+s.sustainability*.2+s.sizing*.15+Math.min(1,Math.max(0,s.roi)/.12)*.05;
 const stable=(a:AdviceScenario,b:AdviceScenario)=>a.investment-b.investment||a.products.map(p=>p.id).join().localeCompare(b.products.map(p=>p.id).join());
 return [...scenarios].sort((a,b)=>Number(b.eligible)-Number(a.eligible)||(preference==='balance'?b.score-a.score:preference==='independence'?independence(b)-independence(a):b.roi-a.roi||b.sizing-a.sizing||b.sustainability-a.sustainability)||stable(a,b));
}
// Compare one module while keeping every other quoted line and price unchanged.
export function moduleAlternatives(scenarios:AdviceScenario[],lines:Line[],category:Goal,preference:AdvicePreference){
 const other=lines.filter(l=>l.product.category!==category);
 return rankAdviceScenarios(scenarios.filter(s=>{
  const unchanged=s.lines.filter(l=>l.product.category!==category);
  return unchanged.length===other.length&&other.every(l=>unchanged.some(q=>JSON.stringify(q)===JSON.stringify(l)));
 }),preference);
}
export type Answers=Record<string,any>;
const number=(value:unknown,fallback:number)=>value===undefined||value===null||value===''?fallback:Number(value);
const suppliedNumber=(value:unknown,{positive=false}:{positive?:boolean}={})=>value!==undefined&&value!==null&&value!==''&&Number.isFinite(Number(value))&&(!positive||Number(value)>0);
export function adviceInputErrors(a:Answers,goals:Goal[]):string[]{
 const errors:string[]=[];
 const currentYear=new Date().getFullYear();
 if(goals.includes('solar')&&(!a.home||!a.direction||!suppliedNumber(a.roofArea,{positive:true})||!suppliedNumber(a.electricity,{positive:true})||!suppliedNumber(a.solar)||!a.dayHome||!a.contract||!suppliedNumber(a.electricityRate,{positive:true})||!['yes','no'].includes(a.hasBattery)))errors.push('solar-input');
 if(goals.includes('battery')&&(!suppliedNumber(a.electricity,{positive:true})||!suppliedNumber(a.solar)||!suppliedNumber(a.exported)||!suppliedNumber(a.fixedExportFee)||!suppliedNumber(a.exportRate)||!suppliedNumber(a.electricityRate,{positive:true})||!a.contract||!a.dayHome||typeof a.backup!=='boolean'))errors.push('battery-input');
 const validYear=Number.isInteger(Number(a.year))&&Number(a.year)>=1800&&Number(a.year)<=currentYear;
 if(goals.includes('heatpump')&&(!a.home||!validYear||!a.insulation||!suppliedNumber(a.area,{positive:true})||!suppliedNumber(a.gas,{positive:true})||!a.heatingSystem))errors.push('heatpump-input');
 if(goals.includes('charger')&&(!a.evType||a.evType==='none'||!suppliedNumber(a.chargingDemand,{positive:true})||!a.energyLink||!suppliedNumber(a.electricityRate,{positive:true})||!suppliedNumber(a.publicChargingRate,{positive:true})))errors.push('charger-input');
 return errors;
}
export function adviceProfile(project:Project,a:Answers,goals:Goal[]):Profile {
 const p=project.profile;
 const hasSolar=a.hasSolar==='yes';
 const gasFromHeatDemand=number(a.heatDemand,0)>0?number(a.heatDemand,0)/Math.max(.1,p.gasHeat):undefined;
 return {...p,
  electricity:number(a.electricity,p.electricity),
  solar:hasSolar?number(a.solarYieldInput??a.solar,p.solar):0,
  exported:hasSolar?number(a.exported,p.exported):0,
  electricityRate:number(a.electricityRate,p.electricityRate),
  exportRate:number(a.exportRate,p.exportRate),exportFee:number(a.exportFee,p.exportFee),
  feeMode:a.feeMode??p.feeMode,fixedExportFee:number(a.fixedExportFee,p.fixedExportFee),
  lowRate:number(a.lowRate,p.lowRate),highRate:number(a.highRate,p.highRate),
  batteryCycles:number(a.batteryCycles,p.batteryCycles),dynamic:a.contract==='dynamic',
  gas:gasFromHeatDemand??number(a.gas,p.gas),gasRate:number(a.gasRate,p.gasRate),
  solarYield:(a.direction==='north'?700:a.direction==='ew'?850:900)*(a.shade==='much'?.72:a.shade==='some'?.86:1),
  solarDirect:a.dayHome==='often'?55:a.dayHome==='no'?20:35,
  publicChargingRate:number(a.publicChargingRate,p.publicChargingRate),
  evKwh:goals.includes('charger')?(a.evType==='none'?0:number(a.chargingDemand,number(a.km,0)*number(a.evConsumption,18)/100*number(a.cars,1))):p.evKwh,
 };
}
export function candidateProducts(goal:Goal,a:Answers,project:Project):Product[]{
 const products=[...catalog.filter(p=>!project.customProducts.some(c=>c.id===p.id)),...project.customProducts];
 return products.filter(p=>{
  if(p.category!==goal||grossPrice(p)===null)return false;
  if(goal==='battery')return p.brand.toLowerCase()==='hyxipower'&&p.phase===number(a.phase,3)&&!!p.backup===!!a.backup;
  if(goal==='solar')return (p.panels??0)<=Math.floor(number(a.roofArea,number(a.area,110)*(a.home==='apartment'?.2:a.home==='detached'?.45:.3))/2.2)&&p.connection===(a.connection??'Stringomvormer');
  if(goal==='charger')return p.phase===number(a.phase,3);
  const constructionYear=number(a.year,0);
  const inferredTemperature=a.heatingSystem==='floor'?40:a.heatingSystem==='hybrid'?50:60;
  const lowTemperature=number(a.cvTemp,inferredTemperature)<=50;
  const suitableEmitters=a.floorheat??(a.heatingSystem==='floor'||a.heatingSystem==='hybrid'||a.radiators!==false);
  const electricSuitable=['good','verygood'].includes(a.insulation)&&lowTemperature&&suitableEmitters&&(constructionYear>=1992||a.insulation==='verygood');
  if(p.heating==='electric'&&!electricSuitable)return false;
  if(a.hpMode&&a.hpMode!=='auto'&&p.heating!==a.hpMode)return false;
  // Annual-demand screening only: a heat-loss survey still determines final sizing.
  const annualHeat=number(a.heatDemand,0)>0?number(a.heatDemand,0):number(a.gas,project.profile.gas)*project.profile.gasHeat;
  const required=annualHeat/2000*(p.heating==='hybrid'?project.profile.hybridCoverage/100:1);
  const rated=Math.max(...(p.power??'0').split(/[^0-9.]+/).filter(Boolean).map(Number));
  return rated>=required;
 });
}
function productLine(product:Product,project:Project):Line{
 const existing=project.lines.find(l=>l.product.id===product.id);
 return existing?{...existing}:{id:product.id,product,quantity:1,price:grossPrice(product),subsidy:product.subsidy??0,annualCost:0,manualBenefit:0};
}
const fit=(actual:number,target:number)=>actual>0&&target>0?Math.min(actual,target)/Math.max(actual,target):0;
const ratedPower=(product:Product)=>Math.max(...(product.power??'0').split(/[^0-9.]+/).filter(Boolean).map(Number));
export function optimizeAdvice(project:Project,a:Answers,requested:Goal[]){
 project=normalizeProject(project);
 const goals=([...new Set(requested)]).sort((x,y)=>['solar','heatpump','charger','battery'].indexOf(x)-['solar','heatpump','charger','battery'].indexOf(y));
 const profile=adviceProfile(project,a,goals);
 const errors=[...profileErrors(profile),...adviceInputErrors(a,goals)];
 if(!Number.isFinite(profile.electricity)||profile.electricity<0||profile.solar<0||profile.exported<0)errors.push('input');
 if(profile.solar-profile.exported>profile.electricity)errors.push('direct-exceeds-demand');
 // Product-input validation lives in adviceInputErrors so the form and engine
 // use exactly the same field names and required-data rules.
 // A heating preference scopes the initial recommendation, but must not hide
 // technically suitable alternatives from the final configurator.
 const sets=goals.map(g=>candidateProducts(g,{...a,hpMode:'auto'},project));
 const unavailable=goals.filter((_,i)=>sets[i].length===0);
 const scenarios:AdviceScenario[]=[];
 const extras=project.lines.filter(l=>l.product.category==='extra');
 function visit(index:number,products:Product[]){
  if(index<sets.length){for(const product of sets[index])visit(index+1,[...products,product]);return;}
  if(!products.length)return;
  if(products.some(p=>p.connection==='Panelen op batterij')&&!products.some(p=>p.category==='battery')&&a.hasBattery!=='yes')return;
  const lines=normalizeLines([...products.map(p=>{
   const existing=project.lines.find(l=>l.product.category===p.category);
   // A module is one configured system. Swapping its product keeps negotiated
   // values only when it is the same product; it never carries duplicate units.
   return existing?.product.id===p.id?{...existing,quantity:1}:{...productLine(p,{...project,lines:[]}),id:existing?.id??p.id,quantity:1};
  }),...extras]);
  const result=calculateProject({...project,profile,lines});
  if(!result.valid||result.investment<=0)return;
  // Marginal value: removing a category must cost more in benefits than it
  // saves in investment. This catches an uneconomic add-on hidden by good PV ROI.
  const increments=products.map(product=>{
   const without=calculateProject({...project,profile,lines:lines.filter(l=>l.product.category!==product.category)});
   const investment=result.investment-without.investment;
   const annual=result.annual-without.annual;
   return {category:product.category as Goal,investment,annual,roi:investment>0?annual/investment:0,payback:annual>0?investment/annual:null};
  });
  const roi=result.annual/result.investment;
  // Keep long-term value and energy independence available for comparisons.
  // The default balanced recommendation is scored explicitly below.
  const futureValue=Math.max(0,(result.benefit25Years+result.investment)/25-result.annual)/result.investment;
  const independence=Math.max(0,result.after.autarky-result.before.autarky)/100;
  // Transparent fit scores prevent a high-price or maximum-capacity product
  // from winning when a smaller product meets the same household need.
  const sizingScores=products.map(product=>{
   const candidates=sets[goals.indexOf(product.category as Goal)];
   if(product.category==='battery'){
    const shift=Math.min(result.withoutBatteries.exported/365,result.withoutBatteries.grid/365)/Math.max(.01,profile.usableBattery/100);
    const capacities=candidates.map(p=>p.capacity??0).filter(Boolean);
    const target=capacities.reduce((best,value)=>Math.abs(value-shift)<Math.abs(best-shift)?value:best,capacities[0]??product.capacity??1);
    return fit(product.capacity??0,target);
   }
   if(product.category==='solar'){
    const desiredPanels=Math.max(1,(result.after.demand-profile.solar)/(Math.max(1,product.watts??475)/1000*profile.solarYield));
    const counts=candidates.map(p=>p.panels??0).filter(Boolean);
    const target=counts.reduce((best,value)=>Math.abs(value-desiredPanels)<Math.abs(best-desiredPanels)?value:best,counts[0]??product.panels??1);
    return fit(product.panels??0,target);
   }
   if(product.category==='heatpump'){
    const required=profile.gas*profile.gasHeat/2000*(product.heating==='hybrid'?profile.hybridCoverage/100:1);
    const adequate=candidates.filter(p=>p.heating===product.heating).map(ratedPower).filter(power=>power>=required).sort((x,y)=>x-y);
    return fit(ratedPower(product),adequate[0]??ratedPower(product));
   }
   return 1;
  });
  const sizing=sizingScores.reduce((sum,value)=>sum+value,0)/Math.max(1,sizingScores.length);
  const avoidedCarbon=Math.max(0,result.before.grid-result.after.grid)*.268+Math.max(0,result.after.gasSaved)*1.79+Math.max(0,result.after.exported-result.before.exported)*.1;
  const sustainability=Math.min(1,avoidedCarbon/5000);
  const comfortScores=products.map(product=>product.category==='heatpump'?(product.heating==='electric'?1:.9):product.category==='charger'?(profile.evKwh>0?1:.25):1);
  const comfort=comfortScores.reduce((sum,value)=>sum+value,0)/Math.max(1,comfortScores.length);
  const score=Math.min(1,Math.max(0,roi)/.12)*.45+sustainability*.25+sizing*.2+comfort*.1;
  // Selected modules are requirements. Evaluate payback for the whole plan;
  // keep marginal economics for transparent advice, never silently drop a module.
  const necessary=products.every(product=>product.category==='charger'?profile.evKwh>0:product.category==='heatpump'?profile.gas>0:product.category==='battery'?(result.withoutBatteries.exported>0||profile.dynamic):true);
  const wellSized=sizingScores.every(value=>value>=.65);
  const eligible=necessary&&wellSized&&result.annual>0&&result.payback!==null&&result.payback<=25;
  const euro=(n:number)=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  const reason=eligible?`Passend totaalplan: ${euro(result.investment)} investering, ${euro(result.annual)} voordeel per jaar en ${result.payback!.toLocaleString('nl-NL',{maximumFractionDigits:1})} jaar terugverdientijd. De score combineert rendement, duurzaamheid, maatvoering en comfort.`:!necessary?'Een gekozen module heeft met deze invoer nog geen functie in de woning.':!wellSized?'Deze combinatie is groter dan de berekende woningbehoefte.':'Het complete energieplan verdient de investering niet binnen 25 jaar terug.';
  scenarios.push({products,lines,investment:result.investment,annual:result.annual,roi,score,futureValue,independence,sustainability,sizing,comfort,payback:result.payback,eligible,reason,increments,result});
 }
 if(!errors.length&&goals.length)visit(0,[]);
 const sorted=rankAdviceScenarios(scenarios,'return');
 scenarios.splice(0,scenarios.length,...sorted);
 const viable=scenarios.filter(s=>s.eligible);
 const preferred=viable.filter(s=>!goals.includes('heatpump')||!a.hpMode||a.hpMode==='auto'||s.products.some(p=>p.category==='heatpump'&&p.heating===a.hpMode));
 const variants={return:rankAdviceScenarios(preferred,'return')[0],balance:rankAdviceScenarios(preferred,'balance')[0],independence:rankAdviceScenarios(preferred,'independence')[0]};
 const overallVariants={return:rankAdviceScenarios(viable,'return')[0],balance:rankAdviceScenarios(viable,'balance')[0],independence:rankAdviceScenarios(viable,'independence')[0]};
 const best=variants.balance;

 // Keep the existing comparison API; each scenario now contains every goal.
 const comparisonCategories=(best??scenarios[0])?.products.map(p=>p.category)??[];
 const comparisonScenarios=scenarios.filter(s=>s.products.length===comparisonCategories.length&&s.products.every(p=>comparisonCategories.includes(p.category)));
 const batteryComparison=scenarios.filter(s=>s.products.some(p=>p.category==='battery')&&(!best||best.products.filter(p=>p.category!=='battery').every(p=>s.products.some(q=>q.id===p.id)))).map(s=>({
  capacity:s.lines.filter(l=>l.product.category==='battery').reduce((sum,l)=>sum+(l.product.capacity??0)*l.quantity,0),
  ...s.result.batteryOptimization,
  extraInvestment:s.increments.find(i=>i.category==='battery')!.investment,
  extraAnnualSavings:s.increments.find(i=>i.category==='battery')!.annual,
  extraRoi:s.increments.find(i=>i.category==='battery')!.roi,
  recommended:s===best,
 }));
 return {profile,errors,unavailable,scenarios:comparisonScenarios,allScenarios:scenarios,batteryComparison,best,variants,overallVariants,
  closingReason:best?`Door nu te investeren voorkomt u toekomstige energiekosten. Bij de ingevulde aannames bespaart u ongeveer ${Math.round(best.annual/12).toLocaleString('nl-NL')} euro per maand; dit is een prognose.`:undefined};
}
