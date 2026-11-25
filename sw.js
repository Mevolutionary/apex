/* Keeps the app usable with no signal at the gym and makes it open fast.
   - index.html and other unversioned files: open from the saved copy straight away and fetch a fresh copy in the background
     for next time, so bad gym or plane Wi-Fi never holds up opening the app. New versions are still found by the update
     check (version.json, which bypasses this worker with ?u=); updating clears the saved copies, so it loads fresh.
   - files with ?v=<version> in the address (the app's scripts, scanner and font) and the sync library never change for a given
     address, so the saved copy is used straight away with no network wait. */
const CACHE='apex-shell-v79';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','config.js','manifest.webmanifest','icon-192.png','vendor/zxing-1d.min.js?v=0.23.0','fonts/nunito-latin.woff?v=1','data/afcd-r3.json?v=1'])).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
/* A new index.html is only saved once every script it loads is saved too, so the next launch also works with no signal. */
async function keepPage(req,res){if(!res||!res.ok)return res;try{const txt=await res.clone().text(),v=(txt.match(/VERSION='([\d.]+)'/)||[])[1],
    list=(txt.match(/\[('[a-z]+'(?:,'[a-z]+')*)\]\.forEach\(n=>document\.write/)||[])[1];
  if(v&&list){const c=await caches.open(CACHE),urls=list.split(',').map(n=>n.replace(/'/g,'')+'.js?v='+v);
    for(const x of urls){if(!(await c.match(x))){const rr=await fetch(x);if(!rr.ok)return res;await c.put(x,rr)}}}
  (await caches.open(CACHE)).put(req,res.clone())}catch(e){}return res}
const keep=(req,res)=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{})}return res};
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  const own=u.origin===location.origin,lib=u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/');
  if(!own&&!lib)return;if(own&&u.searchParams.has('u'))return;
  if(lib||(own&&u.searchParams.has('v'))){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>keep(r,res))));return}
  e.respondWith((async()=>{const cached=await caches.match(r,{ignoreSearch:true}),page=r.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname),
    net=fetch(r.url,{cache:'no-cache'}).then(res=>page&&cached?keepPage(r,res):keep(r,res));
    if(!cached)return net.catch(()=>caches.match('index.html'));
    e.waitUntil(net.catch(()=>{}));return cached})())});
