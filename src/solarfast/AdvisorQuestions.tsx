import {useState} from 'react';
import {ArrowLeft,ArrowRight,House,PlugZap,Sun,Flame} from 'lucide-react';
import {Button,Field,NumberField,Toggle,useText,CategoryIcon} from './ui';
import {adviceInputErrors,type Answers,type Goal,type AdvicePreference} from './optimizer';
import type {Project} from './types';

export default function AdvisorQuestions({answers:a,set,goals,onBack,onNext,onGoalsChange}:{answers:Answers;set:(key:string,value:unknown)=>void;goals:Goal[];project:Project;onBack:()=>void;onNext:()=>void;onGoalsChange:(goals:Goal[])=>void;preference:AdvicePreference;onPreference:(value:AdvicePreference)=>void}){
 const {t}=useText();const [tried,setTried]=useState(false);
 const solar=goals.includes('solar');const battery=goals.includes('battery');const heatpump=goals.includes('heatpump');const charger=goals.includes('charger');
 const modules:{id:Goal;label:string}[]=[{id:'solar',label:t('Zonnepanelen','Solar panels')},{id:'battery',label:t('Thuisbatterij','Home battery')},{id:'heatpump',label:t('Warmtepomp','Heat pump')},{id:'charger',label:t('Laadpaal','EV charger')}];
 const errors=adviceInputErrors(a,goals);
 const select=(key:string,label:string,options:[string,string][]) => <Field label={label}><select value={String(a[key]??'')} onChange={event=>set(key,event.target.value)}><option value="" disabled>{t('Maak een keuze','Choose an option')}</option>{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></Field>;
 const number=(key:string,label:string,{min=0,max=1e8,step='any',placeholder}:{min?:number;max?:number;step?:number|'any';placeholder?:string}={})=><NumberField label={label} value={a[key]??null} min={min} max={max} step={step} optional placeholder={placeholder} onChange={value=>set(key,value)}/>;
 const updateSolar=(value:number|null)=>{set('solar',value);set('hasSolar',(value??0)>0?'yes':'no');};
 const submit=()=>{if(errors.length){setTried(true);return;}setTried(false);onNext();};

 return <section className="aq-card aq-single-flow">
  <header className="aq-heading"><span className="pr-eyebrow">{t('ALLEEN WAT NODIG IS','ONLY WHAT IS NEEDED')}</span><h2>{t('Vertel ons wat we moeten weten.','Tell us what we need to know.')}</h2><p>{t('Uw invoer bepaalt direct het advies.','Your answers directly determine the recommendation.')}</p></header>
  <div className="aq-module-choices" aria-label={t('Gekozen producten','Selected products')}>{modules.map(module=><button key={module.id} aria-pressed={goals.includes(module.id)} disabled={goals.length===1&&goals.includes(module.id)} onClick={()=>onGoalsChange(goals.includes(module.id)?goals.filter(goal=>goal!==module.id):[...goals,module.id])}><CategoryIcon category={module.id}/><span>{module.label}</span><span className="aq-choice-mark">{goals.includes(module.id)?'✓':'+'}</span></button>)}</div>

  {(solar||heatpump)&&<div className="aq-section"><div className="aq-section-title"><House size={20}/><h3>{t('Uw woning','Your home')}</h3></div><div className="advisor-fields">
   {select('home',t('Woningtype','Home type'),[['terrace',t('Tussenwoning','Terraced house')],['corner',t('Hoekwoning','Corner house')],['semi',t('Twee-onder-een-kap','Semi-detached')],['detached',t('Vrijstaand','Detached')],['apartment',t('Appartement','Apartment')]])}
   {heatpump&&number('year',t('Bouwjaar','Construction year'),{min:1800,max:new Date().getFullYear(),step:1,placeholder:t('Bijvoorbeeld 1995','For example 1995')})}
   {heatpump&&select('insulation',t('Isolatie','Insulation'),[['poor',t('Beperkt','Limited')],['average',t('Gemiddeld','Average')],['good',t('Goed','Good')],['verygood',t('Zeer goed','Very good')]])}
   {heatpump&&number('area',t('Woonoppervlakte (m²)','Living area (m²)'),{min:20,max:2000})}
  </div></div>}

  {(solar||battery)&&<div className="aq-section"><div className="aq-section-title"><Sun size={20}/><h3>{t('Stroom en zonnepanelen','Electricity and solar')}</h3></div><div className="advisor-fields">
   {number('electricity',t('Jaarverbruik stroom (kWh)','Annual electricity use (kWh)'),{min:1})}
   <NumberField label={t('Huidige zonne-opwek (kWh/jaar)','Current solar yield (kWh/year)')} value={a.solar??null} min={0} optional placeholder="0" onChange={updateSolar}/>
   {battery&&number('exported',t('Teruglevering (kWh/jaar)','Export to grid (kWh/year)'),{min:0})}
   {select('dayHome',t('Overdag thuis','Home during the day'),[['no',t('Bijna nooit','Rarely')],['sometimes',t('Soms','Sometimes')],['often',t('Vaak','Often')]])}
  </div></div>}

  {solar&&<div className="aq-section"><div className="aq-section-title"><Sun size={20}/><h3>{t('Uw dak','Your roof')}</h3></div><div className="advisor-fields">
   {select('direction',t('Dakrichting','Roof orientation'),[['south',t('Zuid','South')],['ew',t('Oost / west','East / west')],['north',t('Noord','North')]])}
   {number('roofArea',t('Bruikbaar dakoppervlak (m²)','Usable roof area (m²)'),{min:1,max:2000})}
   {select('hasBattery',t('Aansluiten op een batterij?','Connect to a battery?'),[['no',t('Nee','No')],['yes',t('Ja','Yes')]])}
  </div></div>}

  {(solar||battery||charger)&&<div className="aq-section"><div className="aq-section-title"><PlugZap size={20}/><h3>{t('Tarieven','Rates')}</h3></div><div className="advisor-fields">
   {(solar||battery)&&select('contract',t('Contracttype','Contract type'),[['variable',t('Variabel','Variable')],['fixed',t('Vast','Fixed')],['dynamic',t('Dynamisch','Dynamic')]])}
   {number('electricityRate',t('Stroomprijs (€/kWh)','Electricity price (€/kWh)'),{min:.01,max:5})}
   {battery&&number('fixedExportFee',t('Terugleverkosten (€/jaar)','Export costs (€/year)'),{min:0})}
   {battery&&number('exportRate',t('Terugleververgoeding (€/kWh)','Export compensation (€/kWh)'),{min:0,max:5})}
  </div></div>}

  {battery&&<div className="aq-section"><div className="aq-section-title"><CategoryIcon category="battery" size={20}/><h3>{t('Thuisbatterij','Home battery')}</h3></div><Toggle label={t('Noodstroom voor de woning','Home backup')} checked={!!a.backup} onChange={value=>set('backup',value)}/></div>}

  {heatpump&&<div className="aq-section"><div className="aq-section-title"><Flame size={20}/><h3>{t('Verwarming','Heating')}</h3></div><div className="advisor-fields">
   {number('gas',t('Gasverbruik (m³/jaar)','Gas use (m³/year)'),{min:1})}
   {select('heatingSystem',t('Huidig verwarmingssysteem','Current heating system'),[['boiler',t('Cv-ketel met radiatoren','Gas boiler with radiators')],['floor',t('Cv-ketel met vloerverwarming','Gas boiler with underfloor heating')],['hybrid',t('Hybride warmtepomp','Hybrid heat pump')]])}
  </div></div>}

  {charger&&<div className="aq-section"><div className="aq-section-title"><CategoryIcon category="charger" size={20}/><h3>{t('Elektrische auto','Electric car')}</h3></div><div className="advisor-fields">
   {select('evType',t('Uw auto','Your car'),[['ev',t('Elektrische auto','Electric car')],['hybrid',t('Plug-in hybride','Plug-in hybrid')],['planned',t('Elektrische auto gepland','Electric car planned')]])}
   {number('chargingDemand',t('Laadbehoefte thuis (kWh/jaar)','Home charging demand (kWh/year)'),{min:1})}
   {number('publicChargingRate',t('Publieke laadprijs (€/kWh)','Public charging price (€/kWh)'),{min:.01,max:5})}
   {select('energyLink',t('Koppelen met','Connect with'),[['none',t('Geen bestaand systeem','No existing system')],['solar',t('Zonnepanelen','Solar panels')],['battery',t('Thuisbatterij','Home battery')],['both',t('Zonnepanelen en batterij','Solar panels and battery')]])}
  </div></div>}

  {tried&&errors.length>0&&<p className="sf-note sf-warning">{errors.includes('heatpump-input')?t('Meer woninginformatie nodig voor een betrouwbaar warmtepompadvies.','More home information is needed for reliable heat-pump advice.'):t('Vul de ontbrekende gegevens in voor een betrouwbaar advies.','Complete the missing details for a reliable recommendation.')}</p>}
  <div className="advisor-actions"><Button secondary onClick={onBack}><ArrowLeft size={16}/>{t('Producten','Products')}</Button><Button onClick={submit}>{t('Bereken mijn advies','Calculate my recommendation')}<ArrowRight size={17}/></Button></div>
 </section>;
}
