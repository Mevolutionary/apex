/* Apex workout extras: screen awake (A11), beep on silent (A12), spoken rest cues (A13).
   Settings live in S.settings so they follow the account: awake (default on), silentBeep, speak. */

const wkOn=k=>k==='awake'?S.settings.awake!==false:!!S.settings[k];

/* ---------- A11: keep the screen awake while a workout is running ----------
   polish.js holds the wake lock itself; this adds the setting, a retry on the next tap when iOS refuses
   the first request, and a status line for the debug menu. */
let wakeRefused=false;
{const w0=wakeSync;wakeSync=async function(){
  const want=!!(S&&S.active)&&wkOn('awake')&&document.visibilityState==='visible';
  if(!want){if(wakeLock){const l=wakeLock;wakeLock=null;try{await l.release()}catch(e){}}return}
  await w0();wakeRefused=!!navigator.wakeLock&&!wakeLock}}
document.addEventListener('pointerdown',()=>{if(wakeRefused&&S&&S.active)wakeSync()},{passive:true});
window.addEventListener('pageshow',()=>wakeSync());
function wakeStatus(){return !navigator.wakeLock?'not supported here (needs iOS 18.4 or later)':!wkOn('awake')?'off in settings':wakeLock?'holding':S&&S.active?(wakeRefused?'refused, retrying on next tap':'asking'):'idle'}

/* ---------- A12: rest beep even when the ringer is on silent ----------
   Safari's audioSession 'playback' type ignores the silent switch. It can pause other audio, so the
   session goes back to 'auto' straight after the beep, and the setting is off unless switched on. */
{const b0=beep;beep=function(){const as=navigator.audioSession;
  if(wkOn('silentBeep')&&as){try{as.type='playback'}catch(e){}
    try{if(actx&&actx.state==='suspended')actx.resume()}catch(e){}
    b0();setTimeout(()=>{try{as.type='auto'}catch(e){}},900);return}
  b0()}}

/* ---------- A13: spoken rest cues for earbuds ---------- */
let voiceReady=false;
function voiceUnlock(){if(voiceReady||!('speechSynthesis' in window))return;try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);voiceReady=true}catch(e){}}
document.addEventListener('pointerdown',()=>{if(wkOn('speak')&&S&&S.active)voiceUnlock()},{passive:true});
function say(text){if(!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.05;u.lang=navigator.language||'en-AU';speechSynthesis.speak(u)}catch(e){}}
/* the next set still to do in the running workout: exercise name and what's in its boxes (or last time's numbers) */
function nextSetText(){const a=S.active;if(!a)return'';
  for(const e of a.exercises){const j=e.sets.findIndex(s=>!s.done);if(j<0)continue;const s=e.sets[j],ex=exById(e.exId),u=unit()==='lb'?'pounds':'kilograms';
    const w=s.w!=null&&s.w!==''?+disp(s.w):null,r=s.r||null;
    const load=ex.bw?(w?`plus ${w} ${u}`:'bodyweight'):(w!=null?`${w} ${u}`:'');
    return `Next: ${ex.name}${load?', '+load:''}${r?' for '+r:''}.`}
  return 'That was the last set. Finish when you are ready.'}
function restDone(){if(wkOn('speak'))say('Rest done. '+nextSetText())}

/* ---------- settings: a Workout block in Settings → General ---------- */
function generalExtra(){const sw=(k,label,sub)=>{const on=wkOn(k);return `<div class="row between" style="gap:12px"><span>${label}<br><span class="small muted">${sub}</span></span><div class="seg" style="flex:none"><button data-a="wk-set" data-k="${k}" data-v="0" class="${on?'':'on'}">Off</button><button data-a="wk-set" data-k="${k}" data-v="1" class="${on?'on':''}">On</button></div></div>`};
  const as=!!navigator.audioSession,tts='speechSynthesis' in window;
  return `<h3 style="margin:6px 0 0">During workouts</h3>
    ${sw('awake','Keep screen awake','Stops the phone locking mid-workout, so the rest beep is heard')}
    ${tts?sw('speak','Speak rest cues','Says "Rest done" and your next set, for earbuds'):''}
    ${as?sw('silentBeep','Beep on silent','Rest beep plays with the ringer off. May briefly pause music'):''}
    ${typeof rirSetting==='function'?rirSetting(sw):''}`}

function workoutAction(a,v,b){
  if(a==='wk-set'){const k=b.dataset.k;S.settings[k]=v==='1';save('settings');[...b.parentElement.children].forEach(x=>x.classList.toggle('on',x===b));
    if(k==='speak'&&v==='1'){voiceUnlock();say('Rest cues on.')}
    if(k==='silentBeep'&&v==='1'){try{if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}beep()}
    if(k==='awake')wakeSync();return true}
  return false}

/* ---------- A21: optional reps in reserve (RIR) per set ----------
   One tap cycles blank → 0 → 1 → 2 → 3+ → blank. Stored on the set as q (0-3). Hidden unless switched on. */
const rirOn=()=>!!S.settings.rir;
const RIR_LAB=q=>q==null?'–':q>=3?'3+':String(q);
function rirCell(s,i,j){if(!rirOn())return'';return `<button class="rirb ${s.q!=null?'on':''}" data-a="rir" data-x="${i}" data-s="${j}" aria-label="Reps in reserve, set ${j+1}: ${s.q==null?'not set':RIR_LAB(s.q)}. Tap to change">${RIR_LAB(s.q)}</button>`}
function rirSetting(sw){return sw('rir','Reps in reserve','Adds an RIR column: how many more reps you had left. The Coach uses it to judge effort')}
(()=>{const st=document.createElement('style');st.textContent=`.sets.rir{grid-template-columns:32px 1fr 64px 48px 44px 44px;gap:8px 6px}
.rirb{min-height:44px;border-radius:12px;background:rgb(255 255 255 / .05);font-family:var(--display);font-weight:800;color:var(--ink-3);font-variant-numeric:tabular-nums}
.rirb.on{color:var(--ink);background:rgb(255 255 255 / .1)}`;document.head.appendChild(st)})();
{const wa0=workoutAction;workoutAction=function(a,v,b){
  if(a==='rir'&&S.active){const e=S.active.exercises[+b.dataset.x],s=e&&e.sets[+b.dataset.s];if(!s)return true;s.q=s.q==null?0:s.q>=3?undefined:s.q+1;if(s.q===undefined)delete s.q;save('active');
    b.textContent=RIR_LAB(s.q);b.classList.toggle('on',s.q!=null);b.setAttribute('aria-label',`Reps in reserve, set ${+b.dataset.s+1}: ${s.q==null?'not set':RIR_LAB(s.q)}. Tap to change`);if(typeof haptic==='function')haptic();return true}
  if(a==='wk-set'&&b.dataset.k==='rir'){wa0(a,v,b);render();return true}
  return wa0(a,v,b)}}
/* the Coach reads RIR from the heaviest sets last time: everything 3+ in reserve means go up even before the top
   of the rep range; a set taken to 0 below the top of the range means stay put */
if(typeof suggestLoad==='function'){const sl0=suggestLoad;suggestLoad=function(exId,lo,hi){const base=sl0(exId,lo,hi);
  let last=null;for(let i=S.workouts.length-1;i>=0&&!last;i--){const s=S.workouts[i].exercises.filter(x=>x.exId===exId).flatMap(x=>x.sets);if(s.length)last=s}
  if(!last)return base;const top=Math.max(...last.map(s=>s.w||0)),ts=last.filter(s=>(s.w||0)===top),qs=ts.map(s=>s.q).filter(q=>q!=null);if(!qs.length||!top)return base;
  const minR=Math.min(...ts.map(s=>s.r||0)),inc=top<20?1:2.5;
  if(Math.min(...qs)>=3&&minR>=lo&&minR<hi)return `Last time ${disp(top)} ${unit()} × ${minR} with 3 or more reps to spare. Go up to ${disp(top+inc)} ${unit()}.`;
  if(Math.min(...qs)===0&&minR<hi)return `Last time ${disp(top)} ${unit()} × ${minR}, taken to failure. Same weight, aim for ${Math.min(hi,minR+1)} reps with one left in reserve.`;
  return base}}

/* ---------- A22: training calendar on History ----------
   One month at a time, each day shaded by how many working sets were done. Encouraging only: counts days
   trained, never "streak lost". */
let calOff=0;
function calCard(){const ws=V().workouts,now=new Date(),m=new Date(now.getFullYear(),now.getMonth()+calOff,1),y=m.getFullYear(),mo=m.getMonth(),days=new Date(y,mo+1,0).getDate(),lead=(m.getDay()+6)%7;
  const by={};for(const w of ws){const d=new Date(w.start);if(d.getFullYear()!==y||d.getMonth()!==mo)continue;const k=d.getDate();(by[k]=by[k]||{n:0,ids:[]}).n+=setCount(w);by[k].ids.push(w.id)}
  const lvl=n=>n<=0?0:n<10?1:n<20?2:3,today=calOff===0?now.getDate():-1,trained=Object.keys(by).length;
  let cells='';for(let i=0;i<lead;i++)cells+='<span></span>';
  for(let d=1;d<=days;d++){const x=by[d],l=x?lvl(x.n):0,lab=new Date(y,mo,d).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})+(x?`, ${x.n} set${x.n===1?'':'s'}`:', rest day');
    cells+=x?`<button class="cd l${l}${d===today?' td':''}" data-a="cal-day" data-v="${x.ids[x.ids.length-1]}" aria-label="${lab}">${d}</button>`:`<span class="cd${d===today?' td':''}" aria-label="${lab}" role="img">${d}</span>`}
  const name=m.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  return `<section class="glass card"><div class="row between"><h2 style="margin:0">${name}</h2><div class="row" style="gap:6px"><button class="iconbtn cal-nav" data-a="cal-prev" aria-label="Previous month">‹</button><button class="iconbtn cal-nav" data-a="cal-next" aria-label="Next month" ${calOff>=0?'disabled':''}>›</button></div></div>
    <div class="cal" aria-label="Training calendar for ${name}">${['M','T','W','T','F','S','S'].map(x=>`<span class="cw">${x}</span>`).join('')}${cells}</div>
    <div class="small muted" style="margin-top:8px">${trained?`${trained} training day${trained===1?'':'s'} ${calOff===0?'so far this month':'this month'}. Darker means more sets.`:calOff===0?'Your training days this month will show here.':'No workouts logged this month.'}</div></section>`}
(()=>{const st=document.createElement('style');st.textContent=`.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:12px}
.cal .cw{font-size:11px;color:var(--ink-3);text-align:center;padding-bottom:2px}
.cal .cd{aspect-ratio:1;min-height:36px;border-radius:10px;display:grid;place-items:center;font-size:12px;font-weight:700;color:var(--ink-3);background:rgb(255 255 255 / .04);font-variant-numeric:tabular-nums}
.cal .cd.l1{background:color-mix(in oklch,var(--blue) 35%,transparent);color:var(--ink)}
.cal .cd.l2{background:color-mix(in oklch,var(--blue) 60%,transparent);color:var(--ink)}
.cal .cd.l3{background:var(--blue);color:#0b1020}
.cal .cd.td{outline:2px solid rgb(255 255 255 / .6);outline-offset:-2px}
.cal-nav{width:44px;height:44px;font-size:22px;font-weight:700}.cal-nav[disabled]{opacity:.35}`;document.head.appendChild(st)})();
{const wa1=workoutAction;workoutAction=function(a,v,b){
  if(a==='cal-prev'){calOff--;render();return true}
  if(a==='cal-next'){if(calOff<0)calOff++;render();return true}
  if(a==='cal-day'){expanded=v;const all=V().workouts.slice().reverse(),i=all.findIndex(w=>w.id===v);if(i>=histShown)histShown=i+1;render();
    setTimeout(()=>{const el=document.querySelector('[data-a="expand"][data-v="'+v+'"]');if(el)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})},60);return true}
  return wa1(a,v,b)}}
