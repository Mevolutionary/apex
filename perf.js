/* Apex speed measurements (A9). Times the main jobs (saving, drawing a screen, syncing) and records how quickly the app
   responds to taps (INP) and how fast the first screen appears (LCP), where the browser supports it (Safari 26.2+).
   Shown only in the owner's debug menu. Loaded after every other script so it can wrap their functions by name. */

const PERF={};
function perfAdd(name,ms){const p=PERF[name]||(PERF[name]={n:0,sum:0,max:0,last:0});p.n++;p.sum+=ms;p.last=ms;if(ms>p.max)p.max=ms}
function perfWrap(name){const f=window[name];if(typeof f!=='function'||f.__perf)return;const w=function(){const t=performance.now(),r=f.apply(this,arguments);
    if(r&&typeof r.then==='function')r.then(()=>perfAdd(name,performance.now()-t),()=>perfAdd(name,performance.now()-t));else perfAdd(name,performance.now()-t);return r};
  w.__perf=true;window[name]=w}
['render','localSave','storeFlush','pull','pullChanges'].forEach(perfWrap);

/* Interaction to Next Paint: the slowest tap-to-screen-update time, per interaction. With few interactions this is the worst one. */
const inpByInteraction=new Map();let lcpMs=null;
try{new PerformanceObserver(l=>{for(const e of l.getEntries()){if(!e.interactionId)continue;const d=Math.max(inpByInteraction.get(e.interactionId)||0,e.duration);inpByInteraction.set(e.interactionId,d)}}).observe({type:'event',durationThreshold:16,buffered:true})}catch(e){}
try{new PerformanceObserver(l=>{const es=l.getEntries();if(es.length)lcpMs=es[es.length-1].startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch(e){}
function inpMs(){const v=[...inpByInteraction.values()].sort((a,b)=>b-a);if(!v.length)return null;return v[Math.min(v.length-1,Math.floor(v.length/50))]}
function perfRows(){const f=v=>v==null?'not measured':Math.round(v)+' ms',row=(label,k)=>{const p=PERF[k];return[label,p?`last ${f(p.last)} · avg ${f(p.sum/p.n)} · worst ${f(p.max)} (${p.n}×)`:'not run yet']};
  const nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
  return[['Tap response (INP)',inpByInteraction.size?f(inpMs())+' over '+inpByInteraction.size+' taps':'supported: '+(PerformanceObserver.supportedEntryTypes||[]).includes('event')],
    ['First screen (LCP)',lcpMs!=null?f(lcpMs):'supported: '+(PerformanceObserver.supportedEntryTypes||[]).includes('largest-contentful-paint')],
    ['App loaded',nav?f(nav.loadEventEnd||nav.domContentLoadedEventEnd):'not measured'],
    row('Draw a screen','render'),row('Save request','localSave'),row('Write to storage','storeFlush'),row('Full sync','pull'),row('Change-only sync','pullChanges')]}
