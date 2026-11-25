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
  const rows=dr.map((d,k)=>`<span class="dn" aria-hidden="true">↳</span><span class="prev" style="white-space:nowrap">Drop ${k+1}</span>
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

/* ---------- drag to reorder exercises ----------
   Each exercise card has a grab bar at the top. Hold or drag it and the card lifts (shrinks a little, with a
   shadow and a tap of haptics), the other cards fold down to their names so it's easy to drop between them, and
   they slide out of the way as you move. Let go to drop it. The ↑ ↓ buttons stay for screen readers only, and the
   arrow keys move a card when its grab bar is focused. A superset only breaks where the moved card left or joined. */
(()=>{const st=document.createElement('style');st.textContent=`
.vh{position:absolute!important;width:1px!important;height:1px!important;min-width:0!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;border:0!important}
.ex{position:relative}
.exgrab{position:absolute;left:50%;top:0;transform:translateX(-50%);width:96px;height:26px;display:grid;place-items:center;touch-action:none;cursor:grab;z-index:2}
.exgrab span{width:40px;height:5px;border-radius:3px;background:var(--ink-3);opacity:.75}
.exgrab::after{content:'';position:absolute;inset:-6px -10px}
#view.reorder .ex>*:not(.exgrab):not(:nth-child(2)){display:none}
#view.reorder .ex>:nth-child(2) .btn{visibility:hidden}
#view.reorder .ex{transition:transform .22s cubic-bezier(.23,1,.32,1)}
#view.reorder .ex.lifted{transition:none;z-index:20;transform:translateY(var(--dy,0)) scale(.96);box-shadow:0 18px 40px rgb(0 0 0 / .45);cursor:grabbing}
#view.reorder .ex.drop{transition:transform .22s cubic-bezier(.23,1,.32,1),box-shadow .22s}`;document.head.appendChild(st)})();

let exDrag=null;
function exMove(from,to){const l=S.active.exercises;if(to<0||to>=l.length||to===from)return;
  /* the card above the old spot was paired "with next" to this one; the moved card's own pairing can't carry over */
  if(from>0&&l[from-1].ss)delete l[from-1].ss;delete l[from].ss;
  const m=l.splice(from,1)[0];l.splice(to,0,m);
  if(to>0&&l[to-1].ss)delete l[to-1].ss;   /* it doesn't silently join the superset above */
  save('active')}
document.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('.exgrab');if(!g||!S.active||tab!=='train')return;
  e.preventDefault();const from=+g.dataset.x;exDrag={from,id:e.pointerId,x0:e.clientX,y0:e.clientY,on:false,g,
    hold:setTimeout(()=>exLift(e.clientY),280)};try{g.setPointerCapture(e.pointerId)}catch(x){}});
function exLift(y){const d=exDrag;if(!d||d.on)return;d.on=true;clearTimeout(d.hold);const v=document.getElementById('view'),cards=[...v.querySelectorAll('section.ex')];
  v.classList.add('reorder');const card=cards[d.from];card.classList.add('lifted');if(typeof haptic==='function')haptic();
  /* after folding, keep the lifted card under the finger */
  d.cards=cards;d.card=card;d.to=d.from;d.y=y;
  d.rects=cards.map(c=>{const b=c.getBoundingClientRect();return{top:b.top,h:b.height}});d.gap=cards.length>1?(d.rects[1].top-(d.rects[0].top+d.rects[0].h)):12;
  d.scroller=v.closest('main')||document.scrollingElement;d.st0=d.scroller.scrollTop;exPaint();exAuto()}
function exPaint(){const d=exDrag;if(!d||!d.on)return;const scroll=d.scroller.scrollTop-d.st0;
  d.card.style.setProperty('--dy',(d.y-(d.rects[d.from].top+d.rects[d.from].h/2)+scroll)+'px');
  /* where would it land? compare the finger with the middles of the other cards */
  const fy=d.y+scroll;let to=0;d.rects.forEach((r,k)=>{if(k!==d.from&&fy>r.top+r.h/2)to++});to=Math.max(0,Math.min(d.cards.length-1,to));
  if(to!==d.to){d.to=to;if(typeof haptic==='function')haptic()}
  const shift=d.rects[d.from].h+d.gap;d.cards.forEach((c,k)=>{if(k===d.from)return;const s=d.from<k&&k<=to?-shift:to<=k&&k<d.from?shift:0;c.style.transform=s?`translateY(${s}px)`:''})}
function exAuto(){const d=exDrag;if(!d||!d.on)return;const H=innerHeight,edge=90;let v=0;if(d.y<edge)v=-(edge-d.y)/6;else if(d.y>H-edge-120)v=(d.y-(H-edge-120))/6;
  if(v){d.scroller.scrollTop+=v;exPaint()}d.raf=requestAnimationFrame(exAuto)}
document.addEventListener('pointermove',e=>{const d=exDrag;if(!d||e.pointerId!==d.id)return;d.y=e.clientY;
  if(!d.on){if(Math.abs(e.clientY-d.y0)>6||Math.abs(e.clientX-d.x0)>6)exLift(e.clientY);return}exPaint()});
function exEnd(e){const d=exDrag;if(!d||(e&&e.pointerId!==d.id))return;exDrag=null;clearTimeout(d.hold);cancelAnimationFrame(d.raf);if(!d.on)return;
  const v=document.getElementById('view');d.card.classList.add('drop');d.card.style.setProperty('--dy','0px');
  const moved=d.to!==d.from;if(moved)exMove(d.from,d.to);if(typeof haptic==='function')haptic();
  setTimeout(()=>{v.classList.remove('reorder');render();if(moved){const c=document.querySelectorAll('#view section.ex')[d.to];if(c)c.scrollIntoView({block:'nearest'})}},moved?60:200)}
document.addEventListener('pointerup',exEnd);document.addEventListener('pointercancel',exEnd);
document.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('.exgrab');if(!g||!S.active)return;const i=+g.dataset.x;
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const to=i+(e.key==='ArrowUp'?-1:1);if(to<0||to>=S.active.exercises.length)return;exMove(i,to);render();
    const ng=document.querySelector('.exgrab[data-x="'+to+'"]');if(ng)ng.focus();toast(exById(S.active.exercises[to].exId).name+' moved to position '+(to+1)+'.')}});

/* ---------- your own exercises: several muscles, and which part of each ----------
   Tap muscle groups to add them; the first one is the main muscle (it decides which drop-down the exercise sits
   under), the rest are secondary and count half a set each towards weekly sets per muscle, like the built-in
   exercises. Each muscle has a drop-down for the part it works. Stored on the exercise as muscle, part, sec
   ({Triceps:.5}) and parts ({Triceps:'Long head'}). */
const MPARTS={Chest:['Whole chest','Upper chest','Middle chest','Lower chest'],Back:['Whole back','Lats','Upper back','Lower back','Traps'],Shoulders:['All heads','Front delts','Side delts','Rear delts'],
  Biceps:['Whole biceps','Long head','Short head','Brachialis'],Triceps:['All heads','Long head','Lateral head','Medial head'],Quads:['Whole quads','Rectus femoris','Inner and outer quads'],
  Hamstrings:['Whole hamstrings','Upper (hip hinge)','Lower (knee curl)'],Glutes:['Whole glutes','Glute max','Glute medius'],Calves:['Whole calves','Gastrocnemius','Soleus'],Core:['Whole core','Upper abs','Lower abs','Obliques'],Other:[]};
let muscSel=[];   /* [[muscle, part], ...] while the editor is open; first is the main muscle */
const shortPart=(m,p)=>p&&p!==MPARTS[m][0]?p.toLowerCase().replace(' '+m.toLowerCase(),'').replace(/ delts$/,''):'';
function muscText(ex){if(!ex)return'';const main=ex.muscle+(shortPart(ex.muscle,ex.part)?' ('+shortPart(ex.muscle,ex.part)+')':''),sec=Object.keys(ex.sec||{});
  return main+(sec.length?' · also '+sec.map(m=>m+(ex.parts&&shortPart(m,ex.parts[m])?' ('+shortPart(m,ex.parts[m])+')':'')).join(', '):'')}
function muscEditor(sel){muscSel=sel.map(x=>x.slice());return `<div id="musced" class="stack" style="gap:8px">${muscInner()}</div>`}
function muscInner(){const on=new Set(muscSel.map(x=>x[0]));
  return `<div class="small muted">Muscles worked. The first is the main one.</div><div class="row wrap" style="gap:6px">${MUSCLES.map(m=>`<button class="chip ${on.has(m)?'on':''}" data-a="musc-tog" data-v="${m}" aria-pressed="${on.has(m)}">${m}</button>`).join('')}</div>
  ${muscSel.map(([m,p],k)=>`<div class="row between" style="gap:8px"><span style="min-width:0;font-size:15px;font-weight:700">${m} <span class="small muted" style="font-weight:600">${k?'secondary':'main'}</span></span>${MPARTS[m].length?`<select data-i="musc-part" data-v="${m}" aria-label="Which part of ${m}" style="max-width:56%">${MPARTS[m].map(o=>`<option ${o===(p||MPARTS[m][0])?'selected':''}>${o}</option>`).join('')}</select>`:''}</div>`).join('')}`}
function muscRedraw(){const el=document.getElementById('musced');if(el)el.innerHTML=withTicks(muscInner())}
function muscPreset(m){if(!muscSel.length){muscSel=[[m,'']];muscRedraw()}}
function muscRead(){if(!document.getElementById('musced'))return null;if(!muscSel.length)return{};const [m0,p0]=muscSel[0],out={muscle:m0,part:p0||MPARTS[m0][0]||''},sec={},parts={};
  for(const [m,p] of muscSel.slice(1)){sec[m]=.5;parts[m]=p||MPARTS[m][0]||''}if(Object.keys(sec).length){out.sec=sec;out.parts=parts}return out}
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.i==='musc-part'){const r=muscSel.find(x=>x[0]===t.dataset.v);if(r)r[1]=t.value}});
/* secondary muscles of your own exercises feed the weekly sets per muscle, like the built-in ones */
function muscSync(){if(typeof SECONDARY!=='object')return;for(const c of S.custom){if(c.sec)SECONDARY[c.id]=c.sec;else delete SECONDARY[c.id]}}
{const r0=render;render=function(){muscSync();return r0.apply(this,arguments)}}
function muscEditSheet(id){const c=S.custom.find(x=>x.id===id);if(!c)return;const sel=[[c.muscle,c.part||'']].concat(Object.keys(c.sec||{}).map(m=>[m,(c.parts||{})[m]||'']));
  pushSheet(`<h2>${esc(c.name)}</h2><div class="stack">${muscEditor(sel)}<button class="btn primary" data-a="musc-save" data-v="${esc(id)}">Save</button></div>`,'musc')}
{const wa3=workoutAction;workoutAction=function(a,v,b){
  if(a==='musc-tog'){const k=muscSel.findIndex(x=>x[0]===v);if(k>=0)muscSel.splice(k,1);else muscSel.push([v,'']);muscRedraw();return true}
  if(a==='musc-edit'){muscEditSheet(v);return true}
  if(a==='musc-save'){const c=S.custom.find(x=>x.id===v),m=muscRead();if(!c)return true;if(!m.muscle){toast('Pick at least one muscle group.');return true}
    delete c.sec;delete c.parts;Object.assign(c,m);save('settings');muscSync();closeSheet();render();toast('Muscles saved.');return true}
  return wa3(a,v,b)}}
(()=>{const st=document.createElement('style');st.textContent=`.linkbtn{display:inline;padding:0;min-height:0;background:none;color:var(--blue);font-weight:700;text-decoration:underline;text-underline-offset:2px}
.linkbtn::after{content:'';position:absolute;inset:-12px}.linkbtn{position:relative}`;document.head.appendChild(st)})();
