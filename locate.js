/* Find a stockist: the opticians that stock De Bril (stores.json), searchable, grouped by district,
   with a Google map (no API key, plain embed) that follows the selected optician. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const list = $('#slist'), pills = $('#dpills'), count = $('#scount'), empty = $('#sempty'), map = $('#smap'), mapCap = $('#smap-cap');
const q = $('#sq');
let ALL = [], dist = '', cur = -1;

const where = s => `${s.n}, ${s.a || s.p + ', ' + s.d}`;
const dir = s => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(where(s));
const embed = t => `https://maps.google.com/maps?q=${encodeURIComponent(t)}&z=${t === 'Kerala, India' ? 7 : 15}&output=embed`;
const tel = n => 'tel:' + n.replace(/[^\d+]/g, '').replace(/^0?(\d{10})$/, '+91$1');

const show = i => {
  cur = i;
  $$('.st', list).forEach(c => c.classList.toggle('is-on', +c.dataset.i === i));
  const s = ALL[i];
  const u = embed(s ? where(s) : 'Kerala, India');
  if (map.dataset.u !== u) { map.dataset.u = u; map.src = u; } // don't reload the map while typing
  mapCap.innerHTML = s ? `<b>${esc(s.n)}</b>${esc(s.p)}, ${esc(s.d)} · <a href="${dir(s)}" target="_blank" rel="noopener">Open in Google Maps ↗</a>` : `<b>${ALL.length} opticians</b>across Kerala`;
};

const render = () => {
  const t = q.value.trim().toLowerCase();
  const hit = ALL.map((s, i) => ({ s, i })).filter(({ s }) => (!dist || s.d === dist) && (!t || `${s.n} ${s.a} ${s.p} ${s.d}`.toLowerCase().includes(t)));
  const by = {};
  hit.forEach(h => (by[h.s.d] ||= []).push(h));
  list.innerHTML = Object.keys(by).sort().map(d => `<li class="sg"><h2>${esc(d)} <span>${by[d].length}</span></h2><ul>${by[d].map(({ s, i }) => `
    <li class="st" data-i="${i}">
      <button class="st-pick" type="button" aria-label="Show ${esc(s.n)} on the map"></button>
      <p class="st-place">${esc(s.p)}</p>
      <h3>${esc(s.n)}</h3>
      <p class="st-addr">${esc(s.a)}</p>
      <div class="st-acts">
        ${s.ph.map(n => `<a href="${tel(n)}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 3.5 8 7l-1.8 1.2a9 9 0 0 0 5.6 5.6L13 12l3.5 1.5V16a1.5 1.5 0 0 1-1.6 1.5A13.5 13.5 0 0 1 2.5 5.1 1.5 1.5 0 0 1 4 3.5Z"/></svg>${esc(n)}</a>`).join('')}
        <a href="${dir(s)}" target="_blank" rel="noopener"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2.5 7.5 7.5-7.5 7.5L2.5 10Z"/><path d="M8 11.5V9.5h4M10.5 8l1.5 1.5-1.5 1.5"/></svg>Directions</a>
      </div>
    </li>`).join('')}</ul></li>`).join('');
  count.textContent = `${hit.length} optician${hit.length === 1 ? '' : 's'}${t ? ` matching “${q.value.trim()}”` : ''}`;
  $('#res-h').textContent = dist ? `Opticians in ${dist}` : 'All opticians';
  empty.hidden = !!hit.length;
  $$('[data-d]', pills).forEach(b => b.setAttribute('aria-pressed', b.dataset.d === dist));
  const u = new URLSearchParams(); if (t) u.set('q', q.value.trim()); if (dist) u.set('district', dist);
  history.replaceState(null, '', u.toString() ? '?' + u : location.pathname);
  if (hit.length && !hit.some(h => h.i === cur)) show(hit[0].i); else if (!hit.length) show(-1); else show(cur);
};

list.addEventListener('click', e => {
  const c = e.target.closest('.st');
  if (c && !e.target.closest('a')) show(+c.dataset.i);
});
// results sit right under the band; scroll only if they're off-screen (phones)
const toResults = () => { if ($('#results').getBoundingClientRect().top > innerHeight * .7) $('#results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
pills.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) { dist = b.dataset.d; render(); toResults(); } });
q.addEventListener('input', render);
$('#sq-form').addEventListener('submit', e => { e.preventDefault(); render(); toResults(); });
$('#sreset').addEventListener('click', () => { q.value = ''; dist = ''; render(); q.focus(); });

fetch('stores.json').then(r => r.json()).then(d => {
  ALL = d;
  const n = {}; d.forEach(s => { n[s.d] = (n[s.d] || 0) + 1; });
  const chip = (k, label, c) => `<button type="button" data-d="${esc(k)}" aria-pressed="false">${esc(label)} <span>${c}</span></button>`;
  pills.innerHTML = chip('', 'All', d.length) + Object.keys(n).sort().map(k => chip(k, k, n[k])).join('');
  const u = new URLSearchParams(location.search);
  q.value = u.get('q') || '';
  dist = n[u.get('district')] ? u.get('district') : '';
  render();
}).catch(() => { count.textContent = 'Opticians could not be loaded.'; });
})();
