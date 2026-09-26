import {calculateProject,normalizeLines} from './engine';
import type {Line,Product,Project} from './types';

export type ModuleId='solar'|'battery'|'heatpump'|'charger';
export type Unit='kwh'|'m3'|'eur'|'percent';

export interface ComparisonRow{key:string;before:number;after:number;unit:Unit}
export interface ComparisonHeadline{key:string;before:number;after:number;unit:Unit}
export interface ModuleComparison{id:ModuleId;impact:number;headline:ComparisonHeadline;rows:ComparisonRow[]}
export interface PlanProduct{line:Line;impact:number;impactKey:'yearValue'|'enteredBenefit';price:number|null;subsidy:number;contribution:number}
export interface ContributionRow{line:Line;contribution:number;investment:number}

type Result=ReturnType<typeof calculateProject>;
type State=ReturnType<typeof calculateProject>['after'];

const row=(key:string,before:number,after:number,unit:Unit):ComparisonRow=>({key,before,after,unit});
const publicCharging=(profile:Project['profile'],state:State)=>(profile.evKwh-state.homeCharging)*profile.publicChargingRate;
const present=(lines:Line[],category:Product['category'])=>lines.some(l=>l.product.category===category);

/**
 * Leave-one-out economics: the annual difference between the plan and the plan
 * without this module. Every card, comparison and headline uses this single
 * definition so a module can never show two different numbers.
 */
export function withoutModule(plan:Project,result:Result,id:ModuleId):State{
  if(id==='battery')return result.withoutBatteries;
  return calculateProject({...plan,lines:plan.lines.filter(l=>l.product.category!==id)}).after;
}

export function moduleComparison(plan:Project,result:Result,id:ModuleId):ModuleComparison{
  const before=withoutModule(plan,result,id);
  const after=result.after;
  const impact=before.netCost-after.netCost;
  const annual=row('annualValue',0,impact,'eur');
  const head=(key:string,unit:Unit,beforeValue=before[key as keyof State] as number,afterValue=after[key as keyof State] as number):ComparisonHeadline=>({key,before:beforeValue,after:afterValue,unit});
  const rows:Record<ModuleId,ComparisonRow[]>={
   battery:[
    row('energyCosts',before.netCost,after.netCost,'eur'),
    row('selfConsumption',before.selfConsumption,after.selfConsumption,'percent'),
    row('export',before.exported,after.exported,'kwh'),
    annual,
   ],
   solar:[
    row('energyCosts',before.netCost,after.netCost,'eur'),
    row('production',before.production,after.production,'kwh'),
    row('selfConsumption',before.selfConsumption,after.selfConsumption,'percent'),
    annual,
   ],
   heatpump:[
    row('gas',before.gas,after.gas,'m3'),
    row('heatElectricity',before.heatElectricity,after.heatElectricity,'kwh'),
    row('energyCosts',before.netCost,after.netCost,'eur'),
    annual,
   ],
   charger:[
    row('publicCharging',publicCharging(plan.profile,before),publicCharging(plan.profile,after),'eur'),
    row('homeCharging',before.homeCharging,after.homeCharging,'kwh'),
    row('energyCosts',before.netCost,after.netCost,'eur'),
    annual,
   ],
  };
  const headlines:Record<ModuleId,ComparisonHeadline>={
   battery:head('selfConsumption','percent'),
   solar:head('production','kwh'),
   heatpump:head('gas','m3'),
   charger:head('homeCharging','kwh'),
  };
  return {id,impact,headline:headlines[id],rows:rows[id]};
}

export function buildComparisons(plan:Project,result:Result):ModuleComparison[]{
  const canonical={...plan,lines:normalizeLines(plan.lines)};
  return (['battery','solar','heatpump','charger'] as ModuleId[]).filter(id=>present(canonical.lines,id)).map(id=>moduleComparison(canonical,result,id));
}

/** One premium card per quoted line, in plan order. */
export function planProducts(plan:Project,result:Result):PlanProduct[]{
  plan={...plan,lines:normalizeLines(plan.lines)};
  const contributions=new Map(result.contributions.map(c=>[c.line.id,c]));
  return plan.lines.map(line=>{
   const contribution=contributions.get(line.id);
   const without=calculateProject({...plan,lines:plan.lines.filter(l=>l.id!==line.id)});
   return {
    line,
    impact:without.after.netCost-result.after.netCost,
    impactKey:line.product.category==='extra'?'enteredBenefit':'yearValue',
    price:line.price===null?null:line.price*line.quantity,
    subsidy:Math.min(line.price??0,line.subsidy)*line.quantity,
    contribution:contribution?contribution.benefit:0,
   };
  });
}

export function contributionRows(result:Result):ContributionRow[]{
  return result.contributions.map(({line,benefit,investment})=>({line,contribution:benefit,investment}));
}
