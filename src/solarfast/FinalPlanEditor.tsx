import type {Project} from './types';
import {moduleAlternatives,type AdviceScenario,type AdvicePreference,type Goal,type Answers,type optimizeAdvice} from './optimizer';
import {CategoryIcon,Field,NumberField,useText} from './ui';

export default function FinalPlanEditor({plan,optimization,preference,goals,onSelect,onGoals,onEdit}:{plan:Project;optimization:ReturnType<typeof optimizeAdvice>;preference:AdvicePreference;answers:Answers;goals:Goal[];onSelect:(scenario:AdviceScenario)=>void;onGoals:(goals:Goal[])=>void;onAnswer:(key:string,value:unknown)=>void;onEdit:(plan:Project)=>void}){
 const {t,money,num,productName}=useText();
 const modules:{id:Goal;label:string}[]=[{id:'solar',label:t('Zonnepanelen','Solar panels')},{id:'battery',label:t('Thuisbatterij','Home battery')},{id:'heatpump',label:t('Warmtepomp','Heat pump')},{id:'charger',label:t('Laadpaal','EV charger')}];
 return <section className="pr-configurator pr-consumer-editor">
  <div className="aq-module-choices">{modules.map(module=><button key={module.id} aria-pressed={goals.includes(module.id)} disabled={goals.length===1&&goals.includes(module.id)} onClick={()=>onGoals(goals.includes(module.id)?goals.filter(goal=>goal!==module.id):[...goals,module.id])}><CategoryIcon category={module.id}/>{module.label}<span className="aq-choice-mark">{goals.includes(module.id)?'✓':'+'}</span></button>)}</div>
  <div className="pr-config-modules">{modules.filter(module=>goals.includes(module.id)).map(module=>{
   const all=moduleAlternatives(optimization.allScenarios,plan.lines,module.id,preference);
   const options=[...new Map(all.map(scenario=>[scenario.products.find(product=>product.category===module.id)!.id,scenario])).values()];
   const selected=plan.lines.find(line=>line.product.category===module.id);
   const selectedScenario=options.find(scenario=>scenario.products.some(product=>product.category===module.id&&product.id===selected?.product.id));
   const hpTypes=module.id==='heatpump'?(['hybrid','electric'] as const).map(type=>({type,scenario:options.find(scenario=>scenario.products.some(product=>product.category==='heatpump'&&product.heating===type))})):[];
   const selectLabel=module.id==='battery'?t('Kies capaciteit','Choose capacity'):t('Kies product','Choose product');
   return <article className="pr-config-module" key={module.id}>
    <h4><CategoryIcon category={module.id} size={19}/>{module.label}</h4>
    {hpTypes.length>0&&<div className="pr-heatpump-switch">{hpTypes.map(({type,scenario})=><button key={type} disabled={!scenario} aria-pressed={selected?.product.heating===type} onClick={()=>scenario&&onSelect(scenario)}>{type==='hybrid'?t('Hybride','Hybrid'):t('All-electric','All-electric')}</button>)}</div>}
    <Field label={selectLabel}><select value={selected?.product.id??''} onChange={event=>{const scenario=options.find(option=>option.products.some(product=>product.category===module.id&&product.id===event.target.value));if(scenario)onSelect(scenario);}}>{options.map(scenario=>{const product=scenario.products.find(item=>item.category===module.id)!;return <option value={product.id} key={product.id}>{productName(product)}</option>;})}</select></Field>
    {selected&&<div className="pr-edit-costs"><NumberField label={t('Prijs incl. btw','Price incl. VAT')} value={selected.price} optional onChange={price=>onEdit({...plan,lines:plan.lines.map(line=>line.id===selected.id?{...line,price}:line)})}/><NumberField label={t('Jaarlijkse kosten','Annual costs')} value={selected.annualCost} onChange={annualCost=>onEdit({...plan,lines:plan.lines.map(line=>line.id===selected.id?{...line,annualCost:annualCost??0}:line)})}/></div>}
    {selectedScenario&&<p className="pr-choice-impact"><span>{t('Effect op totaalplan','Impact on total plan')}</span><strong>{money(selectedScenario.investment)} · {money(selectedScenario.annual)}/{t('jaar','year')} · {num(selectedScenario.roi*100)}% ROI</strong></p>}
   </article>;
  })}</div>
 </section>;
}
