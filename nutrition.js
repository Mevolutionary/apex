/* Apex nutrition: food log, targets, food search, barcode, and AI label and meal scans.
   Loaded after the main script in index.html and uses its globals (S, save, openSheet, toast, ...). */

(function(){const st=document.createElement('style');st.textContent=`
.ring{flex:none}
.macro{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center;font-size:13px}
.frow{display:flex;justify-content:space-between;gap:12px;align-items:center;width:100%;text-align:left}
.frow .nm{font-weight:600;min-width:0;overflow-wrap:anywhere}
.hscroll{display:flex;gap:8px;overflow-x:auto;touch-action:pan-x;padding-bottom:4px}
.scanbox{position:relative;border-radius:22px;overflow:hidden;background:#000;aspect-ratio:4/3}
.scanbox video{width:100%;height:100%;object-fit:cover;display:block}
.scanbox i{position:absolute;left:10%;right:10%;top:50%;height:2px;background:#ff7a59;box-shadow:0 0 12px #ff7a59}
.per{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.per label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--ink-2)}
.per input{padding:0 6px;text-align:center}
.spin{width:44px;height:44px;margin:0 auto;border-radius:50%;border:4px solid rgba(255,255,255,.15);border-top-color:#fff;animation:spin .9s linear infinite}
.spin.sm{width:16px;height:16px;border-width:2px;margin:0;display:inline-block;flex:none}
@keyframes spin{to{transform:rotate(360deg)}}
.step{display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:start}
.step>b{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#0b0d18;font-family:var(--display);font-weight:900}
.shot{margin-top:8px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.3);padding:10px;font-size:12px;color:var(--ink-2)}
.shot .bar{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.1);color:var(--ink);font-size:12px;overflow:hidden;white-space:nowrap}
.shot .fakebtn{display:inline-block;margin-top:8px;padding:7px 12px;border-radius:10px;background:#fff;color:#0b0d18;font-weight:700;box-shadow:0 0 0 3px rgba(255,209,102,.9)}
.shot .key{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.08);font-family:ui-monospace,monospace;color:var(--ink)}
.shot .key span:last-child{font-family:var(--body);font-weight:700;padding:3px 8px;border-radius:8px;background:#fff;color:#0b0d18;box-shadow:0 0 0 3px rgba(255,209,102,.9)}
select{-webkit-appearance:none;appearance:none}
`;document.head.appendChild(st)})();

const MEALS=['Breakfast','Lunch','Dinner','Snacks'];
const ACT=[['Mostly sitting',1.2],['Lightly active',1.375],['Active',1.55],['Very active',1.725]];
/* Common whole foods per 100 g: kcal, protein, carbs, fat. Rounded figures from standard food tables, for when a packaged-food database has nothing useful. */
const GENERIC=[['Chicken breast, cooked',165,31,0,3.6],['Chicken thigh, cooked',209,26,0,11],['Beef mince, lean, cooked',217,26,0,12],['Steak, sirloin, cooked',206,30,0,9],['Salmon, cooked',206,22,0,13],['Tuna, canned in water',116,26,0,1],['Egg, whole',143,13,0.7,9.5],['Egg white',52,11,0.7,0.2],['Milk, full cream',64,3.3,4.8,3.6],['Milk, skim',35,3.4,5,0.1],['Greek yoghurt, plain',97,9,3.6,5],['Cheddar cheese',403,25,1.3,33],['Cottage cheese',98,11,3.4,4.3],['Tofu, firm',144,15,3,9],['White rice, cooked',130,2.7,28,0.3],['Brown rice, cooked',123,2.7,26,1],['Pasta, cooked',158,5.8,31,0.9],['Oats, dry',379,13,68,6.5],['Bread, white',265,9,49,3.2],['Bread, wholemeal',247,13,41,3.4],['Potato, boiled',87,1.9,20,0.1],['Sweet potato, baked',90,2,21,0.2],['Banana',89,1.1,23,0.3],['Apple',52,0.3,14,0.2],['Orange',47,0.9,12,0.1],['Blueberries',57,0.7,14,0.3],['Avocado',160,2,9,15],['Broccoli, cooked',35,2.4,7,0.4],['Spinach',23,2.9,3.6,0.4],['Carrot',41,0.9,10,0.2],['Tomato',18,0.9,3.9,0.2],['Olive oil',884,0,0,100],['Butter',717,0.9,0.1,81],['Peanut butter',588,25,20,50],['Almonds',579,21,22,50],['Lentils, cooked',116,9,20,0.4],['Chickpeas, cooked',164,9,27,2.6],['Black beans, cooked',132,9,24,0.5],['Whey protein powder',400,80,8,6],['Honey',304,0.3,82,0],['Sugar',387,0,100,0]].map(a=>({n:a[0],b:'Generic',src:'built-in list of common foods (approximate)',per:{k:a[1],p:a[2],c:a[3],f:a[4]},serv:null}));
/* Fibre g, sugars g, saturated fat g, sodium mg per 100 g for the foods above, in the same order. Typical rounded values. */
[[0,0,1,74],[0,0,3,84],[0,0,5,70],[0,0,3.5,56],[0,0,2.5,60],[0,0,.3,250],[0,.4,3.1,140],[0,.7,0,166],[0,4.8,2.3,43],[0,5,.1,44],[0,3.6,3.2,36],[0,.5,19,650],[0,2.7,1.7,360],[2.3,.6,1.3,14],[.4,.1,.1,1],[1.6,.2,.3,4],[1.8,.6,.2,1],[10,1,1.1,6],[2.7,5,.7,490],[6,4.5,.7,450],[1.8,.9,0,5],[3.3,6.5,.1,36],[2.6,12,.1,1],[2.4,10,0,1],[2.4,9,0,0],[2.4,10,0,1],[6.7,.7,2.1,7],[3.3,1.4,.1,41],[2.2,.4,.1,79],[2.8,4.7,0,69],[1.2,2.6,0,5],[0,0,14,2],[0,.1,51,580],[6,9,10,430],[12.5,4.4,3.8,1],[8,1.8,.1,2],[7.6,4.8,.3,7],[8.7,.3,.1,1],[0,6,3,300],[.2,82,0,4],[0,100,0,1]].forEach((x,i)=>{if(GENERIC[i])GENERIC[i].per.x={fib:x[0],sug:x[1],sat:x[2],na:x[3]}});
/* Extra nutrients the app tracks when a food lists them: key, name, unit, reference amount, and whether the reference is something to aim for or a limit.
   References are the adult daily intake values behind the "% daily intake" on Australian food labels (FSANZ). They are general, not personal targets. */
const NUTR=[['fib','Fibre','g',30,'aim'],['sug','Sugars','g',90,'limit'],['sat','Saturated fat','g',24,'limit'],['trans','Trans fat','g',null,'limit'],['mono','Monounsaturated fat','g',null,''],['poly','Polyunsaturated fat','g',null,''],['na','Sodium','mg',2300,'limit'],['chol','Cholesterol','mg',null,''],['pot','Potassium','mg',null,''],['ca','Calcium','mg',800,'aim'],['fe','Iron','mg',12,'aim'],['vc','Vitamin C','mg',40,'aim'],['va','Vitamin A','µg',750,'aim'],['vd','Vitamin D','µg',10,'aim']];
const fmtN=(v,u)=>u==='g'?r1(v):v<10?r1(v):r0(v);

let foodDay=ymd(Date.now()),nutItem=null,mealItems=[],searchTimer=null,scanStop=null;
const fdKey=d=>'fd_'+d.slice(0,7),dayList=d=>S.food[d]||[],r0=n=>Math.round(n||0),r1=n=>Math.round((n||0)*10)/10;
const fsum=l=>l.reduce((a,e)=>({k:a.k+(e.k||0),p:a.p+(e.p||0),c:a.c+(e.c||0),f:a.f+(e.f||0)}),{k:0,p:0,c:0,f:0});
/* Energy is stored in kcal; these convert for display and input when the person prefers kilojoules. */
const isKj=()=>S.settings.energy==='kJ',en=k=>r0(isKj()?(k||0)*4.184:k),eu=()=>isKj()?'kJ':'kcal',enIn=v=>isKj()?v/4.184:v;
const mealNow=()=>{const hr=new Date().getHours();return hr<11?0:hr<15?1:hr<21?2:3};
const curKg=()=>{const w=S.weights;return w.length?trend(w)[w.length-1]:0};

/* ================= targets ================= */
function bmrOf(p,kg){return 10*kg+6.25*p.h-5*p.age+(S.settings.sex==='female'?-161:5)}
/* Expenditure worked out from your own data: average logged intake, corrected by how much your trend weight moved (about 7,700 kcal per kg). */
function adaptiveTdee(){const ks=[];for(let i=1;i<=21;i++){const l=dayList(ymd(Date.now()-i*DAY));if(l.length)ks.push(fsum(l).k)}
  const from=ymd(Date.now()-22*DAY),w=S.weights.filter(x=>x.d>=from);if(ks.length<10||w.length<4)return null;
  const span=(new Date(w[w.length-1].d)-new Date(w[0].d))/DAY;if(span<10)return null;
  const tr=trend(S.weights),dkg=tr[S.weights.length-1]-tr[S.weights.indexOf(w[0])],avg=ks.reduce((a,b)=>a+b,0)/ks.length;return{tdee:avg-dkg*7700/span,days:ks.length,avg,dkg,span}}
function targets(){const p=S.settings.nut,kg=curKg();if(!p||!kg)return null;const ad=adaptiveTdee(),b=bmrOf(p,kg),form=b*ACT[p.act][1],tdee=ad?ad.tdee:form;
  let rate=p.goal==='lose'?-Math.min(p.rate,kg*.01):p.goal==='gain'?p.rate:0,kcal=tdee+rate*7700/7;const floor=S.settings.sex==='female'?1200:1500,floored=kcal<floor;if(floored)kcal=floor;
  const prot=Math.round(kg*(p.pk||1.8)),fat=Math.round(Math.max(kg*.8,kcal*.2/9)),carbs=Math.max(0,Math.round((kcal-prot*4-fat*9)/4));
  return{kcal:Math.round(kcal/10)*10,p:prot,f:fat,c:carbs,tdee,form,ad,b,floored,floor,kg,rate}}
function targetInfo(){const t=targets(),p=S.settings.nut;if(!t){toast('Set up your targets first.');return}const u=unit();
  openSheet(`<h2>How your target is calculated</h2>
  ${isKj()?`<p class="small">The working below is in kcal, the unit these formulas use. 1 kcal is 4.184 kJ, so your daily target of ${t.kcal} kcal is ${en(t.kcal)} kJ.</p>`:''}
  <p><b>1. Resting burn.</b> The Mifflin-St Jeor formula estimates the energy your body uses at rest from weight, height, age and sex: 10 × ${r1(t.kg)} kg + 6.25 × ${p.h} cm − 5 × ${p.age} ${S.settings.sex==='female'?'− 161':'+ 5'} = <b>${r0(t.b)} kcal</b>.</p>
  <p><b>2. Daily burn.</b> That is multiplied by an activity factor. Yours is "${ACT[p.act][0]}" (× ${ACT[p.act][1]}), giving <b>${r0(t.form)} kcal</b>.</p>
  <p><b>3. Your real data.</b> ${t.ad?`You have logged food on ${t.ad.days} of the last 21 days, averaging ${r0(t.ad.avg)} kcal, while your trend weight moved ${t.ad.dkg>0?'+':''}${disp(t.ad.dkg)} ${u}. A kilogram of body weight is worth roughly 7,700 kcal, so your actual daily burn works out at <b>${r0(t.ad.tdee)} kcal</b>. This replaces the formula above because it is measured from you.`:`Once you have logged food on at least 10 of the last 21 days and weighed in at least 4 times across 10 days, the app replaces the formula with a figure measured from your own intake and weight trend. Until then it uses step 2.`}</p>
  <p><b>4. Your goal.</b> ${t.rate?`You chose to ${t.rate<0?'lose':'gain'} about ${disp(Math.abs(t.rate))} ${u} a week. At 7,700 kcal per kg that is ${r0(Math.abs(t.rate)*7700/7)} kcal a day ${t.rate<0?'below':'above'} your burn.`:'You chose to maintain, so the target equals your burn.'} Weight loss is capped at 1% of bodyweight a week${t.floored?`, and your target has been raised to the ${t.floor} kcal minimum the app will not go below`:`, and the target never drops below ${t.floor} kcal`}.</p>
  <p><b>5. Macros.</b> Protein is ${p.pk||1.8} g per kg of bodyweight (${t.p} g). Fat is the larger of 0.8 g per kg and 20% of calories (${t.f} g). Carbs take the calories left over (${t.c} g). Protein and carbs count 4 kcal per gram, fat 9.</p>
  <p class="small">These are estimates for general training, not medical advice. Days you log only part of what you ate will skew step 3.</p>`,'info')}
function goalSheet(){const p=S.settings.nut||{age:'',h:'',act:1,goal:'maintain',rate:.5,pk:1.8},noW=!S.weights.length,opt=(v,l,c)=>`<option value="${v}" ${String(c)===String(v)?'selected':''}>${l}</option>`;
  openSheet(`<h2>Your nutrition targets</h2><p>Used to estimate your daily calories and macros. You can change these at any time.</p><div class="stack">
  <div class="row"><label class="f" style="flex:1">Age<input type="number" inputmode="numeric" id="ng-age" value="${p.age}"></label><label class="f" style="flex:1">Height (cm)<input type="number" inputmode="decimal" id="ng-h" value="${p.h}"></label>${noW?`<label class="f" style="flex:1">Weight (${unit()})<input type="number" inputmode="decimal" id="ng-w"></label>`:''}</div>
  <div class="row between"><span>Sex, for the formula</span><div class="seg"><button data-a="set-sex" data-v="male" class="${S.settings.sex==='male'?'on':''}">Male</button><button data-a="set-sex" data-v="female" class="${S.settings.sex==='female'?'on':''}">Female</button></div></div>
  <label class="f">Day-to-day activity, not counting gym sessions<select id="ng-act">${ACT.map((a,i)=>opt(i,a[0],p.act)).join('')}</select></label>
  <label class="f">Goal<select id="ng-goal">${opt('lose','Lose weight',p.goal)}${opt('maintain','Maintain',p.goal)}${opt('gain','Gain weight',p.goal)}</select></label>
  <label class="f">Pace, if losing or gaining<select id="ng-rate">${[.125,.25,.5,.75].map(r=>opt(r,r+' kg a week',p.rate)).join('')}</select></label>
  <label class="f">Protein<select id="ng-pk">${[1.6,1.8,2,2.2].map(r=>opt(r,r+' g per kg of bodyweight',p.pk)).join('')}</select></label>
  <button class="btn primary block" data-a="ng-save">Save targets</button></div>`,'goal')}
function goalSave(){const age=+$('#ng-age').value,hh=+$('#ng-h').value,wEl=$('#ng-w');if(!(age>=13&&age<=100)){toast('Enter your age.');return}if(!(hh>=120&&hh<=230)){toast('Enter your height in centimetres.');return}
  if(wEl&&document.body.contains(wEl)&&!S.weights.length){const w=parseFloat(wEl.value);if(!(w>0)){toast('Enter your weight.');return}S.weights.push({d:ymd(Date.now()),kg:Math.round(toKg(w)*100)/100});save('weights')}
  S.settings.nut={age,h:hh,act:+$('#ng-act').value,goal:$('#ng-goal').value,rate:+$('#ng-rate').value,pk:+$('#ng-pk').value};save('settings');closeSheet();render();toast('Targets saved.')}

/* ================= screens ================= */
function ring(eaten,target){const R=46,C=2*Math.PI*R,f=Math.min(1,target?eaten/target:0),over=target&&eaten>target;
  return `<svg class="ring" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="${r0(eaten)} of ${r0(target)} kilocalories"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b6cff"/><stop offset="1" stop-color="#ff7a59"/></linearGradient></defs>
  <circle cx="60" cy="60" r="${R}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="12"/><circle cx="60" cy="60" r="${R}" fill="none" stroke="${over?'#ff6b6b':'url(#rg)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C*f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/>
  <text x="60" y="58" text-anchor="middle" font-family="ui-rounded,Nunito,sans-serif" font-weight="900" font-size="24" fill="#f5f7fc">${en(eaten)}</text><text x="60" y="76" text-anchor="middle" font-size="11" fill="rgba(245,247,252,.6)">of ${en(target)} ${eu()}</text></svg>`}
const macroRow=(l,v,t)=>`<div class="macro"><span>${l}</span><div class="track"><i style="width:${Math.min(100,t?v/t*100:0)}%"></i></div><span class="num">${r0(v)}${t?' / '+t:''} g</span></div>`;
function food(){const l=dayList(foodDay),t=fsum(l),tg=targets(),today=ymd(Date.now()),isToday=foodDay===today;
  const label=isToday?'Today':foodDay===ymd(Date.now()-DAY)?'Yesterday':niceDate(foodDay+'T12:00');
  return `<div class="top"><h1>Nutrition</h1><div class="row" style="gap:6px"><button class="iconbtn glass" data-a="fd-prev" aria-label="Previous day">‹</button><span style="min-width:84px;text-align:center;font-weight:700">${label}</span><button class="iconbtn glass" data-a="fd-next" aria-label="Next day" ${isToday?'disabled style="opacity:.3"':''}>›</button></div></div>
  ${tg?`<section class="glass card tap" data-a="fd-day"><div class="row" style="gap:18px">${ring(t.k,tg.kcal)}<div style="flex:1;min-width:0"><div class="small muted">${t.k>tg.kcal?'Over by':'Remaining'}</div><div class="num" style="font-size:34px;font-weight:900;line-height:1.1">${en(Math.abs(tg.kcal-t.k))}<span style="font-size:15px;color:var(--ink-2)"> ${eu()}</span></div><button class="info" data-a="fd-info">How this is calculated</button></div></div>
    <div class="bars" style="margin-top:16px">${macroRow('Protein',t.p,tg.p)}${macroRow('Carbs',t.c,tg.c)}${macroRow('Fat',t.f,tg.f)}</div><div class="small muted" style="margin-top:12px;text-align:center">Tap for the full breakdown</div></section>`
  :`<section class="glass card"><h2>Set your targets</h2><div class="muted small">Tell the app a few details and it works out daily calories and macros, and shows how.</div><button class="btn block" style="margin-top:14px" data-a="fd-goal">Set up targets</button>${l.length?`<div class="bars" style="margin-top:16px"><div class="num" style="font-weight:800">${en(t.k)} ${eu()} so far</div>${macroRow('Protein',t.p,0)}${macroRow('Carbs',t.c,0)}${macroRow('Fat',t.f,0)}</div>`:''}</section>`}
  <button class="btn primary block" data-a="fd-add">Add food</button>
  ${l.length?MEALS.map((m,mi)=>{const es=l.filter(e=>e.m===mi);if(!es.length)return '';return `<section class="glass card"><h2>${m}<span class="num small muted" style="font-family:var(--body);font-weight:400">${en(fsum(es).k)} ${eu()}</span></h2><div class="list">${es.map(e=>`<button class="frow" data-a="fd-edit" data-v="${e.id}"><span class="nm">${esc(e.n)}<span class="small muted" style="display:block;font-weight:400">${e.g?r0(e.g)+' g · ':''}P ${r0(e.p)} · C ${r0(e.c)} · F ${r0(e.f)}</span></span><span class="num" style="font-weight:800;white-space:nowrap">${en(e.k)} ${eu()}</span></button>`).join('')}</div></section>`}).join(''):'<section class="glass card muted small">Nothing logged for this day yet.</section>'}
  ${tg?`<section class="glass card"><div class="row between"><div class="small muted">Daily target ${en(tg.kcal)} ${eu()} · estimated burn ${en(tg.tdee)} ${eu()}${tg.ad?' from your own data':''}</div><button class="btn sm" data-a="fd-goal">Edit</button></div></section>`:''}`}
function nutHome(){const tg=targets(),t=fsum(dayList(ymd(Date.now())));
  if(!tg)return `<section class="glass card tap" data-a="tab" data-v="food"><div class="row between"><div><div style="font-weight:800">Nutrition</div><div class="small muted">${t.k?en(t.k)+' '+eu()+' logged today':'Track energy and macros'}</div></div><span class="chip">Open</span></div></section>`;
  return `<section class="glass card tap" data-a="tab" data-v="food"><div class="row between"><div style="font-weight:800">Nutrition today</div><div class="num small muted">${en(t.k)} / ${en(tg.kcal)} ${eu()}</div></div><div class="track" style="margin:10px 0 8px"><i style="width:${Math.min(100,t.k/tg.kcal*100)}%"></i></div><div class="small muted num">Protein ${r0(t.p)} / ${tg.p} g · Carbs ${r0(t.c)} / ${tg.c} g · Fat ${r0(t.f)} / ${tg.f} g</div></section>`}
function nutSettingsRow(){return `<div class="row between"><span>Energy unit</span><div class="seg"><button data-a="set" data-k="energy" data-v="kcal" class="${isKj()?'':'on'}">kcal</button><button data-a="set" data-k="energy" data-v="kJ" class="${isKj()?'on':''}">kJ</button></div></div><div class="row between"><span>AI food scanning</span><button class="btn sm" data-a="gem-guide">${gKey()?'Connected · change':'Set up'}</button></div><div class="row between"><span>Energy and macro targets</span><button class="btn sm" data-a="fd-goal">${S.settings.nut?'Edit':'Set up'}</button></div><div class="tile small">AI scanning reads label and meal photos using your own free Google Gemini key. Everything else in Nutrition works without it.</div>`}

/* ================= status, errors, network ================= */
function busySheet(title,sub){openSheet(`<div style="text-align:center;padding:18px 0 10px"><div class="spin"></div><h2 style="margin:16px 0 6px">${title}</h2><p style="margin:0 auto">${sub||''}</p></div>`,'busy')}
/* A failure always gets its own sheet: what happened, what to do next, and a technical line to pass on if it keeps happening. */
function errorSheet(title,msg,detail,actions){openSheet(`<h2>${title}</h2><p>${msg}</p><div class="stack">${(actions||[]).join('')}<button class="btn block" data-a="close">Close</button>${detail?`<div class="small muted" style="overflow-wrap:anywhere">Details: ${esc(detail)}</div>`:''}</div>`,'error')}
const ACT_LABEL=`<label class="btn block" data-ai="1" style="cursor:pointer">Photograph the nutrition label instead<input type="file" accept="image/*" id="fd-label-in" hidden></label>`,ACT_QUICK=`<button class="btn block" data-a="fd-quick">Type the numbers in</button>`,ACT_RESCAN=`<button class="btn block" data-a="fd-scan">Scan again</button>`,ACT_SEARCH=`<button class="btn block" data-a="fd-search">Search by name</button>`;
async function getJSON(url,ms){const host=url.split('/')[2],ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),ms||12000);
  try{const r=await fetch(url,{signal:ctl.signal});if(r.status===404)return{notFound:true};if(!r.ok)throw{why:host+' answered with error '+r.status};return await r.json()}
  catch(e){if(e&&e.why)throw e;throw{why:host+(e&&e.name==='AbortError'?' did not answer within '+Math.round((ms||12000)/1000)+' seconds':' could not be reached'+(navigator.onLine===false?' (this device is offline)':''))}}
  finally{clearTimeout(t)}}

/* ================= nutrient detail ================= */
/* "High in" follows published labelling rules, judged per 100 g: UK front-of-pack red thresholds for fat, saturates, sugars and salt, and the EU claim rules for protein and fibre. */
function highIn(per){const x=per.x||{},out=[];if(per.k>0&&per.p*4/per.k>=.2)out.push(['Protein','good']);if(x.fib>=6)out.push(['Fibre','good']);
  if(x.sug>22.5)out.push(['Sugars','warn']);if(per.f>17.5)out.push(['Fat','warn']);if(x.sat>5)out.push(['Saturated fat','warn']);if(x.na>600)out.push(['Salt','warn']);return out}
const hiChips=per=>{const hi=highIn(per);return hi.length?`<div><div class="small muted" style="margin-bottom:6px">High in <button class="info" data-a="hi-info">How this is decided</button></div><div class="row wrap" style="gap:8px">${hi.map(a=>`<span class="chip" style="${a[1]==='good'?'color:#06281a;background:var(--good);border-color:var(--good)':'color:#3a2a00;background:var(--gold);border-color:var(--gold)'}">${a[0]}</span>`).join('')}</div></div>`:''};
/* Full nutrient list for a food. vals holds k,p,c,f and x for the amount described by label. */
function factsTable(vals,label){const x=vals.x||{},row=(l,v,u,sub)=>`<div class="row between ${sub?'small muted':''}" style="${sub?'padding-left:14px':''}"><span>${l}</span><span class="num" style="font-weight:${sub?400:700}">${v} ${u}</span></div>`,has=k=>x[k]!=null;
  const extra=NUTR.filter(n=>!['sat','trans','mono','poly','sug','fib'].includes(n[0])&&has(n[0])).map(n=>row(n[1],fmtN(x[n[0]],n[2]),n[2])).join('');
  return `<div class="tile"><div style="font-weight:800;margin-bottom:4px">Nutrition facts <span class="small muted" style="font-weight:400">${label}</span></div><div class="list">
    ${row('Energy',en(vals.k),eu())}${row('Protein',r1(vals.p),'g')}
    <div>${row('Fat',r1(vals.f),'g')}${has('sat')?row('Saturated',r1(x.sat),'g',1):''}${has('trans')?row('Trans',r1(x.trans),'g',1):''}${has('mono')?row('Monounsaturated',r1(x.mono),'g',1):''}${has('poly')?row('Polyunsaturated',r1(x.poly),'g',1):''}</div>
    <div>${row('Carbohydrate',r1(vals.c),'g')}${has('sug')?row('Sugars',r1(x.sug),'g',1):''}</div>${has('fib')?row('Fibre',r1(x.fib),'g'):''}${extra}</div>
    ${Object.keys(x).length<4?'<div class="small muted" style="margin-top:10px">This food\'s source lists only some nutrients, so the rest are not shown.</div>':''}</div>`}
function daySheet(){const l=dayList(foodDay),t=fsum(l),tg=targets(),tot={},cnt={};for(const e of l)if(e.x)for(const k in e.x){tot[k]=(tot[k]||0)+e.x[k];cnt[k]=(cnt[k]||0)+1}
  if(!l.length){toast('Nothing logged for this day yet.');return}
  const kc=t.p*4+t.c*4+t.f*9||1,pc=v=>Math.round(v/kc*100),bar=(v,ref,over)=>`<div class="track" style="margin-top:6px"><i style="width:${Math.min(100,ref?v/ref*100:0)}%${over?';background:var(--bad)':''}"></i></div>`;
  const macro=(l2,g,per,tgt)=>`<div><div class="row between"><span style="font-weight:600">${l2}</span><span class="num">${r1(g)} g${tgt?' of '+tgt+' g':''} · ${pc(g*per)}%</span></div>${tgt?bar(g,tgt):''}</div>`;
  const meals=MEALS.map((m,i)=>[m,fsum(l.filter(e=>e.m===i)).k]).filter(a=>a[1]>0);
  const rows=NUTR.filter(n=>tot[n[0]]!=null).map(n=>{const v=tot[n[0]],ref=n[0]==='fib'&&S.settings.sex==='female'?25:n[3],over=n[4]==='limit'&&ref&&v>ref;
    return `<div><div class="row between"><span style="font-weight:600">${n[1]}${cnt[n[0]]<l.length?` <span class="small muted" style="font-weight:400">from ${cnt[n[0]]} of ${l.length} foods</span>`:''}</span><span class="num">${fmtN(v,n[2])} ${n[2]}${ref?` <span class="muted">/ ${n[4]==='limit'?'limit ':''}${ref}</span>`:''}</span></div>${ref?bar(v,ref,over):''}</div>`}).join('');
  openSheet(`<h2 style="margin-bottom:2px">${foodDay===ymd(Date.now())?'Today':niceDate(foodDay+'T12:00')} in full</h2><p class="small">${l.length} food${l.length===1?'':'s'} logged</p><div class="stack">
  <div class="tile"><div class="row between"><span style="font-weight:800">Energy</span><span class="num" style="font-weight:800">${en(t.k)}${tg?' of '+en(tg.kcal):''} ${eu()}</span></div>${tg?bar(t.k,tg.kcal,t.k>tg.kcal):''}
    ${meals.length?`<div class="list" style="margin-top:12px">${meals.map(a=>`<div class="row between small"><span>${a[0]}</span><span class="num">${en(a[1])} ${eu()} · ${Math.round(a[1]/(t.k||1)*100)}%</span></div>`).join('')}</div>`:''}</div>
  <div class="tile"><div style="font-weight:800;margin-bottom:10px">Macros <span class="small muted" style="font-weight:400">grams and share of energy</span></div><div class="stack">${macro('Protein',t.p,4,tg&&tg.p)}${macro('Carbohydrate',t.c,4,tg&&tg.c)}${macro('Fat',t.f,9,tg&&tg.f)}</div></div>
  <div class="tile"><div style="font-weight:800;margin-bottom:10px">Other nutrients</div>${rows?`<div class="stack">${rows}</div><div class="small muted" style="margin-top:12px">Totals only count foods whose source lists that nutrient, so they can be lower than what you really ate. Reference amounts are the general adult values behind "% daily intake" on Australian labels, not personal targets.</div>`:'<div class="small muted">None of the foods logged today list fibre, sugars, sodium or other nutrients. Products found by barcode or search usually do.</div>'}</div></div>`,'fd-day')}
const HI_INFO=`<h2>How "high in" is decided</h2><p>The tags compare a food's nutrition per 100 g with published labelling thresholds, so they describe the food itself, not your portion.</p><p><b>Protein:</b> at least 20% of the food's energy comes from protein. <b>Fibre:</b> at least 6 g per 100 g. These are the conditions for "high protein" and "high fibre" claims under EU food labelling rules.</p><p><b>Fat:</b> more than 17.5 g. <b>Saturated fat:</b> more than 5 g. <b>Sugars:</b> more than 22.5 g. <b>Salt:</b> more than 1.5 g, which is 600 mg of sodium. These are the "red" levels in the UK's front-of-pack traffic light scheme.</p><p class="small">A tag appears only when the food's source lists that nutrient. Gold tags are ones most people try to limit; green ones most people try to get enough of.</p>`;

/* ================= adding food ================= */
const aiTile=(id,label,icon)=>`<label class="ltile" data-ai="1" style="cursor:pointer"><svg viewBox="0 0 24 24">${icon}</svg><span>${label}</span><em>AI</em><input type="file" accept="image/*" id="${id}" hidden></label>`;
function addSheet(){gRestore();const rec=S.foods.slice(0,12);
  openSheet(`<h2>Add food</h2><div class="lgrid" style="margin-top:0">
    <button class="ltile" data-a="fd-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>Search</span></button>
    <button class="ltile" data-a="fd-scan"><svg viewBox="0 0 24 24">${ICON.scan}</svg><span>Barcode</span></button>
    <button class="ltile" data-a="fd-quick"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Quick add</span></button>
    ${aiTile('fd-label-in','Label photo','<path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4"/>')}${aiTile('fd-meal-in','Meal photo','<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>')}
  </div>${rec.length?`<div style="font-weight:800;margin:18px 0 4px">Recent</div><div class="list">${rec.map((f,i)=>`<button class="frow" data-a="fd-pick" data-v="r${i}"><span class="nm">${esc(f.n)}<span class="small muted" style="display:block;font-weight:400">${esc(f.b||'')}</span></span><span class="num small muted" style="white-space:nowrap">${en(f.per.k)} ${eu()} / 100 g</span></button>`).join('')}</div>`:''}`,'fd-add')}
let searchRes=[];
function searchSheet(){searchRes=[];openSheet(`<h2>Search foods</h2><div class="stack"><input type="text" id="fd-q" placeholder="Try chicken breast, or a brand name" autocomplete="off" autocapitalize="off"><div class="list" id="fd-res"><div class="muted small">Type at least 2 letters. Results come from your own foods, common whole foods, and the Open Food Facts product database.</div></div><div class="want-full"></div></div>`,'fd-search');
  SH.full=true;sheetMeasure(true);setTimeout(()=>{const i=$('#fd-q');i&&i.focus()},350)}
const resRows=(list,prefix)=>list.map((f,i)=>`<button class="frow" data-a="fd-pick" data-v="${prefix}${i}"><span class="nm">${esc(f.n)}<span class="small muted" style="display:block;font-weight:400">${esc(f.b||'')}</span></span><span class="num small muted" style="white-space:nowrap">${en(f.per.k)} ${eu()} / 100 g</span></button>`).join('');
let localRes=[];
async function runSearch(q){const box=$('#fd-res');if(!box)return;q=q.trim();if(q.length<2)return;const ql=q.toLowerCase(),words=ql.split(/\s+/);
  localRes=S.foods.concat(GENERIC).filter(f=>words.every(w=>(f.n+' '+(f.b||'')).toLowerCase().includes(w))).slice(0,8);
  box.innerHTML=(localRes.length?resRows(localRes,'l'):'')+'<div class="muted small row" id="fd-wait"><span class="spin sm"></span> Searching the product database…</div>';
  let res=null,why='';try{res=await foodSearch(q)}catch(e){why=(e&&e.why)||'unknown error'}
  if(!$('#fd-q')||$('#fd-q').value.trim()!==q)return;searchRes=res||[];
  box.innerHTML=(localRes.length?resRows(localRes,'l'):'')+(res===null?`<div class="tile small"><b>The product database could not be reached.</b><br>${localRes.length?'The results above are from your own and built-in foods. ':''}You can try again, scan the barcode, or type the numbers in.<div class="row" style="margin-top:10px"><button class="btn sm" data-a="fd-research">Try again</button><button class="btn sm" data-a="fd-quick">Quick add</button></div><div class="muted" style="margin-top:8px;overflow-wrap:anywhere">Details: ${esc(why)}</div></div>`
    :searchRes.length?resRows(searchRes,'s'):(localRes.length?'':'<div class="muted small">No matches. Try fewer words, scan the barcode, or use Quick add.</div>'))}
const OFF_FIELDS='code,product_name,brands,nutriments,serving_quantity';
function offItem(p){const n=p.nutriments||{};let k=n['energy-kcal_100g'];if(k==null&&n['energy_100g']!=null)k=n['energy_100g']/4.184;const name=p.product_name||p.product_name_en;if(k==null||!name)return null;
  /* Open Food Facts stores every nutrient in grams per 100 g, so minerals and vitamins are converted to mg or micrograms here. */
  const x={},put=(key,field,mul)=>{const v=n[field+'_100g'];if(v!=null&&v!==''&&isFinite(+v))x[key]=+v*mul};
  put('fib','fiber',1);put('sug','sugars',1);put('sat','saturated-fat',1);put('trans','trans-fat',1);put('mono','monounsaturated-fat',1);put('poly','polyunsaturated-fat',1);put('na','sodium',1000);if(x.na==null)put('na','salt',400);
  put('chol','cholesterol',1000);put('pot','potassium',1000);put('ca','calcium',1000);put('fe','iron',1000);put('vc','vitamin-c',1000);put('va','vitamin-a',1e6);put('vd','vitamin-d',1e6);
  return{n:String(name).slice(0,80),b:String(Array.isArray(p.brands)?p.brands[0]||'':p.brands||'').split(',')[0].slice(0,40),code:p.code,per:{k:+k||0,p:+n.proteins_100g||0,c:+n.carbohydrates_100g||0,f:+n.fat_100g||0,x},serv:+p.serving_quantity||null}}
/* USDA FoodData Central, used when Open Food Facts is unreachable. DEMO_KEY is its shared public key with a low hourly limit. */
function fdcItem(f){const g=id=>{const n=(f.foodNutrients||[]).find(x=>x.nutrientId===id);return n?+n.value||0:0};const k=g(1008);if(!k||!f.description)return null;const nm=f.description.toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase());
  return{n:nm.slice(0,80),b:(f.brandName||f.brandOwner||'USDA').slice(0,40),src:'USDA FoodData Central',per:{k,p:g(1003),c:g(1005),f:g(1004),x:(()=>{const x={},has=id=>(f.foodNutrients||[]).some(n=>n.nutrientId===id);[['fib',1079],['sug',2000],['sat',1258],['trans',1257],['mono',1292],['poly',1293],['na',1093],['chol',1253],['pot',1092],['ca',1087],['fe',1089],['vc',1162],['va',1106],['vd',1114]].forEach(a=>{if(has(a[1]))x[a[0]]=g(a[1])});return x})()},serv:/^g|ml$/i.test(f.servingSizeUnit||'')?+f.servingSize||null:null}}
/* Try each source in turn; only fail if every one fails, and report why each did. */
async function foodSearch(q){const e=encodeURIComponent(q),why=[];
  const tries=[async()=>((await getJSON('https://world.openfoodfacts.org/cgi/search.pl?search_terms='+e+'&search_simple=1&action=process&json=1&page_size=25&fields='+OFF_FIELDS,12000)).products||[]).map(offItem),
    async()=>((await getJSON('https://search.openfoodfacts.org/search?q='+e+'&page_size=25&fields='+OFF_FIELDS,10000)).hits||[]).map(offItem),
    async()=>((await getJSON('https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&pageSize=20&query='+e,10000)).foods||[]).map(fdcItem)];
  for(const t of tries){try{return (await t()).filter(Boolean)}catch(x){why.push((x&&x.why)||'error')}}
  throw{why:why.join('; ')}}
async function offBarcode(code){const c=encodeURIComponent(code),why=[];let reached=false;
  const urls=['https://world.openfoodfacts.org/api/v2/product/'+c+'.json?fields='+OFF_FIELDS,'https://world.openfoodfacts.org/api/v0/product/'+c+'.json','https://search.openfoodfacts.org/search?q=code%3A'+c+'&page_size=1&fields='+OFF_FIELDS];
  for(const u of urls){try{const j=await getJSON(u,12000);reached=true;const prod=j.product||(j.hits&&j.hits[0]);if(prod){const it=offItem(prod);if(it){it.src='Open Food Facts';return{item:it}}return{incomplete:prod.product_name||''}}}catch(x){why.push((x&&x.why)||'error')}}
  if(reached)return{item:null};throw{why:why.join('; ')}}

/* confirm how much of a food was eaten */
function confirmSheet2(item,note){nutItem=item;const g=item.serv||100,chips=[item.serv?[item.serv,'1 serving ('+r0(item.serv)+' g)']:null,[100,'100 g'],[50,'50 g'],[200,'200 g']].filter(Boolean);
  const sv=item.serv,pv=x=>r1(item.per[x]*(sv||100)/100);
  openSheet(`<h2 style="margin-bottom:2px">${esc(item.n)}</h2><p class="small">${esc(item.b||'')}${note?(item.b?' · ':'')+note:''}</p><div class="stack">
  ${item.src||item.code?`<div class="tile small"><div style="font-weight:800;margin-bottom:6px">What was found</div><div>${esc(item.n)}${item.b?' by '+esc(item.b):''}</div>${item.code?`<div class="muted num">Barcode ${esc(item.code)}</div>`:''}${sv?`<div class="num" style="margin-top:6px">One serving (${r0(sv)} g): ${en(item.per.k*(sv||100)/100)} ${eu()} · protein ${pv('p')} g · carbs ${pv('c')} g · fat ${pv('f')} g</div>`:''}<div class="muted" style="margin-top:6px">${item.b==='Generic'?'From the app\'s built-in list of common foods. These are typical averages, so a specific brand or cut may differ.':item.ai?'Read from your photo by AI. Check the numbers against the packet before adding.':'From '+esc(item.src||'Open Food Facts')+', which is filled in by volunteers. Check it against the packet before adding.'}</div></div>`:''}
  ${item.ai?`<div class="per">${[['k',eu()],['p','Protein g'],['c','Carbs g'],['f','Fat g']].map(x=>`<label>${x[1]}<input type="number" inputmode="decimal" step="any" data-i="fd-per" data-k="${x[0]}" id="fd-per-${x[0]}" value="${x[0]==='k'?en(item.per.k):r1(item.per[x[0]])}"></label>`).join('')}</div><div class="small muted">Per 100 g, as read from your photo. Correct anything that looks wrong.</div>`
    :`<div class="small muted num">Per 100 g: ${en(item.per.k)} ${eu()} · protein ${r1(item.per.p)} g · carbs ${r1(item.per.c)} g · fat ${r1(item.per.f)} g</div>`}
  <div class="row" style="align-items:flex-end"><label class="f" style="flex:1">Amount (g or ml)<input type="number" inputmode="decimal" step="any" id="fd-g" data-i="fd-g" value="${r0(g)}"></label><label class="f" style="flex:1">Meal<select id="fd-m">${MEALS.map((m,i)=>`<option value="${i}" ${i===mealNow()?'selected':''}>${m}</option>`).join('')}</select></label></div>
  <div class="hscroll">${chips.map(c=>`<button class="chip" data-a="fd-amt" data-v="${c[0]}">${c[1]}</button>`).join('')}</div>
  <div class="tile num" id="fd-tot" style="font-weight:800"></div>
  <button class="btn primary block" data-a="fd-save">Add to ${foodDay===ymd(Date.now())?'today':'this day'}</button>
  <div class="peek-end small muted" style="text-align:center">Pull up for all nutrients</div>${hiChips(item.per)}${factsTable(item.per,'per 100 g')}</div>`,'fd-confirm');totLine();sheetMeasure(false)}
function totLine(){const el=$('#fd-tot'),g=parseFloat(($('#fd-g')||{}).value)||0;if(!el||!nutItem)return;const p=nutItem.per;el.textContent=`${en(p.k*g/100)} ${eu()} · protein ${r1(p.p*g/100)} g · carbs ${r1(p.c*g/100)} g · fat ${r1(p.f*g/100)} g`}
function remember(item){const key=f=>f.n+'|'+(f.b||'');S.foods=S.foods.filter(f=>key(f)!==key(item));S.foods.unshift({n:item.n,b:item.b||'',per:item.per,serv:item.serv||null});if(S.foods.length>60)S.foods.length=60}
function addEntry(item,g,m){const p=item.per,e={id:uidGen(),n:item.n,m,g,k:r1(p.k*g/100),p:r1(p.p*g/100),c:r1(p.c*g/100),f:r1(p.f*g/100)};if(p.x&&Object.keys(p.x).length){e.x={};for(const k in p.x)e.x[k]=Math.round(p.x[k]*g)/100}(S.food[foodDay]||(S.food[foodDay]=[])).push(e);return e}
function quickSheet(){openSheet(`<h2>Quick add</h2><p>For anything you already know the numbers for.</p><div class="stack"><input type="text" id="qa-n" placeholder="Name, e.g. Protein bar"><div class="per">${[['k',eu()],['p','Protein g'],['c','Carbs g'],['f','Fat g']].map(x=>`<label>${x[1]}<input type="number" inputmode="decimal" step="any" id="qa-${x[0]}"></label>`).join('')}</div>
  <label class="f">Meal<select id="qa-m">${MEALS.map((m,i)=>`<option value="${i}" ${i===mealNow()?'selected':''}>${m}</option>`).join('')}</select></label><button class="btn primary block" data-a="qa-save">Add</button></div>`,'fd-quick')}
function editSheet(id){const e=dayList(foodDay).find(x=>x.id===id);if(!e)return;
  openSheet(`<h2 style="margin-bottom:2px">${esc(e.n)}</h2><p class="small num">${en(e.k)} ${eu()} · protein ${r1(e.p)} g · carbs ${r1(e.c)} g · fat ${r1(e.f)} g</p><div class="stack">
  <div class="row" style="align-items:flex-end">${e.g?`<label class="f" style="flex:1">Amount (g or ml)<input type="number" inputmode="decimal" step="any" id="fe-g" value="${r0(e.g)}"></label>`:''}<label class="f" style="flex:1">Meal<select id="fe-m">${MEALS.map((m,i)=>`<option value="${i}" ${i===e.m?'selected':''}>${m}</option>`).join('')}</select></label></div>
  <div class="row"><button class="btn danger" style="flex:1" data-a="fe-del" data-v="${e.id}">Delete</button><button class="btn primary" style="flex:1" data-a="fe-save" data-v="${e.id}">Save</button></div>
  <div class="peek-end small muted" style="text-align:center">Pull up for all nutrients</div>${e.g?hiChips({k:e.k*100/e.g,p:e.p*100/e.g,c:e.c*100/e.g,f:e.f*100/e.g,x:e.x?Object.fromEntries(Object.entries(e.x).map(a=>[a[0],a[1]*100/e.g])):{}}):''}${factsTable(e,e.g?'for '+r0(e.g)+' g':'as logged')}</div>`,'fd-edit')}

/* ================= barcode ================= */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function scanSheet(){openSheet(`<h2>Scan a barcode</h2><div class="stack"><div class="scanbox"><video id="scan-v" playsinline muted autoplay></video><i></i></div><div class="small muted" id="scan-msg">Starting the camera…</div>
  <div class="row"><input type="text" inputmode="numeric" id="scan-code" placeholder="Or type the barcode number"><button class="btn" data-a="fd-code">Look up</button></div></div>`,'fd-scan');
  const msg=t=>{const m=$('#scan-msg');if(m)m.textContent=t};let stream=null,timer=null,reader=null,done=false;
  window.sheetCleanup=scanStop=()=>{done=true;clearInterval(timer);try{reader&&reader.reset()}catch(e){}try{stream&&stream.getTracks().forEach(t=>t.stop())}catch(e){}};
  const found=code=>{if(done)return;done=true;lookupCode(code)};
  try{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('nocam');
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});const v=$('#scan-v');if(!v||done){stream.getTracks().forEach(t=>t.stop());return}
    v.srcObject=stream;await v.play().catch(()=>{});msg('Hold the barcode inside the frame.');
    if('BarcodeDetector' in window){const det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});timer=setInterval(async()=>{try{const r=await det.detect(v);if(r&&r[0])found(r[0].rawValue)}catch(e){}},300)}
    else{if(!window.ZXing)await loadScript('https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/umd/index.min.js');if(done)return;reader=new ZXing.BrowserMultiFormatReader();reader.decodeFromStream(stream,v,(res)=>{if(res)found(res.getText())})}
  }catch(e){msg(e&&e.name==='NotAllowedError'?'Camera access was refused. Allow the camera for this app in your phone settings, or type the number below.':'The camera could not start ('+((e&&(e.name||e.message))||'unknown reason')+'). Type the number printed under the barcode instead.')}}
async function lookupCode(code){code=String(code||'').replace(/\D/g,'');if(code.length<6){errorSheet('That is not a barcode number','A barcode number has 8 to 13 digits. Check the number printed under the bars and try again.','',[ACT_RESCAN]);return}
  busySheet('Looking up the barcode',code);let r;
  try{r=await offBarcode(code)}catch(e){errorSheet('Could not reach the food database','The barcode '+code+' was read correctly, but the product database did not respond, so nothing was added. You can try again, or add this food another way.',(e&&e.why)||'',[`<button class="btn primary block" data-a="fd-code-retry" data-v="${code}">Try again</button>`,ACT_LABEL,ACT_SEARCH,ACT_QUICK]);return}
  if(r.item)confirmSheet2(r.item,'');
  else errorSheet(r.incomplete!==undefined?'Found, but no nutrition data':'Product not in the database',r.incomplete!==undefined?`The database knows barcode ${code}${r.incomplete?' as "'+esc(r.incomplete)+'"':''} but has no calories recorded for it, so nothing was added.`:`Barcode ${code} was read correctly, but nobody has added that product to the database yet, so nothing was added.`,'',[ACT_LABEL,ACT_SEARCH,ACT_QUICK,ACT_RESCAN])}

/* ================= Gemini (AI scans) ================= */
const gKey=()=>lsGet('.gk')||'';
async function gStore(key){lsSet('.gk',key);lsDel('.gm');if(vaultKey){try{const iv=crypto.getRandomValues(new Uint8Array(12)),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},vaultKey,new TextEncoder().encode(key));S.settings.gk={iv:b64(iv),ct:b64(ct)};save('settings')}catch(e){}}}
async function gRestore(){if(gKey()||!S.settings.gk||!vaultKey)return;try{lsSet('.gk',new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(S.settings.gk.iv)},vaultKey,unb64(S.settings.gk.ct))))}catch(e){}}
const GAPI='https://generativelanguage.googleapis.com/v1beta/';
/* Model names change often, so ask the API which models this key can use and pick the newest general-purpose Flash model. */
async function gModel(key,force){const c=!force&&lsGet('.gm');if(c)return c;const r=await fetch(GAPI+'models?pageSize=200',{headers:{'x-goog-api-key':key}});
  if(!r.ok)throw{code:r.status===429?'limit':'badkey'};const all=((await r.json()).models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>m.name.replace('models/',''));
  const ver=n=>parseFloat((/gemini-(\d+(?:\.\d+)?)/.exec(n)||[])[1])||0,plain=all.filter(n=>/^gemini-[\d.]+-flash/.test(n)&&!/image|tts|audio|live|embed|exp|preview|thinking|native/.test(n));
  const pool=plain.length?plain:all.filter(n=>/flash/.test(n)),pick=pool.sort((a,b)=>ver(b)-ver(a)||(/lite/.test(a)?1:0)-(/lite/.test(b)?1:0)||a.length-b.length)[0];
  if(!pick)throw{code:'fail'};lsSet('.gm',pick);return pick}
async function gAsk(prompt,dataUrl){const key=gKey();if(!key)throw{code:'nokey'};
  const body={contents:[{parts:[{inline_data:{mime_type:'image/jpeg',data:dataUrl.split(',')[1]}},{text:prompt}]}],generationConfig:{temperature:.1,responseMimeType:'application/json'}};
  for(let a=0;a<3;a++){const model=await gModel(key,a>0),r=await fetch(GAPI+'models/'+model+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body)});
    if(r.status===404){lsDel('.gm');continue}if(r.status===400&&body.generationConfig.responseMimeType){delete body.generationConfig.responseMimeType;continue}
    if(r.status===429)throw{code:'limit',status:429};if(r.status===401||r.status===403)throw{code:'badkey',status:r.status};if(!r.ok)throw{code:'fail',status:r.status};
    const j=await r.json(),txt=(((j.candidates||[])[0]||{}).content||{parts:[]}).parts.map(p=>p.text||'').join(''),m=txt.match(/\{[\s\S]*\}/);if(!m)throw{code:'unreadable'};try{return JSON.parse(m[0])}catch(e){throw{code:'unreadable'}}}
  throw{code:'fail'}}
const GERR={limit:'The free AI allowance is used up for now. Try again later, or add the food another way.',badkey:'Google rejected the AI key. Check it under Settings, AI food scanning.',unreadable:'The AI could not read that photo. Try again with better light and the whole label in frame.',fail:'The AI scan did not work this time. Try again in a moment.'};
const gFail=(e,what)=>{if(e&&e.code==='nokey'){geminiGuide();return}const code=e&&e.code;errorSheet('The '+what+' scan did not work',(GERR[code]||(navigator.onLine===false?'This device is offline.':GERR.fail))+' Nothing was added.',code?'AI scan error: '+code+(e.status?' (HTTP '+e.status+')':''):String(e&&e.message||e||''),[code==='badkey'?`<button class="btn block" data-a="gem-guide">Check my AI key</button>`:'',ACT_SEARCH,ACT_QUICK])};
const num=v=>{const n=parseFloat(v);return isFinite(n)&&n>=0?n:0};
const aiExtras=o=>{const x={};[['sat','saturated_fat'],['sug','sugars'],['fib','fibre'],['na','sodium_mg']].forEach(a=>{if(o&&o[a[1]]!=null&&isFinite(parseFloat(o[a[1]])))x[a[0]]=num(o[a[1]])});return x};
async function labelScan(file){busySheet('Reading the label','This usually takes a few seconds.');try{const img=await shrink(file,1500,.85),j=await gAsk('This photo shows a nutrition information panel on food packaging. Read it and reply with JSON only, in this shape: {"name": string, "serving_g": number or null, "per100": {"kcal": number, "protein": number, "carbs": number, "fat": number, "saturated_fat": number or null, "sugars": number or null, "fibre": number or null, "sodium_mg": number or null} or null, "per_serving": the same fields or null}. Use the per 100 g or per 100 ml column for per100 when the panel has one. If energy is given only in kJ, convert with kcal = kJ / 4.184. Use the product name if visible, otherwise "Scanned food". If the photo is not a nutrition panel reply {"error": "not a label"}.',img);
    if(j.error){errorSheet('No nutrition panel in that photo','The AI could not see a nutrition information table, so nothing was added. Photograph the panel on the back of the packet, flat and well lit, with the whole table in frame.','',[ACT_LABEL,ACT_RESCAN,ACT_QUICK]);return}let per=j.per100;const sg=num(j.serving_g);if((!per||per.kcal==null)&&j.per_serving&&sg>0){const s=j.per_serving,k=100/sg;per={kcal:num(s.kcal)*k,protein:num(s.protein)*k,carbs:num(s.carbs)*k,fat:num(s.fat)*k};for(const q of ['saturated_fat','sugars','fibre','sodium_mg'])if(s[q]!=null)per[q]=num(s[q])*k}
    if(!per)throw{code:'unreadable'};confirmSheet2({n:String(j.name||'Scanned food').slice(0,80),b:'',per:{k:num(per.kcal),p:num(per.protein),c:num(per.carbs),f:num(per.fat),x:aiExtras(per)},serv:sg||null,ai:true,src:'your photo, read by AI'},'')}catch(e){gFail(e,'label')}}
async function mealScan(file){busySheet('Looking at your meal','This usually takes a few seconds.');try{const img=await shrink(file,1280,.8),j=await gAsk('This is a photo of a meal. Identify each distinct food and estimate the portion shown. Reply with JSON only: {"items": [{"name": string, "grams": number, "kcal": number, "protein": number, "carbs": number, "fat": number, "saturated_fat": number, "sugars": number, "fibre": number, "sodium_mg": number}]}. The numbers are for the portion in the photo, not per 100 g. Give at most 8 items. If there is no food in the photo reply {"items": []}.',img);
    mealItems=(j.items||[]).filter(i=>i&&i.name&&num(i.grams)>0).slice(0,8).map(i=>{const g=num(i.grams),k=100/g;const x=aiExtras(i);for(const q in x)x[q]*=k;return{n:String(i.name).slice(0,60),g,on:true,per:{k:num(i.kcal)*k,p:num(i.protein)*k,c:num(i.carbs)*k,f:num(i.fat)*k,x}}});
    if(!mealItems.length){errorSheet('No food found in that photo','The AI looked at the photo but did not see a meal, so nothing was added. Meal photo is for a plate of food. For a packet, scan its barcode or photograph the nutrition label.','',[ACT_LABEL,ACT_RESCAN,ACT_QUICK]);return}mealSheet()}catch(e){gFail(e,'meal')}}
function mealSheet(){const on=mealItems.filter(i=>i.on),t=on.reduce((a,i)=>a+i.per.k*i.g/100,0);
  openSheet(`<h2>Meal estimate</h2><p>An estimate from your photo. Portions are the hardest part for AI to judge, so adjust the grams where you know better, and untick anything that is wrong.</p><div class="stack"><div class="list">${mealItems.map((i,x)=>`<div class="row between"><label class="row" style="min-width:0;flex:1"><input type="checkbox" data-i="ml-on" data-x="${x}" ${i.on?'checked':''} style="width:22px;height:22px;flex:none"><span style="min-width:0;overflow-wrap:anywhere">${esc(i.n)}<span class="small muted num" style="display:block">${en(i.per.k*i.g/100)} ${eu()}</span></span></label><span class="row" style="flex:none"><input type="number" inputmode="decimal" data-i="ml-g" data-x="${x}" value="${r0(i.g)}" style="width:76px;text-align:center" aria-label="Grams of ${esc(i.n)}"><span class="small muted">g</span></span></div>`).join('')}</div>
  <label class="f">Meal<select id="ml-m">${MEALS.map((m,i)=>`<option value="${i}" ${i===mealNow()?'selected':''}>${m}</option>`).join('')}</select></label>
  <button class="btn primary block" data-a="ml-save">Add ${on.length} item${on.length===1?'':'s'} · ${en(t)} ${eu()}</button></div>`,'fd-meal')}
function geminiGuide(){const has=!!gKey();
  openSheet(`<h2>Set up AI food scanning</h2><p>Label and meal photos are read by Google's Gemini AI. It is free, but each person needs their own key, which is a long password that lets this app use Gemini on your behalf. It takes about two minutes.</p><div class="stack">
  <div class="step"><b>1</b><div><div style="font-weight:700">Open Google AI Studio and sign in</div><div class="small muted">Use any Google account. Accept the terms if it asks.</div><div class="shot"><div class="bar">aistudio.google.com/apikey</div></div><a class="btn sm" style="margin-top:8px" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Open AI Studio</a></div></div>
  <div class="step"><b>2</b><div><div style="font-weight:700">Tap "Create API key"</div><div class="small muted">If it asks about a project, choose to create a new one. No card is needed.</div><div class="shot">API keys<br><span class="fakebtn">+ Create API key</span></div></div></div>
  <div class="step"><b>3</b><div><div style="font-weight:700">Copy the key</div><div class="small muted">It is a long line of letters and numbers. Tap the copy button beside it.</div><div class="shot"><div class="key"><span>AIza•••••••••••••••</span><span>Copy</span></div></div></div></div>
  <div class="step"><b>4</b><div><div style="font-weight:700">Come back here and paste it</div><input type="text" id="gem-key" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Paste your key" style="margin-top:8px"><div class="row" style="margin-top:8px"><button class="btn primary" style="flex:1" data-a="gem-save">Save and test</button>${has?'<button class="btn danger" data-a="gem-remove">Remove key</button>':''}</div></div></div>
  <div class="tile small"><div style="font-weight:800;margin-bottom:6px">Four things to know</div>
    <div>1. Keep the key private. Do not post it or send it to anyone.</div><div style="margin-top:4px">2. Your photos are sent to Google to be read. On the free plan Google may use them to improve its products, so do not scan anything personal.</div><div style="margin-top:4px">3. The free plan has a daily limit. If scans stop working, try again the next day.</div><div style="margin-top:4px">4. Everything else in Apex works without a key. Only label and meal photos need it.</div></div></div>`,'gemini')}
async function geminiSave(){const k=(($('#gem-key')||{}).value||'').trim();if(k.length<20||/\s/.test(k)){toast('That does not look like a full key. Copy it again and paste the whole thing.');return}toast('Testing the key…');
  try{lsDel('.gm');const m=await gModel(k,true);await gStore(k);lsSet('.gm',m);closeSheet();toast('AI scanning is ready.')}catch(e){toast(e&&e.code==='limit'?'Google is limiting requests right now. Try again in a minute.':e&&e.code==='badkey'?'Google did not accept that key. Check you copied all of it.':'Could not test the key. Check your connection and try again.')}}

/* ================= events ================= */
function nutPreClick(ev){const ai=ev.target.closest&&ev.target.closest('label[data-ai]');if(ai&&!gKey()&&ev.target.tagName!=='INPUT'){ev.preventDefault();geminiGuide();return true}return false}
function nutInput(t){const i=t.dataset.i;
  if(t.id==='fd-q'){clearTimeout(searchTimer);const q=t.value;searchTimer=setTimeout(()=>runSearch(q),450);return true}
  if(i==='fd-g'){totLine();return true}
  if(i==='fd-per'){if(nutItem)nutItem.per[t.dataset.k]=t.dataset.k==='k'?enIn(num(t.value)):num(t.value);totLine();return true}
  if(i==='ml-g'){const it=mealItems[+t.dataset.x];if(it)it.g=num(t.value);return true}
  return false}
function nutChange(t){const f=t.files&&t.files[0];
  if(t.id==='fd-label-in'){if(f)labelScan(f);return true}
  if(t.id==='fd-meal-in'){if(f)mealScan(f);return true}
  if(t.dataset.i==='ml-on'){const it=mealItems[+t.dataset.x];if(it){it.on=t.checked;mealSheet()}return true}
  if(t.dataset.i==='ml-g'){mealSheet();return true}
  return false}
function nutAction(a,v,b){switch(a){
  case 'fd-prev':foodDay=ymd(new Date(foodDay+'T12:00').getTime()-DAY);render();break;
  case 'fd-next':if(foodDay<ymd(Date.now())){foodDay=ymd(new Date(foodDay+'T12:00').getTime()+DAY);render()}break;
  case 'fd-add':addSheet();break;
  case 'fd-info':targetInfo();break;
  case 'fd-day':daySheet();break;
  case 'hi-info':pushMode=true;openSheet(HI_INFO,'info');break;
  case 'fd-goal':goalSheet();break;
  case 'ng-save':goalSave();break;
  case 'set-sex':S.settings.sex=v;save('settings');b.parentNode.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));break;
  case 'fd-search':searchSheet();break;
  case 'fd-scan':scanSheet();break;
  case 'fd-code':lookupCode(($('#scan-code')||{}).value);break;
  case 'fd-code-retry':lookupCode(v);break;
  case 'fd-research':{const q=$('#fd-q');if(q)runSearch(q.value);break}
  case 'fd-quick':quickSheet();break;
  case 'fd-pick':{const src=v[0]==='r'?S.foods:v[0]==='l'?localRes:searchRes,it=src[+v.slice(1)];if(it)confirmSheet2(Object.assign({},it,{per:Object.assign({},it.per)}),'');break}
  case 'fd-amt':{const g=$('#fd-g');if(g){g.value=r0(+v);totLine()}break}
  case 'fd-save':{const g=parseFloat($('#fd-g').value),m=+$('#fd-m').value;if(!(g>0)){toast('Enter an amount.');break}if(!nutItem)break;addEntry(nutItem,g,m);remember(nutItem);save(fdKey(foodDay),'foods');closeSheet();if(tab!=='food')go('food');else render();toast('Added.');break}
  case 'qa-save':{const n=($('#qa-n').value||'').trim()||'Quick add',k=r1(enIn(num($('#qa-k').value)));if(!(k>0)&&!(num($('#qa-p').value)>0)){toast('Enter the energy at least.');break}
    (S.food[foodDay]||(S.food[foodDay]=[])).push({id:uidGen(),n,m:+$('#qa-m').value,g:null,k,p:num($('#qa-p').value),c:num($('#qa-c').value),f:num($('#qa-f').value)});save(fdKey(foodDay));closeSheet();render();toast('Added.');break}
  case 'fd-edit':editSheet(v);break;
  case 'fe-save':{const e=dayList(foodDay).find(x=>x.id===v);if(!e)break;const gEl=$('#fe-g');if(gEl&&e.g){const g=parseFloat(gEl.value);if(!(g>0)){toast('Enter an amount.');break}const k=g/e.g;e.k=r1(e.k*k);e.p=r1(e.p*k);e.c=r1(e.c*k);e.f=r1(e.f*k);if(e.x)for(const q in e.x)e.x[q]=Math.round(e.x[q]*k*100)/100;e.g=g}e.m=+$('#fe-m').value;save(fdKey(foodDay));closeSheet();render();break}
  case 'fe-del':S.food[foodDay]=dayList(foodDay).filter(x=>x.id!==v);if(!S.food[foodDay].length)delete S.food[foodDay];save(fdKey(foodDay));closeSheet();render();break;
  case 'ml-save':{const m=+$('#ml-m').value,on=mealItems.filter(i=>i.on&&i.g>0);if(!on.length){toast('Tick at least one item.');break}on.forEach(i=>addEntry(i,i.g,m));save(fdKey(foodDay));closeSheet();if(tab!=='food')go('food');else render();toast('Meal added.');break}
  case 'gem-guide':geminiGuide();break;
  case 'gem-save':geminiSave();break;
  case 'gem-remove':lsDel('.gk');lsDel('.gm');if(S.settings.gk){delete S.settings.gk;save('settings')}closeSheet();toast('AI key removed from this device.');break;
  }}
