/* Apex: app icon chooser, Face ID / fingerprint unlock, calendar reminders, warm-up calculator, exercise order,
   time estimates and short technique cues. Loaded last; hooks are small typeof-guarded calls in index.html. */

(function(){const st=document.createElement('style');st.textContent=`
.icgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.icopt{aspect-ratio:1;border-radius:22%;overflow:hidden;border:3px solid transparent;padding:0}.icopt img{width:100%;height:100%;display:block}.icopt.on{border-color:#fff}
.swatch{width:38px;height:38px;border-radius:50%;border:3px solid transparent;flex:none}.swatch.on{border-color:#fff}
.dayc{flex:1;min-width:0;padding:8px 0!important;text-align:center}
`;document.head.appendChild(st)})();

/* ---------- app icon ---------- */
const IC_BG={violet:['#7b6cff','#2a1e6e'],midnight:['#1b2140','#05060f'],sunset:['#ff8a5c','#b3246b'],emerald:['#3ddc97','#0c5a4a'],crimson:['#ff5a6e','#6e0f1e'],ocean:['#5ac8fa','#1a3a8a'],gold:['#ffd166','#b8730a'],mono:['#f4f5f8','#c9ccd6']};
const IC_SYM={dumbbell:'M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12',bolt:'M13 2L5 13h6l-1 9 8-11h-6z',flame:'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',peak:'M2 19l7-11 4 6 2-3 7 8z',crown:'M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z',shield:'M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7z'};
const iconCfg=()=>{try{return Object.assign({g:'text',t:'A',bg:'violet'},JSON.parse(localStorage.getItem('apex.icon')||'{}'))}catch(e){return{g:'text',t:'A',bg:'violet'}}};
function iconDraw(cfg,size){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),bg=IC_BG[cfg.bg]||IC_BG.violet,gr=x.createLinearGradient(0,0,size,size);gr.addColorStop(0,bg[0]);gr.addColorStop(1,bg[1]);x.fillStyle=gr;x.fillRect(0,0,size,size);
  const hl=x.createRadialGradient(size*.3,size*.2,0,size*.3,size*.2,size*.8);hl.addColorStop(0,'rgba(255,255,255,.28)');hl.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=hl;x.fillRect(0,0,size,size);
  const ink=cfg.bg==='mono'||cfg.bg==='gold'?'#14172b':'#ffffff';
  if(cfg.g==='text'){const t=String(cfg.t||'A').slice(0,2);x.fillStyle=ink;x.textAlign='center';x.textBaseline='middle';x.font=`900 ${size*(t.length>1?.46:.62)}px Nunito, -apple-system, system-ui, sans-serif`;x.fillText(t,size/2,size*.54)}
  else{const s=size*.62/24;x.save();x.translate(size*.19,size*.19);x.scale(s,s);x.strokeStyle=ink;x.lineWidth=2.2;x.lineCap='round';x.lineJoin='round';try{x.stroke(new Path2D(IC_SYM[cfg.g]||IC_SYM.dumbbell))}catch(e){}x.restore()}
  return c.toDataURL('image/png')}
function iconApply(){if(!localStorage.getItem('apex.icon'))return;try{const url=iconDraw(iconCfg(),360);document.querySelectorAll('link[rel="apple-touch-icon"],link[rel="icon"]').forEach(l=>{l.href=url})}catch(e){}}
function iconSheet(){const c=iconCfg(),opts=[['text',c.t||'A']].concat(Object.keys(IC_SYM).map(k=>[k,'']));
  openSheet(`<h2>App icon</h2><p class="small muted">Pick the picture and colour that appear on your Home Screen.</p><div class="stack">
  <div class="icgrid">${opts.map(o=>`<button class="icopt ${c.g===o[0]?'on':''}" data-a="ic-g" data-v="${o[0]}" aria-label="${o[0]==='text'?'Letters':o[0]}"><img alt="" src="${iconDraw({g:o[0],t:c.t,bg:c.bg},120)}"></button>`).join('')}</div>
  ${c.g==='text'?`<label class="f">Letters (one or two)<input type="text" id="ic-t" maxlength="2" value="${esc(c.t||'A')}" autocapitalize="characters" autocomplete="off"></label>`:''}
  <div class="row wrap" style="gap:10px">${Object.keys(IC_BG).map(k=>`<button class="swatch ${c.bg===k?'on':''}" data-a="ic-bg" data-v="${k}" aria-label="${k}" style="background:linear-gradient(135deg,${IC_BG[k][0]},${IC_BG[k][1]})"></button>`).join('')}</div>
  <div class="tile small">${typeof isApp==='function'&&isApp()?'<strong>This copy is already on your Home Screen, and an iPhone fixes the icon at the moment it is added.</strong> To change it: open Apex in Safari, choose the icon there in Settings, Devices, then add it to the Home Screen again and delete the old one. Sign in on the new one and your data comes back.':'<strong>Choose first, then add.</strong> An iPhone takes the icon at the moment you tap Add to Home Screen, so pick it here in Safari and then follow the Home Screen guide. You can also rename the app on that screen.'}</div>
  ${typeof isApp==='function'&&isApp()?'<button class="btn block" data-a="app-copy">Copy the link to open in Safari</button>':'<button class="btn block" data-a="install-guide">Home Screen guide</button>'}</div>`,'icon')}

/* ---------- Face ID / Touch ID / fingerprint unlock (the PIN stays as the fallback) ---------- */
const faceGet=()=>{try{return JSON.parse(localStorage.getItem('apex.face')||'null')}catch(e){return null}},faceOk=()=>!!(window.PublicKeyCredential&&navigator.credentials&&window.isSecureContext);
const rnd=n=>crypto.getRandomValues(new Uint8Array(n));
function faceRow(){if(!pinGet())return'';const on=!!faceGet();return `<div class="row between" style="gap:12px"><span>Unlock with Face ID or fingerprint<br><span class="small muted">${faceOk()?'Your PIN still works as a fallback':'Not available in this browser'}</span></span><button class="btn sm" data-a="${on?'face-off':'face-on'}" ${faceOk()?'':'disabled style="opacity:.4"'}>${on?'On · turn off':'Turn on'}</button></div>`}
async function faceSetup(){if(!faceOk()){toast('This browser does not support it.');return}
  try{const cred=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'Apex'},user:{id:rnd(16),name:'apex-device',displayName:'Apex on this device'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000,attestation:'none'}});
    if(!cred)throw 0;localStorage.setItem('apex.face',JSON.stringify({id:b64(cred.rawId)}));toast('Face ID or fingerprint unlock is on.');refreshSettings()}
  catch(e){toast(e&&e.name==='NotAllowedError'?'Cancelled. Nothing was changed.':'Could not set it up on this device.')}}
async function faceUnlock(){const f=faceGet();if(!f||!faceOk())return;
  try{const r=await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id:unb64(f.id),transports:['internal']}],userVerification:'required',timeout:60000}});if(!r)throw 0;const el=$('#lock');el.classList.remove('on');el.innerHTML=''}
  catch(e){toast('Not recognised. Enter your PIN instead.')}}
{const lk=document.getElementById('lock');if(lk)new MutationObserver(()=>{const box=lk.querySelector('.lockbox'),pin=lk.querySelector('#lock-pin');if(box&&pin&&faceGet()&&faceOk()&&!lk.querySelector('[data-a="face-unlock"]')){const b=document.createElement('button');b.className='btn block';b.dataset.a='face-unlock';b.textContent='Use Face ID or fingerprint';const u=lk.querySelector('[data-a="unlock"]');(u&&u.parentNode===box?u:box.lastChild).after(b)}}).observe(lk,{childList:true,subtree:true})}

/* ---------- reminders through the phone's own calendar ---------- */
const RDAYS=[['MO','M'],['TU','T'],['WE','W'],['TH','T'],['FR','F'],['SA','S'],['SU','S']];let remKind='weigh',remDays=new Set(['MO','TU','WE','TH','FR','SA','SU']);
function remSheet(){openSheet(`<h2>Reminders</h2><p class="small muted">A web app cannot send notifications while it is closed unless it runs its own server, which Apex does not. So reminders are added to your phone's calendar, which alerts you like any other event.</p><div class="stack">
  <div class="seg"><button data-a="rem-kind" data-v="weigh" class="${remKind==='weigh'?'on':''}">Weigh-in</button><button data-a="rem-kind" data-v="train" class="${remKind==='train'?'on':''}">Workout</button><button data-a="rem-kind" data-v="food" class="${remKind==='food'?'on':''}">Log food</button></div>
  <div class="row" style="gap:6px">${RDAYS.map(d=>`<button class="chip dayc ${remDays.has(d[0])?'on':''}" data-a="rem-day" data-v="${d[0]}" aria-label="${d[0]}">${d[1]}</button>`).join('')}</div>
  <label class="f">Time<input type="time" id="rem-t" value="${remKind==='weigh'?'07:00':remKind==='train'?'17:30':'20:00'}"></label>
  <button class="btn primary block" data-a="rem-make">Add to calendar</button>
  <div class="small muted">Your phone asks which calendar to add it to. To stop a reminder later, delete the repeating event in the Calendar app.</div></div>`,'rem')}
async function remMake(){const t=(($('#rem-t')||{}).value||'07:00').replace(':',''),days=RDAYS.map(d=>d[0]).filter(d=>remDays.has(d));if(!days.length){toast('Pick at least one day.');return}
  const title={weigh:'Weigh in (Apex)',train:'Workout (Apex)',food:'Log your food (Apex)'}[remKind],now=new Date(),p=n=>String(n).padStart(2,'0'),idx=RDAYS.findIndex(d=>d[0]===days[0]),st=new Date(now);st.setDate(now.getDate()+((idx+1-now.getDay()+7)%7));
  const ymdS=`${st.getFullYear()}${p(st.getMonth()+1)}${p(st.getDate())}`,stamp=now.toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Apex//Reminders//EN','BEGIN:VEVENT','UID:apex-'+remKind+'-'+Date.now()+'@apex','DTSTAMP:'+stamp,'DTSTART:'+ymdS+'T'+t+'00','DURATION:PT15M','RRULE:FREQ=WEEKLY;BYDAY='+days.join(','),'SUMMARY:'+title,'URL:https://mevolutionary.github.io/apex/','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+title,'TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n'),name='apex-'+remKind+'-reminder.ics';
  let file=null;try{file=new File([ics],name,{type:'text/calendar'})}catch(e){}
  try{if(file&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return}}catch(e){if(e&&e.name==='AbortError')return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Reminder file downloaded. Open it to add it to your calendar.')}catch(e){toast('Could not make the reminder on this browser.')}}
function devicesExtra(){return `<div class="tile small row between"><span>App icon</span><button class="btn sm" data-a="ic-open">Customise</button></div><div class="tile small row between"><span>Reminders</span><button class="btn sm" data-a="rem-open">Set up</button></div>`}

/* ---------- time estimates ---------- */
const WORK_S=40,SWITCH_S=60;
const estSecs=(exId,n)=>n*(WORK_S+(restFor(exId)||0))+SWITCH_S;
function estRoutine(exIds){let s=0;exIds.forEach(id=>{const pe=prevEx(id);s+=estSecs(id,(pe?pe.sets.length+(pe.warm||[]).length:3))});return Math.max(5,Math.round(s/300)*5)}
function estLeft(){const a=S.active;if(!a)return'';let s=0,left=0;a.exercises.forEach(e=>{const n=e.sets.filter(q=>!q.done).length;if(n){left+=n;s+=estSecs(e.exId,n)}});return left?`${left} set${left===1?'':'s'} to go · about ${Math.max(1,Math.round(s/60))} min`:''}

/* ---------- warm-up calculator ---------- */
function warmPlan(x){const e=S.active.exercises[x],ex=exById(e.exId);if(ex.bw)return{err:'Warm-up sets are worked out from a bar weight, so they are not available for bodyweight exercises.'};
  const first=e.sets.find(q=>q.t!=='w'),j=first?e.sets.indexOf(first):-1,p=j>=0?prevFor(prevEx(e.exId),e.sets,j):null,w=first&&first.w!=null?first.w:(p?p.w:0);if(!(w>0))return{err:'Enter the weight of your first working set, then tap Warm-up again.'};
  const lb=S.settings.unit==='lb',step=lb?5/LB:2.5,bar=lb?45/LB:20,rd=v=>Math.max(step,Math.round(v/step)*step),out=[];
  if(w>=bar*2)out.push({w:bar,r:10});[[.5,5],[.7,3],[.85,1]].forEach(a=>{const v=rd(w*a[0]);if(v<w-1e-6&&(!out.length||v>out[out.length-1].w+1e-6))out.push({w:v,r:a[1]})});return{w,sets:out}}
function warmSheet(x){const pl=warmPlan(x),ex=exById(S.active.exercises[x].exId);if(pl.err){toast(pl.err);return}
  openSheet(`<h2>Warm-up for ${esc(ex.name)}</h2><p class="small muted">Building up to ${disp(pl.w)} ${unit()}. Lighter sets with fewer reps as the weight climbs, so you are ready without being tired.</p><div class="stack"><div class="list">${pl.sets.map(q=>`<div class="row between"><span class="num" style="font-weight:800">${disp(q.w)} ${unit()}</span><span class="muted">× ${q.r}</span></div>`).join('')||'<div class="muted small">This weight is light enough that no ramp is needed.</div>'}</div>
  ${pl.sets.length?`<button class="btn primary block" data-a="warm-add" data-x="${x}">Add as warm-up sets</button>`:''}<div class="small muted">A common ramp: about 50%, 70% and 85% of the working weight, rounded to the plates. It is a starting point, not a rule. Warm-up sets do not count towards PRs or volume.</div></div>`,'warm')}

/* ---------- short technique cues ---------- */
const CUES={bench:'Shoulder blades pulled back and down, feet planted. Lower the bar to mid-chest with elbows about 45 degrees from your sides, then press up and slightly back.',incbench:'Bench at 30 to 45 degrees. Lower to the upper chest and press straight up, keeping your shoulder blades pinned.',dbbench:'Start with the dumbbells over your chest, lower until your upper arms are about level with the bench, then press up and slightly in.',incdb:'Bench at about 30 degrees. Lower the dumbbells beside the upper chest and press up without clanging them together.',fly:'Slight bend in the elbows that does not change. Sweep the hands together in an arc and squeeze the chest, then return under control.',dip:'Lean forward a little for chest, stay upright for triceps. Lower until your upper arms are about parallel to the floor, then press up.',dead:'Bar over mid-foot, shins to the bar, back flat. Push the floor away, keep the bar against your legs, and stand tall without leaning back.',row:'Hinge until your torso is close to parallel, back flat. Pull the bar to your lower ribs and lower it under control without standing up.',pullup:'Start from a dead hang. Pull your elbows down to your sides until your chin clears the bar, then lower all the way.',chinup:'Palms facing you, from a dead hang. Pull until your chin clears the bar and lower all the way.',latpd:'Lean back slightly, pull the bar to your upper chest by driving the elbows down, and let it rise fully each rep.',cablerow:'Sit tall, pull the handle to your stomach while squeezing your shoulder blades, and reach forward on the way back without rounding.',dbrow:'One hand and knee on the bench, back flat. Pull the dumbbell to your hip and lower until your arm is straight.',ohp:'Bar on the front of your shoulders, squeeze your glutes. Press straight up, moving your head through once the bar passes it.',dbohp:'Dumbbells at ear height with forearms vertical. Press up until your arms are straight without arching your back.',latraise:'Slight bend in the elbows. Raise out to the sides to shoulder height, leading with the elbows, and lower slowly.',facepull:'Rope at face height. Pull towards your forehead, spreading the rope and turning your knuckles back.',curl:'Elbows by your sides. Curl without swinging your body and lower slowly until your arms are straight.',dbcurl:'Elbows by your sides, palms turning up as you curl. Lower slowly until your arms are straight.',hammer:'Thumbs up, elbows by your sides. Curl without swinging and lower slowly.',pushdown:'Elbows pinned to your sides. Push down until your arms are straight and let the handle rise only to chest height.',skull:'Upper arms angled slightly back. Bend only at the elbow, lowering the bar towards your forehead, then extend.',squat:'Bar across the upper back, feet about shoulder width. Sit down between your hips with knees tracking over toes, to at least thighs parallel, then drive up.',fsquat:'Bar on the front of the shoulders, elbows high. Stay upright as you sit down, then drive up keeping the elbows up.',legpress:'Feet shoulder width on the plate. Lower until your knees are well bent without your lower back lifting off the pad, then press without locking hard.',legext:'Line your knee up with the pivot. Straighten fully, pause, and lower slowly.',bss:'Back foot on a bench, front foot far enough forward that your knee stays over your foot. Drop straight down and drive up through the front leg.',rdl:'Soft knees that stay fixed. Push your hips back with a flat back until you feel your hamstrings stretch, then stand by driving the hips forward.',legcurl:'Hips down on the pad. Curl the weight all the way and lower it slowly.',hipthrust:'Upper back on a bench, bar over the hips. Drive up until your hips are level with your knees and squeeze, keeping your chin tucked.',calf:'Rise as high as you can on the balls of your feet, pause, then lower until your heels are below the step.',legraise:'Hang with straight arms. Raise your legs by curling your hips up, not by swinging, and lower under control.'};
function cueTile(id){const ex=exById(id),c=CUES[id];return `<div class="tile small">${c?`<strong>How to do it.</strong> ${c}`:'<strong>Technique.</strong> No written cues for this exercise yet.'} <a class="info" href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name+' proper form')}" target="_blank" rel="noopener">Watch a demo</a></div>`}

function moreAction(a,v,b){const x=+b.dataset.x;switch(a){
  case 'ic-open':iconSheet();break;
  case 'ic-g':case 'ic-bg':{const c=iconCfg(),t=$('#ic-t');if(t&&t.value.trim())c.t=t.value.trim().slice(0,2);if(a==='ic-g')c.g=v;else c.bg=v;localStorage.setItem('apex.icon',JSON.stringify(c));iconApply();iconSheet();break}
  case 'face-on':faceSetup();break;
  case 'face-off':localStorage.removeItem('apex.face');toast('Turned off. The PIN still locks the app.');refreshSettings();break;
  case 'face-unlock':faceUnlock();break;
  case 'pin-off':setTimeout(()=>{if(!pinGet())localStorage.removeItem('apex.face')},600);break;
  case 'rem-open':remSheet();break;
  case 'rem-kind':remKind=v;remSheet();break;
  case 'rem-day':remDays.has(v)?remDays.delete(v):remDays.add(v);b.classList.toggle('on',remDays.has(v));break;
  case 'rem-make':remMake();break;
  case 'ex-warm':warmSheet(x);break;
  case 'warm-add':{const pl=warmPlan(x),e=S.active.exercises[x];if(pl.err||!pl.sets.length)break;e.sets=pl.sets.map(q=>({w:Math.round(q.w*100)/100,r:q.r,t:'w',done:false})).concat(e.sets.filter(q=>!(q.t==='w'&&!q.done)));save('active');closeSheet();render();break}
  case 'ex-up':case 'ex-down':{const l=S.active.exercises,to=x+(a==='ex-up'?-1:1);if(to<0||to>=l.length)break;l.forEach(e=>delete e.ss);const m=l.splice(x,1)[0];l.splice(to,0,m);save('active');render();break}
}}
document.addEventListener('change',ev=>{if(ev.target&&ev.target.id==='ic-t'){const c=iconCfg();c.t=(ev.target.value.trim()||'A').slice(0,2);c.g='text';localStorage.setItem('apex.icon',JSON.stringify(c));iconApply();iconSheet()}});
iconApply();
