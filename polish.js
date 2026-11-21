/* Apex: behaviour that follows design-rules/design-rules.md.
   Wrong-input shake, Undo instead of "Are you sure?", screen kept awake during a workout, big +/- steppers above the
   keyboard for weight and reps, fading edges on sideways-scrolling rows, a sync status dot, skeleton loading rows, and
   transitions switched off while the display theme changes. Loaded last; it wraps a few existing functions by name. */

(function(){const st=document.createElement('style');st.textContent=`
@keyframes shake{0%{transform:translateX(0)}17%{transform:translateX(-10px)}33%{transform:translateX(10px)}50%{transform:translateX(-6px)}67%{transform:translateX(6px)}83%{transform:translateX(-3px)}100%{transform:translateX(0)}}
.bad{border-color:rgb(255 107 107 / .9)!important;box-shadow:0 0 0 3px rgb(255 107 107 / .22)!important}
.shake{animation:shake 360ms cubic-bezier(.23,1,.32,1)}
html.calm .shake{animation:none}
@media (prefers-reduced-motion:reduce){.shake{animation:none}}
#toast .undo{margin-left:12px;padding:10px 14px;margin-top:-10px;margin-bottom:-10px;margin-right:-10px;border-radius:999px;font-weight:800;color:var(--ink);background:rgb(255 255 255 / .16);min-height:44px}
#toast.act{pointer-events:auto}
#stepbar{position:fixed;left:50%;z-index:65;display:none;gap:10px;padding:8px;border-radius:999px;transform:translateX(-50%);width:min(420px,calc(100% - 24px));background:oklch(20% 0.03 275);border:1px solid rgb(255 255 255 / .16);box-shadow:0 10px 30px rgb(0 0 0 / .4)}
#stepbar.on{display:flex}
#stepbar button{flex:1;min-height:52px;border-radius:999px;font-family:var(--display);font-weight:900;font-size:20px;background:rgb(255 255 255 / .12);border:1px solid rgb(255 255 255 / .16);transition:scale 150ms cubic-bezier(.23,1,.32,1)}
#stepbar button:active{scale:.97}
#stepbar .lab{flex:none;align-self:center;font-size:12px;color:var(--ink-2);padding:0 4px;min-width:52px;text-align:center}
.hfade{-webkit-mask-image:linear-gradient(90deg,transparent,#000 var(--fl,0%) calc(100% - var(--fr,0%)),transparent);mask-image:linear-gradient(90deg,transparent,#000 var(--fl,0%) calc(100% - var(--fr,0%)),transparent)}
[data-a="settings"]{position:relative}
html.syncing [data-a="settings"]::after,html.synced [data-a="settings"]::after{content:'';position:absolute;right:4px;top:4px;width:9px;height:9px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 2px var(--bg)}
html.synced [data-a="settings"]::after{background:var(--good)}
html.syncing [data-a="settings"]::after{animation:syncp 1.2s ease-out infinite}
@keyframes syncp{50%{opacity:.35}}
html.calm.syncing [data-a="settings"]::after{animation:none}
.skel{display:flex;flex-direction:column;gap:10px;padding:16px 18px}
.skel i{display:block;height:12px;border-radius:6px;background:linear-gradient(90deg in oklch,rgb(255 255 255 / .07),rgb(255 255 255 / .16),rgb(255 255 255 / .07));background-size:200% 100%;animation:skel 1.4s linear infinite}
.skel i:nth-child(1){width:38%}.skel i:nth-child(2){width:92%;height:16px}.skel i:nth-child(3){width:64%}
@keyframes skel{to{background-position:-200% 0}}
html.calm .skel i{animation:none}
`;document.head.appendChild(st)})();

/* ---------- wrong input: shake the field and mark it red, as well as the message ---------- */
function badField(sel,msg){const el=typeof sel==='string'?document.querySelector(sel):sel;if(msg)toast(msg);if(!el)return;el.classList.remove('shake');void el.offsetWidth;el.classList.add('bad','shake');
  try{el.focus({preventScroll:true})}catch(e){}const off=()=>{el.classList.remove('bad');el.removeEventListener('input',off)};el.addEventListener('input',off);setTimeout(()=>el.classList.remove('shake'),400)}
/* map the existing "you missed something" messages to the field they are about */
const BAD_MAP=[[/^Wrong PIN/,'#lock-pin'],[/^Enter your email and a password/,'#au-email'],[/^Choose a password of at least 8/,'#au-pass'],[/^Enter your weight first/,'#bw-val'],[/^Enter an amount/,'#fd-g'],[/^Enter how many minutes/,'#cd-mins'],[/^Choose a display name/,'#board-name'],[/^Write what you ate first/,'#ai-text'],[/^Type a question first/,'#ask-q'],[/^Enter a target weight|^That does not look like a body weight/,'#gw-v'],[/^Enter at least one measurement/,'#ms-waist'],[/^Pick at least one day/,null],[/^Enter reps first/,'__reps']];
{const t0=toast;toast=function(m){const hit=BAD_MAP.find(r=>r[0].test(m||''));if(hit&&hit[1]){let el=null;if(hit[1]==='__reps'){el=lastCheck&&lastCheck.closest('.sets')?document.getElementById('r-'+lastCheck.dataset.x+'-'+lastCheck.dataset.s):null}else el=document.querySelector(hit[1]);
    if(el&&!(el.closest('#sheet')&&!$('#scrim').classList.contains('on'))){t0(m);badField(el);return}}return t0.apply(this,arguments)}}
let lastCheck=null;document.addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('[data-a="check"]');if(c)lastCheck=c},true);

/* ---------- Undo instead of "Are you sure?" for deleting sets, exercises, workouts, food, meals and weigh-ins ---------- */
let undoFn=null,undoT=null;
function undoToast(msg,undo,commit){const t=$('#toast');if(undoFn&&undoFn.commit)undoFn.commit();clearTimeout(undoT);clearTimeout(toastT);
  undoFn={undo,commit};t.innerHTML='';const s=document.createElement('span');s.textContent=msg;const b=document.createElement('button');b.className='undo';b.textContent='Undo';b.dataset.a='undo';t.append(s,b);t.classList.add('on','act');
  undoT=setTimeout(()=>{t.classList.remove('on','act');const f=undoFn;undoFn=null;if(f&&f.commit)f.commit()},5000)}
function undoRun(){const f=undoFn;undoFn=null;clearTimeout(undoT);const t=$('#toast');t.classList.remove('on','act');if(f&&f.undo)f.undo()}
{const t0=toast;toast=function(m){if(undoFn){const f=undoFn;undoFn=null;clearTimeout(undoT);$('#toast').classList.remove('act');if(f.commit)f.commit()}return t0.apply(this,arguments)}}
const snap=o=>JSON.parse(JSON.stringify(o));
function polishAction(a,v,b){const x=b&&b.dataset?+b.dataset.x:NaN;switch(a){
  case 'undo':undoRun();return true;
  /* A2: ticking a set updates only that row (and the time-left line) instead of redrawing the whole workout */
  case 'check':{if(tab!=='train'||!S.active||!b.closest||!b.closest('#view'))return false;const i=x,j=+b.dataset.s,e=S.active.exercises[i],st=e&&e.sets[j];if(!st)return false;
    const p=prevFor(prevEx(e.exId),e.sets,j);
    if(!st.done){if(st.w==null&&p)st.w=p.w;if(st.r==null&&p)st.r=p.r;if(!(st.r>0)){toast('Enter reps first.');return true}st.done=true;if(!e.ss)startRest(e.exId)}else st.done=false;
    save('active');
    b.classList.toggle('on',st.done);b.setAttribute('aria-pressed',String(st.done));b.classList.remove('pop');if(st.done){void b.offsetWidth;b.classList.add('pop')}
    const wI=document.getElementById('w-'+i+'-'+j),rI=document.getElementById('r-'+i+'-'+j);
    if(wI&&document.activeElement!==wI){wI.value=st.w==null?'':disp(st.w)}if(rI&&document.activeElement!==rI){rI.value=st.r==null?'':st.r}
    [wI,rI].forEach(el=>{if(el&&el.parentElement)el.parentElement.classList.toggle('done',st.done)});
    const ex=exById(e.exId),best=bestOf(S.workouts,e.exId),isPr=st.t!=='w'&&st.done&&best&&score(ex,st)>best.sc+1e-6,n=b.parentElement&&b.parentElement.querySelector('[data-a="set-type"][data-s="'+j+'"]');
    if(n){let lab;if(st.t)lab=SETT[st.t][0];else{lab=0;for(let k=0;k<=j;k++)if(e.sets[k].t!=='w')lab++}n.innerHTML=isPr?'<span class="pr">PR</span>':lab}
    const el=document.getElementById('estleft');if(el&&typeof estLeft==='function')el.textContent=estLeft();
    return true}
  case 'rm-set':{const e=S.active.exercises[x];if(!e||!e.sets.length)return true;const s=e.sets.pop();save('active');render();undoToast('Set removed.',()=>{if(S.active&&S.active.exercises[x]===e){e.sets.push(s);save('active');render()}});return true}
  case 'rm-ex':{const l=S.active.exercises,e=l[x];if(!e)return true;l.splice(x,1);save('active');render();undoToast(exById(e.exId).name+' removed.',()=>{if(S.active&&S.active.exercises===l){l.splice(Math.min(x,l.length),0,e);save('active');render()}});return true}
  case 'cardio-rm':{const l=S.active.cardio,c=l[x];l.splice(x,1);save('active');render();undoToast('Cardio removed.',()=>{if(S.active&&S.active.cardio===l){l.splice(x,0,c);save('active');render()}});return true}
  case 'cancel':{const was=snap(S.active);S.active=null;stopRest();save('active');render();undoToast('Workout discarded.',()=>{if(!S.active){S.active=was;save('active');render()}});return true}
  case 'del-workout':{const w=S.workouts.find(q=>q.id===v);if(!w)return true;S.workouts=S.workouts.filter(q=>q.id!==v);recomputePRs(S.workouts);save(monthKey(w.start));render();
    undoToast('Workout deleted.',()=>{if(!S.workouts.some(q=>q.id===w.id)){S.workouts.push(w);S.workouts.sort((p,q)=>p.start-q.start);recomputePRs(S.workouts);save(monthKey(w.start));render()}});return true}
  case 'del-weight':{const w=S.weights.find(q=>q.d===v);if(!w)return true;S.weights=S.weights.filter(q=>q.d!==v);save('weights');render();
    undoToast('Weigh-in deleted.',()=>{if(!S.weights.some(q=>q.d===w.d)){S.weights.push(w);S.weights.sort((p,q)=>p.d<q.d?-1:1);save('weights');render()}},()=>{if(w.p&&!S.weights.some(q=>q.d===w.d))phRemove(w.d)});return true}
  case 'del-routine':{const i=S.routines.findIndex(r=>r.id===v);if(i<0)return true;const r=S.routines.splice(i,1)[0];save('settings');closeSheet();render();undoToast('Routine deleted.',()=>{S.routines.splice(Math.min(i,S.routines.length),0,r);save('settings');render()});return true}
  case 'fe-del':{const day=foodDay,list=dayList(day),i=list.findIndex(q=>q.id===v);if(i<0)return true;const e=list[i];S.food[day]=list.filter(q=>q.id!==v);if(!S.food[day].length)delete S.food[day];save(fdKey(day));closeSheet();render();
    undoToast(e.n+' removed.',()=>{const l=S.food[day]||(S.food[day]=[]);l.splice(Math.min(i,l.length),0,e);save(fdKey(day));render()});return true}
  case 'sm-del':{const l=savedMeals(),i=+v,m=l[i];if(!m)return true;l.splice(i,1);save('settings');savedSheet();undoToast('"'+m.name+'" deleted.',()=>{l.splice(Math.min(i,l.length),0,m);save('settings');if($('#sheet').dataset.kind==='saved')savedSheet()});return true}
  case 'meas-del':{const l=S.settings.meas||[],m=l.find(q=>q.d===v);if(!m)return true;S.settings.meas=l.filter(q=>q.d!==v);save('settings');measHist();if(tab==='body')render();
    undoToast('Measurements deleted.',()=>{(S.settings.meas=S.settings.meas||[]).push(m);save('settings');if($('#sheet').dataset.kind==='meashist')measHist();if(tab==='body')render()});return true}
}return false}

/* ---------- keep the screen awake while a workout is running ---------- */
let wakeLock=null,wakeAsk=false;
async function wakeSync(){const want=!!(S&&S.active)&&document.visibilityState==='visible';
  if(want&&!wakeLock&&!wakeAsk&&navigator.wakeLock){wakeAsk=true;try{wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null})}catch(e){wakeLock=null}wakeAsk=false;if(!(S&&S.active))wakeSync()}
  else if(!want&&wakeLock){const l=wakeLock;wakeLock=null;try{await l.release()}catch(e){}}}
document.addEventListener('visibilitychange',wakeSync);

/* ---------- big +/- steppers above the keyboard for weight and reps ---------- */
let stepIn=null;
const stepBar=(()=>{const b=document.createElement('div');b.id='stepbar';b.setAttribute('role','group');b.setAttribute('aria-label','Adjust value');b.innerHTML='<button type="button" data-d="-1" aria-label="Decrease">−</button><span class="lab"></span><button type="button" data-d="1" aria-label="Increase">+</button>';document.body.appendChild(b);
  /* keep the keyboard open: stop the button taking focus away from the field */
  ['pointerdown','mousedown','touchstart'].forEach(t=>b.addEventListener(t,e=>{e.preventDefault()},{passive:false}));
  b.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn||!stepIn)return;e.stopPropagation();stepBy(+btn.dataset.d)});return b})();
const stepSize=inp=>inp.dataset.f==='r'?1:(S.settings.unit==='lb'?5:2.5);
function stepBy(dir){const inp=stepIn;if(!inp)return;const cur=parseFloat(inp.value!==''?inp.value:inp.placeholder)||0,step=stepSize(inp),nv=Math.max(0,Math.round((cur+dir*step)/step)*step);inp.value=inp.dataset.f==='r'?String(Math.round(nv)):String(Math.round(nv*100)/100);inp.dispatchEvent(new Event('input',{bubbles:true}));try{haptic()}catch(e){}}
function stepPlace(){if(!stepIn)return;const vv=window.visualViewport,nav=document.getElementById('nav'),nt=nav&&nav.offsetParent?nav.getBoundingClientRect().top:innerHeight,bottom=Math.min(vv?vv.offsetTop+vv.height:innerHeight,nt);stepBar.style.top=(bottom-stepBar.offsetHeight-10)+'px'}
document.addEventListener('focusin',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.i==='set'){stepIn=t;stepBar.querySelector('.lab').textContent=(t.dataset.f==='r'?'1 rep':(S.settings.unit==='lb'?'5 lb':'2.5 kg'));stepBar.classList.add('on');stepPlace();setTimeout(stepPlace,350)}});
document.addEventListener('focusout',e=>{if(e.target===stepIn){setTimeout(()=>{if(document.activeElement!==stepIn){stepIn=null;stepBar.classList.remove('on')}},60)}});
if(window.visualViewport){visualViewport.addEventListener('resize',stepPlace);visualViewport.addEventListener('scroll',stepPlace)}

/* ---------- sideways rows: fade the edge that has more to scroll to ---------- */
function hfade(el){const max=el.scrollWidth-el.clientWidth;if(max<=2){el.classList.remove('hfade');return}el.classList.add('hfade');el.style.setProperty('--fl',el.scrollLeft>2?'15%':'0%');el.style.setProperty('--fr',el.scrollLeft<max-2?'15%':'0%')}
function hfadeAll(root){(root||document).querySelectorAll('.stchips,.phstrip').forEach(el=>{hfade(el);if(!el.dataset.hf){el.dataset.hf='1';el.addEventListener('scroll',()=>hfade(el),{passive:true})}})}
new MutationObserver(()=>hfadeAll()).observe(document.getElementById('view'),{childList:true,subtree:true});

/* ---------- sync status dot on the settings button: amber while changes are waiting, green briefly when done ---------- */
let syncT=null;
function syncDot(){const c=document.documentElement.classList,n=unsynced().length,on=typeof fbUser!=='undefined'&&fbUser&&typeof cloudState!=='undefined'&&cloudState!=='signedout'&&cloudState!=='off';
  if(on&&n){c.add('syncing');c.remove('synced');clearTimeout(syncT)}else if(c.contains('syncing')){c.remove('syncing');c.add('synced');clearTimeout(syncT);syncT=setTimeout(()=>c.remove('synced'),1600)}}
{const m0=markUnsynced;markUnsynced=function(){const r=m0.apply(this,arguments);syncDot();return r}}

/* ---------- skeleton rows instead of spinners for loading lists ---------- */
const skelRows=n=>Array.from({length:n||4},()=>'<section class="glass card skel" aria-hidden="true"><i></i><i></i><i></i></section>').join('');

/* ---------- theme switches: no transitions while the look changes ---------- */
{const u0=uiApply;uiApply=function(){const c=document.documentElement.classList;c.add('theme-switching');const r=u0.apply(this,arguments);requestAnimationFrame(()=>requestAnimationFrame(()=>c.remove('theme-switching')));return r}}

{const r0=render;render=function(){const r=r0.apply(this,arguments);wakeSync();return r}}
wakeSync();syncDot();
