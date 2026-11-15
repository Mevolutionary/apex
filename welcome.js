/* Apex welcome guide: shown once on a new device, and again on request from Settings, About.
   It explains what the app is, how to put it on the Home Screen (phone-specific), walks through the main screens,
   says plainly that the AI key is optional, and ends on creating an account. It replaces the older one-off sign-in
   prompt for new people. KEEP IN STEP: when a screen or setup step changes, update the matching page in wlPages(). */

(function(){const st=document.createElement('style');st.textContent=`
#welcome{position:absolute;inset:0;z-index:58;display:none;flex-direction:column;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top) + 18px) 22px calc(var(--sab,0px) + 18px);background:radial-gradient(60% 45% at 25% 15%,rgba(92,74,255,.6),transparent 70%),radial-gradient(55% 45% at 85% 90%,rgba(0,160,215,.42),transparent 70%),#060814}
#welcome.on{display:flex}
.wlcard{width:100%;max-width:460px;display:flex;flex-direction:column;flex:1;min-height:0}
.wlbody{margin:auto 0;max-height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding-bottom:6px;animation:wlin .45s cubic-bezier(.2,.9,.2,1) both}
@keyframes wlin{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
html.calm .wlbody{animation:none}
.wlbody h1{font-family:var(--display);font-weight:900;font-size:30px;line-height:1.1;margin:0}.wlbody p{margin:0;color:var(--ink-2);line-height:1.45}
.wlic{width:64px;height:64px;border-radius:20px;display:grid;place-items:center;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2)}
.wlic svg{width:32px;height:32px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.wlrow{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}
.wlrow svg{width:22px;height:22px;flex:none;margin-top:2px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.wlrow b{display:block}.wlrow span{color:var(--ink-2);font-size:14px;line-height:1.4}
.wlnum{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#14172b;font-weight:900;font-size:14px;margin-top:1px}
.wldots{display:flex;gap:6px;justify-content:center}.wldots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.25);transition:all .3s}.wldots i.on{width:20px;border-radius:9px;background:#fff}
.wlnav{display:flex;gap:10px;width:100%;max-width:460px}
`;document.head.appendChild(st)})();

let wlI=0,wlList=[],wlForce=null; /* wlForce: 'ios' | 'android' | 'app' | 'desktop', set from the owner's debug menu to preview each version */
const wlRow=(icon,title,text)=>`<div class="wlrow"><svg viewBox="0 0 24 24">${icon}</svg><div><b>${title}</b><span>${text}</span></div></div>`,wlStep=(n,title,text)=>`<div class="wlrow"><div class="wlnum">${n}</div><div><b>${title}</b><span>${text}</span></div></div>`;
function wlPages(){const ua=navigator.userAgent,android=wlForce?wlForce==='android':/Android/.test(ua),ios=wlForce?wlForce==='ios':(/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)),app=wlForce?wlForce==='app':(typeof isApp==='function'&&isApp()),P=[];
  P.push({id:'hello',html:`<div class="wlic"><svg viewBox="0 0 24 24">${ICON.train}</svg></div><h1>Welcome to Apex</h1><p>One app for your training and your food. This short guide takes about a minute, and you can skip it at any point.</p>
    ${wlRow(ICON.train,'Log workouts','Sets, PRs and a rank for each main lift.')}${wlRow(ICON.food,'Track food','Search, scan a barcode, or use a saved meal.')}${wlRow(ICON.coach||ICON.ranks,'Get a plan','The Coach builds sessions from what you are missing.')}`});
  if(!app)P.push({id:'install',html:`<div class="wlic"><svg viewBox="0 0 24 24">${ICON.home}</svg></div><h1>Put it on your Home Screen</h1><p>Do this first. It gives Apex its own icon and opens it full screen like a normal app.</p>
    ${android?wlStep(1,'Open this page in Chrome','If you are in another browser, copy the link and paste it into Chrome.')+wlStep(2,'Tap the three dots at the top right','')+wlStep(3,'Choose "Add to Home screen" or "Install app"','Then confirm.')
      :ios?wlStep(1,'Open this page in Safari','It has to be Safari. If you opened the link inside a chat app, copy it and paste it into Safari.')+wlStep(2,'Tap the Share button','The square with an arrow pointing up. On newer iPhones tap the three dots first, then Share.')+wlStep(3,'Choose "Add to Home Screen", then Add','Scroll down the list to find it.')
      :wlStep(1,'Open this link on your phone','Apex is built for a phone. Send yourself the link, open it there, and this guide shows the steps for that phone.')}
    ${wlStep(android||ios?4:2,'Open Apex from the new icon','Carry on from there. The Home Screen app keeps its own data, so create your account inside it, not here.')}
    <div class="row" style="gap:8px"><button class="btn sm" style="flex:1" data-a="app-copy">Copy link</button>${ios?'<button class="btn sm" style="flex:1" data-a="wl-icon">Choose an icon first</button>':''}</div>`});
  P.push({id:'train',html:`<div class="wlic"><svg viewBox="0 0 24 24">${ICON.train}</svg></div><h1>Training</h1><p>Tap <strong>Start workout</strong> on Home, add exercises, and tick each set as you finish it.</p>
    ${wlRow(ICON.history,'Last time is always shown','Each set shows what you did before, so you know what to beat.')}${wlRow(ICON.ranks,'PRs and ranks','Beat your best and it is marked. Each main lift earns a rank from Iron to Titan based on your bodyweight.')}${wlRow(ICON.body,'Body','Log weigh-ins, an optional progress photo and measurements.')}`});
  P.push({id:'food',html:`<div class="wlic"><svg viewBox="0 0 24 24">${ICON.food}</svg></div><h1>Nutrition</h1><p>Set your targets once, then log what you eat. Every number has a small link showing how it was worked out.</p>
    ${wlRow(ICON.scan||ICON.food,'Fast ways to add food','Search, barcode, quick add, saved meals, or copy a whole day.')}${wlRow(ICON.progress||ICON.ranks,'Targets that adapt','After a couple of weeks of logging, your calorie target adjusts to your own results.')}`});
  P.push({id:'more',html:`<div class="wlic"><svg viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg></div><h1>Everything else</h1><p><strong>Swipe up on the bar at the bottom</strong> to see every feature. Tap Edit dock there to choose which ones live in the bar and drag them into order.</p>
    ${wlRow(ICON.coach||ICON.ranks,'Coach','A weekly plan built from the muscles you are under-training, with the evidence behind it.')}${wlRow(ICON.board||ICON.ranks,'Leaderboard','Optional. Compare ranks and lifts with friends, only if you choose to join.')}${wlRow(ICON.studies||ICON.history,'Studies and Progress','New research in plain English, plus awards and a monthly recap.')}`});
  P.push({id:'ai',html:`<div class="wlic"><svg viewBox="0 0 24 24"><path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z"/></svg></div><h1>AI is optional</h1><p>Almost everything works without it. A few extras use AI: reading a nutrition label or a meal photo, study overviews, and asking questions about your own numbers.</p>
    ${wlRow('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>','It needs a free key from Google','Each person uses their own. The app walks you through it in about two minutes under Settings, Nutrition.')}${wlRow('<path d="M5 12.5l4.500 4.500L19 7.500"/>','You can skip this','Set it up later, or never. Nothing else depends on it.')}`});
  P.push({id:'account',html:`<div class="wlic"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg></div><h1>Create your account</h1><p>${app?'An account backs up your data and keeps your phone and computer in step.':'If you are putting Apex on your Home Screen, create the account there instead. Otherwise you can do it here.'}</p>
    ${wlStep(1,'Use the email you were invited with','Apex is invite-only, so it has to be the address your friend added.')}${wlStep(2,'New here? Tap Create account','Choose a password of 8 or more characters and tick the terms box. Already have an account? Tap Sign in.')}${wlStep(3,'Confirm your email','Open the email Apex sends, tap the link, then come back. Check your junk folder if it is missing.')}`,last:true});
  return P}
function wlRender(){const el=document.getElementById('welcome'),p=wlList[wlI];if(!el||!p)return;const last=wlI===wlList.length-1;
  el.innerHTML=`<div class="wlcard"><div class="wlbody">${p.html}</div></div><div class="wldots" aria-hidden="true">${wlList.map((x,i)=>`<i class="${i===wlI?'on':''}"></i>`).join('')}</div>
  <div class="wlnav" style="margin-top:14px">${wlI>0?'<button class="btn" style="flex:1" data-a="wl-back">Back</button>':'<button class="btn" style="flex:1" data-a="wl-skip">Skip</button>'}${last?'<button class="btn primary" style="flex:2" data-a="wl-account">Create account or sign in</button>':'<button class="btn primary" style="flex:2" data-a="wl-next">Next</button>'}</div>
  ${last?'<button class="info" style="margin-top:12px" data-a="wl-skip">Not now, just look around</button>':wlI>0?'<button class="info" style="margin-top:12px" data-a="wl-skip">Skip the guide</button>':''}`}
function welcomeShow(){let el=document.getElementById('welcome');if(!el){el=document.createElement('div');el.id='welcome';el.setAttribute('role','dialog');el.setAttribute('aria-label','Welcome guide');document.body.appendChild(el);
    let sx=null;el.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});el.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>70){if(dx<0&&wlI<wlList.length-1){wlI++;wlRender()}else if(dx>0&&wlI>0){wlI--;wlRender()}}},{passive:true})}
  wlList=wlPages();wlI=0;el.classList.add('on');wlRender()}
function welcomeClose(){wlForce=null;const el=document.getElementById('welcome');if(el){el.classList.remove('on');el.innerHTML=''}try{localStorage.setItem('apex.welcome','1')}catch(e){}}
function welcomeBoot(){try{if(localStorage.getItem('apex.forceWelcome')){localStorage.removeItem('apex.forceWelcome');localStorage.setItem(LS+'.loginAsked','1');welcomeShow();return}if(localStorage.getItem('apex.welcome'))return;
    /* someone already using this device (has data, a PIN, or was shown the old sign-in prompt) is not new */
    if(!isEmpty()||pinGet()||localStorage.getItem(LS+'.loginAsked')){localStorage.setItem('apex.welcome','1');return}
    localStorage.setItem(LS+'.loginAsked','1');welcomeShow()}catch(e){}}
function welcomeAction(a,v,b){switch(a){
  case 'wl-next':if(wlI<wlList.length-1){wlI++;wlRender()}break;
  case 'wl-back':if(wlI>0){wlI--;wlRender()}break;
  case 'wl-skip':welcomeClose();break;
  case 'wl-account':welcomeClose();if(typeof fbUser!=='undefined'&&fbUser){toast('You are already signed in.');break}loginSheet();break;
  case 'wl-icon':welcomeClose();if(typeof iconSheet==='function')iconSheet();break;
  case 'wl-again':closeSheet();setTimeout(welcomeShow,350);break;
  case 'debug':debugSheet();break;
  case 'dbg-wl':wlForce=v;closeSheet();setTimeout(welcomeShow,350);break;
  case 'dbg-notes':notesSheet(v==='new'?'0.50':undefined);break;
  case 'dbg-login':loginSheet();break;
  case 'dbg-gate':aiGate();break;
  case 'dbg-gem':geminiGuide();break;
  case 'dbg-summary':{const w=S.workouts[S.workouts.length-1];if(!w){toast('No workouts logged yet.');break}summarySheet(w.id,true);break}
  case 'dbg-update':openSheet('<h2>Update available</h2><p>This is a preview of the update prompt. Nothing will change.</p><button class="btn primary block" data-a="close">Close</button>','dbg');break;
  case 'dbg-lock':if(pinGet()){closeSheet();lockShow()}else toast('Set a PIN first under Settings, Security.');break;
  case 'dbg-toast':toast('This is a test message to check how notifications look when they are longer than one line.');break;
  case 'dbg-newdev':try{['apex.welcome',LS+'.loginAsked',LS+'.seen'].forEach(k=>localStorage.removeItem(k));localStorage.setItem('apex.forceWelcome','1')}catch(e){}toast('Done. Close and reopen Apex to see the first-run welcome guide.');break;
  case 'dbg-ai':lsDel('.gm');lsDel('.gml');lsDel('.gslow');toast('AI model choice cleared. The next AI request picks again.');break;
  case 'dbg-copy':navigator.clipboard.writeText(debugInfo().map(r=>r[0]+': '+r[1]).join('\n')).then(()=>toast('Copied.')).catch(()=>toast('Could not copy.'));break;
}}

/* ---------- owner-only debug menu (Settings, About). Shown only to the account that owns the Firebase project. ---------- */
function debugInfo(){let bytes=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);bytes+=k.length+(localStorage.getItem(k)||'').length}}catch(e){}
  return[['Version',VERSION],['Signed in',typeof fbUser!=='undefined'&&fbUser?'yes':'no'],['Sync',typeof cloudState!=='undefined'?cloudState:'?'],['Owner',typeof isOwner!=='undefined'&&isOwner?'yes':'no'],['Home Screen app',typeof isApp==='function'&&isApp()?'yes':'no'],['Screen',innerWidth+'×'+innerHeight+' of '+screen.width+'×'+screen.height+', fill '+(window.vgap||0)],['Workouts',S.workouts.length],['Weigh-ins',S.weights.length],['Food days',Object.keys(S.food).length],['Stored on device',Math.round(bytes/1024)+' KB'],['AI key',typeof gMem!=='undefined'&&gMem?'set':'none'],['AI model',lsGet('.gm')||'not chosen yet'],['Photo encryption',typeof vaultKey!=='undefined'&&vaultKey?'on':'off']]}
function debugRow(){return typeof isOwner!=='undefined'&&isOwner?'<div class="tile small row between"><span>Debug menu<br><span class="muted">Only your account sees this</span></span><button class="btn sm" data-a="debug">Open</button></div>':''}
function debugSheet(){if(typeof isOwner==='undefined'||!isOwner)return;const btn=(a,l,v)=>`<button class="btn sm" style="flex:1 1 46%" data-a="${a}"${v?` data-v="${v}"`:''}>${l}</button>`;
  pushMode=!!$('#scrim').classList.contains('on');openSheet(`<h2>Debug menu</h2><p class="small muted">Previews for testing. None of these change or delete your data.</p><div class="stack">
  <div><div style="font-weight:800;margin-bottom:8px">Welcome guide</div><div class="row wrap" style="gap:8px">${btn('dbg-wl','iPhone in Safari','ios')}${btn('dbg-wl','Home Screen app','app')}${btn('dbg-wl','Android','android')}${btn('dbg-wl','Computer','desktop')}${btn('dbg-newdev','Act like a new device on next open')}</div></div>
  <div><div style="font-weight:800;margin-bottom:8px">Screens and prompts</div><div class="row wrap" style="gap:8px">${btn('dbg-notes','What is new (after update)','new')}${btn('dbg-notes','All patch notes','all')}${btn('dbg-login','Sign-in prompt')}${btn('terms','Terms of use')}${btn('dbg-gate','AI sign-in notice')}${btn('dbg-gem','AI key guide')}${btn('dbg-summary','Workout summary')}${btn('dbg-update','Update prompt')}${btn('dbg-lock','Lock screen')}${btn('dbg-toast','Long message')}</div></div>
  <div><div style="font-weight:800;margin-bottom:8px">State</div><div class="list">${debugInfo().map(r=>`<div class="row between small"><span class="muted">${r[0]}</span><span style="text-align:right;overflow-wrap:anywhere">${esc(String(r[1]))}</span></div>`).join('')}</div>
  <div class="row" style="gap:8px;margin-top:10px">${btn('dbg-copy','Copy state')}${btn('dbg-ai','Reset AI model choice')}</div></div></div>`,'debug')}
