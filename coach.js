/* Apex Coach: reads logged training, finds what is under-trained for the chosen goal, and builds a week of sessions.
   Loaded after the main script and nutrition.js; uses their globals. */

(function(){const st=document.createElement('style');st.textContent=`
.mrow{display:grid;grid-template-columns:92px 1fr 74px;gap:10px;align-items:center;font-size:13px}
.mtrack{position:relative;height:10px;border-radius:999px;background:rgba(255,255,255,.08)}
.mtrack i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--cool),var(--warm))}
.mtrack .mk{position:absolute;top:-4px;bottom:-4px;width:2px;border-radius:2px;background:#fff}
.crow{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;width:100%;text-align:left}
`;document.head.appendChild(st)})();

const CMUS=['Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings','Glutes','Calves','Core'];
const FOCUS={balanced:['Balanced physique',[]],vtaper:['Wider back and shoulders',['Back','Shoulders']],arms:['Bigger arms',['Biceps','Triceps']],chest:['Fuller chest',['Chest','Shoulders']],legs:['Stronger legs and glutes',['Quads','Hamstrings','Glutes']]};
/* Indirect work: a set of the exercise on the left counts as part of a set for these muscles. This is the "fractional sets" method used in recent volume research. */
const SECONDARY={bench:{Triceps:.5,Shoulders:.5},incbench:{Triceps:.5,Shoulders:.5},dbbench:{Triceps:.5,Shoulders:.5},incdb:{Triceps:.5,Shoulders:.5},dip:{Triceps:.5,Shoulders:.5},pushup:{Triceps:.5,Shoulders:.5},cgbench:{Chest:.5,Shoulders:.5},
  dead:{Hamstrings:.5,Glutes:.5},row:{Biceps:.5},pullup:{Biceps:.5},chinup:{Biceps:.5},latpd:{Biceps:.5},cablerow:{Biceps:.5},dbrow:{Biceps:.5},tbar:{Biceps:.5},ohp:{Triceps:.5},dbohp:{Triceps:.5},
  squat:{Glutes:.5},fsquat:{Glutes:.5},legpress:{Glutes:.5},bss:{Glutes:.5},hack:{Glutes:.5},lunge:{Glutes:.5},rdl:{Glutes:.5},hipthrust:{Hamstrings:.5}};
const POOL={Chest:['bench','incdb','fly','dbbench','pecdeck','dip'],Back:['pullup','row','latpd','cablerow','dbrow','dead'],Shoulders:['ohp','latraise','dbohp','reardelt','facepull'],Biceps:['curl','hammer','dbcurl','preacher'],Triceps:['pushdown','skull','ohext'],
  Quads:['squat','legpress','legext','bss','hack'],Hamstrings:['rdl','legcurl'],Glutes:['hipthrust','bss'],Calves:['calf','seatcalf'],Core:['cablecrunch','legraise']};
const COMPOUND=new Set(['bench','incbench','dbbench','incdb','dip','dead','row','pullup','chinup','latpd','cablerow','dbrow','tbar','ohp','dbohp','cgbench','squat','fsquat','legpress','bss','hack','lunge','rdl','hipthrust']);
const SPLITS={2:['Full body A','Full body B'],3:['Full body A','Full body B','Full body C'],4:['Upper A','Lower A','Upper B','Lower B'],5:['Push','Pull','Legs','Upper','Lower'],6:['Push A','Pull A','Legs A','Push B','Pull B','Legs B']};
const DAYMUS=n=>/^Full/.test(n)?CMUS:/^Upper/.test(n)?['Chest','Back','Shoulders','Biceps','Triceps']:/^Lower|^Legs/.test(n)?['Quads','Hamstrings','Glutes','Calves','Core']:/^Push/.test(n)?['Chest','Shoulders','Triceps']:['Back','Biceps'];
const SETCAP={45:14,60:18,75:22,90:26};
const coachCfg=()=>Object.assign({focus:'balanced',days:4,mins:60},S.settings.coach||{});

/* Average weekly sets per muscle over the last 4 weeks, counting indirect work at half. */
function muscleSets(){const span=28*DAY,from=Date.now()-span,ws=S.workouts.filter(w=>w.start>=from),out={};if(!ws.length)return{sets:out,weeks:0,n:0};
  for(const w of ws)for(const e of w.exercises){const ex=exById(e.exId),n=e.sets.length;out[ex.muscle]=(out[ex.muscle]||0)+n;const sec=SECONDARY[e.exId];if(sec)for(const m in sec)out[m]=(out[m]||0)+n*sec[m]}
  const weeks=Math.max(1,Math.min(4,(Date.now()-ws[0].start)/(7*DAY)));for(const m in out)out[m]/=weeks;return{sets:out,weeks,n:ws.length}}
/* A ranked lift two or more tiers below your best one is treated as a weak point. */
function laggingLifts(){const rs=Object.keys(STD).map(rankFor).filter(Boolean);if(rs.length<2)return[];const best=Math.max(...rs.map(r=>r.tier));return rs.filter(r=>best-r.tier>=2).map(r=>({id:r.id,tier:r.tier,best}))}
function coachTargets(){const c=coachCfg(),pri=new Set(FOCUS[c.focus][1]),lag=laggingLifts(),lagM=new Set(lag.map(l=>exById(l.id).muscle)),t={};
  for(const m of CMUS)t[m]=(m==='Calves'||m==='Core'?6:10)+(pri.has(m)?4:0)+(lagM.has(m)?2:0);return{t,pri,lag,lagM}}
function suggestLoad(exId,lo,hi){const ex=exById(exId);let last=null;for(let i=S.workouts.length-1;i>=0&&!last;i--){const s=S.workouts[i].exercises.filter(x=>x.exId===exId).flatMap(x=>x.sets);if(s.length)last=s}
  if(!last)return ex.bw?'Bodyweight. Stop a rep or two short of failure.':`New for you. Start with a weight you could lift about ${hi+3} times.`;
  const top=Math.max(...last.map(s=>s.w||0)),minR=Math.min(...last.filter(s=>(s.w||0)===top).map(s=>s.r||0));
  if(ex.bw&&!top)return minR>=hi?`You hit ${minR} last time. Add a little weight or slow the lowering.`:`Last time ${minR} reps. Try for ${minR+1}.`;
  if(minR>=hi){const inc=top<20?1:2.5;return `Last time ${disp(top)} ${unit()} × ${minR}. Go up to ${disp(top+inc)} ${unit()}.`}
  return `Last time ${disp(top)} ${unit()} × ${minR}. Same weight, aim for ${Math.min(hi,minR+1)} reps.`}
/* Build the week. Each muscle's weekly target is shared across the days that train it. A session uses a few exercises at 3 to 4 sets each, favourites first.
   If it runs over the chosen length, the least important work is cut first: second exercises for non-priority muscles, then small muscles that get indirect work anyway. */
const DROP_ORDER=['Core','Calves','Biceps','Triceps','Glutes','Shoulders','Hamstrings','Chest','Back','Quads'];
const slotOf=id=>id==='dead'?'Hamstrings':exById(id).muscle;   /* deadlifts are scheduled with the lower-body work */
function coachPlan(){const c=coachCfg(),{t,pri,lagM,lag}=coachTargets(),names=SPLITS[c.days]||SPLITS[4],used={};for(const w of S.workouts)for(const e of w.exercises)used[e.exId]=(used[e.exId]||0)+1;
  const dayCount={};for(const n of names)for(const m of DAYMUS(n))dayCount[m]=(dayCount[m]||0)+1;const seen={},cap=SETCAP[c.mins]||18;
  return names.map(name=>{let items=[];for(const m of DAYMUS(name)){const keep=pri.has(m)||lagM.has(m)||lag.some(l=>slotOf(l.id)===m),direct=t[m]*(['Biceps','Triceps','Shoulders','Glutes','Hamstrings'].includes(m)?.75:1);
      let sets=Math.max(3,Math.min(9,Math.round(direct/dayCount[m])));const k=seen[m]=(seen[m]||0)+1,lagEx=lag.map(l=>l.id).filter(id=>slotOf(id)===m);
      let pool=POOL[m].filter(id=>slotOf(id)===m).sort((a,b)=>(used[b]||0)-(used[a]||0));if(pool.length>2&&k%2===0)pool=[pool[1],pool[0]].concat(pool.slice(2));   /* vary the lead exercise between A and B days */
      pool=lagEx.concat(pool.filter(x=>!lagEx.includes(x)));const nEx=sets<=4?1:sets<=8?2:3;
      for(let q=0;q<nEx&&q<pool.length;q++){const id=pool[q],n=Math.max(2,Math.round(sets/nEx)),comp=COMPOUND.has(id);if(items.some(x=>x.id===id))continue;items.push({id,m,sets:Math.min(4,n),lo:comp?6:10,hi:comp?10:15,keep,second:q>0})}}
    const total=()=>items.reduce((a,x)=>a+x.sets,0);let guard=0;
    while(total()>cap&&guard++<80){
      let cut=items.filter(x=>x.second&&!x.keep).pop();if(cut){items.splice(items.indexOf(cut),1);continue}           /* 1: second exercises for non-priority muscles */
      const four=items.filter(x=>!x.keep&&x.sets>3)[0];if(four){four.sets--;continue}                                    /* 2: trim 4-set work to 3 */
      const m=DROP_ORDER.find(mm=>items.some(x=>x.m===mm&&!x.keep));if(m&&items.length>3){cut=items.filter(x=>x.m===m&&!x.keep).pop();items.splice(items.indexOf(cut),1);continue}   /* 3: drop the least important muscle */
      cut=items.filter(x=>x.second).pop();if(cut){items.splice(items.indexOf(cut),1);continue}const big=items.filter(x=>x.sets>3)[0];if(big){big.sets--;continue}break}
    items.sort((a,b)=>(COMPOUND.has(b.id)?1:0)-(COMPOUND.has(a.id)?1:0));
    return{name,items,sets:total(),mins:Math.round(items.reduce((a,x)=>a+x.sets*(COMPOUND.has(x.id)?3:2),0)+5)}})}
function nextDay(plan){const done=S.workouts.filter(w=>w.start>=weekStart()).length;return plan.length?done%plan.length:0}

/* ================= screens ================= */
function coach(){const c=coachCfg(),{sets,weeks,n}=muscleSets(),{t,pri,lag}=coachTargets(),plan=coachPlan(),nx=nextDay(plan),mx=Math.max(16,...CMUS.map(m=>Math.max(sets[m]||0,t[m])))*1.1;
  const rows=CMUS.map(m=>{const v=sets[m]||0,gap=t[m]-v,state=v>=t[m]?'On target':v>=t[m]*.7?'Close':'Under';
    return `<div class="mrow"><span>${m}${pri.has(m)?' <span class="muted">★</span>':''}</span><div class="mtrack"><i style="width:${Math.min(100,v/mx*100)}%"></i><span class="mk" style="left:${t[m]/mx*100}%"></span></div><span class="num" style="text-align:right;color:${state==='Under'?'var(--gold)':state==='Close'?'var(--ink)':'var(--good)'}">${Math.round(v*10)/10} / ${t[m]}</span></div>`}).join('');
  const under=CMUS.filter(m=>(sets[m]||0)<t[m]*.7).sort((a,b)=>(t[b]-(sets[b]||0))-(t[a]-(sets[a]||0)));
  return `<div class="top"><h1>Coach</h1><button class="btn sm" data-a="coach-edit">Goal and schedule</button></div>
  <section class="glass card"><div class="row between"><div><div class="small muted">Your goal</div><div style="font-weight:800;font-size:18px">${FOCUS[c.focus][0]}</div><div class="small muted">${c.days} days a week · about ${c.mins} minutes a session</div></div></div></section>
  <section class="glass card"><h2>Weekly sets per muscle<button class="info" data-a="coach-evidence">The evidence</button></h2>
    ${n?`<div class="bars">${rows}</div><div class="small muted" style="margin-top:12px">Your average over the last ${weeks<1.5?'week':Math.round(weeks)+' weeks'} against the target for your goal. The white line is the target${pri.size?', and ★ marks the muscles your goal puts first':''}. Sets for other muscles in the same lift count as half.</div>
    ${under.length?`<div class="tile small" style="margin-top:12px"><strong>Not hitting:</strong> ${under.map(m=>`${m.toLowerCase()} (${Math.round((t[m]-(sets[m]||0))*10)/10} sets short)`).join(', ')}. The plan below is built to close these first.</div>`:'<div class="tile small" style="margin-top:12px">Every muscle is at or near its target. The plan below keeps it that way.</div>'}`
    :'<div class="muted small">No workouts logged in the last 4 weeks, so there is nothing to compare yet. The plan below is a starting point built from the targets for your goal. It adapts as you log.</div>'}</section>
  ${lag.length?`<section class="glass card"><h2>Lagging lifts</h2><div class="list">${lag.map(l=>`<div class="row between tap" data-a="ex" data-v="${l.id}"><span>${esc(exById(l.id).name)}</span><span class="small muted">${TIERS[l.tier][0]}, ${l.best-l.tier} tiers below your best lift</span></div>`).join('')}</div><div class="small muted" style="margin-top:10px">These get extra sets and lead their sessions.</div></section>`:''}
  ${plan.map((d,i)=>`<section class="glass card"><h2>${d.name}${i===nx?'<span class="pr">Up next</span>':''}</h2><div class="small muted" style="margin-top:-6px">${d.sets} sets · about ${d.mins} minutes</div>
    <div class="list" style="margin-top:12px">${d.items.map((x,j)=>`<button class="crow" data-a="coach-why" data-v="${i}.${j}"><span style="min-width:0"><span style="font-weight:600">${esc(exById(x.id).name)}</span><span class="small muted" style="display:block">${suggestLoad(x.id,x.lo,x.hi)}</span></span><span class="num" style="font-weight:800;white-space:nowrap">${x.sets} × ${x.lo}–${x.hi}</span></button>`).join('')}</div>
    <button class="btn ${i===nx?'primary':''} block" style="margin-top:14px" data-a="coach-start" data-v="${i}">Start ${d.name}</button></section>`).join('')}
  <button class="btn block" data-a="coach-save">Save all ${plan.length} sessions as routines</button>
  <div class="small muted" style="text-align:center">Tap any exercise to see why it is there.</div>`}
function coachHome(){if(!S.workouts.length)return '';const plan=coachPlan(),d=plan[nextDay(plan)];if(!d)return '';
  return `<section class="glass card tap" data-a="tab" data-v="coach"><div class="row between"><div><div class="small muted">Coach suggests next</div><div style="font-weight:800">${d.name}</div><div class="small muted">${d.items.slice(0,3).map(x=>esc(exById(x.id).name)).join(', ')}${d.items.length>3?' and '+(d.items.length-3)+' more':''}</div></div><span class="chip">Open</span></div></section>`}
function coachWhy(v){const [i,j]=v.split('.').map(Number),x=(coachPlan()[i]||{items:[]}).items[j];if(!x)return;const {sets}=muscleSets(),{t,pri,lagM,lag}=coachTargets(),cur=sets[x.m]||0,ex=exById(x.id),isLag=lag.some(l=>l.id===x.id);
  openSheet(`<h2 style="margin-bottom:2px">Why ${esc(ex.name)}</h2><p class="small">${x.sets} sets of ${x.lo} to ${x.hi} reps</p><div class="stack">
  <div class="tile small"><strong>Your numbers.</strong> ${x.m} is averaging ${Math.round(cur*10)/10} sets a week against a target of ${t[x.m]}. ${cur<t[x.m]?`That is ${Math.round((t[x.m]-cur)*10)/10} short, so this session adds direct ${x.m.toLowerCase()} work.`:'You are on target, so this keeps it there.'}${pri.has(x.m)?` Your goal, "${FOCUS[coachCfg().focus][0]}", raises the ${x.m.toLowerCase()} target by 4 sets.`:''}${isLag?' This lift is also one of your lagging lifts by rank, so it leads the session and gets 2 extra weekly sets.':''}</div>
  <div class="tile small"><strong>Why this many sets.</strong> Pooled research on trained and untrained lifters found muscle growth rises with weekly sets per muscle, with 10 or more a week growing more than fewer. Returns shrink as sets climb, so the plan aims for the target and no further. <button class="info" data-a="coach-evidence">See the studies</button></div>
  <div class="tile small"><strong>Why this exercise.</strong> ${S.workouts.some(w=>w.exercises.some(e=>e.exId===x.id))?'You already train it, so your history gives a starting weight and progress stays comparable.':'You have not logged it yet. It was chosen as a standard movement for this muscle.'} ${COMPOUND.has(x.id)?'It is a multi-joint lift, so it goes early in the session while you are fresh, in a 6 to 10 rep range.':'It is a single-joint lift, so it comes after the heavy work, in a 10 to 15 rep range.'}</div>
  <div class="tile small"><strong>What to do today.</strong> ${suggestLoad(x.id,x.lo,x.hi)} When you reach the top of the rep range on every set, the weight goes up next time. The rep ranges and that progression rule are standard coaching practice, not the result of one study.</div>
  <button class="btn block" data-a="ex" data-v="${esc(x.id)}">Open your ${esc(ex.name)} history</button></div>`,'coach-why')}
const pm=q=>'https://pubmed.ncbi.nlm.nih.gov/?term='+encodeURIComponent(q);
function coachEvidence(){openSheet(`<h2>The evidence behind the plan</h2><p>The Coach rests on a small number of findings. Each is listed with what it showed and how much weight it can bear.</p><div class="stack">
  <div class="tile small"><strong>More weekly sets, more growth, up to a point.</strong><br>Schoenfeld, Ogborn and Krieger (2017, Journal of Sports Sciences) pooled 15 studies. Average muscle gain rose across three bands of weekly sets per muscle: 5.4% for fewer than 5, 6.6% for 5 to 9, and 9.8% for 10 or more. This is where the base target of 10 comes from.<br><span class="muted">How far to trust it: a consistent trend across studies, but the three-band comparison was only a statistical trend, most participants were untrained, and it could not say where the benefit stops.</span><br><a class="info" href="${pm('Schoenfeld Ogborn Krieger dose-response weekly resistance training volume muscle mass')}" target="_blank" rel="noopener">Find it on PubMed</a></div>
  <div class="tile small"><strong>The returns diminish, and indirect work counts.</strong><br>Pelland and colleagues (2026) analysed 67 studies with 2,058 participants. More weekly sets still meant more growth, following a curve that flattens as volume rises. They counted sets that work a muscle indirectly as partial sets, which is why this app counts those at half.<br><span class="muted">How far to trust it: the largest analysis so far, but it describes averages. Individuals respond differently, and very high volumes were rarely tested.</span><br><a class="info" href="${pm('Pelland resistance training volume frequency dose-response meta-regression')}" target="_blank" rel="noopener">Find it on PubMed</a></div>
  <div class="tile small"><strong>How often matters less than how much.</strong><br>Schoenfeld, Ogborn and Krieger (2016) found training a muscle twice a week beat once a week. The 2026 analysis found that once total weekly sets are accounted for, frequency adds little. So the Coach picks a split that fits your days and spreads each muscle's sets across them, without insisting on a fixed frequency.<br><span class="muted">How far to trust it: the two analyses differ, and the newer, larger one is the more cautious. Treat frequency as a matter of convenience.</span><br><a class="info" href="${pm('Schoenfeld Ogborn Krieger resistance training frequency muscle hypertrophy meta-analysis')}" target="_blank" rel="noopener">Find it on PubMed</a></div>
  <div class="tile small"><strong>What is not from a study.</strong><br>The goal presets (4 extra sets for priority muscles), the 6-set targets for calves and core, the rep ranges, the choice of exercises and the rule for adding weight are ordinary coaching conventions chosen for this app. They are reasonable defaults, not research findings.</div>
  <div class="small muted">This is general training guidance, not medical advice. Ease into new volume over a few weeks rather than jumping to the targets.</div></div>`,'coach-ev')}
function coachEdit(){const c=coachCfg(),opt=(v,l,cur)=>`<option value="${v}" ${String(cur)===String(v)?'selected':''}>${l}</option>`;
  openSheet(`<h2>Goal and schedule</h2><p>The Coach rebuilds the plan from these and from what you have logged.</p><div class="stack">
  <label class="f">What are you training for?<select id="co-focus">${Object.keys(FOCUS).map(k=>opt(k,FOCUS[k][0],c.focus)).join('')}</select></label>
  <div class="row"><label class="f" style="flex:1">Days a week<select id="co-days">${[2,3,4,5,6].map(d=>opt(d,d+' days',c.days)).join('')}</select></label><label class="f" style="flex:1">Session length<select id="co-mins">${[45,60,75,90].map(d=>opt(d,d+' minutes',c.mins)).join('')}</select></label></div>
  <button class="btn primary block" data-a="coach-apply">Build my plan</button></div>`,'coach-edit')}
function coachAction(a,v){switch(a){
  case 'coach-edit':coachEdit();break;
  case 'coach-apply':S.settings.coach={focus:$('#co-focus').value,days:+$('#co-days').value,mins:+$('#co-mins').value};save('settings');closeSheet();render();toast('Plan rebuilt.');break;
  case 'coach-evidence':coachEvidence();break;
  case 'coach-why':coachWhy(v);break;
  case 'coach-start':{const d=coachPlan()[+v];if(!d)break;if(S.active){toast('Finish or discard your current workout first.');break}startWorkout(d.items.map(x=>x.id),d.name);
    d.items.forEach((x,i)=>{const e=S.active.exercises[i];if(!e)return;while(e.sets.length<x.sets)e.sets.push({w:(e.sets[e.sets.length-1]||{}).w??null,r:null,done:false});e.sets.length=x.sets});save('active');render();break}
  case 'coach-save':{const plan=coachPlan();S.routines=S.routines.filter(r=>!r.coach);plan.forEach(d=>S.routines.push({id:uidGen(),name:d.name,exIds:d.items.map(x=>x.id),coach:1}));save('settings');toast('Saved. Find them under Routines on the Train tab.');break}
  }}
