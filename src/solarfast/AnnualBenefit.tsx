import {TrendingDown,Zap,Wrench,Plus,Equal} from 'lucide-react';
import type {Project} from './types';
import type {calculateProject} from './engine';
import {useText} from './ui';

export function AnnualBenefit({project,result:r}:{project:Project;result:ReturnType<typeof calculateProject>}){
 const {t,money,num}=useText();const valid=r.valid&&project.lines.length>0;
 const billSaving=r.before.supplierCost-r.after.supplierCost;
 const marketIncome=r.after.trading-r.before.trading;
 const upkeep=r.after.maintenance-r.before.maintenance;
 const extra=r.after.manual-r.before.manual;
 const gasCost=(gas:number)=>gas*project.profile.gasRate+(gas>0?project.profile.fixedGas:0);
 const gasSaving=gasCost(r.before.gas)-gasCost(r.after.gas);
 const chargingSaving=(r.after.homeCharging-r.before.homeCharging)*project.profile.publicChargingRate;
 const electricitySaving=billSaving-gasSaving-chargingSaving;
 const rows=[
  {label:t('Stroom en teruglevering','Electricity and exports'),value:electricitySaving,explanation:t('Inclusief extra stroom voor warmtepomp en auto, terugleververgoeding en terugleverkosten.','Includes extra electricity for the heat pump and car, export compensation and export fees.')},
  ...(project.profile.gas>0?[{label:t('Gas en vaste gaskosten','Gas and fixed gas charges'),value:gasSaving,explanation:`${num(r.after.gasSaved,0)} m³ × ${money(project.profile.gasRate,3)}/m³${r.before.gas>0&&r.after.gas===0?` + ${money(project.profile.fixedGas)} ${t('vaste gaskosten','fixed gas charges')}`:''}`}]:[]),
  ...(project.profile.evKwh>0?[{label:t('Vermeden publiek laden','Avoided public charging'),value:chargingSaving,explanation:t('Thuislaadstroom is al opgenomen in de stroomkosten hierboven.','Home charging electricity is already included in the electricity costs above.')}]:[]),
 ];
 const signed=(n:number)=>`${n>=0?'+':'−'} ${money(Math.abs(n),2)}`;
 return <section className="pr-annual-proof pr-reveal" aria-label={t('Onderbouwing jaarvoordeel','Annual benefit breakdown')}>
 <header className="pr-section-heading"><span className="pr-eyebrow">{t('UW VOORDEEL, ONDERBOUWD','YOUR BENEFIT, EXPLAINED')}</span><h3>{t('Dit houdt u extra over.','This is what you keep extra.')}</h3></header>
 <div className="pr-annual-parts">
 <article><TrendingDown size={22}/><span>{t('Besparen op energiekosten','Save on energy costs')}</span><strong>{valid?money(billSaving):'—'}</strong><p>{valid?`${money(r.before.supplierCost)} → ${money(r.after.supplierCost)}`:'—'}</p></article>
 <article><Zap size={22}/><span>{t('Verwachte marktinkomsten','Estimated market income')}</span><strong>{valid?money(marketIncome):'—'}</strong><p>{marketIncome!==0?t('Dynamische prijzen · indicatief, geen garantie','Dynamic prices · indicative, not guaranteed'):t('Niet meegerekend in dit plan','Not included in this plan')}</p></article>
 <article><Wrench size={22}/><span>{t('Onderhoud en abonnementen','Maintenance and subscriptions')}</span><strong>{valid?`${upkeep>0?'− ':''}${money(upkeep)}`:'—'}</strong><p>{upkeep===0?t('Geen kosten ingevuld','No costs entered'):t('Afgetrokken van uw voordeel','Deducted from your benefit')}</p></article>
 </div>
 {extra!==0&&<p className="pr-annual-extra"><Plus size={15}/>{t('Door adviseur toegevoegd voordeel','Adviser-entered benefit')}: {valid?money(extra):'—'} / {t('jaar','year')}. {t('Apart ingevoerd; controleer de onderbouwing met uw adviseur.','Entered separately; confirm the basis with your adviser.')}</p>}
 <div className="pr-annual-total"><span><Equal size={18}/>{t('Netto jaarvoordeel','Net annual benefit')}</span><strong>{valid?money(r.annual):'—'}<small> / {t('jaar','year')}</small></strong></div>
 <p className="pr-annual-note">{t('Besparing + marktinkomsten + toegevoegd voordeel − jaarlijkse kosten. Investering en financiering zijn hierin niet verwerkt.','Savings + market income + added benefit − annual costs. Investment and financing are not included.')}</p>
 <details><summary>{t('Waar komen deze bedragen vandaan?','Where do these amounts come from?')}</summary><dl>{rows.map(row=><div key={row.label}><dt>{row.label}<small>{row.explanation}</small></dt><dd>{valid?signed(row.value):'—'}</dd></div>)}<div><dt>{t('Besparing op de rekening','Bill savings')}</dt><dd>{valid?money(billSaving,2):'—'}</dd></div><div><dt>{t('Marktinkomsten','Market income')}</dt><dd>{valid?signed(marketIncome):'—'}</dd></div>{extra!==0&&<div><dt>{t('Toegevoegd voordeel','Additional benefit')}</dt><dd>{valid?signed(extra):'—'}</dd></div>}<div><dt>{t('Jaarlijkse kosten','Annual costs')}</dt><dd>{valid?signed(-upkeep):'—'}</dd></div><div><dt>{t('Totaal per jaar','Annual total')}</dt><dd>{valid?money(r.annual,2):'—'}</dd></div></dl><p>{t('Stroomtarief','Electricity rate')}: {money(project.profile.electricityRate,3)}/kWh · {t('Terugleververgoeding','Export payment')}: {money(project.profile.exportRate,3)}/kWh. {t('Prijsstijging telt pas mee in de meerjarenprognose, niet in dit eerste jaar.','Price growth only affects the multi-year projection, not this first year.')}</p></details>
 {project.finance.enabled&&<div className="pr-annual-finance"><span>{t('Na financieringslast in het eerste jaar','After financing payments in the first year')}</span><strong>{valid?money(r.annual-r.monthlyPayment*12):'—'} / {t('jaar','year')}</strong><small>{t('Aflossing en rente','Principal and interest')}: {money(r.monthlyPayment*12)} / {t('jaar','year')}.</small></div>}
 </section>;
}
