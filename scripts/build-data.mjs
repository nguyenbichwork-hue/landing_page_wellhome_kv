import fs from 'node:fs';
const har = JSON.parse(fs.readFileSync('.cache/haravan-products.json','utf8'));

function parseCSV(t){const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){ if(c==='"'){ if(t[i+1]==='"'){cur+='"';i++;} else q=false;} else cur+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(cur);cur='';} else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur='';} else if(c==='\r'){} else cur+=c; } }
  if(cur!==''||row.length){row.push(cur);rows.push(row);}
  return rows;}

const noDia = s => (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d');

// Phân loại nhóm SP theo TÊN (cột CAT trong file bị gán lộn xộn nên không tin cậy).
// Thứ tự kiểm tra quan trọng: từ cụ thể -> chung.
function classifyCategory(name){
  const n = noDia(name).toLowerCase();
  if (/ban ui|ixeo/.test(n)) return 'Chăm sóc quần áo';
  if (/hut bui|lau san|lau nha|\brobot\b/.test(n)) return 'Vệ sinh nhà cửa';
  if (/may xay|may ep|vat cam|xay sinh to|may danh trung/.test(n)) return 'Chế biến thực phẩm';
  if (/binh dun|sieu toc|am dun|may pha/.test(n)) return 'Đồ uống';
  if (/\bdao\b|ke dao/.test(n)) return 'Dao & Dụng cụ bếp';
  // "bếp từ/điện" CHỈ tính khi là thiết bị (đứng đầu tên), tránh "...dùng cho bếp từ" (vẫn là nồi/chảo)
  if (/^bep (tu|dien|hong ngoai|ga)/.test(n)) return 'Nấu nướng điện';
  if (/noi chien|noi com|ap suat dien|multicooker|cao tan/.test(n)) return 'Nấu nướng điện';
  if (/chao|\bnoi\b|quanh|\bvi\b/.test(n)) return 'Nồi & Chảo';
  return 'Khác';
}
const STOP = new Set(['tefal','bosch','smeg','cm','mau','dung','cho','bep','tu','va','2','3','1','bo','mon','inox','l','w','ml','-']);
const norm = s => noDia(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const tokens = s => norm(s).split(' ').filter(t=>t.length>1 && !STOP.has(t));
function models(name){
  const toks = name.toUpperCase().match(/[A-Z0-9]{5,}/g)||[];
  return toks.filter(t=>/[A-Z]/.test(t)&&/[0-9]/.test(t)&&!/^\d+(CM|W|ML|L)$/.test(t));
}
function nameScore(a,b){
  const A=new Set(tokens(a)), B=tokens(b);
  if(!A.size||!B.length) return 0;
  let hit=0; for(const t of B) if(A.has(t)) hit++;
  return hit / Math.max(A.size, B.length);
}
const sizes = s => [...new Set((noDia(s).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(cm|l|w|ml)\b/g)||[]).map(x=>x.replace(/\s+/g,'')))];
function sizeAdjust(kolName, harTitle){
  const a=sizes(kolName), b=sizes(harTitle);
  if(!a.length||!b.length) return 0;
  const inter=a.filter(x=>b.includes(x));
  return inter.length ? 150 : -500;   // sizes agree -> bonus, conflict -> strong penalty
}

const csv = parseCSV(fs.readFileSync('.cache/kol.csv','utf8'));
const rows = csv.slice(1).filter(r=>r[1]&&r[1].trim()&&r[2]&&r[2].trim());
const money = s => parseInt(String(s).replace(/[^\d]/g,''),10)||0;
const pct = s => parseInt(String(s).replace(/[^\d]/g,''),10)||0;

const products=[]; const report=[];
for(const r of rows){
  const note=r[0]?.trim(), cmmf=r[1].trim(), name=r[2].trim(), brand=(r[3]||'').trim(), cat=(r[4]||'').trim();
  const rsp=money(r[6]), kol=money(r[7]), disc=pct(r[8]), stock=parseInt(r[9],10)||0;
  const ms=models(name);
  let best=null;
  for(const h of har){
    let score=0, by=[];
    const titleU=(h.title||'').toUpperCase(), handleU=(h.handle||'').toUpperCase();
    if(h.variants.some(v=>(v.sku||'')===cmmf||(v.barcode||'')===cmmf)){score+=1000;by.push('code');}
    if((h.body_html||'').includes(cmmf)){score+=500;by.push('body');}
    for(const m of ms){ if(titleU.includes(m)||handleU.includes(m)){score+=400;by.push('model:'+m);break;} }
    const ns=nameScore(h.title, name); score += ns*300;
    score += sizeAdjust(name, h.title);
    if(!best||score>best.score) best={h,score,by,ns};
  }
  const matched = best && best.score>=200 && (best.h.images||[]).length>0
    && (best.by.length>0 || best.ns>=0.6);
  const h = matched? best.h : null;
  report.push({cmmf,name,score:Math.round(best?.score||0),by:(best?.by||[]).join('+'),ns:+(best?.ns||0).toFixed(2),har:h?.title||'—'});
  products.push({
    id: cmmf,
    cmmf, name, brand: brand||'TEFAL',
    category: classifyCategory(name),
    catRaw: cat,
    rspPrice: rsp, kolPrice: kol, discountPct: disc, stock,
    badge: note||'',
    haravanId: h?.id||null,
    handle: h?.handle||null,
    variantId: h?.variants?.[0]?.id||null,
    images: h?.images||[],
    productType: h?.product_type||cat,
    descriptionHtml: h?.body_html||'',
    matched: !!matched,
    matchScore: Math.round(best?.score||0),
  });
}
fs.mkdirSync('src/data',{recursive:true});
fs.writeFileSync('src/data/products.json', JSON.stringify(products,null,2));
console.log('Total:',products.length,'matched:',products.filter(p=>p.matched).length,'no-image:',products.filter(p=>!p.images.length).length);
console.log('\n=== LOW CONFIDENCE / REVIEW (score<450 or no image) ===');
report.filter((r,i)=>r.score<450||!products[i].images.length).forEach(r=>console.log(r.score,'|',r.by,'ns'+r.ns,'|',r.name,'\n     ->',r.har));
