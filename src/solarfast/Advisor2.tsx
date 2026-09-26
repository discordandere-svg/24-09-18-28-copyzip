import AdvisorQuestions from './AdvisorQuestions';
import CustomerResult from './CustomerResult';
import {useMemo,useState} from 'react';
import {ArrowRight,Battery,Car,Check,Flame,Home as HomeIcon,Plus,Sun} from 'lucide-react';
import type {Project} from './types';
import {adviceInputErrors,optimizeAdvice,type AdvicePreference} from './optimizer';
import {Button,useText,Note} from './ui';

type Goal='solar'|'battery'|'heatpump'|'charger';
const goals:{id:Goal;icon:any;nl:string;en:string;helpNl:string;helpEn:string}[]=[
 {id:'solar',icon:Sun,nl:'Zonnepanelen',en:'Solar panels',helpNl:'Meer eigen energie opwekken',helpEn:'Generate more of your own energy'},
 {id:'battery',icon:Battery,nl:'Thuisbatterij',en:'Home battery',helpNl:'Minder terugleveren en slim handelen',helpEn:'Export less and trade smartly'},
 {id:'heatpump',icon:Flame,nl:'Warmtepomp',en:'Heat pump',helpNl:'Gas besparen en duurzaam verwarmen',helpEn:'Save gas and heat sustainably'},
 {id:'charger',icon:Car,nl:'Laadpaal',en:'EV charger',helpNl:'Laden met eigen energie',helpEn:'Charge with your own energy'},
];
export default function Advisor2({project,onChange}:{project:Project;onChange:(p:Project)=>void}){
 const {t}=useText();const [preference,setPreference]=useState<AdvicePreference>('balance');const [started,setStarted]=useState(project.lines.length>0);const [goalsChosen,setGoalsChosen]=useState<Goal[]>(project.lines.map(l=>l.product.category).filter(x=>x!=='extra') as Goal[]);const [step,setStep]=useState(project.lines.length?2:0);const [a,setA]=useState<any>({electricity:project.profile.electricity,exported:project.profile.exported,solar:project.profile.solar,solarYield:project.profile.solarYield,connection:'Stringomvormer',phase:3,hasSolar:project.profile.solar>0?'yes':'no',contract:project.profile.dynamic?'dynamic':'variable',electricityRate:project.profile.electricityRate,lowRate:project.profile.lowRate,highRate:project.profile.highRate,batteryCycles:350,publicChargingRate:project.profile.publicChargingRate,evConsumption:18,area:110,direction:'south',shade:'none',hpMode:'auto',evType:'none',cars:1,dayHome:'sometimes',fixedExportFee:project.profile.fixedExportFee,feeMode:'annual',exportFee:project.profile.exportFee,exportRate:project.profile.exportRate,backup:false});
 const set=(k:string,v:any)=>setA((x:any)=>{
  const heating=k==='heatingSystem'?(v==='floor'?{cvTemp:40,floorheat:true,radiators:false}:v==='hybrid'?{cvTemp:50,floorheat:true,radiators:true}:{cvTemp:60,floorheat:false,radiators:true}):{};
  return {...x,[k]:v,...heating};
 });
 const baseChosen:Goal[]=goalsChosen;const chosen:Goal[]=Array.from(new Set<Goal>(a.addBattery==='yes'?[...baseChosen,'battery']:baseChosen));const optimization=useMemo(()=>optimizeAdvice(project,a,chosen),[chosen.join(','),a,project]);

 if(!started||step===1)return <main className="advisor-start"><div className="advisor-hero"><span className="sf-eyebrow">SOLARFAST ENERGY ADVISOR</span><h1>{t('Wat wilt u verduurzamen?','What would you like to improve?')}</h1><p>{t('Kies één of meer doelen. We stellen daarna alleen de vragen voor die modules.','Choose one or more goals. We will then ask only the questions for those modules.')}</p></div><div className="advisor-goals">{goals.map(g=>{const I=g.icon;const on=goalsChosen.includes(g.id);return <button key={g.id} className={on?'active':''} onClick={()=>setGoalsChosen(x=>on?x.filter(y=>y!==g.id):[...x,g.id])} aria-pressed={on}><I size={28}/><strong>{t(g.nl,g.en)}</strong><span>{t(g.helpNl,g.helpEn)}</span>{on&&<Check className="advisor-check"/>}</button>})}<button className="complete" onClick={()=>setGoalsChosen(goals.map(g=>g.id))}><HomeIcon size={28}/><strong>{t('Complete oplossing','Complete solution')}</strong><span>{t('Alle modules combineren','Combine all modules')}</span></button></div><Button disabled={!goalsChosen.length} onClick={()=>{setStarted(true);setStep(2)}}>{t('Start mijn persoonlijk advies','Start my personal advice')} <ArrowRight size={18}/></Button></main>;
 return <div className="advisor-shell"><div className="advisor-top"><div><span className="sf-eyebrow">ENERGY ADVISOR</span><h1>{t('Uw persoonlijk energieadvies','Your personal energy advice')}</h1></div><button className="sf-text-button" onClick={()=>setStarted(false)}>{t('Opnieuw beginnen','Start over')}</button></div><div className="advisor-progress">{[[1,t('Producten','Products')],[2,t('Vragen','Questions')],[3,t('Advies','Advice')]] .map(([target,label],i)=><button key={String(label)} className={(step>=3?3:step)===target?'active':''} disabled={i===2&&!chosen.length} onClick={()=>setStep(target as number)}><span>{i+1}</span>{label}</button>)}</div>
 {step===2&&<AdvisorQuestions answers={a} set={set} goals={chosen} project={project} onGoalsChange={setGoalsChosen} preference={preference} onPreference={setPreference} onBack={()=>setStep(1)} onNext={()=>setStep(3)}/>}
 {(step===3||step===4)&&<>
 {step===3&&!optimization.best?<section className="advisor-card"><h2>{t('Uw persoonlijk advies','Your personal advice')}</h2><Note warning>{optimization.errors.includes('heatpump-input')?t('Meer woninginformatie nodig voor een betrouwbaar warmtepompadvies.','More home information is needed for reliable heat-pump advice.'):optimization.errors.length?t('Controleer uw verbruik en woninggegevens.','Check your energy use and home details.'):t('Geen passend plan gevonden. Pas uw gegevens of doelen aan.','No suitable plan was found. Adjust your details or goals.')}</Note><Button secondary onClick={()=>setStep(2)}>{t('Gegevens aanpassen','Edit details')}</Button></section>:<CustomerResult answers={a} goals={chosen} onGoals={(next,plan)=>{onChange(plan);setGoalsChosen(next);setStep(adviceInputErrors(a,next).length?2:3);}} onAnswer={(key,value,plan)=>{onChange(plan);set(key,value);setStep(3);}} project={step===3&&optimization.variants[preference]?{...project,profile:optimization.profile,lines:optimization.variants[preference]!.lines}:project} preference={preference} onPreference={setPreference} optimization={optimization} applied={step===4} onApply={plan=>{onChange(plan);setStep(4);}} onBack={()=>setStep(2)}/>} 
 {step===4&&<details className="pr-details"><summary>{t('Uw plan uitbreiden','Extend your plan')} <Plus size={17}/></summary><div className="advisor-add">{goals.map(g=><button key={g.id} onClick={()=>{if(!goalsChosen.includes(g.id))setGoalsChosen(x=>[...x,g.id]);setStep(2)}}>{t(g.nl,g.en)} <ArrowRight size={15}/></button>)}</div></details>}
 </>}

 </div>;
}
