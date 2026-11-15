/* Apex Leaderboard (opt-in), terms, patch notes and the show-password button.
   Leaderboard: each person who joins publishes ONE small document, board/<their user id>, holding only
   a display name, overall rank and workouts this week. Nothing else leaves their account. Invited, verified
   accounts can read the board; nobody can write another person's entry (enforced by the Firestore rules in README). */

ITEMS.board={label:'Leaderboard',kind:'screen'};
ICON.board='<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>';

(function(){const st=document.createElement('style');st.textContent=`
.brow{display:flex;align-items:center;gap:12px;padding:12px 4px}.brow+.brow{border-top:1px solid rgba(255,255,255,.1)}
.brow .pos{font-family:var(--display);font-weight:900;width:26px;text-align:center;color:var(--ink-2)}
.brow.me{background:rgba(123,108,255,.16);border-radius:14px;padding:12px 10px;margin:0 -6px;border-top-color:transparent}
.brow.me+.brow{border-top-color:transparent}
.pwwrap{position:relative;display:block}.pwwrap input{padding-right:64px!important;width:100%}
.pwwrap .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:13px;font-weight:700;color:var(--ink-2);padding:8px 10px;border-radius:10px}
.terms h3{font-size:15px;font-weight:800;margin:14px 0 4px}.terms p{margin:0 0 6px;font-size:14px;color:var(--ink-2)}
.tick{display:flex;align-items:center;gap:10px;text-align:left}.tick .check{flex:none}
`;document.head.appendChild(st)})();

/* ---------- show password ---------- */
function eyeify(root){root.querySelectorAll('input[type=password]:not([data-eye])').forEach(inp=>{inp.dataset.eye='1';const w=document.createElement('span');w.className='pwwrap';inp.parentNode.insertBefore(w,inp);w.appendChild(inp);
  const b=document.createElement('button');b.type='button';b.className='eye';b.dataset.a='eye';b.textContent='Show';b.setAttribute('aria-label','Show what you typed');w.appendChild(b)})}
['sheet','lock'].forEach(id=>{const el=document.getElementById(id);if(el){new MutationObserver(()=>eyeify(el)).observe(el,{childList:true,subtree:true});eyeify(el)}});

/* ---------- terms ---------- */
const TERMS_V=2;
function termsSheet(){pushMode=!!$('#scrim').classList.contains('on');openSheet(`<div class="terms"><h2>Terms of use</h2><p class="small muted">Version ${TERMS_V}. Apex is a personal project shared with invited friends.</p>
  <h3>1. Not medical or dietary advice</h3><p>Apex gives general fitness and nutrition information. It is not advice from a doctor, dietitian or qualified trainer, and it does not know your health history. Speak to a professional before changing your training or diet, especially if you have a medical condition, an injury, or are under 18.</p>
  <h3>2. You use it at your own risk</h3><p>Lifting weights and changing how much you eat carry real risk of injury or harm. You are responsible for choosing loads, exercises and calorie targets that are safe for you. Stop and seek help if something hurts or you feel unwell.</p>
  <h3>3. Numbers can be wrong</h3><p>Calorie targets, rank standards, Coach suggestions and food data are estimates. Food entries come from public databases and may be inaccurate. AI features (label and meal scanning, study overviews) can make mistakes, so check anything that matters.</p>
  <h3>4. Your data</h3><p>Your workouts, weigh-ins and food log are stored on your device and, if you sign in, in a private area of a cloud database that only your account can read. Progress photos are encrypted on your device before upload. If you join the Leaderboard, the display name, overall rank, weekly workout count and, unless you turn it off, the rank and estimated one-rep max of your ranked lifts are visible to other invited members. You can export or delete your data at any time in Settings.</p>
  <h3>5. Your AI key</h3><p>If you add a Google Gemini key it is yours. Requests go from your device straight to Google under Google's own terms. Photos you scan are sent to Google to be read.</p>
  <h3>6. No guarantee</h3><p>Apex is provided as it is, free of charge, with no warranty. It may change, break, lose data or be switched off without notice. Keep your own backup if your data matters to you. To the extent the law allows, the maker of Apex is not liable for any loss, injury or damage arising from its use.</p>
  <h3>7. Fair use</h3><p>Do not share your invite or account, attempt to access anyone else's data, or use the app to harm others. Access can be removed at any time.</p>
  <h3>8. Changes</h3><p>These terms may be updated. The version number above will change when they are.</p></div>`,'terms')}

/* ---------- patch notes ---------- */
const NOTES=[
  ['0.53',['New Progress screen: a map of the muscles you trained this week, awards and a monthly or yearly recap','Goal weight with a projected date on the Body screen','Body measurements: waist, chest, arm, thigh, hips']],
  ['0.52',['Leaderboard: a Lifts tab to rank one lift at a time, search by name and compare with a friend','Dock: drag items into any order while editing it']],
  ['0.51',['Saved meals: log a regular meal in one tap','Copy a whole day or one meal','Favourite foods with a star','Water tracking','Weekly nutrition report','Describe what you ate and let AI log it']],
  ['0.50',['Opt-in Leaderboard for invited friends','Show button on every password box','Terms of use, agreed to when creating an account','Your AI key is now stored encrypted on the device','These patch notes']],
  ['0.49',['Set types: warm-up, drop set, to failure','Supersets, notes and rest time per exercise','Swap an exercise, add cardio','Coach suggests a lighter week when lifts slip']],
  ['0.48',['Settings organised into eight tabs','Smoother dock when the all-features panel drops','No more accidental zoom on quick taps']],
  ['0.47',['Accessibility: text size, reduce motion, lite effects, high contrast, haptics']],
  ['0.45',['Faster opening, even on a weak connection','Smoother scrolling and swiping']],
  ['0.44',['Studies page with AI overviews','Faster and more reliable AI requests']],
  ['0.39',['Start a workout on your Apple Watch with one-tap setup']],
  ['0.36',['Add to Home Screen guide and share link']]];
function notesSheet(sinceVer){const cmp=(a,b)=>a.split('.').map(Number).reduce((r,n,i)=>r||n-(+b.split('.')[i]||0),0),list=sinceVer?NOTES.filter(n=>cmp(n[0],sinceVer)>0):NOTES;if(!list.length)return false;
  openSheet(`<h2>${sinceVer?'What is new':'Patch notes'}</h2><div class="stack">${list.map(n=>`<div class="tile small"><strong>Version ${n[0]}</strong><ul style="margin:6px 0 0;padding-left:18px">${n[1].map(x=>`<li style="margin:3px 0">${x}</li>`).join('')}</ul></div>`).join('')}</div>`,'notes');return true}
function notesBoot(){const seen=lsGet('.seen')||(isEmpty()?null:'0.49');lsSet('.seen',VERSION);if(!seen||seen===VERSION)return;
  setTimeout(()=>{if($('#lock').classList.contains('on')||$('#scrim').classList.contains('on')||S.active)return;notesSheet(seen)},1400)}

/* ---------- leaderboard ---------- */
let boardList=null,boardState='idle',boardErr='',boardView='rank',boardAt=0,boardLift='bench',boardQ='';
const boardCfg=()=>Object.assign({on:false,name:'',lifts:true},S.settings.board||{});
const boardName=()=>{const n=(boardCfg().name||'').trim();return n||(((fbUser||{}).email||'').split('@')[0]||'Lifter').slice(0,24)};
/* per-lift numbers: tier always; estimated 1RM only for loaded lifts, because a bodyweight lift's score includes bodyweight */
function boardLifts(){const out={};if(isEmpty())return out;Object.keys(STD).forEach(id=>{const r=rankFor(id),bst=bestOf(S.workouts,id);if(!r||!bst)return;const o={t:r.tier};if(!exById(id).bw)o.e=Math.round(bst.sc*2)/2;out[id]=o});return out}
function boardEntry(){const o=isEmpty()?null:overall(),e={name:boardName().slice(0,24),tier:o?o.tier:-1,prog:o?Math.round(Math.min(.99,Math.max(0,o.prog))*100)/100:0,week:Math.min(21,S.workouts.filter(w=>w.start>=weekStart()).length),at:Date.now()};if(boardCfg().lifts!==false)e.lifts=boardLifts();return e}
const boardReady=()=>!!(fb&&fbUser&&cloudState==='synced');
async function boardPublish(quiet){if(!boardReady()||!boardCfg().on)return false;try{await fb.F.setDoc(fb.F.doc(fb.db,'board',fbUser.uid),boardEntry());return true}catch(e){if(!quiet)toast(e&&e.code==='permission-denied'?'The leaderboard is not switched on for this app yet.':'Could not update the leaderboard. Check your connection.');return false}}
async function boardLoad(){if(!boardReady()){boardState='idle';return}boardState='loading';if(tab==='board')render();
  try{const sn=await fb.F.getDocs(fb.F.collection(fb.db,'board')),out=[],num=(v,lo,hi)=>Math.max(lo,Math.min(hi,+v||0));
    sn.forEach(d=>{const x=d.data()||{},lifts={};/* other people's data: treat as untrusted, coerce every field */
      if(x.lifts&&typeof x.lifts==='object')Object.keys(STD).forEach(id=>{const l=x.lifts[id];if(l&&typeof l==='object'){lifts[id]={t:Math.round(num(l.t,0,6))};if(l.e!=null)lifts[id].e=Math.round(num(l.e,0,700)*2)/2}});
      out.push({id:d.id,name:String(x.name||'Lifter').replace(/[\u0000-\u001f]/g,'').slice(0,24),tier:Math.round(num(x.tier,-1,6)),prog:num(x.prog,0,.99),week:Math.round(num(x.week,0,21)),at:+x.at||0,lifts})});
    boardList=out.filter(e=>Date.now()-e.at<45*DAY);boardState='ok';boardErr='';boardAt=Date.now()}
  catch(e){boardState='error';boardErr=e&&e.code==='permission-denied'?'rules':String((e&&e.code)||(e&&e.message)||e)}
  if(tab==='board')render()}
const liftVal=l=>l?(l.e!=null?disp(l.e)+' '+unit():TIERS[l.t][0]):'—',liftKey=l=>l?(l.e!=null?l.e:l.t):-1;
function boardRows(){const me=fbUser.uid,q=boardQ.trim().toLowerCase();
  if(boardView==='lifts'){const l=boardList.filter(e=>e.lifts[boardLift]&&(!q||e.name.toLowerCase().includes(q))).sort((a,b)=>liftKey(b.lifts[boardLift])-liftKey(a.lifts[boardLift]));
    return l.length?l.map((e,i)=>{const x=e.lifts[boardLift];return `<button class="brow ${e.id===me?'me':''}" style="width:100%;text-align:left" data-a="board-cmp" data-v="${esc(e.id)}"><span class="pos">${i+1}</span>${emblem(x.t,36)}<div style="flex:1;min-width:0"><div style="font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name)}${e.id===me?' <span class="small muted">(you)</span>':''}</div><div class="small muted">${TIERS[x.t][0]}</div></div><div style="text-align:right"><div style="font-family:var(--display);font-weight:900;font-size:18px">${x.e!=null?disp(x.e):TIERS[x.t][0]}</div><div class="small muted">${x.e!=null?unit()+' est. 1RM':'rank'}</div></div></button>`}).join(''):`<div class="muted">${q?'Nobody matches that name for this lift.':'Nobody has shared this lift yet.'}</div>`}
  const l=boardList.filter(e=>!q||e.name.toLowerCase().includes(q)).sort(boardView==='week'?(a,b)=>b.week-a.week||b.tier+b.prog-a.tier-a.prog:(a,b)=>b.tier+b.prog-a.tier-a.prog||b.week-a.week);
  return l.length?l.map((e,i)=>`<button class="brow ${e.id===me?'me':''}" style="width:100%;text-align:left" data-a="board-cmp" data-v="${esc(e.id)}"><span class="pos">${i+1}</span>${e.tier>=0?emblem(e.tier,36):'<span style="width:36px"></span>'}<div style="flex:1;min-width:0"><div style="font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name)}${e.id===me?' <span class="small muted">(you)</span>':''}</div><div class="small muted">${e.tier>=0?TIERS[e.tier][0]+(e.tier<6?' · '+Math.round(e.prog*100)+'% to '+TIERS[e.tier+1][0]:''):'Not ranked yet'}</div></div><div style="text-align:right"><div style="font-family:var(--display);font-weight:900;font-size:18px">${e.week}</div><div class="small muted">this week</div></div></button>`).join(''):`<div class="muted">${q?'Nobody matches that name.':'Nobody has joined yet. You are the first.'}</div>`}
const shareSeg=on=>`<div class="row between" style="gap:12px"><span>Share my best lifts<br><span class="small muted">Rank and estimated 1RM for bench, squat, deadlift, overhead press and row; rank only for pull-ups</span></span><div class="seg" style="flex:none" id="board-lifts" data-on="${on?1:0}"><button data-a="board-lifts" data-v="0" class="${on?'':'on'}">Off</button><button data-a="board-lifts" data-v="1" class="${on?'on':''}">On</button></div></div>`;
function boardScreen(){const c=boardCfg(),head=`<div class="top"><h1>Leaderboard</h1><button class="btn sm" data-a="board-how">How it works</button></div>`;
  if(!boardReady())return head+`<section class="glass card"><h2>Sign in to join</h2><p class="muted" style="margin:0 0 12px">The leaderboard is shared between invited friends, so it needs an account. Nothing is shared until you choose to join.</p><button class="btn block" data-a="settings">Open Settings</button></section>`;
  if(!c.on)return head+`<section class="glass card stack"><h2 style="margin:0">Join the leaderboard</h2><div class="muted">It is off until you turn it on. If you join, other invited members can see:</div>
    <div class="tile small"><strong>Display name</strong> · <strong>Overall rank</strong> · <strong>Workouts this week</strong></div>
    ${shareSeg(c.lifts!==false)}
    <div class="small muted">Never shared: bodyweight, photos, food or your email. A lift's rank is based on bodyweight, so a rank shown beside a 1RM gives a rough idea of weight class. Turn lifts off if you would rather not. You can leave at any time, which removes your entry.</div>
    <label><span class="small muted">Display name</span><input type="text" id="board-name" maxlength="24" value="${esc(boardName())}" autocomplete="off"></label>
    <button class="btn primary block" data-a="board-join">Join</button></section>`;
  if(boardState==='idle'||(boardState==='ok'&&Date.now()-boardAt>120000))setTimeout(()=>{boardPublish(true).then(boardLoad)},0);
  let body='';
  if(boardState==='error')body=`<section class="glass card"><h2>${boardErr==='rules'?'Not switched on yet':'Could not load the leaderboard'}</h2><p style="margin:0 0 12px">${boardErr==='rules'?(isOwner?'Add the leaderboard block to your Firestore rules (it is in the README), then try again.':'The person who runs this app needs to switch the leaderboard on. Let them know.'):'Check your connection and try again.'}</p><button class="btn block" data-a="board-refresh">Try again</button>${boardErr==='rules'?'':`<div class="small muted" style="margin-top:10px">Details: ${esc(boardErr)}</div>`}</section>`;
  else if(!boardList)body=`<section class="glass card" style="text-align:center"><div class="spin"></div><p class="muted" style="margin:14px 0 0">Loading…</p></section>`;
  else body=`<div class="seg" style="align-self:flex-start"><button data-a="board-view" data-v="rank" class="${boardView==='rank'?'on':''}">Overall</button><button data-a="board-view" data-v="week" class="${boardView==='week'?'on':''}">This week</button><button data-a="board-view" data-v="lifts" class="${boardView==='lifts'?'on':''}">Lifts</button></div>
    ${boardView==='lifts'?`<div class="stchips hscroll">${Object.keys(STD).map(id=>`<button class="chip ${boardLift===id?'on':''}" data-a="board-lift" data-v="${id}">${esc(exById(id).name)}</button>`).join('')}</div>`:''}
    <input type="text" id="board-q" autocapitalize="off" autocomplete="off" placeholder="Search a name" value="${esc(boardQ)}">
    <section class="glass card" id="board-rows">${boardRows()}</section>
    <div class="small muted" style="text-align:center">Tap anyone to compare lifts with them.</div>
    <div class="row"><button class="btn sm" style="flex:1" data-a="board-refresh">Refresh</button><button class="btn sm" style="flex:1" data-a="board-rename">My entry</button><button class="btn sm danger" style="flex:1" data-a="board-leave">Leave</button></div>`;
  return head+body}
function boardCompare(id){const them=(boardList||[]).find(e=>e.id===id),me=(boardList||[]).find(e=>e.id===fbUser.uid)||{name:'You',lifts:boardLifts(),tier:-1,week:0};if(!them)return;const self=them.id===fbUser.uid;
  const cell=(l,win)=>`<div style="flex:1;text-align:center${win?';color:var(--good)':''}"><div style="font-family:var(--display);font-weight:900;font-size:17px">${liftVal(l)}</div><div class="small muted">${l?TIERS[l.t][0]:'not shared'}</div></div>`;
  const rows=Object.keys(STD).map(lid=>{const a=me.lifts[lid],b=them.lifts[lid],ka=liftKey(a),kb=liftKey(b);return `<div class="brow" style="gap:8px"><div style="width:96px;font-weight:700;font-size:14px">${esc(exById(lid).name)}</div>${cell(a,!self&&a&&b&&ka>kb)}${self?'':cell(b,a&&b&&kb>ka)}</div>`}).join('');
  openSheet(`<h2>${self?'Your shared lifts':'You and '+esc(them.name)}</h2><div class="brow" style="gap:8px"><div style="width:96px"></div><div style="flex:1;text-align:center" class="small muted">You</div>${self?'':`<div style="flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" class="small muted">${esc(them.name)}</div>`}</div>${rows}
  <p class="small muted" style="margin-top:12px">Estimated one-rep max from each person's best logged set. Green marks the stronger lift. ${Object.keys(them.lifts).length?'':esc(them.name)+' has not shared individual lifts.'}</p>`,'compare')}
function boardHow(){openSheet(`<h2>How the leaderboard works</h2><div class="stack">
  <div class="tile small"><strong>Opt-in.</strong> You are not on it until you tap Join, and Leave removes your entry straight away.</div>
  <div class="tile small"><strong>What is shared.</strong> A display name you choose, your overall rank, and how many workouts you have logged this week. If you leave lift sharing on, also your rank and estimated one-rep max for the ranked lifts.</div>
  <div class="tile small"><strong>Who sees it.</strong> Only people who have been invited to Apex and verified their email.</div>
  <div class="tile small"><strong>Three views.</strong> Overall is the average of your ranked lifts against your bodyweight. This week counts workouts since Monday. Lifts ranks everyone on one lift at a time; tap a person to compare all lifts side by side.</div>
  <div class="tile small"><strong>Honour system.</strong> Each person's phone reports its own numbers, so the board is only as honest as the people on it. Entries older than about six weeks drop off.</div></div>`,'info')}
function boardAction(a,v,b){switch(a){
  case 'eye':{const i=b.parentElement.querySelector('input');if(!i)break;const show=i.type==='password';i.type=show?'text':'password';b.textContent=show?'Hide':'Show';break}
  case 'terms':termsSheet();break;
  case 'terms-tick':{const on=!b.classList.contains('on');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);break}
  case 'notes':notesSheet();break;
  case 'board-how':boardHow();break;
  case 'board-view':boardView=v;render();break;
  case 'board-lift':boardLift=v;render();break;
  case 'board-cmp':boardCompare(v);break;
  case 'board-refresh':boardState='idle';render();break;
  case 'board-lifts':b.parentElement.dataset.on=v;[...b.parentElement.children].forEach(x=>x.classList.toggle('on',x===b));break;
  case 'board-join':case 'board-name-save':{const n=(($('#board-name')||{}).value||'').trim().slice(0,24);if(!n){toast('Choose a display name.');break}const sg=$('#board-lifts');S.settings.board={on:true,name:n,lifts:sg?sg.dataset.on==='1':boardCfg().lifts!==false};save('settings');if(a==='board-name-save')closeSheet();boardState='idle';if(a==='board-join')boardList=null;render();break}
  case 'board-rename':openSheet(`<h2>My entry</h2><div class="stack"><label><span class="small muted">Display name</span><input type="text" id="board-name" maxlength="24" value="${esc(boardName())}" autocomplete="off"></label>${shareSeg(boardCfg().lifts!==false)}<button class="btn primary block" data-a="board-name-save">Save</button></div>`,'boardname');break;
  case 'board-leave':confirmSheet('Leave the leaderboard?','Your entry is removed for everyone. You can join again later.','Leave',async()=>{S.settings.board=Object.assign(boardCfg(),{on:false});save('settings');try{await fb.F.deleteDoc(fb.F.doc(fb.db,'board',fbUser.uid))}catch(e){toast('Left on this device, but the entry could not be removed. Try again when online.')}boardList=null;boardState='idle';render()});break;
}}
document.addEventListener('input',ev=>{if(ev.target&&ev.target.id==='board-q'){boardQ=ev.target.value;const el=$('#board-rows');if(el&&boardList)el.innerHTML=boardRows()}});
/* deleting the account also removes the leaderboard entry */
{const del0=deleteAccount;deleteAccount=async function(){const pw=($('#del-pw')||{}).value;if(pw&&fb&&fbUser){try{await fb.F.deleteDoc(fb.F.doc(fb.db,'board',fbUser.uid))}catch(e){}}return del0.apply(this,arguments)}}
