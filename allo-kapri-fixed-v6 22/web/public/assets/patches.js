
// === Allô Kapri Patches: busca suave + destaque + preço AOA ===
(function(){
  const grid = document.getElementById('grid');
  const search = document.getElementById('search');

  function formatAOA(value){
    if(value == null) return '';
    const n = Number(String(value).replace(/[^\d.-]/g,''));
    const v = Number.isFinite(n) ? n : 0;
    try{
      return new Intl.NumberFormat('pt-AO', { style:'currency', currency:'AOA', maximumFractionDigits:0 }).format(v);
    }catch(e){
      // Fallback
      return 'Kz ' + (v.toLocaleString('pt-PT'));
    }
  }

  // Debounce
  function debounce(fn, delay){
    let t; 
    return (...args)=>{
      clearTimeout(t);
      t = setTimeout(()=>fn.apply(null,args), delay);
    };
  }

  function clearHighlights(el){
    // unwrap <mark>
    el.querySelectorAll('mark.__ak').forEach(m=>{
      const text = document.createTextNode(m.textContent || '');
      m.replaceWith(text);
    });
  }

  function highlightText(el, query){
    if(!query) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    const texts = [];
    let node; 
    while(node = walker.nextNode()){
      const t = node.nodeValue;
      if(!t || !t.trim()) continue;
      const idx = t.toLowerCase().indexOf(query.toLowerCase());
      if(idx !== -1) texts.push(node);
    }
    texts.forEach(node=>{
      const t = node.nodeValue;
      const q = query;
      const parts = [];
      let i = 0, last = 0;
      const low = t.toLowerCase();
      while((i = low.indexOf(q.toLowerCase(), last)) !== -1){
        parts.push(document.createTextNode(t.slice(last, i)));
        const mark = document.createElement('mark');
        mark.className = '__ak';
        mark.textContent = t.slice(i, i+q.length);
        parts.push(mark);
        last = i + q.length;
      }
      parts.push(document.createTextNode(t.slice(last)));
      const frag = document.createDocumentFragment();
      parts.forEach(p=>frag.appendChild(p));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function applyPriceFormatting(scope){
    const root = scope || document;
    root.querySelectorAll('.price').forEach(el=>{
      const raw = el.getAttribute('data-price') || el.textContent;
      // avoid double-formatting
      if(/Kz|AOA|AO\s/.test(el.textContent)) return;
      el.textContent = formatAOA(raw);
    });
  }

  function filterAndHighlight(){
    if(!grid) return;
    const q = (window.__akQuery || '').trim().toLowerCase();
    const cards = Array.from(grid.querySelectorAll('.card'));
    cards.forEach(card=>{
      // Clear previous highlights
      const titleEl = card.querySelector('.title, h3');
      const contentEl = card.querySelector('.content');
      if(titleEl) clearHighlights(titleEl);
      if(contentEl) clearHighlights(contentEl);
      if(!q){
        card.style.display = '';
        return;
      }
      const title = card.querySelector('.title, h3') || card;
      const hay = (title.textContent || '').toLowerCase();
      const show = hay.includes(q);
      card.style.display = show ? '' : 'none';
      if(show){
        highlightText(title, q);
      }
    });
    applyPriceFormatting(grid);
  }

  const runFilter = debounce(()=>{
    window.__akQuery = (search && search.value) || '';
    filterAndHighlight();
  }, 300);

  if(search){
    search.addEventListener('input', runFilter, { passive: true });
  }

  // React to grid changes (renders) with guard + throttle
  if(grid){
    let busy = false;
    let rafId = null;
    const mo = new MutationObserver((mutations)=>{
      // Ignore mutations we cause ourselves (highlighting)
      if(busy) return;
      // Throttle to next frame
      if(rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(()=>{
        busy = true;
        try{
          // Only re-run when children count changes (avoid loops from text node tweaks)
          if(mutations.some(m=>m.type==='childList')){
            filterAndHighlight();
          } else {
            // still ensure prices stay formatted
            applyPriceFormatting(grid);
          }
        } finally {
          busy = false;
        }
      });
    });
    mo.observe(grid, { childList: true }); // no subtree to avoid loops
  }

  // Initial
  applyPriceFormatting(document);
  filterAndHighlight();
})();
