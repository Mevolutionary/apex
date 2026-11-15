/* Apex Studies: recent training and nutrition papers from Europe PMC (free, no key), a plain label for how strong
   each study design is, and an optional AI overview written by the signed-in user's own Gemini key.
   Loaded after nutrition.js; uses its globals (getJSON, gModel, GAPI, aiAllowed, aiGate, gKey, geminiGuide). */

(function(){const st=document.createElement('style');st.textContent=`
.stchips{display:flex;flex:none;gap:8px;overflow-x:auto;margin:0 -18px;padding:2px 18px;scrollbar-width:none}.stchips::-webkit-scrollbar{display:none}
.stcard{display:block;width:100%;text-align:left;padding:16px 18px}
.stcard .tt{font-weight:800;font-size:16px;line-height:1.25;margin:8px 0 6px}
.lvl{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08)}
.lvl i{width:8px;height:8px;border-radius:50%;background:var(--ink-3)}
.lvl.l1 i{background:var(--good)}.lvl.l2 i{background:#7fb4ff}.lvl.l3 i{background:var(--gold)}.lvl.l4 i{background:#ff8a7a}
.verdict{padding:14px 16px;border-radius:18px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.22)}
.verdict .v{font-family:var(--display);font-weight:900;font-size:20px}
.verdict.strong .v{color:var(--good)}.verdict.moderate .v{color:#7fb4ff}.verdict.weak .v{color:var(--gold)}.verdict.unclear .v{color:var(--ink-2)}
.stlist{margin:6px 0 0;padding-left:18px}.stlist li{margin:4px 0}
.abs{font-size:14px;line-height:1.5;color:var(--ink-2);white-space:pre-line}
`;document.head.appendChild(st)})();

const ST_TOPICS=[
  ['hypertrophy','Muscle growth','("resistance training" OR "strength training") AND (hypertrophy OR "muscle mass" OR "muscle growth" OR "muscle thickness")'],
  ['strength','Strength','("resistance training" OR "strength training") AND ("maximal strength" OR "1RM" OR "one repetition maximum" OR "muscle strength")'],
  ['protein','Protein','("protein intake" OR "dietary protein" OR "protein supplementation") AND ("resistance training" OR "lean mass" OR "muscle protein synthesis")'],
  ['fatloss','Fat loss','("weight loss" OR "fat loss" OR "energy restriction" OR "caloric restriction") AND ("body composition" OR "lean mass" OR "fat mass")'],
  ['supps','Supplements','(creatine OR caffeine OR "beta-alanine" OR citrulline OR "dietary supplements") AND ("resistance training" OR "exercise performance" OR "muscle strength")'],
  ['recovery','Sleep and recovery','(sleep OR "muscle soreness" OR "recovery") AND ("resistance training" OR "resistance exercise" OR athletes) AND (performance OR "muscle damage" OR strength)'],
  ['cardio','Cardio','("concurrent training" OR "high-intensity interval training" OR "aerobic exercise") AND ("resistance training" OR "body composition" OR "cardiorespiratory fitness")']];
const ST_STRONG=' AND (PUB_TYPE:"meta-analysis" OR PUB_TYPE:"systematic review" OR PUB_TYPE:"randomized controlled trial")';
const ST_BASE=' AND HAS_ABSTRACT:y AND SRC:MED NOT (TITLE:rat OR TITLE:rats OR TITLE:mice OR TITLE:mouse)';
const ST_API='https://www.ebi.ac.uk/europepmc/webservices/rest/search';
let stTopic='hypertrophy',stStrong=true,stView='new',stQ='',stFeed={},stOpen=null,stBusyAI=false;

/* saved papers and AI overviews stay on this device */
const stStore=()=>{try{return Object.assign({saved:{},ai:{}},JSON.parse(lsGet('.studies')||'{}'))}catch(e){return{saved:{},ai:{}}}};
const stPut=d=>{const k=Object.keys(d.ai);if(k.length>80)k.sort((a,b)=>(d.ai[a].at||0)-(d.ai[b].at||0)).slice(0,k.length-80).forEach(x=>{if(!d.saved[x])delete d.ai[x]});lsSet('.studies',JSON.stringify(d))};

const stClean=s=>String(s||'').replace(/<\/(p|h\d|div|li)>/gi,'\n').replace(/<h\d[^>]*>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n\n').trim();
function stPaper(r){const types=((r.pubTypeList||{}).pubType||[]).map(x=>String(x));const j=(((r.journalInfo||{}).journal||{}).title)||r.journalTitle||'';
  return{id:String(r.id||r.pmid||r.doi||''),src:r.source||'MED',pmid:r.pmid||'',doi:r.doi||'',t:stClean(r.title).replace(/\.$/,''),j:stClean(j),y:r.pubYear||String(r.firstPublicationDate||'').slice(0,4),date:r.firstPublicationDate||'',au:stClean(r.authorString).replace(/\.$/,''),abs:stClean(r.abstractText),types,cited:+r.citedByCount||0,oa:r.isOpenAccess==='Y'}}

/* study design label, read from the publication types the database lists for the paper */
const ST_LEVELS={
  meta:[1,'Meta-analysis','Pools the numbers from many studies into one result. Usually the strongest single source, but only as good as the studies it pools.'],
  sys:[1,'Systematic review','Collects every study on a question using set rules. Strong for seeing the whole picture.'],
  rct:[2,'Randomised trial','People were randomly put into groups and compared. The best design for showing that one thing causes another, though many gym studies are small and short.'],
  trial:[2,'Controlled trial','An experiment comparing groups, but the paper is not listed as randomised, so the groups may have differed from the start.'],
  review:[3,'Review','Experts summarise the research without set rules for which studies are included. Useful background, but it reflects the authors\' choices.'],
  obs:[3,'Observational study','Researchers watched what people already do. It can show a link, but cannot show that one thing caused the other.'],
  case:[4,'Case report','Describes one person or a few people. Interesting, but it cannot be applied to everyone.'],
  other:[0,'Study','The database does not list a study design for this paper, so read the methods before trusting it.']};
function stLevel(p){const t=(p.types||[]).join('|').toLowerCase(),tt=(p.t||'').toLowerCase();
  if(/meta-analysis/.test(t)||/meta-analys/.test(tt))return'meta';if(/systematic review/.test(t)||/systematic review/.test(tt))return'sys';
  if(/randomized controlled trial/.test(t)||/randomi[sz]ed/.test(tt))return'rct';if(/clinical trial|controlled clinical trial|comparative study/.test(t))return'trial';
  if(/case reports/.test(t))return'case';if(/review/.test(t))return'review';if(/observational|cohort|cross-sectional/.test(t+tt))return'obs';return'other'}
const stBadge=p=>{const L=ST_LEVELS[stLevel(p)];return`<span class="lvl l${L[0]}"><i></i>${L[1]}</span>`};

const stKey=()=>stQ?'q:'+stQ+'|'+stStrong:stTopic+'|'+stStrong;
function stQuery(){const base=stQ?'('+stQ.replace(/[()]/g,' ')+')':ST_TOPICS.find(t=>t[0]===stTopic)[2];return base+(stStrong?ST_STRONG:'')+ST_BASE}
async function stLoad(more){const k=stKey(),f=stFeed[k]||(stFeed[k]={list:[],state:'idle',cursor:'*',done:false});if(f.state==='loading')return;if(more&&f.done)return;
  f.state='loading';if(tab==='studies')render();
  try{const j=await getJSON(ST_API+'?query='+encodeURIComponent(stQuery())+'&format=json&resultType=core&pageSize=20&sort='+encodeURIComponent('P_PDATE_D desc')+'&cursorMark='+encodeURIComponent(more?f.cursor:'*'),15000);
    if(!j||j.notFound)throw{why:'The research database returned nothing.'};
    const got=(((j.resultList||{}).result)||[]).map(stPaper).filter(p=>p.id&&p.t),have=new Set(f.list.map(p=>p.id));
    if(!more)f.list=[];got.forEach(p=>{if(more&&have.has(p.id))return;f.list.push(p)});
    f.done=!j.nextCursorMark||j.nextCursorMark===f.cursor||got.length<20;f.cursor=j.nextCursorMark||f.cursor;f.total=+j.hitCount||f.list.length;f.state='ok';f.err=''}
  catch(e){f.state=f.list.length?'ok':'error';f.err=(e&&e.why)||String((e&&e.message)||e||'Unknown error');if(f.list.length)toast('Could not load more studies. '+f.err)}
  if(tab==='studies')render()}

const stFind=id=>{for(const k in stFeed){const p=stFeed[k].list.find(x=>x.id===id);if(p)return p}return stStore().saved[id]||null};
const stMeta=p=>[p.j,p.y,p.au?(p.au.split(',')[0]+(p.au.includes(',')?' et al.':'')):''].filter(Boolean).map(esc).join(' · ');
const stCard=p=>{const d=stStore();return`<button class="glass card stcard tap" data-a="st-open" data-v="${esc(p.id)}"><div class="row between" style="gap:8px">${stBadge(p)}<span class="small muted">${d.ai[p.id]?'AI overview ready':''}${d.saved[p.id]?(d.ai[p.id]?' · ':'')+'Saved':''}</span></div><div class="tt">${esc(p.t)}</div><div class="small muted">${stMeta(p)}</div></button>`};

function studies(){const d=stStore(),saved=Object.values(d.saved).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
  const head=`<div class="top"><h1>Studies</h1><button class="btn sm" data-a="st-how">How to read these</button></div>
  <div class="seg" style="align-self:flex-start"><button data-a="st-view" data-v="new" class="${stView==='new'?'on':''}">Latest</button><button data-a="st-view" data-v="saved" class="${stView==='saved'?'on':''}">Saved${saved.length?' ('+saved.length+')':''}</button></div>`;
  if(stView==='saved')return head+(saved.length?saved.map(stCard).join(''):`<section class="glass card"><h2>Nothing saved yet</h2><p class="muted" style="margin:0">Open a study and tap Save to keep it here with its AI overview.</p></section>`);
  const k=stKey(),f=stFeed[k];if(!f||f.state==='idle')setTimeout(()=>stLoad(false),0);
  const chips=`<div class="stchips hscroll">${ST_TOPICS.map(t=>`<button class="chip ${!stQ&&stTopic===t[0]?'on':''}" data-a="st-topic" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>
  <div class="row" style="gap:8px"><input type="text" inputmode="search" autocapitalize="off" autocomplete="off" id="st-q" placeholder="Search any topic, for example creatine" value="${esc(stQ)}" style="flex:1;min-width:0" enterkeyhint="search"><button class="btn sm" data-a="st-search">Search</button></div>
  <div class="row between" style="gap:10px"><div class="seg" style="flex:none"><button data-a="st-strong" data-v="1" class="${stStrong?'on':''}" style="white-space:nowrap">Reviews and trials</button><button data-a="st-strong" data-v="0" class="${stStrong?'':'on'}">All</button></div><span class="small muted" style="text-align:right">${f&&f.state==='ok'?(f.total||f.list.length).toLocaleString()+' found':''}<br>Newest first</span></div>`;
  let body='';
  if(!f||(f.state==='loading'&&!f.list.length))body=`<section class="glass card" style="text-align:center"><div class="spin"></div><p class="muted" style="margin:14px 0 0">Loading the latest studies…</p></section>`;
  else if(f.state==='error')body=`<section class="glass card"><h2>Could not load studies</h2><p style="margin:0 0 12px">The research database did not respond. Nothing is wrong with your data. Check your connection and try again.</p><button class="btn block" data-a="st-retry">Try again</button><div class="small muted" style="margin-top:10px;overflow-wrap:anywhere">Details: ${esc(f.err)}</div></section>`;
  else if(!f.list.length)body=`<section class="glass card"><h2>No studies found</h2><p class="muted" style="margin:0">Try different words, or switch the filter to All.</p></section>`;
  else body=f.list.map(stCard).join('')+(f.done?'':`<button class="btn block" data-a="st-more">${f.state==='loading'?'Loading…':'Load more'}</button>`)+`<p class="small muted" style="text-align:center;margin:0">Study listings come from Europe PMC.</p>`;
  return head+chips+body}

function stAIBlock(p){const d=stStore(),o=d.ai[p.id];
  if(stBusyAI===p.id)return`<div class="verdict unclear"><div class="row" style="gap:10px"><div class="spin sm"></div><span>Reading the abstract…</span></div></div>`;
  if(!o)return`<button class="btn block" data-a="st-ai" data-v="${esc(p.id)}">Get AI overview</button><p class="small muted" style="margin:8px 0 0">Uses your own Gemini key to judge whether the study holds weight and what to take from it.</p>`;
  const V={strong:'Holds weight',moderate:'Holds some weight',weak:'Weak evidence',unclear:'Cannot tell from the abstract'}[o.verdict]||'Cannot tell from the abstract',li=a=>(a||[]).filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('');
  return`<div class="verdict ${esc(o.verdict||'unclear')}"><div class="small muted">AI overview</div><div class="v">${V}</div>${o.why?`<div style="margin-top:6px">${esc(o.why)}</div>`:''}</div>
  ${o.did?`<div><div style="font-weight:700">What they did</div><div class="muted" style="margin-top:4px">${esc(o.did)}</div></div>`:''}
  ${(o.found||[]).length?`<div><div style="font-weight:700">What they found</div><ul class="stlist muted">${li(o.found)}</ul></div>`:''}
  ${(o.limits||[]).length?`<div><div style="font-weight:700">Reasons to be careful</div><ul class="stlist muted">${li(o.limits)}</ul></div>`:''}
  ${o.takeaway?`<div class="tile"><div class="small muted">Takeaway for your training</div><div style="margin-top:4px">${esc(o.takeaway)}</div></div>`:''}
  <p class="small muted" style="margin:0">Written by Gemini from the abstract only, not the full paper. It can be wrong. <button class="info" data-a="st-ai" data-v="${esc(p.id)}">Redo</button></p>`}
function studySheet(id,replace){const p=stFind(id);if(!p)return;stOpen=id;const L=ST_LEVELS[stLevel(p)],d=stStore(),link=p.doi?'https://doi.org/'+encodeURIComponent(p.doi).replace(/%2F/g,'/'):'https://europepmc.org/article/'+encodeURIComponent(p.src)+'/'+encodeURIComponent(p.id);
  const html=`<div>${stBadge(p)}</div><h2 style="margin-top:10px">${esc(p.t)}</h2><p class="small muted" style="margin:6px 0 0">${stMeta(p)}${p.cited?' · cited '+p.cited+' times':''}</p>
  <div class="stack" style="margin-top:16px"><div class="tile small"><strong>${L[1]}.</strong> ${L[2]}</div>
  <div id="st-ai" class="stack">${stAIBlock(p)}</div>
  <div><div style="font-weight:700;margin-bottom:6px">Abstract</div><div class="abs">${esc(p.abs||'No abstract is available for this paper.')}</div></div>
  <div class="row"><a class="btn" style="flex:1;text-align:center" href="${link}" target="_blank" rel="noopener">${p.oa?'Read the paper (free)':'Open the paper'}</a><button class="btn" style="flex:1" data-a="st-save" data-v="${esc(p.id)}">${d.saved[p.id]?'Remove from saved':'Save'}</button></div></div>`;
  openSheet(html,'study')}
function stRefreshAI(id){const el=document.getElementById('st-ai'),p=stFind(id);if(el&&p&&stOpen===id&&$('#sheet').dataset.kind==='study'){el.innerHTML=typeof withTicks==='function'?withTicks(stAIBlock(p)):stAIBlock(p);if(typeof sheetMeasure==='function')sheetMeasure(true)}}

/* text-only Gemini call; same key, model choice and sign-in rule as the food scanner */
const stAsk=prompt=>gCall({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.2,responseMimeType:'application/json'}});
const stPrompt=p=>`You are a careful sports science reviewer helping a recreational lifter decide how much to trust a study.
Use ONLY the information below. Do not use outside knowledge about this paper and do not invent numbers, sample sizes or results. If something is not stated, say it is not stated.

Title: ${p.t}
Journal: ${p.j||'not stated'} (${p.y||'year not stated'})
Publication types listed by the database: ${(p.types||[]).join(', ')||'none listed'}
Abstract: ${p.abs||'No abstract available.'}

Judge how well the evidence in the abstract supports its conclusion. Weigh the study design, number of participants, whether they were trained or untrained, how long it ran, what was measured, how large the effect was, and whether the conclusion goes further than the results.
Reply with JSON only, in plain English a gym-goer understands, with these keys:
"verdict": one of "strong", "moderate", "weak", "unclear" ("unclear" when the abstract does not give enough to judge)
"why": one sentence explaining the verdict
"did": one or two sentences on who was studied and what was done
"found": array of 1 to 3 short findings, with numbers only if the abstract gives them
"limits": array of 1 to 4 short reasons to be careful
"takeaway": one or two sentences on what, if anything, a lifter should change. Say "nothing yet" if the evidence does not justify a change.`;
async function stRunAI(id){const p=stFind(id);if(!p||stBusyAI)return;if(!aiAllowed()){aiGate();return}if(!gKey()){geminiGuide();return}
  stBusyAI=id;stRefreshAI(id);
  try{const o=await Promise.race([stAsk(stPrompt(p)),new Promise((_,rej)=>setTimeout(()=>rej({code:'timeout'}),60000))]),arr=a=>Array.isArray(a)?a.map(x=>String(x).slice(0,400)).slice(0,4):[];
    const out={verdict:['strong','moderate','weak','unclear'].includes(o.verdict)?o.verdict:'unclear',why:String(o.why||'').slice(0,500),did:String(o.did||'').slice(0,600),found:arr(o.found),limits:arr(o.limits),takeaway:String(o.takeaway||'').slice(0,600),at:Date.now()};
    const d=stStore();d.ai[id]=out;stPut(d);stBusyAI=false;stRefreshAI(id);if(tab==='studies'&&!$('#scrim').classList.contains('on'))render()}
  catch(e){stBusyAI=false;stRefreshAI(id);const code=e&&e.code;
    if(code==='signin'){aiGate();return}if(code==='nokey'){geminiGuide();return}
    const msg={busy:'Google\'s AI is overloaded right now. That is on their side. Try again in a minute.',timeout:'The AI took too long to answer. Try again in a moment.',limit:'The free AI allowance is used up for now. Try again later.',badkey:'Google rejected the AI key. Check it under Settings, Nutrition.',unreadable:'The AI gave an answer that could not be read. Try again.'}[code]||(navigator.onLine===false?'This device is offline.':'The AI overview did not work this time. Try again in a moment.');
    toast(msg+(code?' ('+code+(e.status?' '+e.status:'')+')':''))}}

function stHow(){const row=k=>{const L=ST_LEVELS[k];return`<div class="tile small"><span class="lvl l${L[0]}"><i></i>${L[1]}</span><div style="margin-top:8px">${L[2]}</div></div>`};
  openSheet(`<h2>How to read these</h2><p>Each study gets a label for its design, taken from how the research database files it. The design tells you how much a single paper can prove, before you even read the result.</p>
  <div class="stack">${['meta','sys','rct','trial','review','obs','case','other'].map(row).join('')}
  <div class="tile small"><strong>The label is not the verdict.</strong> A small or badly run trial can be worse than a careful observational study. That is what the AI overview is for: it reads the abstract and weighs things like how many people took part, whether they were trained, and how long the study ran.</div>
  <div class="tile small"><strong>Limits.</strong> The AI sees only the abstract, not the full paper, and can be wrong. One study rarely settles anything, so treat a new result as a reason to look closer, not as a rule. The Coach's targets are based on pooled evidence, not on single papers shown here.</div></div>`,'info')}

function studiesAction(a,v,b){switch(a){
  case 'st-topic':stQ='';stTopic=v;render();$('#view').scrollTop=0;break;
  case 'st-strong':stStrong=v==='1';render();break;
  case 'st-view':stView=v;render();break;
  case 'st-search':{const q=(($('#st-q')||{}).value||'').trim().slice(0,120);stQ=q;render();break}
  case 'st-retry':{const f=stFeed[stKey()];if(f)f.state='idle';render();break}
  case 'st-more':stLoad(true);break;
  case 'st-open':studySheet(v);break;
  case 'st-ai':stRunAI(v);break;
  case 'st-how':stHow();break;
  case 'st-save':{const d=stStore(),p=stFind(v);if(!p)break;if(d.saved[v]){delete d.saved[v];toast('Removed from saved.')}else{d.saved[v]=Object.assign({},p,{savedAt:Date.now()});toast('Saved.')}stPut(d);studySheet(v);if(tab==='studies')render();break}
}}
document.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target&&ev.target.id==='st-q'){ev.target.blur();studiesAction('st-search')}});
