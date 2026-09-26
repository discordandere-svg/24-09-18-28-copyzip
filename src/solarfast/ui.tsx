import {createContext,useContext,useState,useEffect,useId,useRef,cloneElement,isValidElement,type ReactNode,type ReactElement} from 'react';
import {createPortal} from 'react-dom';
import {X,ArrowUpRight,BatteryCharging,Sun,Flame,PlugZap,Plus} from 'lucide-react';
import type {Category,Product} from './types';
export const LanguageContext=createContext({lang:'nl',setLang:(_s:string)=>{}});
export function LanguageProvider({children}:{children:ReactNode}){
  const [lang,setLang]=useState(()=>{try{return localStorage.getItem('solarfast-site-language')==='en'?'en':'nl';}catch{return 'nl';}});
  useEffect(()=>{document.documentElement.lang=lang;document.title='SolarFast — '+(lang==='nl'?'Jouw energie. Jouw plan.':'Your energy. Your plan.');try{localStorage.setItem('solarfast-site-language',lang);}catch{}},[lang]);
  return <LanguageContext.Provider value={{lang,setLang}}>{children}</LanguageContext.Provider>;
}
export function useText(){const {lang,setLang}=useContext(LanguageContext);const locale=lang==='nl'?'nl-NL':'en-GB';return {lang,setLang,t:(nl:string,en:string)=>lang==='nl'?nl:en,money:(n:number,digits=0)=>new Intl.NumberFormat(locale,{style:'currency',currency:'EUR',maximumFractionDigits:digits,minimumFractionDigits:digits}).format(n),num:(n:number,digits=1)=>new Intl.NumberFormat(locale,{maximumFractionDigits:digits}).format(n),productName:(p:Product)=>lang==='en'?(p.nameEn??p.name):p.name};}
export const icons={battery:BatteryCharging,solar:Sun,heatpump:Flame,charger:PlugZap,extra:Plus};
export function useCategories(){const {t}=useText();return {battery:t('Thuisbatterijen','Home batteries'),solar:t('Zonnepanelen','Solar panels'),heatpump:t('Warmtepompen','Heat pumps'),charger:t('Laadpalen','EV chargers'),extra:t('Extra’s & maatwerk','Extras & custom work')};}
export function CategoryIcon({category,size=22}:{category:Category;size?:number}){const Icon=icons[category];return <Icon size={size} strokeWidth={1.6}/>;}
export function Button({children,onClick,secondary=false,type='button',disabled=false,className=''}:{children:ReactNode;onClick?:()=>void;secondary?:boolean;type?:'button'|'submit';disabled?:boolean;className?:string}){return <button type={type} onClick={onClick} disabled={disabled} className={`sf-button ${secondary?'sf-secondary':''} ${className}`}>{children}</button>;}
export function Arrow(){return <ArrowUpRight size={18} aria-hidden="true"/>;}
export function SectionHeading({eyebrow,title,children}:{eyebrow:string;title:string;children?:ReactNode}){return <div className="sf-section-heading"><span className="sf-eyebrow">{eyebrow}</span><h1>{title}</h1>{children&&<p>{children}</p>}</div>;}
export function Field({label,help,children}:{label:string;help?:string;children:ReactNode}){const id=useId();return <div className="sf-field"><label htmlFor={id}>{label}</label>{isValidElement(children)?cloneElement(children as ReactElement<{id?:string;'aria-describedby'?:string}>,{id,'aria-describedby':help?`${id}-help`:undefined}):children}{help&&<small id={`${id}-help`}>{help}</small>}</div>;}
export function NumberField({label,help,value,onChange,min=0,max=100000000,step='any',optional=false,placeholder}:{label:string;help?:string;value:number|null;onChange:(value:number|null)=>void;min?:number;max?:number;step?:number|'any';optional?:boolean;placeholder?:string}){
 const {t}=useText(); const [draft,setDraft]=useState(value===null?'':String(value));
 useEffect(()=>{setDraft(value===null?'':String(value));},[value]);
 return <Field label={label} help={help}><input type="number" inputMode="decimal" min={min} max={max} step={step} required={!optional} value={draft} aria-invalid={draft!==''&&(Number(draft)<min||Number(draft)>max)||undefined} placeholder={placeholder??(optional?t('Prijs invullen','Enter price'):undefined)} onChange={e=>{setDraft(e.target.value);const n=e.target.valueAsNumber;if(Number.isFinite(n)&&n>=min&&n<=max&&(step!==1||Number.isInteger(n)))onChange(n);else if(e.target.value===''&&optional)onChange(null);}} onBlur={()=>{if(draft===''&&optional)return;const n=Number(draft);if(draft===''||!Number.isFinite(n)||n<min||n>max||(step===1&&!Number.isInteger(n)))setDraft(value===null?'':String(value));}}/></Field>;
}
export function Toggle({label,checked,onChange,help}:{label:string;checked:boolean;onChange:(v:boolean)=>void;help?:string}){return <label className="sf-toggle"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span>{label}{help&&<small>{help}</small>}</span></label>;}
export function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);const id=useId();const {t}=useText();
 useEffect(()=>{const dialog=ref.current;const previous=document.activeElement as HTMLElement;const old=document.body.style.overflow;dialog?.showModal();document.body.style.overflow='hidden';return()=>{dialog?.close();document.body.style.overflow=old;previous?.focus();};},[]);
 return createPortal(<dialog className="sf-dialog" ref={ref} aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}}><div className="sf-dialog-top"><h2 id={id}>{title}</h2><button className="sf-icon-button" onClick={onClose} aria-label={t('Sluiten','Close')}><X/></button></div>{children}</dialog>,document.body);
}
export function Note({children,warning=false}:{children:ReactNode;warning?:boolean}){return <p className={`sf-note ${warning?'sf-warning':''}`}>{children}</p>;}
