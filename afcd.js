/* A25: Australian generic foods, offline.
   Data: Australian Food Composition Database, Release 3 (December 2025), © Food Standards Australia New Zealand,
   used under the AFCD Data User Licence (based on CC BY-SA 3.0 Australia). Apex's copy in data/afcd-r3.json is
   modified: energy converted from kJ to kcal, values rounded and only 17 of the nutrients kept. That file stays
   under the same licence; the rest of Apex does not have to be. See data/AFCD-LICENCE.md.
   Row layout: [key, name, kcal, protein, carbs, fat, fibre, sugars, sat, mono, poly, trans g, sodium mg,
   cholesterol mg, potassium mg, calcium mg, iron mg, vitamin C mg, vitamin A ug RE, vitamin D ug], per 100 g. */
const AFCD_URL='data/afcd-r3.json?v=1';
let afcdData=null,afcdP=null;
function afcdLoad(){return afcdP||(afcdP=fetch(AFCD_URL).then(r=>{if(!r.ok)throw 0;return r.json()}).then(rows=>{
  afcdData=rows.map(r=>{const x={},put=(k,v)=>{if(v!=null)x[k]=v};
    [['fib',6],['sug',7],['sat',8],['mono',9],['poly',10],['trans',11],['na',12],['chol',13],['pot',14],['ca',15],['fe',16],['vc',17],['va',18],['vd',19]].forEach(a=>put(a[0],r[a[1]]));
    return{n:r[1],b:'Australian average',afcd:r[0],src:'Australian Food Composition Database',per:{k:r[2]||0,p:r[3]||0,c:r[4]||0,f:r[5]||0,x},serv:null,lc:r[1].toLowerCase()}});
  return afcdData}).catch(()=>{afcdP=null;return null}))}
/* every word must appear; names that start with the first word, then shorter names, come first */
function afcdSearch(words){if(!afcdData||!words.length)return[];
  const hits=afcdData.filter(f=>words.every(w=>f.lc.includes(w)));
  const sc=f=>(f.lc.startsWith(words[0])?0:f.lc.includes(' '+words[0])||f.lc.includes(','+words[0])?1:2)*1000+f.lc.length;
  return hits.sort((a,b)=>sc(a)-sc(b)).slice(0,6)}

/* load as soon as the food search opens, so results are there by the first letters */
if(typeof searchSheet==='function'){const ss0=searchSheet;searchSheet=function(){afcdLoad();return ss0.apply(this,arguments)}}

/* Settings → About: where the data comes from and the licences */
function sourcesSheet(){pushSheet(`<h2>Data sources and licences</h2><div class="stack">
  <div class="tile small"><div style="font-weight:800;margin-bottom:6px">Australian Food Composition Database</div>
  Generic foods marked "Australian average" come from the Australian Food Composition Database – Release 3, © Food Standards Australia New Zealand (FSANZ), used under the <a href="https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement" target="_blank" rel="noopener">AFCD Data User Licence</a>, which is based on Creative Commons Attribution-ShareAlike 3.0 Australia.
  <p style="margin:8px 0 0">Apex changed the data: energy is converted from kJ to kcal, values are rounded and only some nutrients are kept. The changed copy is under the same licence. FSANZ does not endorse Apex.</p>
  <p style="margin:8px 0 0">The data is based on Australian foods and may not suit use in other countries. Values are averages for that kind of food, so a particular brand, cut or recipe can differ. The data is provided as is, without warranty.</p></div>
  <div class="tile small"><div style="font-weight:800;margin-bottom:6px">Open Food Facts</div>Packaged products and barcodes come from <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a>, a volunteer database under the Open Database Licence.</div>
  <div class="tile small"><div style="font-weight:800;margin-bottom:6px">USDA FoodData Central</div>The backup search uses the US Department of Agriculture's FoodData Central, which is in the public domain.</div>
  <div class="tile small"><div style="font-weight:800;margin-bottom:6px">Other parts</div>Barcode reading uses ZXing (Apache 2.0). The Nunito font is under the SIL Open Font Licence.</div>
  </div>`,'sources')}
function afcdAction(a){if(a==='sources'){sourcesSheet();return true}return false}
