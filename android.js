/* Apex on Android: only switches on when Apex runs on an Android phone (or when previewed from the owner's debug menu),
   so nothing here changes the iPhone app.
   - Android's own gestures win at the screen edges: swipe up from the bottom goes Home and a swipe in from the left or
     right edge means Back. So the dock sits higher, page swipes that start at an edge are left to Android, and a small
     handle above the dock opens all features with a tap (swiping up on the dock itself still works too).
   - The Back button closes whatever is on top first (a sheet, the launcher, the welcome guide), then goes back through
     the screens you visited, and from Home it leaves the app as Android users expect.
   - Chrome can install Apex in one tap, so the install guides get an "Install Apex" button when Chrome offers it.
   Haptics already use navigator.vibrate where it exists, which is Android. */
const IS_ANDROID=/Android/i.test(navigator.userAgent);
const andPreview=()=>{try{return localStorage.getItem('apex.androidPreview')==='1'}catch(e){return false}};
const androidMode=()=>IS_ANDROID||andPreview();
if(androidMode())document.documentElement.classList.add('android');

(()=>{const st=document.createElement('style');st.textContent=`
/* keep the dock and anything pinned to the bottom clear of Android's gesture bar or three-button bar */
html.android{--sab:max(env(safe-area-inset-bottom,0px),18px)}
html.android #nav{bottom:calc(var(--sab) + 20px)}
#lhandle{display:none}
html.android #lhandle{display:grid;place-items:center;position:absolute;z-index:6;left:50%;transform:translateX(-50%);bottom:calc(var(--sab) + 20px + 76px);width:88px;height:28px;border-radius:14px;color:var(--ink-3);transition:opacity .2s}
html.android #lhandle::before{content:'';width:40px;height:5px;border-radius:3px;background:currentColor;opacity:.7}
html.android #lhandle::after{content:'';position:absolute;inset:-8px -0px}
html.android.lopen #lhandle,html.android.sheeton #lhandle{opacity:0;pointer-events:none}`;document.head.appendChild(st)})();

/* ---------- launcher handle: tap above the dock to open all features ---------- */
function andHandle(){if(document.getElementById('lhandle'))return;const nav=document.getElementById('nav');if(!nav)return;
  const b=document.createElement('button');b.id='lhandle';b.setAttribute('aria-label','Show all features');b.dataset.a='and-launch';nav.parentNode.insertBefore(b,nav);
  /* the handle sits just above the dock, whatever height the dock ends up */
  const place=()=>{const r=nav.getBoundingClientRect(),host=nav.offsetParent||document.body,hr=host.getBoundingClientRect();b.style.bottom=(hr.bottom-r.top+6)+'px'};place();addEventListener('resize',place)}

/* ---------- edge swipes belong to Android's Back gesture (index.html's page swipe asks this) ---------- */
const AND_EDGE=28;
const andEdge=x=>androidMode()&&(x<AND_EDGE||x>innerWidth-AND_EDGE);

/* ---------- the Back button ---------- */
/* The app's History screen is called history(), which hides window.history, so index.html keeps the real one as __hist. */
const H=window.__hist;let andArmed=false,andTrail=[],andBackGo=false;
function andArm(){if(!androidMode()||andArmed||!H)return;try{H.pushState({apexBack:1},'');andArmed=true}catch(e){}}
function andBack(){
  const lk=document.getElementById('lock');if(lk&&lk.classList.contains('on'))return true;   /* never past the PIN lock */
  const wl=document.getElementById('welcome');if(wl&&wl.classList.contains('on')){const sk=wl.querySelector('[data-a="wl-back"]');if(sk){sk.click();return true}const x=wl.querySelector('[data-a="wl-skip"]');if(x){x.click();return true}}
  const sc=document.getElementById('scrim');if(sc&&sc.classList.contains('on')&&!sc.classList.contains('closing')){dismissSheet();return true}
  if(typeof L!=='undefined'&&(L.open||L.p>0)){launcherClose();return true}
  while(andTrail.length&&andTrail[andTrail.length-1]===tab)andTrail.pop();
  if(andTrail.length){andBackGo=true;go(andTrail.pop());andBackGo=false;return true}
  if(tab!=='home'){andBackGo=true;go('home');andBackGo=false;return true}
  return false}
/* is there anything left for Back to do before leaving the app? */
const andNeeds=()=>tab!=='home'||andTrail.some(t=>t!==tab)||(typeof L!=='undefined'&&L.open)||document.getElementById('scrim').classList.contains('on');
addEventListener('popstate',()=>{if(!androidMode()||!andArmed)return;andArmed=false;if(andBack()&&andNeeds())andArm()});
/* re-arm whenever there is something to go back to again */
{const g0=go;go=function(t){const from=tab,r=g0.apply(this,arguments);if(!andBackGo&&from&&from!==tab){andTrail.push(from);if(andTrail.length>20)andTrail.shift()}if(tab!=='home'||andTrail.length)andArm();return r}}
{const o0=openSheet;openSheet=function(){const r=o0.apply(this,arguments);andArm();document.documentElement.classList.add('sheeton');return r}}
{const p0=pushSheet;pushSheet=function(){const r=p0.apply(this,arguments);andArm();document.documentElement.classList.add('sheeton');return r}}
{const c0=closeSheet;closeSheet=function(){const r=c0.apply(this,arguments);document.documentElement.classList.remove('sheeton');return r}}
{const lo=launcherOpen;launcherOpen=function(){const r=lo.apply(this,arguments);andArm();document.documentElement.classList.add('lopen');return r}}
{const lc=launcherClose;launcherClose=function(){const r=lc.apply(this,arguments);document.documentElement.classList.remove('lopen');return r}}

/* ---------- one-tap install from Chrome ---------- */
let andInstallEvt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();andInstallEvt=e;if(typeof render==='function'&&document.getElementById('welcome')&&document.getElementById('welcome').classList.contains('on')&&typeof wlRender==='function')try{wlRender()}catch(x){}});
addEventListener('appinstalled',()=>{andInstallEvt=null;toast('Apex is installed. Open it from your Home screen.')});
function installBtn(){return andInstallEvt?`<button class="btn primary block" style="margin:4px 0 10px" data-a="and-install">Install Apex</button><p class="small muted" style="margin:0 0 6px">Or do it by hand:</p>`:''}

function androidAction(a){
  if(a==='and-launch'){if(typeof haptic==='function')haptic();launcherOpen(false);return true}
  if(a==='and-install'&&andInstallEvt){const e=andInstallEvt;andInstallEvt=null;e.prompt();e.userChoice.then(c=>{if(c&&c.outcome==='accepted')toast('Installing Apex…')}).catch(()=>{});return true}
  if(a==='and-preview'){try{localStorage.setItem('apex.androidPreview',andPreview()?'0':'1')}catch(e){}document.documentElement.classList.toggle('android',androidMode());if(androidMode())andHandle();closeSheet();toast(androidMode()?'Android layout preview on.':'Android layout preview off.');return true}
  return false}

/* called once the app has drawn its dock */
function androidBoot(){if(!androidMode())return;andHandle();if(tab!=='home')andArm()}
