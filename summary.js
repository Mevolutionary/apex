/* Apex workout summary: the highlights page shown after finishing a workout, and the story image made from it.
   Loaded after the main script; uses its globals. */

(function(){const st=document.createElement('style');st.textContent=`
.hl{display:flex;gap:12px;align-items:flex-start}
.hl>i{flex:none;width:8px;height:8px;border-radius:50%;margin-top:7px;background:linear-gradient(135deg,var(--cool),var(--warm))}
.hl.gold>i{background:var(--gold)}
.storyprev{display:block;width:132px;border-radius:16px;border:1px solid rgba(255,255,255,.2);flex:none}
.storyprev.ov{padding:8px;background:linear-gradient(160deg,#4a4f66,#23263a);box-sizing:border-box}
`;document.head.appendChild(st)})();

/* The name printed on shared images. Change it here if the app is renamed. */
const APP_NAME='Apex';
let storyStyle='card';const story={card:{url:'',file:null},overlay:{url:'',file:null}};
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
function summarySheet(id,fresh,keepStyle){const w=S.workouts.find(x=>x.id===id);if(!w)return;const f=workoutFacts(w),u=unit(),hl=highlightRows(w,f),mx=Math.max(1,...f.mus.map(m=>m[1]));
  if(!keepStyle)storyStyle='card';for(const k of ['card','overlay']){story[k]={url:'',file:null};try{const png=k==='overlay',c=png?drawOverlay(w,f):drawStory(w,f),type=png?'image/png':'image/jpeg';story[k].url=c.toDataURL(type,.9);c.toBlob(b=>{if(b)try{story[k].file=new File([b],'apex-workout.'+(png?'png':'jpg'),{type})}catch(e){}},type,.92)}catch(e){}}
  const cur=story[storyStyle],ov=storyStyle==='overlay';
  openSheet(`<h2 style="margin-bottom:2px">${fresh?'Workout complete':esc(w.name)}</h2><p class="small">${fresh?esc(w.name)+' · ':''}${niceDate(w.start)}</p><div class="stack">
  <div class="grid3"><div class="tile"><b>${dur(w.end-w.start)}</b><span>time</span></div><div class="tile"><b>${setCount(w)}</b><span>sets</span></div><div class="tile"><b>${big(f.vol)}</b><span>${u} lifted</span></div></div>
  <div class="tile"><div style="font-weight:800;margin-bottom:10px">Highlights</div><div class="stack">${hl.map(h=>`<div class="hl ${h[0]}"><i></i><div><div style="font-weight:600">${h[1]}</div><div class="small muted">${h[2]}</div></div></div>`).join('')}</div></div>
  <div class="tile"><div class="row between" style="margin-bottom:12px"><span style="font-weight:800">Share to your story</span><div class="seg"><button data-a="sum-style" data-v="card" data-w="${w.id}" class="${ov?'':'on'}">Card</button><button data-a="sum-style" data-v="overlay" data-w="${w.id}" class="${ov?'on':''}">Text only</button></div></div>
    <div class="row" style="align-items:center;gap:14px">${cur.url?`<img class="storyprev ${ov?'ov':''}" src="${cur.url}" alt="Preview of the ${ov?'text-only overlay':'story card'} for this workout">`:''}<div style="flex:1;min-width:0"><div class="small muted" style="margin-bottom:10px">${ov?'Text with no background, made to sit on top of your own photo. Copy it, then paste it onto your photo in the Instagram story editor. Or save it and add it there as a sticker.':'A tall image of this workout with its own background, ready to post as it is.'}</div><div class="row wrap" style="gap:8px">${ov?'<button class="btn primary sm" data-a="sum-copy">Copy</button>':''}<button class="btn ${ov?'':'primary'} sm" data-a="sum-share">${ov?'Save or share':'Share image'}</button></div></div></div></div>
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
  x.fillStyle='rgba(245,247,252,.55)';x.font=F(600,34);x.textAlign='center';x.fillText('Logged with '+APP_NAME,W/2,H-110);x.textAlign='left';return c}
/* ---------- text-only overlay: transparent background, sized to its content, for laying over a photo ---------- */
function drawOverlay(w,f){const W=1080,P=56,u=unit(),rows=w.exercises.slice(0,10),more=w.exercises.length-rows.length,o=typeof overall==='function'&&!isEmpty()?overall():null,prSet=new Set((w.prs||[]).map(p=>p.exId));
  const H=P+(o?170:0)+150+70+40+rows.length*84+(more>0?64:0)+110,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),F=(wt,px)=>`${wt} ${px}px ui-rounded, "SF Pro Rounded", -apple-system, system-ui, "Segoe UI", sans-serif`;
  const sh=on=>{x.shadowColor=on?'rgba(0,0,0,.7)':'transparent';x.shadowBlur=on?16:0;x.shadowOffsetY=on?3:0};
  const fit=(t,max)=>{t=String(t);if(x.measureText(t).width<=max)return t;while(t.length>1&&x.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…'};
  const hex=(cx,cy,r,tier)=>{const col=TIERS[tier][1];sh(true);x.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;x[i?'lineTo':'moveTo'](cx+r*Math.cos(a),cy+r*Math.sin(a))}x.closePath();const g=x.createLinearGradient(cx-r,cy-r,cx+r,cy+r);g.addColorStop(0,'#fff');g.addColorStop(.4,col);g.addColorStop(1,col);x.fillStyle=g;x.fill();sh(false);
    x.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;x[i?'lineTo':'moveTo'](cx+r*.7*Math.cos(a),cy+r*.7*Math.sin(a))}x.closePath();x.fillStyle='rgba(8,10,22,.82)';x.fill();x.fillStyle=col;x.font=F(900,r*.72);x.textAlign='center';x.fillText(TIERS[tier][0][0],cx,cy+r*.25);x.textAlign='left'};
  const medal=(cx,cy,r)=>{sh(true);x.fillStyle='#7b6cff';x.beginPath();x.moveTo(cx-r*.75,cy-r*1.7);x.lineTo(cx-r*.1,cy-r*1.7);x.lineTo(cx+r*.25,cy-r*.5);x.lineTo(cx-r*.4,cy-r*.5);x.closePath();x.fill();x.fillStyle='#ff7a59';x.beginPath();x.moveTo(cx+r*.75,cy-r*1.7);x.lineTo(cx+r*.1,cy-r*1.7);x.lineTo(cx-r*.25,cy-r*.5);x.lineTo(cx+r*.4,cy-r*.5);x.closePath();x.fill();
    const g=x.createRadialGradient(cx-r*.3,cy-r*.3,r*.1,cx,cy,r);g.addColorStop(0,'#fff3c4');g.addColorStop(.6,'#ffd166');g.addColorStop(1,'#c99a2e');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();sh(false);x.strokeStyle='rgba(120,84,10,.7)';x.lineWidth=2.5;x.beginPath();x.arc(cx,cy,r*.68,0,7);x.stroke()};
  let y=P;x.textBaseline='alphabetic';
  if(o){hex(P+62,y+72,62,o.tier);sh(true);x.fillStyle='rgba(255,255,255,.85)';x.font=F(700,34);x.fillText('OVERALL RANK',P+150,y+52);x.fillStyle=TIERS[o.tier][1];x.font=F(900,72);x.fillText(TIERS[o.tier][0],P+150,y+122);y+=170}
  sh(true);x.fillStyle='#fff';x.font=F(900,96);x.fillText(fit(w.name,W-2*P),P,y+100);y+=150;
  x.fillStyle='rgba(255,255,255,.9)';x.font=F(700,42);x.fillText(fit(dur(w.end-w.start)+'  ·  '+setCount(w)+' sets  ·  '+big(f.vol)+' '+u,W-2*P),P,y+30);y+=70+40;
  rows.forEach(e=>{const ex=exById(e.exId),b=bestSet(ex,e.sets),right=disp(b.w||0)+' '+u+' × '+b.r,pr=prSet.has(e.exId),rk=STD[e.exId]&&!isEmpty()?rankFor(e.exId):null;let lx=P;
    if(pr){medal(P+26,y+38,24);lx=P+70}sh(true);x.font=F(800,46);x.fillStyle='#fff';x.textAlign='right';x.fillText(right,W-P,y+52);const rw=x.measureText(right).width;x.textAlign='left';
    x.font=F(700,46);const room=W-P-rw-40-lx-(rk?64:0),nm=fit(ex.name,room);x.fillStyle=pr?'#ffe08a':'#fff';x.fillText(nm,lx,y+52);if(rk)hex(lx+x.measureText(nm).width+38,y+36,24,rk.tier);y+=84});
  if(more>0){sh(true);x.fillStyle='rgba(255,255,255,.8)';x.font=F(600,38);x.fillText('and '+more+' more',P,y+40);y+=64}
  sh(true);x.fillStyle='rgba(255,255,255,.8)';x.font=F(700,36);x.fillText('Logged with '+APP_NAME,P,y+70);if((w.prs||[]).length){x.textAlign='right';x.fillText((w.prs.length)+' PR'+(w.prs.length>1?'s':'')+' today',W-P,y+70);x.textAlign='left'}sh(false);return c}
async function copyStory(){const s=story[storyStyle];if(!s.file){toast('The image is still being prepared. Try again in a moment.');return}
  try{await navigator.clipboard.write([new ClipboardItem({[s.file.type]:s.file})]);toast('Copied. Open your photo in the story editor and paste.')}catch(e){toast('Copying images is not allowed here. Use Save or share instead.')}}
async function shareStory(){const storyUrl=story[storyStyle].url,storyFile=story[storyStyle].file,ext=storyStyle==='overlay'?'png':'jpg';if(!storyUrl){toast('The image could not be made on this device.');return}
  try{if(storyFile&&navigator.canShare&&navigator.canShare({files:[storyFile]})){await navigator.share({files:[storyFile]});return}}catch(e){if(e&&e.name==='AbortError')return}
  pushMode=true;openSheet(`<h2>Save the image</h2><p>This browser cannot open the share menu for images. Press and hold the picture and choose Save, or use the button.</p><div class="stack"><img src="${storyUrl}" alt="Story image for this workout" style="width:100%;border-radius:20px;display:block;background:linear-gradient(160deg,#4a4f66,#23263a)"><a class="btn block" href="${storyUrl}" download="apex-workout.${ext}">Download image</a></div>`,'story')}
function summaryAction(a,v,b){if(a==='sum-share')shareStory();else if(a==='sum-copy')copyStory();else if(a==='sum-style'){storyStyle=v;const fresh=($('#sheet h2')||{}).textContent==='Workout complete';summarySheet(b.dataset.w,fresh,true)}else if(a==='summary')summarySheet(v,false)}
