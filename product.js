/* Product details: product.html?p=<slug from catalog.json>. Gallery with thumbnails, hover zoom and arrow keys;
   specs; enquiry actions; other colours of the same model; more frames of the same shape. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const wa = it => 'https://wa.me/914843160620?text=' + encodeURIComponent(`Hello, I'd like to know more about the De Bril ${it.m} (${it.c}). Which optician near me has it?`);
const url = it => `product.html?p=${encodeURIComponent(it.id)}`;
const wearer = g => g === 'Unisex' ? 'Unisex' : g + '’s';

const card = it => `<li class="card">
  <div class="ph"><a class="ph-a" href="${url(it)}" tabindex="-1" aria-hidden="true"><img src="${it.i[0]}" alt="" width="450" height="450" loading="lazy">${it.i[1] ? `<img class="alt" src="${it.i[1]}" alt="" width="450" height="450" loading="lazy">` : ''}</a>${it.two ? '<span class="badge">2-in-1</span>' : ''}</div>
  <a class="tx" href="${url(it)}"><b>${esc(it.m)}</b><span>${esc(it.c)}</span><small>${esc(it.sh)} · ${esc(it.mt)}</small></a></li>`;

fetch('catalog.json', { cache: 'no-cache' }).then(r => r.json()).then(all => {
  const id = new URLSearchParams(location.search).get('p');
  const it = all.find(x => x.id === id);
  if (!it) { $('#pd').hidden = true; $('#pd-missing').hidden = false; return; }
  document.title = `${it.m} ${it.c} · De Bril`;

  /* ---------- gallery ---------- */
  const imgs = it.f.length ? it.f : it.i;
  const main = $('#pd-img'), stage = $('.pd-stage'), counter = $('#pd-count');
  let cur = 0;
  const go = i => {
    cur = (i + imgs.length) % imgs.length;
    main.src = imgs[cur];
    main.alt = `${it.m} in ${it.c}, view ${cur + 1} of ${imgs.length}`;
    counter.textContent = `${String(cur + 1).padStart(2, '0')} / ${String(imgs.length).padStart(2, '0')}`;
    $$('.pd-thumbs button').forEach((b, k) => b.setAttribute('aria-current', k === cur));
  };
  $('.pd-thumbs').innerHTML = imgs.map((s, k) => `<li><button type="button" aria-label="View ${k + 1}"><img src="${s}" alt="" width="450" height="450"></button></li>`).join('');
  $$('.pd-thumbs button').forEach((b, k) => b.addEventListener('click', () => go(k)));
  $$('.pd-arrow').forEach(b => b.addEventListener('click', () => go(cur + +b.dataset.dir)));
  stage.addEventListener('keydown', e => { const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (d) { e.preventDefault(); go(cur + d); } });
  // hover zoom (mouse only): the photo scales up and follows the pointer
  stage.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.target.closest('.pd-arrow')) return stage.classList.remove('is-zoom');
    const r = stage.getBoundingClientRect();
    main.style.transformOrigin = `${((e.clientX - r.left) / r.width * 100).toFixed(1)}% ${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`;
    stage.classList.add('is-zoom');
  });
  stage.addEventListener('pointerleave', () => stage.classList.remove('is-zoom'));
  // swipe on touch
  let x0 = null;
  stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); x0 = null; });
  if (imgs.length < 2) $$('.pd-arrow, .pd-thumbs').forEach(n => n.hidden = true);
  go(0);

  /* ---------- details ---------- */
  $('#pd-kick').innerHTML = `<a href="shop.html">Frames</a><span aria-hidden="true">/</span><a href="shop.html?gender=${encodeURIComponent(it.g)}">${esc(wearer(it.g))}</a>`;
  $('#pd-h').textContent = it.m;
  $('#pd-col').textContent = it.c;
  $('#pd-badge').hidden = !it.two;
  $('#pd-lede').textContent = it.two
    ? 'An optical frame with a magnetic sun clip. Imported and selected for De Bril.'
    : 'Imported and selected for De Bril, in ' + it.mt.toLowerCase() + '.';
  const spec = [['Shape', it.sh, `shop.html?shape=${encodeURIComponent(it.sh)}`], ['Material', it.mt, `shop.html?material=${encodeURIComponent(it.mt)}`],
    ['Colour', it.col, `shop.html?colour=${encodeURIComponent(it.col)}`], ['Wearer', it.g, `shop.html?gender=${encodeURIComponent(it.g)}`], ['Sun clip', it.two ? 'Magnetic, included' : 'No', '']];
  $('#pd-spec').innerHTML = spec.filter(([, v]) => v).map(([k, v, h]) => `<div><dt>${k}</dt><dd>${h ? `<a href="${h}">${esc(v)}</a>` : esc(v)}</dd></div>`).join('');
  $('#pd-wa').href = wa(it);
  $('#pd-store').href = it.u;

  /* ---------- other colours of this model ---------- */
  const sibs = all.filter(x => x.m === it.m && x.id !== it.id);
  if (sibs.length) {
    $('#pd-cols').hidden = false;
    $('#pd-cols ul').innerHTML = [it, ...sibs].map(x => `<li><a href="${url(x)}" ${x === it ? 'aria-current="page"' : ''} title="${esc(x.c)}"><img src="${x.i[0]}" alt="" width="450" height="450" loading="lazy"><span>${esc(x.c)}</span></a></li>`).join('');
  }

  /* ---------- more of the same shape ---------- */
  const more = all.filter(x => x.sh === it.sh && x.m !== it.m).slice(0, 4);
  if (more.length) {
    $('#pd-more').hidden = false;
    $('#pd-more h2').textContent = `More ${it.sh.toLowerCase()} frames`;
    $('#pd-more-all').href = `shop.html?shape=${encodeURIComponent(it.sh)}`;
    $('#pd-more ul').innerHTML = more.map(card).join('');
  }
}).catch(() => { $('#pd').hidden = true; $('#pd-missing').hidden = false; });
})();
