/* Apex workout summary: the highlights page shown after finishing a workout, and the story image made from it.
   Loaded after the main script; uses its globals. */

(function(){const st=document.createElement('style');st.textContent=`
.hl{display:flex;gap:12px;align-items:flex-start}
.hl>i{flex:none;width:8px;height:8px;border-radius:50%;margin-top:7px;background:linear-gradient(135deg,var(--cool),var(--warm))}
.hl.gold>i{background:var(--gold)}
.storyprev{display:block;width:132px;border-radius:16px;border:1px solid rgba(255,255,255,.2);flex:none}
`;document.head.appendChild(st)})();

let storyFile=null,storyUrl='';
const bestSet=(ex,sets)=>sets.reduce((a,s)=>score(ex,s)>score(ex,a)?s:a,sets[0]);
/* Everything worth calling out about one workout. */
function workoutFacts(w){const list=S.workouts,idx=list.indexOf(w),vol=volume(w),prev=list.slice(0,idx<0?list.length:idx).reverse().find(x=>x.name===w.name&&x.id!==w.id),mus={};
  for(const e of w.exercises){const m=exById(e.exId).muscle;mus[m]=(mus[m]||0)+e.sets.length}
  const wkStart=(()=>{const d=new Date(w.start);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()})(),thisWeek=list.filter(x=>x.start>=wkStart&&x.start<=w.start).length;
  return{vol,prev,change:prev&&volume(prev)>0?Math.round((vol-volume(prev))/volume(prev)*100):null,mus:Object.entries(mus).sort((a,b)=>b[1]-a[1]),nth:idx<0?list.length:idx+1,streak:streak(list),thisWeek}}
function highlightRows(w,f){const out=[],u=unit();
  for(const up of w.up||[])out.push(['gold',`${esc(exById(up.id).name)} moved up to ${TIERS[up.to][0]}`,`from ${up.from==null?'unranked':TIERS[up.from][0]}`]);
  if((w.prs||[]).length)out.push(['gold',`${w.prs.length} personal record${w.prs.length>1?'s':''}`,w.prs.slice(0,3).map(p=>esc(exById(p.exId).name)).join(', ')+(w.prs.length>3?' and more':'')]);
  if(f.streak>1)out.push(['',`${f.streak} weeks in a row`,'with at least one workout each week']);
  out.push(['',`Workout number ${f.nth}`,f.thisWeek>1?`your ${['','first','second','third','fourth','fifth','sixth','seventh'][f.thisWeek]||f.thisWeek+'th'} this week`:'your first this week']);
  if(f.change!=null&&Math.abs(f.change)>=1)out.push(['',`${f.change>0?'Up':'Down'} ${Math.abs(f.change)}% on your last ${esc(w.name)}`,`${big(f.vol)} ${u} lifted against ${big(volume(f.prev))} ${u}`]);
  return out}
function summarySheet(id,fresh){const w=S.workouts.find(x=>x.id===id);if(!w)return;const f=workoutFacts(w),u=unit(),hl=highlightRows(w,f),mx=Math.max(1,...f.mus.map(m=>m[1]));
  storyFile=null;storyUrl='';try{const c=drawStory(w,f);storyUrl=c.toDataURL('image/jpeg',.9);c.toBlob(b=>{if(b)try{storyFile=new File([b],'apex-workout.jpg',{type:'image/jpeg'})}catch(e){}},'image/jpeg',.92)}catch(e){}
  openSheet(`<h2 style="margin-bottom:2px">${fresh?'Workout complete':esc(w.name)}</h2><p class="small">${fresh?esc(w.name)+' · ':''}${niceDate(w.start)}</p><div class="stack">
  <div class="grid3"><div class="tile"><b>${dur(w.end-w.start)}</b><span>time</span></div><div class="tile"><b>${setCount(w)}</b><span>sets</span></div><div class="tile"><b>${big(f.vol)}</b><span>${u} lifted</span></div></div>
  <div class="tile"><div style="font-weight:800;margin-bottom:10px">Highlights</div><div class="stack">${hl.map(h=>`<div class="hl ${h[0]}"><i></i><div><div style="font-weight:600">${h[1]}</div><div class="small muted">${h[2]}</div></div></div>`).join('')}</div></div>
  <div class="tile"><div class="row" style="align-items:center;gap:14px">${storyUrl?`<img class="storyprev" src="${storyUrl}" alt="Preview of the story image for this workout">`:''}<div style="flex:1;min-width:0"><div style="font-weight:800">Share to your story</div><div class="small muted" style="margin:4px 0 10px">A tall image of this workout, ready for Instagram or anywhere else.</div><button class="btn primary sm" data-a="sum-share">Share image</button></div></div></div>
  ${(w.prs||[]).length?`<div class="tile"><div style="font-weight:800;margin-bottom:4px">Records</div><div class="list">${w.prs.map(p=>`<div class="row between tap" data-a="ex" data-v="${esc(p.exId)}"><span>${esc(exById(p.exId).name)}<span class="small muted"> · ${p.type}</span></span><span class="row"><span class="num" style="font-weight:800">${disp(p.kg)} ${u}</span><span class="pr">PR</span></span></div>`).join('')}</div></div>`:''}
  <div class="tile"><div style="font-weight:800;margin-bottom:10px">Muscles worked</div><div class="bars">${f.mus.map(m=>`<div class="barrow"><span>${m[0]}</span><div class="track"><i style="width:${m[1]/mx*100}%"></i></div><span class="num" style="text-align:right">${m[1]}</span></div>`).join('')}</div></div>
  <div class="tile"><div style="font-weight:800;margin-bottom:4px">Best set of each exercise</div><div class="list">${w.exercises.map(e=>{const ex=exById(e.exId),b=bestSet(ex,e.sets);return `<div class="row between tap" data-a="ex" data-v="${esc(e.exId)}"><span style="min-width:0">${esc(ex.name)}<span class="small muted"> · ${e.sets.length} set${e.sets.length>1?'s':''}</span></span><span class="num" style="font-weight:700;white-space:nowrap">${disp(b.w||0)} ${u} × ${b.r}</span></div>`}).join('')}</div></div>
  <div class="row"><button class="btn" style="flex:1" data-a="to-routine" data-v="${w.id}">Save as routine</button><button class="btn primary" style="flex:1" data-a="close">Done</button></div></div>`,'summary')}

/* ---------- story image (1080 × 1920) ---------- */
function drawStory(w,f){const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),u=unit(),F=(wt,px)=>`${wt} ${px}px ui-rounded, "SF Pro Rounded", -apple-system, system-ui, "Segoe UI", sans-serif`;
  x.fillStyle='#070913';x.fillRect(0,0,W,H);
  const blob=(cx,cy,r,col)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H)};
  blob(220,260,900,'rgba(92,74,255,.85)');blob(1000,620,700,'rgba(255,112,92,.42)');blob(160,1700,820,'rgba(0,160,215,.5)');blob(980,1500,620,'rgba(150,84,255,.4)');
  const rr=(X,Y,w2,h2,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w2,Y,X+w2,Y+h2,r);x.arcTo(X+w2,Y+h2,X,Y+h2,r);x.arcTo(X,Y+h2,X,Y,r);x.arcTo(X,Y,X+w2,Y,r);x.closePath()};
  const glass=(X,Y,w2,h2,r)=>{rr(X,Y,w2,h2,r);const g=x.createLinearGradient(X,Y,X+w2,Y+h2);g.addColorStop(0,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,.07)');x.fillStyle=g;x.fill();x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=2;x.stroke()};
  const fit=(t,max)=>{t=String(t);if(x.measureText(t).width<=max)return t;while(t.length>1&&x.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…'};
  const P=80;x.textBaseline='alphabetic';
  x.fillStyle='rgba(245,247,252,.7)';x.font=F(800,34);x.fillText('A P E X',P,230);
  x.fillStyle='#f5f7fc';x.font=F(900,104);const words=String(w.name).split(/\s+/),lines=[''];for(const wd of words){const t=(lines[lines.length-1]+' '+wd).trim();if(x.measureText(t).width>W-2*P&&lines[lines.length-1])lines.push(wd);else lines[lines.length-1]=t}
  let y=360;lines.slice(0,2).forEach((l,i)=>{x.fillText(i===1&&lines.length>2?fit(l+' …',W-2*P):fit(l,W-2*P),P,y);y+=112});
  x.fillStyle='rgba(245,247,252,.72)';x.font=F(600,40);x.fillText(new Date(w.start).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'}),P,y-30);y+=40;
  const tiles=[[dur(w.end-w.start),'time'],[String(setCount(w)),'sets'],[big(f.vol),u+' lifted']],tw=(W-2*P-2*28)/3;
  tiles.forEach((t,i)=>{const X=P+i*(tw+28);glass(X,y,tw,210,44);x.fillStyle='#f5f7fc';x.font=F(900,76);x.fillText(fit(t[0],tw-48),X+30,y+112);x.fillStyle='rgba(245,247,252,.7)';x.font=F(600,34);x.fillText(t[1],X+30,y+166)});y+=210+40;
  const notes=[];(w.up||[]).forEach(up=>notes.push(['gold',exById(up.id).name+' → '+TIERS[up.to][0]]));(w.prs||[]).slice(0,3).forEach(p=>notes.push(['gold','PR · '+exById(p.exId).name+' '+disp(p.kg)+' '+u]));if(f.streak>1)notes.push(['',f.streak+' weeks in a row']);notes.push(['','Workout number '+f.nth]);
  const nn=notes.slice(0,5),nh=70+nn.length*74;glass(P,y,W-2*P,nh,48);nn.forEach((n,i)=>{const yy=y+92+i*74;x.fillStyle=n[0]?'#ffd166':'rgba(245,247,252,.6)';x.beginPath();x.arc(P+52,yy-14,11,0,7);x.fill();x.fillStyle='#f5f7fc';x.font=F(700,44);x.fillText(fit(n[1],W-2*P-140),P+90,yy)});y+=nh+40;
  const rows=w.exercises.slice(0,Math.max(1,Math.min(8,Math.floor((H-190-y-90)/78)))),eh=90+rows.length*78+(w.exercises.length>rows.length?60:0);glass(P,y,W-2*P,eh,48);
  rows.forEach((e,i)=>{const ex=exById(e.exId),b=bestSet(ex,e.sets),yy=y+104+i*78,right=disp(b.w||0)+' '+u+' × '+b.r;x.font=F(800,42);x.fillStyle='#f5f7fc';x.textAlign='right';x.fillText(right,W-P-44,yy);const rw=x.measureText(right).width;x.textAlign='left';x.font=F(600,42);x.fillStyle='rgba(245,247,252,.88)';x.fillText(fit(ex.name,W-2*P-88-rw-40),P+44,yy)});
  if(w.exercises.length>rows.length){x.fillStyle='rgba(245,247,252,.6)';x.font=F(600,36);x.fillText('and '+(w.exercises.length-rows.length)+' more',P+44,y+eh-44)}
  x.fillStyle='rgba(245,247,252,.55)';x.font=F(600,34);x.textAlign='center';x.fillText('Logged with Apex',W/2,H-110);x.textAlign='left';return c}
async function shareStory(){if(!storyUrl){toast('The image could not be made on this device.');return}
  try{if(storyFile&&navigator.canShare&&navigator.canShare({files:[storyFile]})){await navigator.share({files:[storyFile]});return}}catch(e){if(e&&e.name==='AbortError')return}
  pushMode=true;openSheet(`<h2>Save the image</h2><p>This browser cannot open the share menu for images. Press and hold the picture and choose Save, or use the button.</p><div class="stack"><img src="${storyUrl}" alt="Story image for this workout" style="width:100%;border-radius:20px;display:block"><a class="btn block" href="${storyUrl}" download="apex-workout.jpg">Download image</a></div>`,'story')}
function summaryAction(a,v){if(a==='sum-share')shareStory();else if(a==='summary')summarySheet(v,false)}
