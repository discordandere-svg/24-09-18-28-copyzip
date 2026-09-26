import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,grossPrice,emptyProject} from './catalog.ts';
import {addProduct,calculateProject,energyState,normalizeLines,parseProject,profileErrors,EPEX_ROUND_TRIP_EFFICIENCY,EPEX_SPREAD_EUR_PER_KWH,epexCyclesForCapacity} from './engine.ts';
import type {Line,Product} from './types.ts';
import {optimizeAdvice as optimizeAdviceRaw,candidateProducts,adviceProfile,moduleAlternatives,rankAdviceScenarios} from './optimizer.ts';
function line(p:Product,overrides:Partial<Line>={}):Line{return {id:p.id,product:p,quantity:1,price:grossPrice(p),subsidy:p.subsidy??0,annualCost:0,manualBenefit:0,...overrides};}
const bat=catalog.find(p=>p.category==='battery'&&p.capacity===15.9&&p.backup)!;
const solar=catalog.find(p=>p.id==='solar-1-10')!;
const hp=catalog.find(p=>p.id==='hp-3')!;
const charger=catalog.find(p=>p.id==='zaptec-3')!;
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const completeInputs={home:'terrace',year:1995,insulation:'good',area:130,gas:1550,heatingSystem:'floor',roofArea:45,direction:'south',electricity:4500,solar:5000,exported:3000,dayHome:'sometimes',contract:'dynamic',electricityRate:.28,fixedExportFee:0,exportRate:.07,hasBattery:'no',backup:false,evType:'ev',chargingDemand:2000,energyLink:'none',publicChargingRate:.5};
const optimizeAdvice=(project:any,answers:any,goals:any)=>optimizeAdviceRaw(project,{...completeInputs,...answers},goals);
test('optimizer exposes a highest-return variant and recommends a well-sized balanced battery',()=>{
 const p=emptyProject();
 const a={hasSolar:'yes',solar:5000,exported:1900,electricity:3609,contract:'dynamic',phase:3,backup:false,exportRate:.07,exportFee:.1};
 const result=optimizeAdvice(p,a,['battery']);
 assert.equal(result.scenarios.length,4);
 assert.ok(result.best);
 for(const s of result.scenarios){
  close(s.roi,s.annual/s.investment);
  assert.ok(result.variants.return!.roi>=s.roi||!s.eligible);
  assert.ok(s.products.every(p=>p.category==='battery'&&p.brand==='HYXiPOWER'&&!p.backup&&p.phase===3));
  const applied=calculateProject({...p,profile:result.profile,lines:s.lines});
  close(applied.annual,s.annual);
 }
 assert.equal(result.best,result.variants.balance);
 assert.ok((result.best!.products[0].capacity??Infinity)<Math.max(...result.scenarios.map(s=>s.products[0].capacity??0)));
});
test('optimizer uses edited tariffs and honors exact zero inputs',()=>{
 const p=emptyProject();
 const a={hasSolar:'yes',solar:5000,exported:1900,electricity:3609,contract:'fixed',phase:3,backup:false,electricityRate:0,exportRate:0,exportFee:0};
 const zero=optimizeAdvice(p,a,['battery']);
 assert.equal(zero.best,undefined);
 assert.ok(zero.scenarios.every(s=>s.annual===0&&s.result.after.trading===0));
 const priced=optimizeAdvice(p,{...a,electricityRate:.4,exportFee:.2},['battery']);
 assert.ok(priced.best);
 assert.equal(priced.profile.electricityRate,.4);
 assert.equal(priced.profile.exportFee,.2);
 const noExport=adviceProfile(p,{...a,solar:0,exported:0,electricity:0},['battery']);
 assert.equal(noExport.solar,0);assert.equal(noExport.exported,0);assert.equal(noExport.electricity,0);
});
test('joint optimizer exhaustively ranks chosen combinations without injecting modules',()=>{
 const p=emptyProject();const a={hasSolar:'no',contract:'dynamic',phase:3,backup:false,roofArea:45,connection:'Stringomvormer'};
 const combined=optimizeAdvice(p,a,['solar','battery']);
 assert.equal(combined.scenarios.length,candidateProducts('solar',a,p).length*candidateProducts('battery',a,p).length);
 assert.ok(combined.best);
 assert.equal(combined.best,combined.variants.balance);
 assert.equal(combined.variants.return,rankAdviceScenarios(combined.allScenarios.filter(s=>s.eligible),'return')[0]);
 assert.deepEqual(new Set(combined.best!.products.map(p=>p.category)),new Set(['solar','battery']));
 const reversed=optimizeAdvice(p,a,['battery','solar']);
 close(combined.best!.annual,reversed.best!.annual);
});
test('fixed contract has no EPEX return and fixed fees remain fixed',()=>{
 const p=emptyProject();p.profile={...p.profile,dynamic:false,lowRate:.4,highRate:.2,feeMode:'annual',fixedExportFee:250};
 const result=calculateProject({...p,lines:[line(bat)]});
 assert.equal(result.after.trading,0);
 assert.equal(result.after.fees,250);
 assert.equal(result.before.fees,250);
 assert.ok(result.after.charged<=result.after.capacity*250);
 close(result.after.selfConsumption,(result.after.direct+result.after.stored)/result.after.production*100);
});
test('all-electric suitability and phase/backup compatibility constrain ROI search',()=>{
 const p=emptyProject();
 const a={hasSolar:'no',home:'terrace',year:1995,heatingSystem:'boiler',gas:1550,hpMode:'electric',insulation:'poor',cvTemp:70,radiators:true};
 assert.equal(optimizeAdvice(p,a,['heatpump']).best,undefined);
 assert.ok(candidateProducts('heatpump',{...a,insulation:'good',cvTemp:40,floorheat:true},p).length>0);
 assert.equal(candidateProducts('battery',{phase:1,backup:true},p).length,0);
});
test('heat pump advice requires only the six visible home fields and no hidden temperature field',()=>{
 const p=emptyProject();
 const complete={home:'terrace',year:1995,insulation:'good',area:130,heatingSystem:'floor',gas:1550};
 for(const key of ['home','year','insulation','area','heatingSystem','gas'] as const){
  const incomplete:Record<string,unknown>={...complete};delete incomplete[key];
  assert.ok(optimizeAdviceRaw(p,incomplete,['heatpump']).errors.includes('heatpump-input'),`missing ${key}`);
 }
 const result=optimizeAdviceRaw(p,complete,['heatpump']);
 assert.deepEqual(result.errors,[]);
 assert.ok(result.allScenarios.length>0);
 assert.equal(result.profile.gas,1550);
});
test('charger ROI uses entered vehicle use and public/home rates; gas unchanged',()=>{
 const p=emptyProject();const a={hasSolar:'no',evType:'ev',km:10000,evConsumption:20,cars:1,electricityRate:.25,publicChargingRate:.5,phase:3};
 const result=optimizeAdvice(p,a,['charger']);
 assert.ok(result.best);close(result.best!.annual,500);
 close(result.best!.result.after.gas,result.best!.result.before.gas);
});
test('re-optimization canonicalizes duplicate batteries and preserves the current negotiated product price',()=>{
 const p=emptyProject();const batteries=catalog.filter(p=>p.category==='battery'&&p.brand==='HYXiPOWER'&&p.phase===3&&!p.backup);
 p.lines=[line(batteries[0],{id:'first',quantity:2,price:6100}),line(batteries[1],{id:'second',price:7000})];
 const r=optimizeAdvice(p,{hasSolar:'yes',phase:3,contract:'dynamic',backup:false},['battery']);
 assert.ok(r.best);
 for(const s of r.scenarios){
  assert.equal(s.lines.length,1);
  assert.equal(s.lines[0].quantity,1);
  assert.equal(s.lines[0].id,'second');
  assert.equal(new Set(s.lines.map(l=>l.id)).size,s.lines.length);
  if(s.products[0].id===batteries[1].id)assert.equal(s.lines[0].price,7000);
 }
});
test('complete supplied catalogue and exact gross price conversions',()=>{
 assert.equal(catalog.length,109);
 assert.equal(catalog.filter(p=>p.category==='battery').length,25);
 assert.equal(catalog.filter(p=>p.category==='solar').length,68);
 assert.equal(catalog.filter(p=>p.category==='heatpump').length,14);
 assert.equal(new Set(catalog.map(p=>p.id)).size,catalog.length);
 assert.equal(grossPrice(charger),2299);
 assert.equal(grossPrice(hp),9232.54);
 close(grossPrice(hp)!-hp.subsidy!,8107.54);
 assert.equal(catalog.find(p=>p.id==='solar-3-20')?.price,7200);
 assert.equal(catalog.find(p=>p.id==='solar-0-4')?.price,null);
});
test('empty plan has no investment, saving or payback',()=>{const r=calculateProject(emptyProject());assert.equal(r.annual,0);assert.equal(r.investment,0);assert.equal(r.payback,null);});
test('an extra cost changes total payback without inventing savings',()=>{const p=emptyProject();p.lines=[line(bat)];const a=calculateProject(p);p.lines.push(line({id:'labour',name:'Labour',brand:'SolarFast',category:'extra',price:1500,vat:21,priceBasis:'inclusive'}));const b=calculateProject(p);close(b.annual,a.annual);close(b.investment,a.investment+1500);assert.ok(b.payback!>a.payback!);assert.equal(b.contributions[1].benefit,0);});
test('charger requires charging demand and a quantity multiplier cannot duplicate the system',()=>{const p=emptyProject();p.lines=[line(charger)];assert.equal(calculateProject(p).annual,0);p.profile.evKwh=2000;p.profile.solar=0;p.profile.exported=0;const a=calculateProject(p);close(a.annual,2000*(.5-.28));p.lines[0].quantity=2;const b=calculateProject(p);close(b.annual,a.annual);close(b.investment,a.investment);});
test('hybrid heat pump replaces a bounded fraction of gas and adds electricity',()=>{const p=emptyProject();p.profile.solar=0;p.profile.exported=0;p.lines=[line(hp)];const r=calculateProject(p);const saved=p.profile.gas*p.profile.hybridCoverage/100;close(r.after.gasSaved,saved);close(r.after.heatElectricity,saved*p.profile.gasHeat/p.profile.scop);close(r.annual,saved*1.45-saved*p.profile.gasHeat/p.profile.scop*.28);p.lines[0].quantity=2;close(calculateProject(p).after.gasSaved,saved);});
test('full-electric eliminates gas connection cost once',()=>{const p=emptyProject();p.lines=[line(catalog.find(p=>p.id==='hp-0')!)];const a=calculateProject(p);assert.equal(a.after.gas,0);p.lines[0].quantity=2;close(calculateProject(p).annual,a.annual);});
test('solar panels add energy and price; every prefix contribution reconciles',()=>{const p=emptyProject();p.profile.evKwh=1800;p.lines=[line(charger),line(bat),line(hp),line(solar)];const r=calculateProject(p);close(r.after.solarAdded,10*.475*850);close(r.contributions.reduce((n,c)=>n+c.benefit,0),r.annual);close(r.contributions.reduce((n,c)=>n+c.investment,0),r.investment);close(r.payback!,r.investment/r.annual);const reversed=calculateProject({...p,lines:[...p.lines].reverse()});close(r.annual,reversed.annual);});
test('energy balances and shared solar/trading cycle budget hold across scenarios',()=>{
 for(const generation of [0,1000,5000,10000])for(const consumption of [0,1000,10000])for(const dynamic of [false,true]){
 const p=emptyProject();p.profile.solar=generation;p.profile.exported=generation;p.profile.electricity=consumption;p.profile.dynamic=dynamic;p.lines=[line(bat),line(hp),line(solar)];
 const s=energyState(p.profile,p.lines);close(s.direct+s.stored+s.grid,s.demand);close(s.direct+s.charged+s.exported,s.production);assert.ok(s.charged<=s.throughput+1e-6);assert.ok(s.autarky<=100+1e-6);assert.ok(s.selfConsumption<=100+1e-6);
 close(s.trading,s.tradingCharge*EPEX_SPREAD_EUR_PER_KWH*EPEX_ROUND_TRIP_EFFICIENCY);
 assert.ok(s.charged+s.tradingCharge<=s.throughput+1e-6);
 }
});
test('net metering and zero tariffs are honoured, without silently replacing zero',()=>{const p=emptyProject();p.profile.gas=0;p.profile.netMetering=true;p.profile.exportFee=0;p.lines=[line(bat)];const a=calculateProject(p);assert.ok(a.annual<=0);p.profile.electricityRate=0;p.profile.exportRate=0;assert.equal(calculateProject(p).annual,0);});
test('missing prices block payback, zero and negative benefit remain honest',()=>{const p=emptyProject();p.lines=[line(bat,{price:null})];const r=calculateProject(p);assert.equal(r.valid,false);assert.equal(r.payback,null);p.lines=[line(bat,{annualCost:50000})];assert.ok(calculateProject(p).annual<0);assert.equal(calculateProject(p).payback,null);p.lines=[line(bat,{price:1,subsidy:0})];assert.ok(calculateProject(p).payback!<1);});
test('system subsidies apply once and remain bounded by gross price',()=>{const p=emptyProject();p.lines=[line(hp,{quantity:2,price:1000,subsidy:1500})];const r=calculateProject(p);assert.equal(r.subsidy,1000);assert.equal(r.investment,0);});
test('0% financing, borrowing cap and zero-inflation projection',()=>{const p=emptyProject();p.profile.annualInflation=0;p.lines=[line(bat)];p.finance={enabled:true,amount:100000,rate:0,years:10};const r=calculateProject(p);close(r.financed,r.investment);close(r.monthlyPayment,r.investment/120);close(r.loanTotal,r.investment);close(r.projection[10].value,r.annual*10-r.investment);p.finance.rate=4;assert.ok(calculateProject(p).loanTotal>r.investment);});
test('duplicate modules are repaired to the latest single system, including legacy quantities',()=>{const p=emptyProject();const other=catalog.find(x=>x.id==='hp-0')!;const normalized=normalizeLines([line(hp),line(bat),line(other,{id:'latest',quantity:2})]);assert.equal(normalized.length,2);assert.equal(normalized.filter(l=>l.product.category==='heatpump').length,1);assert.equal(normalized.find(l=>l.product.category==='heatpump')!.product.id,other.id);assert.equal(normalized.find(l=>l.product.category==='heatpump')!.quantity,1);const imported=parseProject({...p,lines:[line(hp),line(other,{id:'latest'})]});assert.equal(imported.lines.length,1);assert.equal(imported.lines[0].product.id,other.id);});
test('rapid repeated product actions are idempotent and replace one module atomically',()=>{let p=emptyProject();p=addProduct(p,hp).project;p=addProduct(p,hp).project;p=addProduct(p,bat).project;p=addProduct(p,bat).project;assert.deepEqual(p.lines.map(l=>l.product.category),['heatpump','battery']);assert.ok(p.lines.every(l=>l.quantity===1));const other=catalog.find(x=>x.id==='hp-0')!;const replaced=addProduct(p,other);assert.equal(replaced.project.lines.length,2);assert.equal(replaced.project.lines.filter(l=>l.product.category==='heatpump').length,1);assert.equal(replaced.project.lines.find(l=>l.product.category==='heatpump')!.product.id,other.id);});
test('import/export round trip and invalid inputs are handled',()=>{const p=emptyProject();p.lines=[line(bat)];assert.equal(JSON.stringify(parseProject(JSON.parse(JSON.stringify(p)))),JSON.stringify(p));assert.throws(()=>parseProject({}));assert.throws(()=>parseProject({...p,profile:{...p.profile,scop:0}}));assert.throws(()=>parseProject({...p,lines:[line(bat,{quantity:-1})]}));assert.equal(parseProject({...p,lines:[line(bat),line(bat)]}).lines.length,1);p.profile.exported=p.profile.solar+1;assert.deepEqual(profileErrors(p.profile),['solar']);assert.equal(calculateProject(p).valid,false);});
test('existing solar is baseline context for a battery, without adding a solar product',()=>{const p=emptyProject();p.profile.solar=5000;p.profile.exported=3000;p.profile.electricity=4500;const before=energyState(p.profile,[]);p.lines=[line(bat)];const after=energyState(p.profile,p.lines);assert.equal(after.solarAdded,0);assert.equal(after.gas,before.gas);assert.ok(after.exported<before.exported);assert.ok(after.selfConsumption>before.selfConsumption);});
test('a battery without solar cannot create solar independence',()=>{const p=emptyProject();p.profile.solar=0;p.profile.exported=0;p.profile.electricity=4500;p.lines=[line(bat)];const r=calculateProject(p);assert.equal(r.after.production,0);assert.equal(r.after.charged,0);assert.equal(r.after.autarky,0);assert.equal(r.after.grid,4500);});
test('a solar advice adds generation only; charger does not save gas',()=>{const p=emptyProject();p.profile.solar=0;p.profile.exported=0;p.profile.gas=1550;p.lines=[line(solar),line(charger)];p.profile.evKwh=2000;const r=calculateProject(p);assert.equal(r.after.gasSaved,0);assert.ok(r.after.solarAdded>0);assert.equal(r.after.heatElectricity,0);assert.equal(r.after.homeCharging,2000);});
test('battery value is split into solar optimisation and EPEX without double counting',()=>{const p=emptyProject();p.profile.solar=6000;p.profile.exported=3000;p.profile.electricity=4500;p.profile.dynamic=true;p.lines=[line(bat)];const r=calculateProject(p);assert.ok(r.batteryOptimization.solarValue>0);assert.ok(r.batteryOptimization.epexValue>=0);close(r.batteryOptimization.totalAnnualValue,r.batteryOptimization.solarValue+r.batteryOptimization.epexValue);});
test('battery EPEX is zero without a dynamic contract',()=>{const p=emptyProject();p.profile.solar=6000;p.profile.exported=3000;p.profile.dynamic=false;p.lines=[line(bat)];const r=calculateProject(p);assert.equal(r.batteryOptimization.epexValue,0);});
test('dynamic EPEX uses capacity-specific cycles, 20 cent spread and 90% round-trip efficiency',()=>{
 const p=emptyProject();p.profile.dynamic=true;p.profile.solar=0;p.profile.exported=0;p.profile.electricity=4500;
 const expected:[[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[10.6,300,572.4],[15.9,310,887.22],[21.2,300,1144.8],[26.5,290,1383.3]];
 for(const [capacity,cycles,value] of expected){
  const product=catalog.find(x=>x.category==='battery'&&x.brand==='HYXiPOWER'&&x.phase===3&&!x.backup&&x.capacity===capacity)!;
  const result=calculateProject({...p,lines:[line(product)]});
  assert.equal(epexCyclesForCapacity(capacity),cycles);
  close(result.after.trading,value);close(result.batteryOptimization.epexValue,value);
  close(result.after.tradingCharge,capacity*cycles);
 }
});
test('battery report values reconcile to annual result and preserve customer export tariffs and fees',()=>{
 const p=emptyProject();p.profile.solar=6000;p.profile.exported=3000;p.profile.electricity=4500;p.profile.electricityRate=.41;p.profile.exportRate=.03;p.profile.exportFee=.17;p.profile.dynamic=true;p.profile.lowRate=.39;p.profile.highRate=.4;
 p.lines=[line(bat)];const r=calculateProject(p);
 close(r.batteryOptimization.epexValue,r.after.trading);
 close(r.batteryOptimization.totalAnnualValue,r.batteryOptimization.solarValue+r.batteryOptimization.epexValue);
 close(r.annual,r.batteryOptimization.totalAnnualValue);
 assert.ok(r.batteryOptimization.solarValue>0);
 const noFee=calculateProject({...p,profile:{...p.profile,exportFee:0}});
 assert.ok(r.batteryOptimization.solarValue>noFee.batteryOptimization.solarValue);
 const noComp=calculateProject({...p,profile:{...p.profile,exportRate:0}});
 assert.ok(noComp.batteryOptimization.solarValue>r.batteryOptimization.solarValue);
});

test('optimizer never drops a selected battery to manufacture an affordable plan',()=>{
 const p=emptyProject();
 p.customProducts=catalog.filter(x=>x.category==='battery').map(x=>({...x,price:1000000}));
 const a={hasSolar:'no',contract:'fixed',phase:3,backup:false,roofArea:45,connection:'Stringomvormer'};
 const r=optimizeAdvice(p,a,['solar','battery']);
 assert.equal(r.best,undefined);
 assert.ok(r.allScenarios.length>0);
 assert.ok(r.allScenarios.every(s=>s.products.length===2&&!s.eligible));
 assert.ok(r.scenarios.every(s=>s.products.some(p=>p.category==='battery')&&s.products.some(p=>p.category==='solar')));
});
test('25-year outputs reconcile with bills, financing and zero growth',()=>{
 const p=emptyProject();p.profile.annualInflation=0;p.lines=[line(bat)];
 p.finance={enabled:true,amount:5000,rate:4,years:10};
 const r=calculateProject(p);
 assert.equal(r.projection.length,16);assert.equal(r.projection25.length,26);
 close(r.benefit25Years,25*r.annual-r.investment);
 close(r.oldMonthlyCost-r.newMonthlyCost,r.monthlySavings);
 close(r.oldMonthlyCost-r.monthlyCostIncludingFinance,r.monthlyNet);
 close(r.benefit25YearsAfterFinance,r.benefit25Years-(r.loanTotal-r.financed));
 const growth=calculateProject({...p,profile:{...p.profile,annualInflation:2}});
 assert.ok(growth.benefit25Years>r.benefit25Years);
 close(growth.annual,r.annual);
});
test('battery marginal ROI includes upkeep and excludes heat pump benefits',()=>{
 const p=emptyProject();p.lines=[line(bat,{annualCost:150,manualBenefit:20}),line(hp)];
 const r=calculateProject(p);
 const without=calculateProject({...p,lines:[line(hp)]});
 close(r.batteryOptimization.totalAnnualValue,r.annual-without.annual);
 close(r.batteryOptimization.operatingAdjustment,-130);
 close(r.batteryOptimization.payback!,r.batteryOptimization.investment/r.batteryOptimization.totalAnnualValue);
});
test('balanced score combines return, sustainability, sizing and comfort',()=>{
 const p=emptyProject();
 const r=optimizeAdvice(p,{hasSolar:'yes',contract:'fixed',phase:3,backup:false},['battery']);
 assert.deepEqual(r.batteryComparison.map(b=>b.capacity).sort((a,b)=>a-b),[10.6,15.9,21.2,26.5]);
 assert.ok(r.best);assert.match(r.best.reason,/per jaar/);
 for(const s of r.allScenarios){close(s.score,Math.min(1,Math.max(0,s.roi)/.12)*.45+s.sustainability*.25+s.sizing*.2+s.comfort*.1);}
 for(const b of r.batteryComparison){close(b.extraRoi,b.extraAnnualSavings/b.extraInvestment);}
});
test('missing selected category blocks a partial recommendation',()=>{
 const p=emptyProject();
 const r=optimizeAdvice(p,{hasSolar:'no',phase:1,backup:true,roofArea:45,connection:'Stringomvormer'},['solar','battery']);
 assert.deepEqual(r.unavailable,['battery']);
 assert.equal(r.best,undefined);assert.equal(r.scenarios.length,0);
});

test('all three recommendations contain every requested module and use their declared ranking',()=>{
 const p=emptyProject();
 const answers={hasSolar:'no',contract:'dynamic',phase:3,backup:false,home:'terrace',year:1995,heatingSystem:'boiler',area:130,roofArea:45,connection:'Stringomvormer',insulation:'good',cvTemp:45,floorheat:true,gas:1550,evType:'ev',km:15000,evConsumption:18,cars:1};
 const requested=['solar','battery','heatpump','charger'] as const;
 const r=optimizeAdvice(p,answers,[...requested]);
 const viable=r.allScenarios.filter(s=>s.eligible);
 assert.ok(viable.length>0);
 const maxRoi=Math.max(...viable.map(s=>s.roi));
 for(const variant of Object.values(r.variants)){
  assert.ok(variant);
  assert.deepEqual(new Set(variant.products.map(p=>p.category)),new Set(requested));
  assert.deepEqual(new Set(variant.lines.map(l=>l.product.category)),new Set(requested));
  const applied=calculateProject({...p,profile:r.profile,lines:variant.lines});
  close(applied.annual,variant.annual);close(applied.investment,variant.investment);
 }
 close(r.variants.return!.roi,maxRoi);
 assert.equal(r.variants.independence,rankAdviceScenarios(viable,'independence')[0]);
 assert.equal(r.variants.balance,rankAdviceScenarios(viable,'balance')[0]);
});
test('a charger is not recommended when the household has no EV demand',()=>{
 const p=emptyProject();
 const r=optimizeAdvice(p,{hasSolar:'no',phase:3,roofArea:45,connection:'Stringomvormer',evType:'none'},['solar','charger']);
 assert.equal(r.best,undefined);assert.ok(r.errors.includes('charger-input'));assert.equal(r.allScenarios.length,0);
});

test('adding, removing and re-adding a battery never duplicates an existing heat pump',()=>{
 const p=emptyProject();p.lines=[line(hp)];
 const answers={hasSolar:'yes',solar:5000,exported:3000,electricity:4500,contract:'dynamic',home:'terrace',year:1995,heatingSystem:'boiler',gas:1550,insulation:'good',cvTemp:45,floorheat:true,phase:3,backup:false};
 const combined=optimizeAdvice(p,answers,['heatpump','battery']);assert.ok(combined.best);
 assert.deepEqual(combined.best.lines.map(l=>l.product.category).sort(),['battery','heatpump']);
 const removed=optimizeAdvice({...p,profile:combined.profile,lines:combined.best.lines},answers,['heatpump']);assert.ok(removed.best);
 assert.deepEqual(removed.best.lines.map(l=>l.product.category),['heatpump']);
 const readded=optimizeAdvice({...p,profile:removed.profile,lines:removed.best.lines},answers,['heatpump','battery']);assert.ok(readded.best);
 assert.deepEqual(readded.best.lines.map(l=>l.product.category).sort(),['battery','heatpump']);
 assert.equal(new Set(readded.best.lines.map(l=>l.product.category)).size,readded.best.lines.length);
});
test('customer home type and area inform the default roof estimate while expert input overrides it',()=>{
 const p=emptyProject();
 const base={connection:'Stringomvormer',home:'terrace',area:80};
 const small=candidateProducts('solar',base,p);
 const large=candidateProducts('solar',{...base,area:160},p);
 assert.ok(large.length>small.length);
 const override=candidateProducts('solar',{...base,roofArea:45},p);
 assert.deepEqual(override,candidateProducts('solar',{...base,area:250,roofArea:45},p));
});

test('all 15 module combinations across four customer profiles are complete and ranked',()=>{
 const modules=['solar','battery','heatpump','charger'] as const;
 const base={home:'terrace',year:1995,heatingSystem:'boiler',area:130,roofArea:45,connection:'Stringomvormer',insulation:'good',cvTemp:45,floorheat:true,phase:3,backup:false,gas:1550,evType:'ev',km:15000,evConsumption:18,cars:1};
 const profiles=[{hasSolar:'yes',solar:5000,exported:3000,electricity:4500,contract:'dynamic'}, {hasSolar:'yes',solar:5000,exported:3000,electricity:4500,contract:'fixed'}, {hasSolar:'no',electricity:4500,contract:'dynamic'}, {hasSolar:'no',electricity:4500,contract:'fixed'}];
 for(let mask=1;mask<16;mask++)for(const profile of profiles){
  const goals=modules.filter((_,index)=>mask&(1<<index));
  const p=emptyProject();const r=optimizeAdvice(p,{...base,...profile},goals);
  assert.deepEqual(r.errors,[]);
  for(const scenario of r.allScenarios){
   assert.deepEqual(new Set(scenario.products.map(p=>p.category)),new Set(goals));
   close(scenario.annual,scenario.result.before.netCost-scenario.result.after.netCost);
   close(scenario.result.contributions.reduce((sum,item)=>sum+item.benefit,0),scenario.annual);
  }
  for(const preference of ['return','balance','independence'] as const){
   const expected=rankAdviceScenarios(r.allScenarios.filter(s=>s.eligible),preference)[0];
   assert.equal(r.overallVariants[preference],expected);
  }
  if(!r.best)assert.ok(r.allScenarios.every(s=>!s.eligible));
 }
});
test('hybrid preference preserves electric alternatives and independent suitability checks',()=>{
 const p=emptyProject();
 const a={hasSolar:'yes',solar:5000,exported:3000,electricity:4500,contract:'dynamic',home:'terrace',year:1995,heatingSystem:'boiler',gas:1550,insulation:'good',cvTemp:45,floorheat:true,phase:3,backup:false,hpMode:'hybrid'};
 const r=optimizeAdvice(p,a,['heatpump','battery']);
 assert.ok(r.best);assert.equal(r.best.products.find(p=>p.category==='heatpump')!.heating,'hybrid');
 const options=moduleAlternatives(r.allScenarios,r.best.lines,'heatpump','return');
 assert.ok(options.some(s=>s.products.some(p=>p.heating==='electric')));
 const electric=options.find(s=>s.products.some(p=>p.heating==='electric'))!;
 assert.equal(electric.result.after.gas,0);
 assert.deepEqual(electric.lines.filter(l=>l.product.category==='battery'),r.best.lines.filter(l=>l.product.category==='battery'));
 assert.ok(electric.investment!==r.best.investment);
 const unsuitable=optimizeAdvice(p,{...a,insulation:'poor',cvTemp:70},['heatpump','battery']);
 assert.ok(unsuitable.allScenarios.every(s=>s.products.every(p=>p.heating!=='electric')));
});
test('every product can be swapped while other selected modules and custom line costs stay unchanged',()=>{
 const p=emptyProject();p.lines=[line(bat,{quantity:2,price:7000,annualCost:120})];
 const a={hasSolar:'no',contract:'dynamic',home:'terrace',year:1995,heatingSystem:'boiler',gas:1550,insulation:'good',cvTemp:45,floorheat:true,phase:3,backup:true,roofArea:45,connection:'Stringomvormer',evType:'ev',km:15000,cars:1,evConsumption:18};
 const r=optimizeAdvice(p,a,['solar','heatpump','battery','charger']);assert.ok(r.best);
 for(const goal of ['solar','heatpump','battery','charger'] as const){
  const options=moduleAlternatives(r.allScenarios,r.best.lines,goal,'return');assert.ok(options.length);
  for(const option of options)assert.deepEqual(option.lines.filter(l=>l.product.category!==goal),r.best.lines.filter(l=>l.product.category!==goal));
 }
 const edited={...p,profile:r.profile,lines:r.best.lines.map(l=>l.product.category==='heatpump'?{...l,price:100000}:l)};
 const updated=optimizeAdvice(edited,a,['solar','heatpump','battery','charger']);
 assert.ok(updated.best);assert.notEqual(updated.best.products.find(p=>p.category==='heatpump')!.id,r.best.products.find(p=>p.category==='heatpump')!.id);
});
