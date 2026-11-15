/* Apex progress extras: a Progress screen (this week's muscle map, awards, recap) and two cards on the Body screen
   (goal weight with a projected date, body measurements). Awards and the recap are worked out from the data each
   time, so nothing extra is stored for them. Goal weight and measurements live in settings (synced). */

ITEMS.progress={label:'Progress',kind:'screen'};
ICON.progress='<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>';

(function(){const st=document.createElement('style');st.textContent=`
.mmap{display:flex;justify-content:center;gap:18px}.mmap svg{width:44%;max-width:170px;height:auto}
.mmap .m{stroke:rgba(255,255,255,.22);stroke-width:1}.mmap .n{fill:rgba(255,255,255,.07);stroke:rgba(255,255,255,.16);stroke-width:1}
.mleg{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--ink-2);margin-top:10px}.mleg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.awards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.aw{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:14px 6px 12px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:12px;font-weight:700;line-height:1.25}
.aw .ic{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);color:var(--ink-3)}
.aw .ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.aw.got{background:rgba(255,209,102,.1);border-color:rgba(255,209,102,.45)}.aw.got .ic{background:linear-gradient(145deg,#ffe08a,#f0a93b);color:#3a2a00}
.aw small{font-weight:600;color:var(--ink-3);font-size:11px}.aw:not(.got){color:var(--ink-2)}
.aw .pb{width:80%;height:4px;border-radius:9px;background:rgba(255,255,255,.12);overflow:hidden}.aw .pb i{display:block;height:100%;background:var(--ink-2);border-radius:9px}
`;document.head.appendChild(st)})();

/* ---------- this week's muscle map ---------- */
const MCOL=r=>r<=0?'rgba(255,255,255,.07)':r<.5?'rgba(123,108,255,.38)':r<1?'rgba(123,108,255,.8)':'#3ddc97';
function weekMuscles(){const out={},from=weekStart();S.workouts.filter(w=>w.start>=from).forEach(w=>w.exercises.forEach(e=>{const m=exById(e.exId).muscle;out[m]=(out[m]||0)+e.sets.length;const sec=typeof SECONDARY==='object'&&SECONDARY[e.exId];if(sec)for(const x in sec)out[x]=(out[x]||0)+e.sets.length*sec[x]}));return out}
function muscleMap(){const sets=weekMuscles(),tg=typeof coachTargets==='function'?coachTargets():{},r=m=>{const t=tg[m]||10;return(sets[m]||0)/t},f=m=>`class="m" fill="${MCOL(r(m))}"`;
  const front=`<svg viewBox="0 0 120 250" aria-hidden="true"><circle class="n" cx="60" cy="20" r="13"/><rect class="n" x="53" y="32" width="14" height="10" rx="4"/>
    <ellipse ${f('Shoulders')} cx="31" cy="56" rx="13" ry="10"/><ellipse ${f('Shoulders')} cx="89" cy="56" rx="13" ry="10"/>
    <rect ${f('Chest')} x="40" y="46" width="19" height="26" rx="7"/><rect ${f('Chest')} x="61" y="46" width="19" height="26" rx="7"/>
    <rect ${f('Biceps')} x="18" y="68" width="14" height="32" rx="7"/><rect ${f('Biceps')} x="88" y="68" width="14" height="32" rx="7"/>
    <rect class="n" x="15" y="103" width="12" height="32" rx="6"/><rect class="n" x="93" y="103" width="12" height="32" rx="6"/>
    <rect ${f('Core')} x="43" y="75" width="34" height="46" rx="9"/>
    <rect ${f('Quads')} x="38" y="126" width="20" height="58" rx="9"/><rect ${f('Quads')} x="62" y="126" width="20" height="58" rx="9"/>
    <rect ${f('Calves')} x="40" y="190" width="15" height="48" rx="7"/><rect ${f('Calves')} x="65" y="190" width="15" height="48" rx="7"/></svg>`;
  const back=`<svg viewBox="0 0 120 250" aria-hidden="true"><circle class="n" cx="60" cy="20" r="13"/><rect class="n" x="53" y="32" width="14" height="10" rx="4"/>
    <ellipse ${f('Shoulders')} cx="31" cy="56" rx="13" ry="10"/><ellipse ${f('Shoulders')} cx="89" cy="56" rx="13" ry="10"/>
    <rect ${f('Back')} x="40" y="46" width="40" height="54" rx="10"/>
    <rect ${f('Triceps')} x="18" y="68" width="14" height="32" rx="7"/><rect ${f('Triceps')} x="88" y="68" width="14" height="32" rx="7"/>
    <rect class="n" x="15" y="103" width="12" height="32" rx="6"/><rect class="n" x="93" y="103" width="12" height="32" rx="6"/>
    <rect ${f('Glutes')} x="40" y="103" width="40" height="24" rx="10"/>
    <rect ${f('Hamstrings')} x="38" y="130" width="20" height="54" rx="9"/><rect ${f('Hamstrings')} x="62" y="130" width="20" height="54" rx="9"/>
    <rect ${f('Calves')} x="40" y="190" width="15" height="48" rx="7"/><rect ${f('Calves')} x="65" y="190" width="15" height="48" rx="7"/></svg>`;
  const rows=MUSCLES.filter(m=>m!=='Other').map(m=>{const t=tg[m]||10,v=Math.round((sets[m]||0)*10)/10;return `<div class="row between small"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;background:${MCOL(v/t)}"></i>${m}</span><span class="num muted">${v} of ${t} sets</span></div>`}).join('');
  return `<section class="glass card"><h2>Muscles this week</h2><div class="mmap">${front}${back}</div>
  <div class="mleg"><span><i style="background:${MCOL(0)};border:1px solid rgba(255,255,255,.2)"></i>none</span><span><i style="background:${MCOL(.2)}"></i>started</span><span><i style="background:${MCOL(.7)}"></i>over half</span><span><i style="background:${MCOL(1)}"></i>target hit</span></div>
  <div class="list" style="margin-top:14px">${rows}</div><div class="small muted" style="margin-top:10px">Working sets since Monday against the Coach's weekly target for your goal. Sets for a second muscle in the same lift count as half.</div></section>`}

/* ---------- awards ---------- */
const AIC={dumb:'<path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12"/>',flame:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',star:'<path d="M12 3.5l2.6 5.4 5.9.8-4.300 4.100 1 5.800L12 16.900 6.800 19.600l1-5.800L3.500 9.700l5.900-.8z"/>',shield:'<path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7z"/>',plate:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',fork:'<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/>',scale:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9a4 4 0 0 1 6 0l-3 3"/>',up:'<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>'};
function awardList(){const ws=S.workouts,n=ws.length,prs=ws.reduce((a,w)=>a+(w.prs||[]).length,0),stk=streak(ws),vol=ws.reduce((a,w)=>a+volume(w),0),ov=overall(),lb=S.settings.unit==='lb';
  const best=id=>{const b=bestOf(ws,id);return b?(lb?b.w*LB:b.w):0},foodDays=Object.keys(S.food).filter(d=>(S.food[d]||[]).some(e=>!e.w)).length,out=[],add=(name,have,need,ic,fmt)=>out.push({name,have,need,ic,got:have>=need,fmt});
  [[1,'First workout'],[10,'10 workouts'],[50,'50 workouts'],[100,'100 workouts'],[250,'250 workouts'],[500,'500 workouts']].forEach(a=>add(a[1],n,a[0],'dumb'));
  [[4,'4-week streak'],[12,'12-week streak'],[26,'Half-year streak'],[52,'Full-year streak']].forEach(a=>add(a[1],stk,a[0],'flame'));
  [[1,'First PR'],[25,'25 PRs'],[100,'100 PRs']].forEach(a=>add(a[1],prs,a[0],'star'));
  TIERS.slice(1).forEach((t,i)=>add(t[0]+' overall',ov?ov.tier:-1,i+1,'shield',()=>ov?TIERS[ov.tier][0]+' now':'not ranked yet'));
  const u=lb?'lb':'kg',pl=(id,label,arr)=>arr.forEach(x=>add(label+' '+x+' '+u,Math.floor(best(id)),x,'plate'));
  pl('bench','Bench',lb?[135,225,315]:[60,100,140]);pl('squat','Squat',lb?[225,315,405]:[100,140,180]);pl('dead','Deadlift',lb?[225,405,495]:[100,180,220]);
  [[1e5,'100 t lifted'],[5e5,'500 t lifted'],[1e6,'1,000 t lifted']].forEach(a=>add(a[1],vol,a[0],'up',()=>big(vol)+' kg so far'));
  [[7,'7 days of food logged'],[30,'30 days of food logged'],[100,'100 days of food logged']].forEach(a=>add(a[1],foodDays,a[0],'fork'));
  [[10,'10 weigh-ins'],[50,'50 weigh-ins'],[100,'100 weigh-ins']].forEach(a=>add(a[1],S.weights.length,a[0],'scale'));
  return out}
let awardsAll=false;
function awardsCard(){const l=awardList(),got=l.filter(a=>a.got),next=l.filter(a=>!a.got).sort((a,b)=>b.have/b.need-a.have/a.need),show=awardsAll?got.concat(next):got.slice(-3).concat(next.slice(0,3));
  const cell=a=>`<div class="aw ${a.got?'got':''}"><div class="ic"><svg viewBox="0 0 24 24">${AIC[a.ic]}</svg></div>${a.name}${a.got?'':`<div class="pb"><i style="width:${Math.max(4,Math.min(100,a.have/a.need*100))}%"></i></div><small>${a.fmt?a.fmt():Math.max(0,Math.floor(a.have)).toLocaleString()+' of '+a.need.toLocaleString()}</small>`}</div>`;
  return `<section class="glass card"><h2>Awards<span class="num small muted" style="font-family:var(--body);font-weight:400">${got.length} of ${l.length}</span></h2><div class="awards">${show.map(cell).join('')}</div><button class="btn block" style="margin-top:14px" data-a="aw-all">${awardsAll?'Show fewer':'Show all '+l.length}</button></section>`}

/* ---------- recap ---------- */
let recapSpan='month';
function recapRange(){const d=new Date();d.setHours(0,0,0,0);if(recapSpan==='year'){return[new Date(d.getFullYear(),0,1).getTime(),Date.now(),String(d.getFullYear())]}
  const m=recapSpan==='last'?-1:0,a=new Date(d.getFullYear(),d.getMonth()+m,1),b=new Date(d.getFullYear(),d.getMonth()+m+1,1);return[a.getTime(),Math.min(b.getTime(),Date.now()),a.toLocaleString(undefined,{month:'long'})]}
function recapCard(){const [from,to,label]=recapRange(),ws=S.workouts.filter(w=>w.start>=from&&w.start<to),vol=ws.reduce((a,w)=>a+volume(w),0),sets=ws.reduce((a,w)=>a+setCount(w),0),prs=ws.reduce((a,w)=>a+(w.prs||[]).length,0),ms=ws.reduce((a,w)=>a+Math.max(0,(w.end||w.start)-w.start),0);
  const mus={};ws.forEach(w=>w.exercises.forEach(e=>{const m=exById(e.exId).muscle;mus[m]=(mus[m]||0)+e.sets.length}));const top=Object.keys(mus).sort((a,b)=>mus[b]-mus[a])[0];
  const exs={};ws.forEach(w=>w.exercises.forEach(e=>{exs[e.exId]=(exs[e.exId]||0)+1}));const topEx=Object.keys(exs).sort((a,b)=>exs[b]-exs[a])[0];
  const f=ymd(from),t=ymd(to),wt=S.weights.filter(x=>x.d>=f&&x.d<=t),wd=wt.length>=2?wt[wt.length-1].kg-wt[0].kg:null,fd=Object.keys(S.food).filter(d=>d>=f&&d<=t&&(S.food[d]||[]).some(e=>!e.w)).length;
  const tile=(v,l)=>`<div class="tile"><b style="font-size:20px">${v}</b><span>${l}</span></div>`;
  return `<section class="glass card"><h2>Recap</h2><div class="seg" style="margin-bottom:12px"><button data-a="recap" data-v="month" class="${recapSpan==='month'?'on':''}">This month</button><button data-a="recap" data-v="last" class="${recapSpan==='last'?'on':''}">Last month</button><button data-a="recap" data-v="year" class="${recapSpan==='year'?'on':''}">This year</button></div>
  ${ws.length||fd||wt.length?`<div class="grid3">${tile(ws.length,'workouts')}${tile(sets,'sets')}${tile(big(lbOrKg(vol)),unit()+' lifted')}${tile(prs,'PRs')}${tile(dur(ms),'training')}${tile(fd,'food days')}</div>
  <div class="stack" style="margin-top:12px">${top?`<div class="tile small">Most trained muscle in ${label}: <strong>${top}</strong> with ${mus[top]} sets.${topEx?' Most frequent lift: <strong>'+esc(exById(topEx).name)+'</strong>, '+exs[topEx]+' session'+(exs[topEx]===1?'':'s')+'.':''}</div>`:''}
  ${wd!=null?`<div class="tile small">Bodyweight ${Math.abs(wd)<.05?'held steady':(wd>0?'went up ':'came down ')+disp(Math.abs(wd))+' '+unit()} across ${wt.length} weigh-ins.</div>`:''}</div>`:`<div class="muted small">Nothing logged in ${label} yet.</div>`}</section>`}
const lbOrKg=kg=>S.settings.unit==='lb'?kg*LB:kg;

function progressScreen(){if(isEmpty())return `<div class="top"><h1>Progress</h1></div><section class="glass card"><h2>Nothing to show yet</h2><p class="muted" style="margin:0">Log your first workout and this screen fills in with a map of the muscles you have trained this week, your awards, and a monthly recap.</p></section>`;
  const stk=streak(S.workouts);
  return `<div class="top"><h1>Progress</h1><span class="sub">${stk?stk+' week'+(stk===1?'':'s')+' in a row':''}</span></div>${muscleMap()}${awardsCard()}${recapCard()}`}

/* ---------- Body screen: goal weight and measurements ---------- */
const MEAS=[['waist','Waist'],['chest','Chest'],['arm','Arm'],['thigh','Thigh'],['hips','Hips']],inch=()=>S.settings.unit==='lb',lenU=()=>inch()?'in':'cm',lenOut=cm=>Math.round((inch()?cm/2.54:cm)*10)/10,lenIn=v=>inch()?v*2.54:v;
const measList=()=>(S.settings.meas||[]).slice().sort((a,b)=>a.d<b.d?-1:1);
function goalLine(l,tr){const g=+S.settings.goalKg;if(!g||!l.length)return null;const now=tr[tr.length-1],left=g-now;if(Math.abs(left)<.25)return'You are at your goal weight.';
  const cut=ymd(Date.now()-28*DAY),pts=l.map((w,i)=>[new Date(w.d+'T12:00').getTime()/DAY,tr[i],w.d]).filter(p=>p[2]>=cut);
  if(pts.length<4||pts[pts.length-1][0]-pts[0][0]<10)return'Log a few more weigh-ins over the next couple of weeks to get a projected date.';
  const n=pts.length,mx=pts.reduce((a,p)=>a+p[0],0)/n,my=pts.reduce((a,p)=>a+p[1],0)/n,slope=pts.reduce((a,p)=>a+(p[0]-mx)*(p[1]-my),0)/(pts.reduce((a,p)=>a+(p[0]-mx)**2,0)||1),wk=slope*7;
  const rate=`Your trend is ${Math.abs(wk)<.03?'flat':(wk>0?'up ':'down ')+disp(Math.abs(wk))+' '+unit()+' a week'}`;
  if(Math.abs(wk)<.03||slope*left<=0)return rate+`, which is ${Math.abs(wk)<.03?'not moving towards':'moving away from'} your goal, so there is no projected date yet.`;
  const days=left/slope;if(days>730)return rate+'. At that pace the goal is more than two years away.';
  return rate+`. At that pace you reach ${disp(g)} ${unit()} around <strong>${niceDate(Date.now()+days*DAY)}</strong>.`}
function bodyExtras(l,tr){if(isEmpty())return'';const g=+S.settings.goalKg,gl=goalLine(l,tr),ms=measList(),last=ms[ms.length-1],first=ms[0];
  const goal=`<section class="glass card"><div class="row between"><h2 style="margin:0">Goal weight</h2><button class="btn sm" data-a="goal-w">${g?'Change':'Set a goal'}</button></div>${g?`<div class="num" style="font-size:28px;font-weight:900;margin-top:8px">${disp(g)}<span style="font-size:15px;color:var(--ink-2)"> ${unit()}${l.length?' · '+disp(Math.abs(g-tr[tr.length-1]))+' to go':''}</span></div><div class="small muted" style="margin-top:6px">${gl||''}</div>`:'<div class="small muted" style="margin-top:6px">Set a target and the app projects when you will reach it from your own trend.</div>'}</section>`;
  const meas=`<section class="glass card"><div class="row between"><h2 style="margin:0">Measurements</h2><div class="row" style="gap:6px">${ms.length?'<button class="btn sm" data-a="meas-hist">History</button>':''}<button class="btn sm" data-a="meas-add">Add</button></div></div>
  ${last?`<div class="list" style="margin-top:10px">${MEAS.filter(m=>ms.some(x=>x[m[0]])).map(m=>{const k=m[0],cur=[...ms].reverse().find(x=>x[k]),fst=ms.find(x=>x[k]),d=cur[k]-fst[k];return `<div class="row between"><span>${m[1]}</span><span><span class="num" style="font-weight:800">${lenOut(cur[k])} ${lenU()}</span>${cur!==fst?` <span class="small muted">${d>0?'+':''}${lenOut(d)} since ${niceDate(fst.d+'T12:00')}</span>`:''}</span></div>`}).join('')}</div>`:'<div class="small muted" style="margin-top:6px">Track waist, chest, arm, thigh and hips. Tape measurements often show change that the scale misses.</div>'}</section>`;
  return goal+meas}
function measSheet(){openSheet(`<h2>Add measurements</h2><p class="small muted">Fill in only the ones you measured, in ${lenU()}.</p><div class="stack"><label class="f">Date<input type="date" id="ms-d" value="${ymd(Date.now())}" max="${ymd(Date.now())}"></label>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${MEAS.map(m=>`<label class="f">${m[1]}<input type="number" inputmode="decimal" step="any" id="ms-${m[0]}" placeholder="0"></label>`).join('')}</div><button class="btn primary block" data-a="meas-save">Save</button></div>`,'meas')}
function measHist(){const ms=measList().reverse();openSheet(`<h2>Measurement history</h2><div class="list">${ms.map(x=>`<div class="row between"><span>${niceDate(x.d+'T12:00')}<span class="small muted" style="display:block">${MEAS.filter(m=>x[m[0]]).map(m=>m[1]+' '+lenOut(x[m[0]])).join(' · ')} ${lenU()}</span></span><button class="btn sm danger" data-a="meas-del" data-v="${x.d}">Delete</button></div>`).join('')||'<div class="muted small">Nothing yet.</div>'}</div>`,'meashist')}

function progressAction(a,v,b){switch(a){
  case 'aw-all':awardsAll=!awardsAll;render();break;
  case 'recap':recapSpan=v;render();break;
  case 'goal-w':openSheet(`<h2>Goal weight</h2><div class="stack"><label class="f">Target (${unit()})<input type="number" inputmode="decimal" step="any" id="gw-v" value="${S.settings.goalKg?disp(S.settings.goalKg):''}" placeholder="0"></label><button class="btn primary block" data-a="goal-w-save">Save</button>${S.settings.goalKg?'<button class="btn block danger" data-a="goal-w-clear">Remove goal</button>':''}</div>`,'goalw');break;
  case 'goal-w-save':{const n=parseFloat(($('#gw-v')||{}).value);if(!(n>0)){toast('Enter a target weight.');break}const kg=Math.round(toKg(n)*10)/10;if(kg<30||kg>300){toast('That does not look like a body weight.');break}S.settings.goalKg=kg;save('settings');closeSheet();render();break}
  case 'goal-w-clear':delete S.settings.goalKg;save('settings');closeSheet();render();break;
  case 'meas-add':measSheet();break;
  case 'meas-hist':measHist();break;
  case 'meas-save':{const d=($('#ms-d')||{}).value||ymd(Date.now()),e={d};let any=false;MEAS.forEach(m=>{const n=parseFloat(($('#ms-'+m[0])||{}).value);if(n>0&&n<400){e[m[0]]=Math.round(lenIn(n)*10)/10;any=true}});if(!any){toast('Enter at least one measurement.');break}
    const l=S.settings.meas=S.settings.meas||[],old=l.find(x=>x.d===d);if(old)Object.assign(old,e);else l.push(e);if(l.length>400)l.splice(0,l.length-400);save('settings');closeSheet();render();toast('Saved.');break}
  case 'meas-del':S.settings.meas=(S.settings.meas||[]).filter(x=>x.d!==v);save('settings');measHist();if(tab==='body')render();break;
}}
