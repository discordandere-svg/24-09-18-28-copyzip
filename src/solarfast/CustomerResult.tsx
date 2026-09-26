import FinalPlanEditor from './FinalPlanEditor';
import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronDown,Leaf,ShieldCheck,TrendingUp} from 'lucide-react';
import type {Project} from './types';
import {calculateProject,EPEX_ROUND_TRIP_EFFICIENCY,EPEX_SPREAD_EUR_PER_KWH} from './engine';
import {optimizeAdvice,type AdvicePreference,type Answers,type Goal} from './optimizer';
import {buildComparisons,planProducts,type ModuleComparison,type ModuleId,type Unit} from './resultModel';
import {Button,CategoryIcon,useText,Note} from './ui';
import './customer-result.css';

type Optimization=ReturnType<typeof optimizeAdvice>;
type Text=(nl:string,en:string)=>string;

const comparisonMeta:(t:Text)=>Record<ModuleId,{eyebrow:string;title:string;metric:string}>=t=>({
 battery:{eyebrow:t('THUISBATTERIJ','HOME BATTERY'),title:t('Meer eigen stroom gebruiken','Use more of your own power'),metric:t('Zelfverbruik zonnestroom','Solar self-consumption')},
 solar:{eyebrow:t('ZONNEPANELEN','SOLAR PANELS'),title:t('Meer stroom van uw dak','More power from your roof'),metric:t('Zonneproductie','Solar production')},
 heatpump:{eyebrow:t('WARMTEPOMP','HEAT PUMP'),title:t('Minder gas voor verwarming','Less gas for heating'),metric:t('Gasverbruik','Gas use')},
 charger:{eyebrow:t('LAADPAAL','EV CHARGER'),title:t('Meer thuis laden','Charge more at home'),metric:t('Thuis geladen','Charged at home')},
});

function PlanCompareCard({comparison,valid,investment}:{comparison:ModuleComparison;valid:boolean;investment:number|null}){
 const {t,money,num}=useText();const meta=comparisonMeta(t)[comparison.id];
 const show=(value:ReactNode)=>valid?value:'—';
 const format=(value:number,unit:Unit)=>unit==='eur'?money(value):unit==='percent'?`${num(value)}%`:`${num(value,0)} ${unit==='m3'?'m³':'kWh'}`;
 const labels:Record<string,string>={energyCosts:t('Energiekosten','Energy costs'),selfConsumption:t('Eigen verbruik','Self-consumption'),export:t('Teruglevering','Grid export'),production:t('Zonne-opwek','Solar generation'),gas:t('Gasverbruik','Gas use'),heatElectricity:t('Stroom voor verwarming','Electricity for heating'),publicCharging:t('Publieke laadkosten','Public charging costs'),homeCharging:t('Thuis geladen','Charged at home')};
 const rows=comparison.rows.filter(row=>row.key!=='annualValue');
 const roi=investment&&investment>0?comparison.impact/investment*100:null;
 return <article className="pr-compare-card">
  <header><CategoryIcon category={comparison.id} size={20}/><div><span className="pr-eyebrow">{meta.eyebrow}</span><h4>{meta.title}</h4></div></header>
  <div className="pr-compare-columns">
   <section><span className="pr-state-label">{t('Voor','Before')}</span><dl>{rows.map(row=><div key={row.key}><dt>{labels[row.key]??row.key}</dt><dd>{show(format(row.before,row.unit))}</dd></div>)}</dl></section>
   <section className="pr-compare-after"><span className="pr-state-label">{t('Na','After')}</span><dl>{rows.map(row=><div key={row.key}><dt>{labels[row.key]??row.key}</dt><dd>{show(format(row.after,row.unit))}</dd></div>)}{comparison.id==='heatpump'&&<div><dt>{t('Comfort','Comfort')}</dt><dd>{t('Gelijkmatige warmte','Steady heating')}</dd></div>}</dl></section>
  </div>
  <div className="pr-card-outcome"><p className="pr-compare-impact"><span>{t('Jaarlijkse besparing','Annual saving')}</span><strong>{show(money(comparison.impact))} <small>{t('/ jaar','/ year')}</small></strong></p><p><span>ROI</span><strong>{valid&&roi!==null?`${num(roi)}%`:'—'}</strong></p></div>
 </article>;
}

export default function CustomerResult({project,optimization:inputOptimization,onApply,onBack,applied=false,preference,onPreference,answers,goals,onGoals,onAnswer}:{project:Project;optimization:Optimization;onApply:(p:Project)=>void;onBack:()=>void;applied?:boolean;preference:AdvicePreference;onPreference:(value:AdvicePreference)=>void;answers:Answers;goals:Goal[];onGoals:(goals:Goal[],plan:Project)=>void;onAnswer:(key:string,value:unknown,plan:Project)=>void}){
 const {t,money,num,productName}=useText();
 const [preview,setPreview]=useState<Optimization['scenarios'][number]|null>(null);
 const [customPlan,setCustomPlan]=useState<Project|null>(null);
 useEffect(()=>{setPreview(null);setCustomPlan(null);},[answers,goals.join(',')]);
 const optimization=useMemo(()=>customPlan?optimizeAdvice(customPlan,answers,goals):inputOptimization,[customPlan,answers,goals.join(','),inputOptimization]);
 const base=customPlan??project;
 const plan=preview?{...base,profile:optimization.profile,lines:preview.lines}:base;
 const result=calculateProject(plan);const valid=result.valid&&plan.lines.length>0;
 const best=optimization.overallVariants[preference];
 const products=useMemo(()=>planProducts(plan,result),[plan]);
 const comparisons=useMemo(()=>buildComparisons(plan,result),[plan]);
 const hasModule=(module:ModuleId)=>products.some(card=>card.line.product.category===module);
 const recommended=!!best&&best.lines.length===plan.lines.length&&best.lines.every(line=>plan.lines.some(current=>current.product.id===line.product.id));
 const modes:{id:AdvicePreference;title:string}[]=[
  {id:'balance',title:t('Beste balans','Best balance')},
  {id:'return',title:t('Beste rendement','Best return')},
  {id:'independence',title:t('Meer onafhankelijkheid','More independence')},
 ];
 const show=(value:ReactNode)=>valid?value:'—';
 const moduleOutcome=hasModule('heatpump')&&(hasModule('solar')||hasModule('battery')||hasModule('charger'))
  ?t('Minder netstroom en gas, zonder onnodige capaciteit.','Less grid power and gas, without unnecessary capacity.')
  :hasModule('heatpump')?t('Minder gas, zonder een te groot verwarmingssysteem.','Less gas, without an oversized heating system.')
  :hasModule('charger')?t('Meer thuis laden, zonder onnodige laadcapaciteit.','More charging at home, without unnecessary charging capacity.')
  :hasModule('solar')?t('Meer eigen zonnestroom, passend bij uw dak.','More solar power of your own, matched to your roof.')
  :t('Meer eigen zonnestroom gebruiken, zonder een te grote batterij.','Use more of your own solar power, without an oversized battery.');
 const reasons=[
  preference==='return'?t('Hoogste rendement binnen een passende maat.','Highest return within a suitable size.'):t('Sterke balans tussen investering en jaarvoordeel.','Strong balance between investment and annual benefit.'),
  t('Capaciteit afgestemd op uw woning en energiegebruik.','Capacity matched to your home and energy use.'),
  moduleOutcome,
 ];
 const technicalRows:[string,string][]=[
  [t('Huidige energiekosten','Current energy costs'),money(result.before.netCost)],
  [t('Nieuwe energiekosten','New energy costs'),valid?money(result.after.netCost):'—'],
  [t('Netto investering','Net investment'),result.missing.length?'—':money(result.investment)],
  [t('Netto jaarvoordeel','Net annual benefit'),String(show(money(result.annual)))],
  [t('Netstroom','Grid electricity'),`${num(result.before.grid,0)} → ${num(result.after.grid,0)} kWh`],
 ];
 if(hasModule('heatpump'))technicalRows.push([answers.heatSource==='demand'?t('Warmte uit gas','Heat supplied by gas'):t('Gas','Gas'),answers.heatSource==='demand'?`${num(result.before.gas*plan.profile.gasHeat,0)} → ${num(result.after.gas*plan.profile.gasHeat,0)} kWh`:`${num(result.before.gas,0)} → ${num(result.after.gas,0)} m³`]);

 return <div className="premium-result pr-simple-result">
  {!valid&&<Note warning>{t('Vul de ontbrekende gegevens en productprijzen in.','Complete the missing details and product prices.')}</Note>}

  <section className="pr-hero pr-simple-plan">
   <div className="pr-hero-top"><span className="pr-eyebrow"><span className="pr-dot"/>{t('UW PLAN','YOUR PLAN')}</span><span className="pr-pill">{recommended?t('Aanbevolen','Recommended'):t('Aangepast','Adjusted')}</span></div>
   <h2>{t('Aanbevolen systeem','Recommended system')}</h2>
   <div className="pr-plan-list">{products.map(card=>{
    const investment=card.price===null?null:card.price-card.subsidy;
    return <div className="pr-plan-row" key={card.line.id}><CategoryIcon category={card.line.product.category} size={20}/><strong>{productName(card.line.product)}</strong><span>{t('Investering','Investment')}<b>{investment===null?'—':money(investment)}</b></span><span>{t('Voordeel','Benefit')}<b>{show(money(card.impact))}/{t('jaar','year')}</b></span></div>;
   })}</div>
   <div className="pr-plan-summary"><div><span>{t('Kosten','Cost')}</span><strong>{result.missing.length?'—':money(result.investment)}</strong></div><div><span>{t('Jaarlijkse besparing','Annual saving')}</span><strong>{show(money(result.annual))}</strong></div><div><span>ROI</span><strong>{valid&&result.investment>0?`${num(result.annual/result.investment*100)}%`:'—'}</strong></div></div>
   <Button disabled={!valid} onClick={()=>{onApply(plan);setPreview(null);}}>{applied?t('Plan bevestigd','Plan confirmed'):t('Kies dit plan','Choose this plan')} <ArrowRight size={17}/></Button>
  </section>

  <section className="pr-why-simple">
   <span className="pr-eyebrow">{t('WAAROM DIT PLAN?','WHY THIS PLAN?')}</span>
   <ul>{reasons.map(reason=><li key={reason}><Check size={17}/>{reason}</li>)}</ul>
  </section>

  <section className="pr-comparisons">
   <header className="pr-section-heading"><span className="pr-eyebrow">{t('VOOR → NA','BEFORE → AFTER')}</span><h3>{t('Het effect per onderdeel','The effect of each module')}</h3></header>
   <div className="pr-compare-cards">{comparisons.map(comparison=>{const card=products.find(product=>product.line.product.category===comparison.id);const investment=card?.price===null||!card?null:card.price-card.subsidy;return <PlanCompareCard key={comparison.id} comparison={comparison} valid={valid} investment={investment}/>;})}</div>
  </section>

  <details className="pr-plan-edit"><summary>{t('Plan aanpassen','Adjust plan')}<ChevronDown size={18}/></summary><div className="pr-plan-edit-body">
   <div className="pr-mode-picker" aria-label={t('Adviesvoorkeur','Recommendation preference')}>{modes.map(mode=><button key={mode.id} aria-pressed={preference===mode.id&&(!preview||preview===optimization.overallVariants[mode.id])} disabled={!optimization.overallVariants[mode.id]} onClick={()=>{setPreview(optimization.overallVariants[mode.id]??null);onPreference(mode.id);}}><span>{mode.title}</span>{preference===mode.id&&(!preview||preview===optimization.overallVariants[mode.id])&&<Check size={15}/>}</button>)}</div>
   <FinalPlanEditor plan={plan} optimization={optimization} preference={preference} answers={answers} goals={goals} onSelect={setPreview} onGoals={next=>onGoals(next,plan)} onAnswer={(key,value)=>onAnswer(key,value,plan)} onEdit={next=>{setCustomPlan(next);setPreview(null);}}/>
  </div></details>

  <details className="pr-details"><summary>{t('Bekijk technische berekening','View technical calculation')}<ChevronDown size={18}/></summary><div className="pr-details-body">
   <dl>{technicalRows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   {plan.profile.dynamic&&result.after.nominalCapacity>0&&<p><TrendingUp size={14}/> EPEX / EMS: {num(result.after.nominalCapacity)} kWh × {num(result.after.epexCycles)} {t('cycli','cycles')} × {money(EPEX_SPREAD_EUR_PER_KWH,2)} × {num(EPEX_ROUND_TRIP_EFFICIENCY*100)}% = {money(result.after.trading)}/{t('jaar','year')}. {t('Indicatief; geen gegarandeerde opbrengst.','Indicative; returns are not guaranteed.')}</p>}
   <p><Leaf size={14}/>{t('De berekening gebruikt uw tarieven, verbruik en gekozen producten. Definitieve maatvoering volgt na een technische schouw.','The calculation uses your rates, usage and selected products. Final sizing follows a technical survey.')}</p>
   <p><ShieldCheck size={14}/>{t('Subsidies zijn indicatief en worden vóór de offerte gecontroleerd.','Subsidies are indicative and are checked before the quote.')}</p>
  </div></details>

  <footer className="pr-footer"><button onClick={onBack}><ArrowLeft size={15}/>{t('Gegevens aanpassen','Edit details')}</button><p>{t('Indicatie op basis van uw gegevens. Werkelijke resultaten kunnen afwijken.','Estimate based on your details. Actual results may vary.')}</p></footer>
 </div>;
}
