import {useState,useEffect,useRef} from 'react';
import {Menu,X,ArrowRight,Check,Leaf} from 'lucide-react';
import type {Page,Category,Project,Product} from './types';
import {emptyProject} from './catalog';
import {addProduct,parseProject,normalizeProject} from './engine';
import {LanguageProvider,useText,Button,Note} from './ui';
import {Home,InfoPage} from './Content';
import {Products} from './Products';
import {downloadProject} from './Report';
import Advisor from './Advisor2';
const storageKey='solarfast-complete-project-v1';
const pages:Page[]=['home','products','how','hyxi','finance','about','faq','builder'];
function initialPage():Page{const hash=location.hash.slice(1) as Page;return pages.includes(hash)?hash:'home';}
function readProject(){try{const s=localStorage.getItem(storageKey);return {project:s?parseProject(JSON.parse(s)):emptyProject(),error:false};}catch{return {project:emptyProject(),error:true};}}
function Site(){
 const {t,lang,setLang}=useText();const [initial]=useState(readProject);const [project,setProject]=useState<Project>(initial.project);const projectRef=useRef(project);const [storageError,setStorageError]=useState(initial.error);const [page,setPage]=useState<Page>(initialPage);const [mobile,setMobile]=useState(false);const [category,setCategory]=useState<Category>('battery');const [notice,setNotice]=useState<'added'|'already'|'saved'|'limit'|null>(null);const heading=useRef<HTMLElement>(null);
 const updateProject=(next:Project|((previous:Project)=>Project))=>{const updated=normalizeProject(typeof next==='function'?next(projectRef.current):next);projectRef.current=updated;setProject(updated);};
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(project));setStorageError(false);}catch{setStorageError(true);}},[project]);
 useEffect(()=>{const onHash=()=>{setPage(initialPage());setMobile(false);};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash);},[]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});heading.current?.focus({preventScroll:true});},[page]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(null),5000);return()=>clearTimeout(timer);},[notice]);
 const nav: [Page,string][]=[['home',t('Home','Home')],['products',t('Aanbod','Products')],['how',t('Hoe werkt het?','How it works')],['hyxi','HYXiPOWER'],['finance','Warmtefonds'],['about',t('Over ons','About us')],['faq','FAQ']];
 const navigate=(p:Page)=>{location.hash=p;setPage(p);setMobile(false);};
 const saveProduct=(p:Product)=>{updateProject(prev=>({...prev,customProducts:[...prev.customProducts.filter(v=>v.id!==p.id),p]}));setNotice('saved');};
  // One configured system per energy module. Repeated clicks are idempotent;
  // choosing another product replaces the current module atomically.
  const add=(p:Product)=>{
   const transaction=addProduct(projectRef.current,p);
   if(transaction.project!==projectRef.current)updateProject(transaction.project);
   setNotice(transaction.outcome);
  };
 const selectedIds=project.lines.map(l=>l.product.id);
 const takenCategories=Array.from(new Set(project.lines.map(l=>l.product.category).filter(c=>c!=='extra')));
 const showSummary=()=>navigate('builder');
 const notifications={added:t('Je plan is bijgewerkt.','Your plan has been updated.'),already:t('Dit product staat al in je plan.','This product is already in your plan.'),saved:t('Catalogusproduct opgeslagen.','Catalogue product saved.'),limit:t('Het maximum voor dit plan is bereikt.','This plan has reached its limit.')};
 return <div className="sf-site"><a className="sf-skip" href="#main-content">{t('Naar inhoud','Skip to content')}</a>
  <div className="sf-topbar">{t('Alles voor een slimmer, duurzamer thuis.','Everything for a smarter, more sustainable home.')}<a href="mailto:info@solarfast.nl">info@solarfast.nl <span>↗</span></a></div>
  <header className="sf-header no-print"><a className="sf-logo" href="#home" onClick={()=>navigate('home')} aria-label="SolarFast Home"><span><Leaf size={23}/></span>SOLAR<span className="sf-logo-light">FAST</span><i>®</i></a><nav className="sf-desktop-nav" aria-label={t('Hoofdnavigatie','Main navigation')}>{nav.map(([key,label])=><a href={`#${key}`} key={key} aria-current={page===key?'page':undefined} className={page===key?'active':''}>{label}</a>)}</nav><div className="sf-header-actions"><div className="sf-language" aria-label={t('Taal','Language')}><button aria-pressed={lang==='nl'} onClick={()=>setLang('nl')}>NL</button><span>/</span><button aria-pressed={lang==='en'} onClick={()=>setLang('en')}>EN</button></div><Button onClick={()=>navigate('builder')} className="sf-header-cta">{t('Mijn energieplan','My energy plan')}{project.lines.length>0&&<span className="sf-count">{project.lines.reduce((n,l)=>n+l.quantity,0)}</span>}<ArrowUp/></Button><button className="sf-menu-button" aria-expanded={mobile} aria-controls="mobile-nav" aria-label={t('Menu','Menu')} onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button></div></header>
  {mobile&&<nav id="mobile-nav" className="sf-mobile-nav no-print">{nav.map(([key,label])=><a key={key} href={`#${key}`} onClick={()=>navigate(key)}>{label}</a>)}<Button onClick={()=>navigate('builder')}>{t('Mijn energieplan','My energy plan')} ({project.lines.length})</Button></nav>}
  {storageError&&<Note warning>{t('Opslaan in deze browser lukt niet. Download je plan om wijzigingen te bewaren.','Saving in this browser is unavailable. Download your plan to keep changes.')}</Note>}
  <main id="main-content" ref={heading} tabIndex={-1} className={`sf-main ${page==='builder'?'sf-builder-page':''}`}>
   {page==='home'&&<Home navigate={navigate} choose={c=>{setCategory(c);navigate('products');}}/>}
   {page==='products'&&<><Products key={category} initialCategory={category} customProducts={project.customProducts} onSaveProduct={saveProduct} onAdd={add} selectedIds={selectedIds} takenCategories={takenCategories}/>{project.lines.length>0&&<div className="sf-floating-plan"><span>{project.lines.reduce((n,l)=>n+l.quantity,0)} {t('producten in je plan','products in your plan')}</span><Button onClick={()=>navigate('builder')}>{t('Bekijk mijn plan','View my plan')}<ArrowRight size={18}/></Button></div>}</>}
   {page!=='home'&&page!=='products'&&page!=='builder'&&<InfoPage page={page} navigate={navigate}/>}
   {page==='builder'&&<Advisor project={project} onChange={updateProject}/>} 
  </main>
  <footer className="sf-footer no-print"><div className="sf-footer-grid"><div><a className="sf-logo" href="#home"><span><Leaf size={22}/></span>SOLAR<span className="sf-logo-light">FAST</span></a><p>{t('Jouw energie. Duidelijk geregeld.','Your energy. Clearly planned.')}<br/>{t('Opwekken · opslaan · verwarmen · laden','Generate · store · heat · charge')}</p><a href="mailto:info@solarfast.nl">info@solarfast.nl ↗</a></div><div><h3>{t('Ontdek','Explore')}</h3>{nav.slice(1,4).map(([p,n])=><a href={`#${p}`} key={p}>{n}</a>)}</div><div><h3>{t('SolarFast','SolarFast')}</h3>{nav.slice(4).map(([p,n])=><a href={`#${p}`} key={p}>{n}</a>)}</div><div><h3>{t('Jouw plan','Your plan')}</h3><a href="#builder">{t('Systeem samenstellen','Build your system')}</a><button onClick={()=>downloadProject(project)}>{t('Plan downloaden','Download plan')}</button><a href="/solarfast-brondocument.txt" download>{t('Bron- en prijslijsten (NL)','Source and price lists (NL)')}</a></div></div><div className="sf-footer-bottom"><span>© {new Date().getFullYear()} SolarFast</span><span>{t('Indicatieve berekeningen. Definitieve afspraken staan in je offerte.','Indicative calculations. Final agreements are set out in your quotation.')}</span></div></footer>
  {notice&&<div className="sf-toast no-print" role="status"><Check size={18}/><span>{notifications[notice]}</span>{notice==='added'&&<button onClick={()=>{showSummary();setNotice(null);}}>{t('Bekijk plan','View plan')} →</button>}<button aria-label={t('Melding sluiten','Close notification')} onClick={()=>setNotice(null)}><X size={17}/></button></div>}
 </div>;
}
function ArrowUp(){return <span aria-hidden="true">↗</span>;}
export default function SolarFastSite(){return <LanguageProvider><Site/></LanguageProvider>;}
