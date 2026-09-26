import {useText} from './ui';
export function House(){const {t}=useText();return <div className="sf-house" role="img" aria-label={t('Schematische woning met zonnepanelen, thuisbatterij, warmtepomp en laadpaal','Illustration of a home with solar panels, a battery, a heat pump and an EV charger')}>
  <div className="sf-house-tag"><span className="sf-live-dot"/>{t('Alles werkt samen','Everything works together')}</div>
  <svg viewBox="0 0 640 470" aria-hidden="true">
    <defs><linearGradient id="roof" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#334b47"/><stop offset="1" stopColor="#122d28"/></linearGradient><linearGradient id="wall" x1="0" x2="1"><stop stopColor="#f6f1e4"/><stop offset="1" stopColor="#d8decd"/></linearGradient><pattern id="panel" width="23" height="19" patternUnits="userSpaceOnUse"><rect width="23" height="19" fill="#264953"/><path d="M0 0H23V19" stroke="#95b7b1" strokeWidth=".7"/></pattern></defs>
    <ellipse cx="330" cy="384" rx="272" ry="47" fill="#000" opacity=".09"/>
    <path d="M61 328L304 195L602 350L353 458Z" fill="#c9d1b7"/>
    <path d="M139 217L335 113L501 204V335L310 430L139 336Z" fill="url(#wall)"/>
    <path d="M310 237L501 145V335L310 430Z" fill="#bac5b3"/>
    <path d="M111 225L292 59L525 181L329 280Z" fill="url(#roof)"/>
    <path d="M111 225L292 59L347 86L163 248Z" fill="#466059"/>
    <path d="M182 219L295 108L456 193L326 254Z" fill="url(#panel)" stroke="#8eaaa0" strokeWidth="3"/>
    <path d="M182 275L240 305V357L182 326Z" fill="#49685d"/><path d="M247 309L289 331V398L247 376Z" fill="#173b30"/>
    <path d="M359 291L398 272V325L359 344Z" fill="#284b42"/><path d="M426 258L469 237V290L426 313Z" fill="#284b42"/>
    <path d="M378 206L378 230M320 239L320 262M259 213L260 239M237 166L346 225M266 136L391 202" stroke="#91b1a7" strokeWidth="1"/>
    <g transform="translate(477 310)"><path d="M0 0L30-15L50-3V71L20 86L0 74Z" fill="#e9ede4"/><path d="M20 12L50-3V71L20 86Z" fill="#c1cbbd"/><path d="M0 0L20 12V86L0 74Z" fill="#fafff5"/><path d="M22 38L47 25M22 59L47 46" stroke="#91a292"/><path d="M26 18L43 9" stroke="#c3ef70" strokeWidth="4"/></g>
    <g transform="translate(96 324)"><path d="M0 0L28-15L80 11V65L52 80L0 54Z" fill="#eceee5"/><path d="M52 26L80 11V65L52 80Z" fill="#a1b09e"/><ellipse cx="26" cy="37" rx="18" ry="23" transform="rotate(-24 26 37)" fill="#305347"/><path d="M12 21L40 48M12 35L37 34M24 16L25 58" stroke="#90a790" strokeWidth="2"/></g>
    <g transform="translate(556 294)"><path d="M0 0L18-9L29-3V49L12 57L0 49Z" fill="#243e32"/><path d="M7 7L21 0V18L7 25Z" fill="#d1f38b"/><path d="M28 25Q54 54 32 71Q12 72 24 43" stroke="#203e31" strokeWidth="5" fill="none"/></g>
    <path d="M154 375L301 448L535 333" stroke="#c2e96b" strokeWidth="4" fill="none" strokeDasharray="7 7"/>
    <circle cx="301" cy="448" r="7" fill="#d4fa8e"/>
    <path d="M70 285V220M65 249L39 229M72 238L95 217" stroke="#506443" strokeWidth="5"/><circle cx="62" cy="213" r="35" fill="#8aa675"/><circle cx="81" cy="229" r="27" fill="#789263"/>
  </svg>
  <div className="sf-house-footer"><span>{t('Opwekken. Opslaan. Verwarmen. Laden.','Generate. Store. Heat. Charge.')}</span><small>{t('Schematische weergave','Illustrative view')}</small></div>
</div>;}
