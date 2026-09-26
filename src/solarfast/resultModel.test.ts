import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,grossPrice,emptyProject} from './catalog.ts';
import {calculateProject} from './engine.ts';
import {buildComparisons,contributionRows,moduleComparison,planProducts,withoutModule} from './resultModel.ts';
import type {Line,Product,Project} from './types.ts';

function line(p:Product,overrides:Partial<Line>={}):Line{return {id:p.id,product:p,quantity:1,price:grossPrice(p),subsidy:p.subsidy??0,annualCost:0,manualBenefit:0,...overrides};}
const bat=catalog.find(p=>p.category==='battery'&&p.capacity===15.9&&p.backup)!;
const solar=catalog.find(p=>p.id==='solar-1-10')!;
const hp=catalog.find(p=>p.id==='hp-3')!;
const charger=catalog.find(p=>p.id==='zaptec-3')!;
const extra:Product={id:'labour',name:'Installation',brand:'SolarFast',category:'extra',price:1500,vat:21,priceBasis:'inclusive'};
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const annual=(rows:{key:string;before:number;after:number}[])=>rows.find(r=>r.key==='annualValue')!;
const full=():Project=>{const p=emptyProject();p.profile={...p.profile,solar:6000,exported:3000,electricity:4500,evKwh:2000};p.lines=[line(solar),line(bat),line(hp),line(charger),line(extra,{annualCost:40,manualBenefit:25})];return p;};

test('all four modules are compared and each headline is the strongest single number',()=>{
 const p=full();const r=calculateProject(p);const comparisons=buildComparisons(p,r);
 assert.deepEqual(comparisons.map(c=>c.id),['battery','solar','heatpump','charger']);
 assert.deepEqual(comparisons.map(c=>[c.headline.key,c.headline.unit]),[['selfConsumption','percent'],['production','kwh'],['gas','m3'],['homeCharging','kwh']]);
 assert.deepEqual(comparisons.map(c=>c.rows.at(-1)?.key),['annualValue','annualValue','annualValue','annualValue']);
});

test('only modules present in the plan are compared',()=>{
 const p=emptyProject();p.profile={...p.profile,solar:6000,exported:3000};p.lines=[line(solar)];
 const comparisons=buildComparisons(p,calculateProject(p));
 assert.deepEqual(comparisons.map(c=>c.id),['solar']);
 const r=calculateProject(p);
 assert.deepEqual(buildComparisons(emptyProject(),calculateProject(emptyProject())),[]);
 assert.equal(withoutModule(p,r,'heatpump').gas,r.after.gas);
});

test('the battery comparison is the engine battery value and shows what the battery delivers',()=>{
 const p=full();const r=calculateProject(p);const battery=moduleComparison(p,r,'battery');
 close(battery.impact,r.batteryOptimization.totalAnnualValue);
 assert.equal(annual(battery.rows).before,0);
 assert.equal(battery.rows[0].key,'energyCosts');
 assert.equal(battery.rows[1].key,'selfConsumption');
 assert.ok(battery.rows[0].after<battery.rows[0].before);
 assert.ok(battery.rows[1].after>battery.rows[1].before);
 assert.equal(withoutModule(p,r,'battery'),r.withoutBatteries);
 assert.ok(battery.rows.every(row=>!['gas','heatElectricity'].includes(row.key)));
});

test('the solar comparison reports added generation against the existing baseline',()=>{
 const p=full();const r=calculateProject(p);const panels=moduleComparison(p,r,'solar');
 const production=panels.rows.find(x=>x.key==='production')!;
 assert.equal(production.before,p.profile.solar);
 assert.ok(production.after>production.before);
 const independent=calculateProject({...p,lines:p.lines.filter(l=>l.product.category!=='solar')});
 close(panels.impact,independent.after.netCost-r.after.netCost);
 assert.ok(panels.rows.find(x=>x.key==='selfConsumption')!.after>0);
});

test('heat pump and charger comparisons keep their own demand and cost rows',()=>{
 const p=full();const r=calculateProject(p);
 const heat=moduleComparison(p,r,'heatpump');
 assert.equal(heat.headline.key,'gas');
 assert.equal(heat.rows[0].key,'gas');
 assert.ok(heat.rows[0].before>heat.rows[0].after);
 assert.ok(heat.rows.find(x=>x.key==='heatElectricity')!.after>0);
 assert.ok(heat.rows.every(row=>!['selfConsumption','batteryUse','trading'].includes(row.key)));
 const charge=moduleComparison(p,r,'charger');
 assert.equal(charge.headline.key,'homeCharging');
 assert.ok(charge.rows.find(x=>x.key==='publicCharging')!.after<charge.rows.find(x=>x.key==='publicCharging')!.before);
 assert.equal(charge.rows.find(x=>x.key==='homeCharging')!.after,p.profile.evKwh);
});

test('product cards carry one impact number, the gross price and the subsidy',()=>{
 const p=full();const r=calculateProject(p);const cards=planProducts(p,r);
 assert.deepEqual(cards.map(c=>c.line.id),p.lines.map(l=>l.id));
 const battery=cards[1];
 close(battery.impact,moduleComparison(p,r,'battery').impact);
 assert.equal(battery.impactKey,'yearValue');
 assert.equal(battery.price,battery.line.price!);
 assert.equal(battery.subsidy,0);
 const pump=cards[2];
 assert.ok(pump.subsidy>0);
 assert.equal(cards[4].impactKey,'enteredBenefit');
 close(cards[4].impact,(25-40));
 assert.equal(cards[4].contribution,cards[4].impact);
});

test('a product card and its comparison card never show two different numbers',()=>{
 const p=emptyProject();p.profile={...p.profile,solar:6000,exported:3000,electricity:4500,evKwh:2000};
 p.lines=[line(solar),line(bat),line(hp),line(charger)];
 const r=calculateProject(p);
 for(const comparison of buildComparisons(p,r)){
  const card=planProducts(p,r).find(c=>c.line.product.category===comparison.id)!;
  close(card.impact,comparison.impact);
 }
});

test('a duplicate module is canonicalized to one product card',()=>{
 const p=emptyProject();p.profile={...p.profile,gas:1550}; p.lines=[line(hp),line(hp,{id:'second'})];
 const cards=planProducts(p,calculateProject(p));
 assert.equal(cards.length,1);
 assert.equal(cards[0].line.id,'second');
 assert.ok(cards[0].impact>0);
});

test('a missing price blocks the price but keeps the impact readable',()=>{
 const p=emptyProject();p.lines=[line(bat,{price:null})];
 const cards=planProducts(p,calculateProject(p));
 assert.equal(cards[0].price,null);
 assert.equal(cards[0].subsidy,0);
 assert.equal(cards.length,1);
});

test('contribution rows reconcile with the annual result in plan order',()=>{
 const p=full();const r=calculateProject(p);
 const rows=contributionRows(r);
 assert.deepEqual(rows.map(x=>x.line.id),r.contributions.map(c=>c.line.id));
 close(rows.reduce((n,x)=>n+x.contribution,0),r.annual);
 close(rows.reduce((n,x)=>n+x.investment,0),r.investment);
});
