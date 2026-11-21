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
