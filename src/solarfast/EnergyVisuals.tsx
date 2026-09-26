import {useId} from 'react';
import {ArrowUpRight,House,Sun,Zap} from 'lucide-react';
import type {Category,Project} from './types';
import {CategoryIcon,useText} from './ui';

/** Stylised illustrations, not manufacturer photography or installation drawings. */
export function ProductVisual({category}:{category:Category}){
 const id=useId().replaceAll(':','');
 return <svg className={`ev-product ev-product-${category}`} viewBox="0 0 300 210" aria-hidden="true">
 <defs><linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".6" stopColor="#e5e9e4"/><stop offset="1" stopColor="#b5c1b7"/></linearGradient><linearGradient id={`${id}-dark`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#45615b"/><stop offset="1" stopColor="#172f29"/></linearGradient><radialGradient id={`${id}-shadow`}><stop stopColor="#142f27" stopOpacity=".17"/><stop offset="1" stopColor="#142f27" stopOpacity="0"/></radialGradient></defs>
 <ellipse cx="150" cy="188" rx="104" ry="15" fill={`url(#${id}-shadow)`}/>
 <g className="ev-device">
 {category==='battery'&&<><path d="M112 31 177 23 199 36 134 45Z" fill="#f9fcf8"/><path d="M177 23 199 36 199 173 177 182Z" fill="#b4c0b4"/><path d="M112 31 177 23V182L112 173Z" fill={`url(#${id}-body)`}/><path d="m113 70 63-6m-63 45 63-2m-63 39 63 3" stroke="#b4c1b5"/><rect x="126" y="44" width="30" height="11" rx="3" fill="#304b40"/><path d="M134 49h13" stroke="#a6cd7f" strokeWidth="2"/><circle cx="164" cy="49" r="2" fill="#91c46a"/><path d="m119 174 1 9 52 8 1-9" fill="#78907e"/><text x="121" y="94" fontSize="6" fill="#677d6a" letterSpacing="1">ENERGY STORAGE</text></>}
 {category==='heatpump'&&<><path d="m60 74 148-18 73 25-149 20Z" fill="#f5f8f1"/><path d="m209 69 12 12v84l-12 9Z" fill="#82958a"/><path d="m60 74 149-5v105L60 165Z" fill={`url(#${id}-body)`}/><rect x="70" y="91" width="116" height="59" rx="4" fill="#263f36"/><ellipse cx="112" cy="120" rx="28" ry="27" fill="#40594d" stroke="#728774"/>{Array.from({length:8},(_,i)=><path key={i} d="M112 120c-18-19-23-8-18 2 5 8 12 8 18-2" fill="#6e8270" transform={`rotate(${i*45} 112 120)`}/>)}<circle cx="112" cy="120" r="7" fill="#263f36"/>{Array.from({length:9},(_,i)=><path key={i} d={`M150 ${97+i*6}h29`} stroke="#78927f" strokeWidth="1"/>)}<path d="M72 168v12h17v-10m94 3v10h15v-9" fill="#617b69"/><rect x="168" y="79" width="23" height="4" rx="2" fill="#50784a"/></>}
 {category==='solar'&&<><path d="M71 159 95 81 233 88 207 175Z" fill="#bbc9bf"/><path d="M63 151 91 66 233 80 204 165Z" fill="#eff5f1" stroke="#b1c3b9" strokeWidth="3"/><path d="M70 147 95 72 226 84 201 158Z" fill={`url(#${id}-dark)`}/>{[0,1,2,3,4].map(i=><path key={i} d={`M${96+i*26} ${74+i*2.4}l-24 74`} stroke="#8ca5a0" strokeWidth=".7"/>)}{[0,1,2,3,4].map(i=><path key={i} d={`M${93-i*5} ${78+i*16}l130 12`} stroke="#8ca5a0" strokeWidth=".7"/>)}<path d="m82 157-5 20m117-9-5 19" stroke="#8a9b90" strokeWidth="5"/></>}
 {category==='charger'&&<><path d="M135 23h32l12 12v94l-12 8h-32Z" fill="#74897b"/><rect x="120" y="23" width="47" height="110" rx="18" fill={`url(#${id}-dark)`}/><rect x="128" y="32" width="31" height="57" rx="12" fill="#244236"/><path d="M136 44h15" stroke="#b7d686" strokeWidth="3" strokeLinecap="round"/><circle cx="144" cy="107" r="10" fill="#182d26" stroke="#7d927e"/><path d="M143 115v45c0 40 69 38 69-3v-43" fill="none" stroke="#354c3b" strokeWidth="6" strokeLinecap="round"/><rect x="203" y="97" width="18" height="32" rx="5" fill="#294233" transform="rotate(15 212 114)"/><path d="m212 99 3-12" stroke="#47634e" strokeWidth="5"/><path d="M143 134v44" stroke="#a6b5a8" strokeWidth="6"/></>}
 {category==='extra'&&<><path d="M102 77 149 51 198 76v76l-49 27-47-27Z" fill={`url(#${id}-body)`}/><path d="m102 77 47 28 49-29m-49 29v74" fill="none" stroke="#9aaf9f"/><path d="M138 138h23m-12-12v24" stroke="#4c7253" strokeWidth="3"/></>}
 </g></svg>;
}
export function EnergyScene({project}:{project:Project}){
 const id=useId().replaceAll(':','');const {t}=useText();const has=(c:Category)=>project.lines.some(l=>l.product.category===c);
 const solar=has('solar')||project.profile.solar>0;
 return <div className="ev-scene" role="img" aria-label={t('Illustratie van uw woning met de geselecteerde energiesystemen','Illustration of your home with the selected energy systems')}>
 <div className="ev-scene-caption"><span className="pr-eyebrow">{t('UW COMPLETE ENERGIEPLAN','YOUR COMPLETE ENERGY PLAN')}</span><span>{t('Opwekken. Opslaan. Verwarmen. Laden.','Generate. Store. Heat. Charge.')}</span></div>
 <svg viewBox="0 0 900 380" aria-hidden="true"><defs><linearGradient id={`${id}-wall`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f9faf5"/><stop offset="1" stopColor="#d8dfd2"/></linearGradient><linearGradient id={`${id}-roof`} x1="0" x2="1"><stop stopColor="#718279"/><stop offset="1" stopColor="#354d42"/></linearGradient><radialGradient id={`${id}-ground`}><stop stopColor="#8f9e81" stopOpacity=".26"/><stop offset="1" stopColor="#a0b497" stopOpacity="0"/></radialGradient><linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8ea8a0"/><stop offset="1" stopColor="#d5e6de"/></linearGradient></defs>
 <ellipse cx="450" cy="297" rx="340" ry="65" fill={`url(#${id}-ground)`}/>
 <path d="m193 276 270-73 253 85-278 73Z" fill="#e7ecdf" stroke="#dce5d5"/>
 <path d="m480 306 106 36 105-27-97-37Z" fill="#cdd8c7"/>
 <g className="ev-home"><path d="M304 162 458 122 590 169v111l-154 45-132-45Z" fill={`url(#${id}-wall)`}/><path d="m436 210 154-41v111l-154 45Z" fill="#c3cdbd"/><path d="m288 164 75-101 141 43-67 109Z" fill={`url(#${id}-roof)`}/><path d="m363 63 143-38 97 146-166 44 67-109Z" fill="#536b5d"/><path d="m288 164 149 51 166-44" fill="none" stroke="#354e3f" strokeWidth="5"/><path d="m305 177 119 40v94l-119-40Z" fill="#e2e7da"/>
 <path d="m321 204 39 13v66l-39-13Z" fill={`url(#${id}-glass)`} stroke="#7d9280" strokeWidth="3"/><path d="m376 223 29 10v76l-29-10Z" fill="#849682"/><path d="m454 225 112-31v63l-112 33Z" fill={`url(#${id}-glass)`} stroke="#edf0e6" strokeWidth="5"/><path d="m491 214v65m37-77v64" stroke="#e2e9de" strokeWidth="3"/><path d="m447 295 129-37 16 7-134 40Z" fill="#a2b29e"/>
 {solar&&<g className="ev-roof-panels"><path d="m395 78 84 24-39 65-84-26Z" fill="#213d35" stroke="#d1e0d4" strokeWidth="2"/><path d="m423 86-39 64m28 9 39-65m-68 2 84 25m-97-3 84 25" stroke="#698c7e" strokeWidth="1"/><path d="m509 57 39 60-51 14-25-38Z" fill="#234237" stroke="#c6d7c9" strokeWidth="2"/><path d="m494 72 32 51m-42-36 43-12m-32 29 42-12" stroke="#698c7e"/></g>}
 {has('battery')&&<g><path d="m270 220 25-7 16 8v63l-25 8-16-8Z" fill="#f4f7ed" stroke="#b4c2ad"/><path d="m295 213 16 8v63l-16 8Z" fill="#c4d0bd"/><path d="m272 242 22-6m-22 24 22-6" stroke="#b9c8b2"/><path d="m278 230 10-3" stroke="#5d9250" strokeWidth="3"/></g>}
 {has('heatpump')&&<g><path d="m565 269 43-12 27 9v39l-43 14-27-10Z" fill="#eff3e8" stroke="#a7bba0"/><path d="m565 277 43-12v32l-43 13Z" fill="#516b55"/><ellipse cx="586" cy="287" rx="13" ry="13" fill="#34553d" stroke="#9eb994"/><path d="m579 278 14 18m-14 0 14-18" stroke="#8cae7e" strokeWidth="2"/></g>}
 {has('charger')&&<g><path d="M657 222v69" stroke="#8b9f85" strokeWidth="5"/><rect x="644" y="198" width="24" height="43" rx="8" fill="#2b4b36"/><path d="M651 206h10" stroke="#b6d991" strokeWidth="2"/><path d="M667 230c26 2 29 50 1 54" stroke="#537c4b" strokeWidth="3" fill="none"/><path d="m685 282 17-31 41-5 29 28v20l-79 15-11-14Z" fill="#f4f6ed" stroke="#a9b99e"/><path d="m705 254 32-4 20 21-62 12Z" fill="#6b8678"/><ellipse cx="701" cy="302" rx="8" ry="11" fill="#38503c"/><ellipse cx="759" cy="290" rx="8" ry="11" fill="#38503c"/></g>}
 </g>
 <g className="ev-garden" fill="#a8bc93"><ellipse cx="229" cy="230" rx="18" ry="31"/><path d="M229 230v44" stroke="#829a71" strokeWidth="4"/><ellipse cx="620" cy="174" rx="21" ry="34"/><path d="M620 174v45" stroke="#829a71" strokeWidth="4"/><ellipse cx="252" cy="292" rx="19" ry="10"/><ellipse cx="546" cy="336" rx="25" ry="9"/></g>
 <g className="ev-energy-paths" fill="none" stroke="#7daa57" strokeWidth="2" strokeLinecap="round">
 {solar&&<path d="M411 148v64l25 10v56"/>}{has('battery')&&<path d="m288 289 36 12 112-23"/>}{has('heatpump')&&<path d="m436 278 68 33 81-21"/>}{has('charger')&&<path d="m436 278 111 49 112-36"/>}
 </g></svg>
 <span className="ev-illustration-label">{t('Impressie van uw energiesysteem','An impression of your energy system')}</span>
 </div>;
}
export function EnergyFlow({project}:{project:Project}){
 const {t}=useText();const has=(category:Category)=>project.lines.some(l=>l.product.category===category);
 const solar=has('solar')||project.profile.solar>0;
 const nodes=[
  {id:'source',Icon:solar?Sun:Zap,label:solar?t('Zon','Sun'):t('Energienet','Energy grid'),text:solar?t('Energie van uw eigen dak','Energy from your own roof'):t('Energie voor uw woning','Energy for your home')},
  ...(has('battery')?[{id:'battery',category:'battery' as Category,label:t('Batterij','Battery'),text:t('Bewaren voor later','Store for later')}]:[]),
  {id:'home',Icon:House,label:t('Woning','Home'),text:t('Uw energie komt thuis','Your energy comes home')},
  ...(has('heatpump')?[{id:'heatpump',category:'heatpump' as Category,label:t('Warmtepomp','Heat pump'),text:t('Comfortabel verwarmen','Comfortable heating')}]:[]),
  ...(has('charger')?[{id:'charger',category:'charger' as Category,label:t('Auto','Car'),text:t('Thuis slim opladen','Smart charging at home')}]:[]),
 ];
 return <section className="ev-flow pr-reveal"><header><span className="pr-eyebrow">{t('ENERGIESTROOM','ENERGY FLOW')}</span><h3>{t('Zo werkt uw energiesysteem samen.','How your energy system works together.')}</h3></header><div className="ev-flow-track" aria-label={t('Schematische energiestroom','Schematic energy flow')}>{nodes.map(node=><div className={`ev-flow-node ${node.id==='home'?'ev-flow-home':''}`} key={node.id}><span className="ev-flow-icon">{'Icon' in node&&node.Icon?<node.Icon size={24}/>:<CategoryIcon category={'category' in node?node.category!:'extra'} size={24}/>}</span><strong>{node.label}</strong><small>{node.text}</small><ArrowUpRight size={15}/></div>)}</div><p>{t('Schematische weergave van uw complete energieplan.','A schematic view of your complete energy plan.')}</p></section>;
}
