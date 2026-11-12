(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if ($('.hero')) { // homepage only
/* ---------- products (from the approved design; photos exported from Figma) ---------- */
const P = {
  '59A': ['TJ 837', 'Black RG', 'Metal-TR combination'],
  '61A': ['TR ZC 808', 'Black RG', 'Metal-TR combination'],
  '63A': ['TR ZC 809', 'Choko RG', 'Metal-TR combination'],
  '58A': ['TR P 5029', 'Clear Black', 'HD acetate'],
  '47A': ['1003', 'Black Titanium', 'Titanium'],
  '48A': ['1003', 'Black Titanium RG', 'Titanium'],
  '49A': ['1003', 'Black Titanium S', 'Titanium'],
  '60A': ['TJ 837', 'Green S', 'Metal-TR combination'],
  '62A': ['TR ZC 808', 'Pink RG', 'Metal-TR combination'],
  '67A': ['2052', 'Brown Tiger Gold', 'Metal-TR combination'],
  '59E': ['TJ 837', 'Black RG', 'Metal-TR combination'],
  '61E': ['TR ZC 808', 'Black RG', 'Metal-TR combination'],
};
/* ponytail: tab lists are hand-picked from the 12 frames above. Wire them to the live shop
   (buydb.in WooCommerce: /wp-json/wc/store/v1/products?orderby=popularity etc.) before launch. */
const LISTS = {
  recent: ['59A', '61A', '63A', '58A'],
  latest: ['47A', '48A', '49A', '60A', '62A', '67A', '59E', '61E'],
  best: ['59A', '47A', '61A', '67A', '58A', '49A', '63A', '60A'],
  featured: ['47A', '48A', '49A', '58A', '67A', '63A', '62A', '61A'],
  reviews: ['67A', '59A', '47A', '62A', '61E', '48A', '58A', '60A'],
  seasonal: ['62A', '60A', '63A', '67A', '58A', '49A', '59E', '61E'],
};
// homepage photos are named after the store's upload ids; map them to catalog.json slugs
const SLUG = { '59A': 'tj-837-black-rg', '61A': 'tr-zc-808-black-rg', '63A': 'tr-zc-809-choko-rg', '58A': 'tr-p-5029-clear-balck', '47A': '1003-black-titanium',
  '48A': '1003-black-titanium-rg', '49A': '1003-black-titanium-s', '60A': 'tj-837-green-s', '62A': 'tr-zc-808-pink-rg', '67A': '2052-brown-tiger-gold',
  '59E': 'tj-837-black-rg', '61E': 'tr-zc-808-black-rg' };
const card = id => {
  const [n, c, m] = P[id];
  const url = `product.html?p=${SLUG[id]}`;
  const wa = 'https://wa.me/914843160620?text=' + encodeURIComponent(`Hello, I'd like to know more about the De Bril ${n} (${c}).`);
  // photo link is a mouse shortcut only; keyboard users get the name link + the two CTA buttons
  return `<li class="card">
    <div class="ph"><a class="ph-a" href="${url}" tabindex="-1" aria-hidden="true"><img src="img/${id}.webp" alt="" width="800" height="800" loading="lazy"></a>
      <div class="cta"><a class="cta-v" href="${url}" aria-label="View ${n}, ${c}">View frame <i aria-hidden="true">→</i></a><a class="cta-w" href="${wa}" target="_blank" rel="noopener" aria-label="Enquire about ${n}, ${c} on WhatsApp">Enquire</a></div></div>
    <a class="tx" href="${url}"><b>${n}</b><span>${c}</span><small>${m}</small><em class="tx-more" aria-hidden="true">View frame →</em></a></li>`;
};
const fill = (ul, key) => { ul.innerHTML = LISTS[key].map(card).join(''); };
fill($('[data-list=recent]'), 'recent');
const latest = $('[data-list=latest]');
fill(latest, 'latest');

const tabs = $$('.tabs [role=tab]');
const pick = btn => {
  if (btn.getAttribute('aria-selected') === 'true') return;
  tabs.forEach(t => { const on = t === btn; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  const key = btn.dataset.tab === 'recent' ? 'latest' : btn.dataset.tab;
  if (reduced) return fill(latest, key);
  latest.classList.add('is-swapping');
  setTimeout(() => { fill(latest, key); latest.classList.remove('is-swapping'); }, 220);
};
tabs.forEach((t, i) => {
  t.tabIndex = i ? -1 : 0;
  t.addEventListener('click', () => pick(t));
  t.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); pick(n);
  });
});

/* ---------- collection rail: arrows + progress line ---------- */
const bar = $('.rail-bar i'), [prev, next] = $$('.rail-btn');
const railSync = () => {
  const max = latest.scrollWidth - latest.clientWidth, vis = latest.clientWidth / latest.scrollWidth;
  bar.style.setProperty('--w', (vis * 100).toFixed(1) + '%');
  bar.style.setProperty('--x', (max ? latest.scrollLeft / max * (1 / vis - 1) * 100 : 0).toFixed(1) + '%');
  prev.disabled = latest.scrollLeft < 4; next.disabled = latest.scrollLeft > max - 4;
};
[prev, next].forEach(b => b.addEventListener('click', () => latest.scrollBy({ left: +b.dataset.dir * latest.querySelector('.card').offsetWidth * 2, behavior: reduced ? 'auto' : 'smooth' })));
latest.addEventListener('scroll', railSync, { passive: true });
addEventListener('resize', railSync);
new MutationObserver(() => { latest.scrollLeft = 0; railSync(); }).observe(latest, { childList: true });
railSync();

/* ---------- hero slider: 7s per slide, pauses on hover/focus and when the tab is hidden ---------- */
const hero = $('.hero'), slides = $$('.slide', hero), dots = $$('.dashes [role=tab]', hero), num = $('.count b', hero);
const DUR = 7000;
let cur = 0, timer = 0, left = DUR, started = 0;
const show = i => {
  cur = (i + slides.length) % slides.length;
  slides.forEach((s, k) => { const on = k === cur; s.classList.toggle('is-on', on); s.inert = !on; });
  dots.forEach((d, k) => d.setAttribute('aria-selected', k === cur));
  num.textContent = String(cur + 1).padStart(2, '0');
  // restart the dash fill animation
  const i2 = dots[cur].firstElementChild; i2.style.animation = 'none'; void i2.offsetWidth; i2.style.animation = '';
  left = DUR; play();
};
const play = () => { if (reduced) return; clearTimeout(timer); started = Date.now(); timer = setTimeout(() => show(cur + 1), left); };
const pause = () => { clearTimeout(timer); left -= Date.now() - started; hero.classList.add('is-paused'); };
const resume = () => { hero.classList.remove('is-paused'); play(); };
hero.style.setProperty('--dur', DUR + 'ms');
dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
hero.addEventListener('mouseenter', pause); hero.addEventListener('mouseleave', resume);
hero.addEventListener('focusin', pause); hero.addEventListener('focusout', resume);
document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
// swipe on touch screens
let x0 = null;
hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
hero.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
play();

/* ---------- hero → billboard curtain, damped ----------
   Scroll sets a target; every frame the values ease 8% of the way towards it, so the
   billboard drifts in slowly and settles instead of tracking the wheel 1:1. */
const board = $('.board');
if (board) {
  new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting) { board.classList.add('is-in'); io.disconnect(); } }), { threshold: .2 }).observe(board);
  const head = $('.head'), EASE = .08;
  let covered = false, raf = 0;
  const now = { p: 0, d: 0 }, goal = { p: 0, d: 0 };
  const measure = () => {
    const r = board.getBoundingClientRect(), vh = innerHeight;
    goal.p = Math.min(1, Math.max(0, 1 - (r.top - head.offsetHeight) / hero.offsetHeight)); // how much of the hero is covered
    goal.d = Math.min(1, Math.max(-1, (r.top + r.height / 2 - vh / 2) / vh));               // billboard centre vs screen centre
  };
  const tick = () => {
    now.p += (goal.p - now.p) * EASE; now.d += (goal.d - now.d) * EASE;
    hero.style.setProperty('--p', now.p.toFixed(4));
    board.style.setProperty('--d', now.d.toFixed(4));
    // stop the slider while the hero is hidden under the page
    if (now.p > .995 && !covered) { covered = true; pause(); } else if (now.p < .99 && covered) { covered = false; resume(); }
    raf = Math.abs(goal.p - now.p) + Math.abs(goal.d - now.d) > .0005 ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { measure(); raf ||= requestAnimationFrame(tick); };
  if (!reduced) { addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); kick(); }
}
}

/* ---------- menu drawer + search overlay ---------- */
let opener = null;
const open = (sheet, btn) => {
  opener = btn; sheet.hidden = false; btn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('is-open')));
  ($('input[type=search]', sheet) || $('a,button', $('.sheet-panel', sheet))).focus();
};
const close = sheet => {
  sheet.classList.remove('is-open'); document.body.style.overflow = '';
  if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); }
  setTimeout(() => { sheet.hidden = true; }, reduced ? 0 : 450);
};
$$('[data-open]').forEach(b => b.addEventListener('click', () => { const s = $('#' + b.dataset.open); s.hidden ? open(s, b) : close(s); }));
$$('.sheet').forEach(s => {
  $$('[data-close]', s).forEach(c => c.addEventListener('click', () => close(s)));
  s.addEventListener('keydown', e => {
    if (e.key === 'Escape') return close(s);
    if (e.key !== 'Tab') return;
    const f = $$('a,button,input:not([type=hidden])', $('.sheet-panel', s)); // keep focus inside
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  });
});

/* shop-by-wearer tiles: arrow keys move between them */
const tiles = $$('.g-tile');
tiles.forEach((t, i) => t.addEventListener('keydown', e => {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (d) { e.preventDefault(); tiles[(i + d + tiles.length) % tiles.length].focus(); }
}));
})();
