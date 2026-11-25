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

/* ---------- A12 + music: how the rest beep and spoken cues share the speaker with your music ----------
   Safari's audioSession API sets how Apex's sound mixes with other apps. 'transient' is meant for short
   sounds: iOS lowers (ducks) the music and brings it back afterwards instead of stopping it. 'playback'
   is needed to beep with the ringer on silent, which can pause music, so it's only used when that setting
   is on. The session goes back to 'auto' as soon as the sound ends. */
let duckT=null;
function duck(ms){const as=navigator.audioSession;if(!as)return;clearTimeout(duckT);try{as.type=wkOn('silentBeep')?'playback':'transient'}catch(e){}
  try{if(actx&&actx.state==='suspended')actx.resume()}catch(e){}if(ms)duckT=setTimeout(unduck,ms)}
function unduck(){const as=navigator.audioSession;clearTimeout(duckT);if(!as)return;try{as.type='auto'}catch(e){}}
{const b0=beep;beep=function(){if(navigator.audioSession&&!(typeof speaking!=='undefined'&&speaking))duck(900);b0()}}

/* ---------- A13: spoken rest cues for earbuds ---------- */
let voiceReady=false;
function voiceUnlock(){if(voiceReady||!('speechSynthesis' in window))return;try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);voiceReady=true}catch(e){}}
document.addEventListener('pointerdown',()=>{if(wkOn('speak')&&S&&S.active)voiceUnlock()},{passive:true});
let speaking=false;
function say(text){if(!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.05;u.lang=navigator.language||'en-AU';
  /* duck the music for the length of the sentence; a long backstop in case iOS never fires onend */
  speaking=true;duck(12000);const done=()=>{speaking=false;setTimeout(unduck,250)};u.onend=done;u.onerror=done;speechSynthesis.speak(u)}catch(e){speaking=false}}
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
    ${as?sw('silentBeep','Beep on silent','Rest beep plays with the ringer off. This can pause your music'):''}
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

/* ---------- drop sets: record what you dropped to ----------
   A set marked D gets a "Dropped to" line under it. Each drop is a weight and reps (s.dr = [{w,r}]); drops add
   to volume but never to PRs or ranks, and history shows them as 80 × 8 D → 60 × 6 → 40 × 5. */
function dropRow(s,i,j){if(s.t!=='d')return'';const dr=s.dr||[],gap=rirOn()?'<span></span>':'';
  /* each drop sits in the same columns as the set above it, so the weights and reps line up */
  const rows=dr.map((d,k)=>`<span class="dn" aria-hidden="true">↳</span><span class="prev">Drop ${k+1}</span>
    <span class="${s.done?'done':''}"><input type="number" inputmode="decimal" step="any" data-i="drop" data-x="${i}" data-s="${j}" data-k="${k}" data-f="w" value="${d.w!=null?disp(d.w):''}" placeholder="0" aria-label="Drop ${k+1} weight, set ${j+1}"></span>
    <span class="${s.done?'done':''}"><input type="number" inputmode="decimal" data-i="drop" data-x="${i}" data-s="${j}" data-k="${k}" data-f="r" value="${d.r??''}" placeholder="0" aria-label="Drop ${k+1} reps, set ${j+1}"></span>${gap}
    <button class="dropx" data-a="drop-rm" data-x="${i}" data-s="${j}" data-v="${k}" aria-label="Remove drop ${k+1}">×</button>`).join('');
  return rows+`<div class="dropadd"><button class="chip" data-a="drop-add" data-x="${i}" data-s="${j}">${dr.length?'+ Another drop':'+ Add the weight you dropped to'}</button></div>`}
(()=>{const st=document.createElement('style');st.textContent=`.sets .dn{color:var(--blue);font-weight:800;text-align:center;align-self:center}
.sets .dropadd{grid-column:1/-1;display:flex;justify-content:flex-end;margin:-4px 0 2px}
.sets .dropx{min-height:44px;border-radius:12px;color:var(--ink-3);font-size:22px}`;document.head.appendChild(st)})();
document.addEventListener('input',ev=>{const t=ev.target;if(!t.dataset||t.dataset.i!=='drop'||!S.active)return;const st=S.active.exercises[+t.dataset.x].sets[+t.dataset.s],d=(st.dr||[])[+t.dataset.k];if(!d)return;
  const n=parseFloat(t.value);if(t.dataset.f==='w')d.w=isNaN(n)?null:Math.round(toKg(n)*100)/100;else d.r=isNaN(n)?null:Math.round(n);save('active')});
document.addEventListener('focusin',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.i==='drop'&&t.value!==''){const sel=()=>{if(document.activeElement===t)try{t.select()}catch(x){}};sel();setTimeout(sel,0);setTimeout(sel,60)}});
{const wa2=workoutAction;workoutAction=function(a,v,b){
  if((a==='drop-add'||a==='drop-rm')&&S.active){const st=S.active.exercises[+b.dataset.x].sets[+b.dataset.s];if(!st)return true;st.dr=st.dr||[];
    if(a==='drop-add'){/* suggest about 20% lighter, rounded to 2.5 kg or 5 lb */const last=st.dr.length?st.dr[st.dr.length-1].w:st.w,inc=unit()==='lb'?5/LB:2.5;st.dr.push({w:last?Math.max(0,Math.round(Math.round(last*.8/inc)*inc*100)/100):null,r:null})}else st.dr.splice(+v,1);
    if(!st.dr.length)delete st.dr;save('active');render();
    if(a==='drop-add')setTimeout(()=>{const el=document.querySelector(`[data-i="drop"][data-x="${b.dataset.x}"][data-s="${b.dataset.s}"][data-k="${st.dr.length-1}"][data-f="r"]`);if(el)el.focus()},60);return true}
  return wa2(a,v,b)}}
