
const grid = document.getElementById('grid');
const filters = Array.from(document.querySelectorAll('.filter-card'));
const marketSel = document.getElementById('market');
const search = document.getElementById('search');
const alertBox = document.getElementById('alert');

let CATALOG = null;
let activeType = 'iphone';

filters.forEach(btn=>btn.onclick=()=>{
  filters.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  activeType = btn.dataset.type;
  render();
});

marketSel.onchange = async ()=>{
  await loadCatalog();
  render();
};
search.oninput = ()=> render();

function starString(rating){
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5-full);
}

function priceFormat(v, cur){
  const s = Number(v||0).toLocaleString('pt-PT');
  return s + ' ' + (cur==='AOA'?'Kz':cur);
}


function formatModel(name){
  if(!name) return '';
  let s = String(name).trim();

  // Detect family at the beginning
  const familyMatch = s.match(/^\s*(iphone|mac\s*book|macbook|ipad)/i);
  if(familyMatch){
    const fam = familyMatch[1].toLowerCase().replace(/\s+/g,'');
    if(fam === 'iphone'){
      s = s.replace(/^\s*iphone/i, 'iPhone');
    }else if(fam === 'macbook' || fam === 'macbook'){
      // normalize any "mac book" or "macbook" to MacBook
      s = s.replace(/^\s*mac\s*book/i, 'MacBook')
           .replace(/^\s*macbook/i, 'MacBook');
      // specialize MacBook Air/Pro if present
      s = s.replace(/^MacBook\s*air/i, 'MacBook Air')
           .replace(/^MacBook\s*pro/i, 'MacBook Pro');
    }else if(fam === 'ipad'){
      s = s.replace(/^\s*ipad/i, 'iPad')
           .replace(/^iPad\s*pro/i, 'iPad Pro')
           .replace(/^iPad\s*air/i, 'iPad Air');
    }
  }else{
    // No family found at start; keep string as-is to avoid wrong prefixes.
  }

  // Token mapping for proper casing
  const TOK_MAP = {
    'pro':'Pro','max':'Max','plus':'Plus','mini':'mini','air':'Air',
    'se':'SE','ultra':'Ultra','promax':'Pro Max','gb':'GB','tb':'TB'
  };

  // Split by spaces, preserve separators
  const parts = s.split(/(\s+)/);
  for(let i=0;i<parts.length;i++){
    // skip pure spaces
    if(/^\s+$/.test(parts[i])) continue;
    const raw = parts[i].replace(/[^a-z0-9]/ig,'');
    const low = raw.toLowerCase();

    if(/^iphone$/i.test(parts[i])) { parts[i] = 'iPhone'; continue; }
    if(/^mac\s*book$/i.test(parts[i])) { parts[i] = 'MacBook'; continue; }
    if(/^macbook$/i.test(parts[i])) { parts[i] = 'MacBook'; continue; }
    if(/^ipad$/i.test(parts[i])) { parts[i] = 'iPad'; continue; }

    if(TOK_MAP[low]){
      parts[i] = parts[i].replace(raw, TOK_MAP[low]);
      continue;
    }

    // Numbers unchanged; others Title Case
    if(/^\d+$/.test(raw)) continue;
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase();
  }

  // Merge "Mac Book" if split across tokens
  const joinOnce = parts.join('');
  // If still contains "Mac Book" separated by a space, fix it
  let out = parts.join('');
  out = out.replace(/\bMac\s+Book\b/g, 'MacBook');

  return out;
}
function whatsappLink(p, state, displayPrice){
  const msg = `Olá! Quero este produto:%0A` +
              `Modelo: ${p.model}%0A` +
              `Condição: ${state.cond}%0A` +
              `Armazenamento: ${state.gb} GB%0A` +
              `Cor: ${state.color}%0A` +
              `Preço: ${displayPrice}`;
  // Coloque o teu número abaixo (com código do país, sem +)
  const phone = '244936777484';
  return `https://wa.me/${phone}?text=${msg}`;
}

function computePrice(p, state){
  const vkey = `${p.model}|${state.cond}|${state.gb}|${CATALOG.market}`;
  const base = CATALOG.variants[vkey];
  if(!base) return null;
  const hex = state.color.toLowerCase();
  let key = 'default';
  if(hex.includes('d4af37')) key='gold';
  else if(hex.includes('0b1020')||hex.includes('000')) key='black';
  else if(hex.includes('e5e7eb')||hex.includes('fff')) key='white';
  else if(hex.includes('949494')) key='titanium';
  const pct = CATALOG.colorMods[key] ?? CATALOG.colorMods.default ?? 0.05;
  const val = Math.round(base.price * (1+pct));
  return { val, cur: base.currency };
}

function render(){
  if(!CATALOG){ grid.innerHTML=''; return; }
  const q = (search.value||'').toLowerCase();
  const prods = CATALOG.products.filter(p => p.type===activeType && p.model.toLowerCase().includes(q));
  grid.innerHTML='';
  prods.forEach(p=> grid.appendChild(card(p)));
}

function card(p){
  const el = document.createElement('div');
  el.className = 'card';

  // media
  const media = document.createElement('div');
  media.className = 'media';
  const img = document.createElement('img');
  img.src = p.image;
  img.onerror = ()=>{ img.src='/public/assets/placeholder.png'; };
  media.appendChild(img);
  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.textContent = p.type==='iphone' ? 'Desbloqueado para todas operadoras' : '';
  media.appendChild(badge);

  // content
  const ct = document.createElement('div');
  ct.className = 'content';

  const kicker = document.createElement('div');
  kicker.className = 'kicker';
  kicker.textContent = 'Apple';
  ct.appendChild(kicker);

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = formatModel(p.model);
  ct.appendChild(title);

  const stars = document.createElement('div');
  stars.className = 'stars';
  stars.innerHTML = starString(p.rating) + ` <span class=\"reviews-count\">(${Math.min(250,p.reviews)} – Feedbacks)</span>`;
  ct.appendChild(stars);

  const priceEl = document.createElement('div');
  priceEl.className = 'price';
  const starting = document.createElement('div');
  starting.className = 'starting';
  starting.innerHTML = '<i>Desde</i>';
  const oldPriceEl = document.createElement('div');
  oldPriceEl.className = 'price-old';


  const priceBlock = document.createElement('div');
  priceBlock.className = 'price-block';
  priceBlock.appendChild(starting);
  priceBlock.appendChild(oldPriceEl);
  priceBlock.appendChild(priceEl);
  ct.appendChild(priceBlock);

  const state = {
    cond: (p.storages.usado.length ? 'usado' : 'novo'),
    gb: (p.storages.usado[0] || p.storages.novo[0]),
    color: (p.colors[0] || '#0b1020')
  };

  // condition row
  const rowCond = document.createElement('div');
  rowCond.className = 'row';
  ['usado','novo'].forEach(cond=>{
    const enabled = cond==='usado' ? p.storages.usado.length>0 : p.storages.novo.length>0;
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = cond==='usado' ? 'Usado' : 'Novo';
    if(!enabled){ b.disabled = true; b.style.opacity=.4; }
    b.onclick = ()=>{ if(enabled){ state.cond=cond; state.gb = (cond==='usado'?p.storages.usado[0]:p.storages.novo[0]); update(); } };
    rowCond.appendChild(b);
  });
  ct.appendChild(rowCond);
  const deliveryBadge = document.createElement('div');
  deliveryBadge.className = 'delivery-badge';
  deliveryBadge.textContent = 'Entrega imediata em Angola';
  deliveryBadge.style.display = 'none';
  ct.appendChild(deliveryBadge);

  // storage row
  const rowGB = document.createElement('div');
  rowGB.className = 'row';
  function drawGB(){
    rowGB.innerHTML='';
    const list = state.cond==='usado' ? p.storages.usado : p.storages.novo;
    list.forEach(gb=>{
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = `${gb} GB`;
      b.onclick = ()=>{ state.gb=gb; update(); };
      if(gb===state.gb) b.classList.add('active');
      rowGB.appendChild(b);
    });
  }
  drawGB();
    try { deliveryBadge.style.display = (state.cond==='novo') ? 'inline-block' : 'none'; } catch(e) {}
  ct.appendChild(rowGB);

  // colors row (max 4)
  const rowColors = document.createElement('div');
  rowColors.className = 'dots';
  p.colors.slice(0,4).forEach(hex=>{
    const d = document.createElement('div');
    d.className = 'dot';
    d.style.background = hex;
    d.onclick = ()=>{ state.color = hex; update(); };
    rowColors.appendChild(d);
  });
  ct.appendChild(rowColors);

  // buy button
  const buy = document.createElement('a');
  buy.className = 'buy';
  buy.textContent = 'Encomendar no WhatsApp';
buy.textContent = 'Encomendar no WhatsApp';
  buy.target = '_blank';
  ct.appendChild(buy);

  el.appendChild(media);
  el.appendChild(ct);

  function update(){
    // toggle cond active
    Array.from(rowCond.children).forEach(b=>{
      const is = (b.textContent.toLowerCase()===(state.cond==='usado'?'usado':'novo'));
      b.classList.toggle('active', is);
    });
    drawGB();
    try { deliveryBadge.style.display = (state.cond==='novo') ? 'inline-block' : 'none'; } catch(e) {}
    // colors active
    Array.from(rowColors.children).forEach(d=>{
      d.classList.toggle('active', d.style.background.toLowerCase()===state.color.toLowerCase());
    });
    // price
    const pr = computePrice(p, state);
    if(!pr){
      priceEl.textContent = 'Indisponível';
      buy.href = '#';
      buy.style.opacity = .5;
      buy.onclick = (e)=> e.preventDefault();
    }else{
      const txt = priceFormat(pr.val, pr.cur);
      priceEl.textContent = txt;
      buy.href = whatsappLink(p, state, txt);
      buy.style.opacity = 1;
    }
  }
  update();
  return el;
}

// load placeholder
fetch('/public/assets/placeholder.png').catch(()=>{});

async function loadCatalog(){
  alertBox.classList.add('hidden');
  try{
    const res = await fetch(`/api/catalog?market=${marketSel.value}`);
    if(!res.ok) throw new Error(`${res.status}`);
    CATALOG = await res.json();
  }catch(e){
    CATALOG = null;
    alertBox.textContent = `Falha ao carregar o catálogo: ${e.message||e}`;
    alertBox.classList.remove('hidden');
  }
}

(async ()=>{
  await loadCatalog();
  render();
})();


// --- Categoria: filtro baseado em 'category' retornado pela API (sem mudar tema) ---
const CATEGORY_MAP = {
  'iphones':'iPhones',
  'macbooks':'MacBooks',
  'ipads':'iPads',
  'acessórios':'Acessórios',
  'acessorios':'Acessórios'
};

function applyCategoryFilter(list, selectedKey){
  if(!selectedKey) return list;
  const cat = CATEGORY_MAP[selectedKey.toLowerCase()] || selectedKey;
  return list.filter(p => (p.category || '').toLowerCase() === String(cat).toLowerCase());
}

// Hook: se já existirem tabs, usamos o texto da tab como chave
(function bindCategoryTabs(){
  const tabs = document.querySelectorAll('[data-tab], .tabs button, .tabs .btn');
  if(!tabs.length) return;
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = (btn.dataset.tab || btn.textContent || '').trim();
      window.__selectedCategory = key;
      render();
    });
  });
})();

// Patch no render para considerar categoria
const __origRender = typeof render === 'function' ? render : null;
if(__origRender){
  window.render = function(){
    let list = window.__catalogProducts || [];
    if (window.__selectedCategory) {
      list = applyCategoryFilter(list, window.__selectedCategory);
    }
    // delega para o render original se ele aceitar lista, senão sobrescrevemos pipeline
    try { return __origRender(list); } catch(e){ /* fallback */ }
  }
}
