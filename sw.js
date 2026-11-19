/* Keeps the app usable with no signal at the gym and makes it open fast.
   - index.html and other unversioned files: ask the server first, but fall back to the saved copy after 1.2 s so a slow
     connection never holds up opening the app (the fresh copy is still saved for next time).
   - files with ?v=<version> in the address (the app's scripts), fonts and the sync library never change for a given
     address, so the saved copy is used straight away with no network wait. */
const CACHE='apex-shell-v59';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','config.js','manifest.webmanifest','icon-192.png'])).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const keep=(req,res)=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{})}return res};
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  const own=u.origin===location.origin,lib=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'||(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/'));
  if(!own&&!lib)return;if(own&&u.searchParams.has('u'))return;
  if(lib||(own&&u.searchParams.has('v'))){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>keep(r,res))));return}
  e.respondWith((async()=>{const cached=await caches.match(r,{ignoreSearch:true}),net=fetch(r.url,{cache:'no-cache'}).then(res=>keep(r,res));
    if(!cached)return net.catch(()=>caches.match('index.html'));
    e.waitUntil(net.catch(()=>{}));return Promise.race([net.catch(()=>cached),new Promise(res=>setTimeout(()=>res(cached),1200))])})())});
