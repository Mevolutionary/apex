/* A15: weight from Apple Health, through a shortcut.
   A web app can't read Apple Health, so a small shortcut does it: it finds the latest Weight sample,
   copies "72.4 kg 2026-11-22" to the clipboard and comes back. Apex then offers to paste it, and always
   asks before logging. Links of the form ?w=72.4&d=2026-11-22 are accepted too. */
const HEALTH_SC='Apex Weight',HEALTH_LINK='';   /* HEALTH_LINK: the iCloud link once a ready-made shortcut is shared */
const healthOn=()=>{try{return localStorage.getItem('apex.health')==='1'}catch(e){return false}};
let healthPending=0;

function healthRow(){return `<div class="tile small row between"><span>Weight from Apple Health<br><span class="muted">${healthOn()?'On for this phone':'Works with smart scales'}</span></span><button class="btn sm" data-a="hl-guide">${healthOn()?'Options':'Set up'}</button></div>`}
function healthBtn(){return healthOn()?`<button class="btn block" style="margin-top:10px" data-a="hl-fetch">Get latest from Apple Health</button>`:''}

function healthGuide(){const st=(n,t,d,x)=>`<div class="step"><b>${n}</b><div><div style="font-weight:700">${t}</div><div class="small muted">${d}</div>${x||''}</div></div>`,on=healthOn();
  const make=HEALTH_LINK?st(1,'Tap Add shortcut','This opens the ready-made "'+HEALTH_SC+'" shortcut in Shortcuts. Tap "Add Shortcut" and keep its name.','<a class="btn sm" style="margin-top:8px" href="'+HEALTH_LINK+'" target="_blank" rel="noopener">Add shortcut</a>')
    :st(1,'Make a shortcut called "'+HEALTH_SC+'"','In Shortcuts tap +, name it exactly '+HEALTH_SC+', then add these actions in order:<br>• <b>Find Health Samples</b>: Type is Weight, Sort by Start Date, Latest First, Limit 1<br>• <b>Text</b>: put in the Health Samples value, a space, then its Start Date (tap the date, choose Custom format yyyy-MM-dd)<br>• <b>Copy to Clipboard</b>');
  const html=`<h2>Weight from Apple Health</h2><p>Bring in the latest weight from Apple Health, for example from a smart scale. Apex asks before saving anything, and nothing leaves your phone.</p><div class="stack">
  ${make}
  ${st(2,'Come back here and tap Test','The phone switches to Shortcuts for a moment. Allow Health access the first time, then come back to Apex and tap Paste when asked.')}
  ${st(3,'Tap Turn on','A "Get latest from Apple Health" button then appears under Log a weigh-in on the Body screen.')}
  </div><div class="row" style="margin-top:16px"><button class="btn" style="flex:1" data-a="hl-fetch">Test</button><button class="btn" style="flex:1" data-a="hl-toggle">${on?'Turn off':'Turn on'}</button></div>
  <p class="small muted" style="margin-top:12px">If your Health app uses pounds or stone, Apex converts it. This setting stays on this phone only.</p>`;
  pushSheet(html,'guide')}

/* "72.4 kg 2026-11-22", "160 lb", "72,4" and similar. Returns {kg,d} or null. */
function healthParse(txt){txt=String(txt||'').trim();if(!txt)return null;
  const m=txt.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilograms?|lbs?|pounds?|st|stone)?/i);if(!m)return null;
  let v=parseFloat(m[1].replace(',','.'));const u=(m[2]||'kg').toLowerCase();
  if(/^(lb|pound)/.test(u))v=v/2.20462;else if(/^st/.test(u))v=v*6.35029;
  const dm=txt.match(/(\d{4})-(\d{2})-(\d{2})/),d=dm?dm[0]:ymd(Date.now());
  if(!(v>=20&&v<=400)||d>ymd(Date.now()))return null;return{kg:Math.round(v*100)/100,d}}

function healthConfirm(h){const old=S.weights.find(w=>w.d===h.d),shown=disp(h.kg)+' '+unit();
  if(old&&Math.abs(old.kg-h.kg)<.05){toast('Already logged: '+shown+' on '+niceDate(new Date(h.d+'T12:00').getTime())+'.');return}
  openSheet(`<h2>Log this weight?</h2><p><b class="num">${shown}</b> on ${niceDate(new Date(h.d+'T12:00').getTime())}, from Apple Health.${old?` This replaces ${disp(old.kg)} ${unit()} logged for that day.`:''}</p><div class="row"><button class="btn" style="flex:1" data-a="close">Cancel</button><button class="btn primary" style="flex:1" data-a="hl-log" data-v="${h.kg}|${h.d}">Log it</button></div>`)}

function healthFetch(){healthPending=Date.now();try{location.href='shortcuts://run-shortcut?name='+encodeURIComponent(HEALTH_SC)}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible'||!healthPending||Date.now()-healthPending>180000)return;healthPending=0;
  setTimeout(()=>openSheet(`<h2>Weight from Apple Health</h2><p>Tap Paste to bring in the weight the shortcut copied. Your phone may ask to allow pasting.</p><div class="row"><button class="btn" style="flex:1" data-a="close">Cancel</button><button class="btn primary" style="flex:1" data-a="hl-paste">Paste</button></div>`),250)});

/* ?w=72.4&d=2026-11-22 */
(function(){try{const q=new URLSearchParams(location.search),w=q.get('w');if(!w)return;const h=healthParse(w+' '+(q.get('u')||'kg')+' '+(q.get('d')||''));
  /* the app's History screen shadows window.history, so the link can't be cleaned from the address bar;
     remember it was handled instead, so a reload doesn't ask again */
  const k='apex.hl.'+location.search;if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');if(h)setTimeout(()=>healthConfirm(h),900)}catch(e){}})();

function healthAction(a,v,b){
  if(a==='hl-guide'){healthGuide();return true}
  if(a==='hl-toggle'){try{localStorage.setItem('apex.health',healthOn()?'0':'1')}catch(e){}toast(healthOn()?'Apple Health weight is on.':'Apple Health weight is off.');closeSheet();render();return true}
  if(a==='hl-fetch'){healthFetch();return true}
  if(a==='hl-paste'){(async()=>{let t='';try{t=await navigator.clipboard.readText()}catch(e){}const h=healthParse(t);
    if(!h){toast('No weight found on the clipboard. Run the shortcut again, or check its Text action.');return}healthConfirm(h)})();return true}
  if(a==='hl-log'){const [kg,d]=String(v).split('|');saveWeigh(unit()==='lb'?+kg*LB:+kg,d,false);closeSheet();toast('Weigh-in saved from Apple Health.');return true}
  return false}
