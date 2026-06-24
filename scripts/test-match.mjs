import fs from 'node:fs';
const har = JSON.parse(fs.readFileSync('.cache/haravan-products.json','utf8'));

// crude CSV parse
function parseCSV(t){
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){ if(c==='"'){ if(t[i+1]==='"'){cur+='"';i++;} else q=false;} else cur+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(cur);cur='';} else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur='';} else if(c==='\r'){} else cur+=c; }
  }
  if(cur!==''||row.length){row.push(cur);rows.push(row);}
  return rows;
}
const csv = parseCSV(fs.readFileSync('.cache/kol.csv','utf8'));
const header = csv[0];
const rows = csv.slice(1).filter(r=>r[1] && r[1].trim() && r[2] && r[2].trim());
console.log('KOL rows:', rows.length);

// model code extractor: token with letters+digits, len>=5
function models(name){
  const toks = name.toUpperCase().match(/[A-Z0-9]{5,}/g)||[];
  return toks.filter(t=>/[A-Z]/.test(t)&&/[0-9]/.test(t)&&!/^\d+CM$|^\d+W$|^\d+ML$|^\d+L$/.test(t));
}

let byModel=0, byCmmf=0, byNone=0, multi=0;
const unmatched=[];
for(const r of rows){
  const cmmf=r[1].trim(), name=r[2].trim();
  const ms=models(name);
  // try model code match in haravan title/handle/sku/barcode
  let hit=null;
  for(const m of ms){
    const cand=har.filter(h=>(h.title||'').toUpperCase().includes(m)||(h.handle||'').toUpperCase().includes(m.toLowerCase().toUpperCase()));
    if(cand.length){hit={by:'model',m,n:cand.length,t:cand[0].title};break;}
  }
  if(!hit){
    // try cmmf in barcode/sku/body
    const cand=har.filter(h=> h.variants.some(v=>(v.sku||'')===cmmf||(v.barcode||'')===cmmf) || (h.body_html||'').includes(cmmf));
    if(cand.length){hit={by:'cmmf',m:cmmf,n:cand.length,t:cand[0].title};}
  }
  if(hit){ if(hit.by==='model')byModel++; else byCmmf++; if(hit.n>1)multi++; }
  else { byNone++; unmatched.push({cmmf,name,ms}); }
}
console.log({byModel,byCmmf,byNone,multi});
console.log('--- UNMATCHED ---');
unmatched.forEach(u=>console.log(u.cmmf,'|',u.name,'| models:',u.ms.join(',')));
