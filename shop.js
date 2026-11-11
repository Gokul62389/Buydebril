/* Shop: 88 frames from catalog.json (snapshot of the live buydb.in store), filtered in the browser.
   Filters live in the URL (?gender=Men&shape=Round&q=1003) so links from the homepage and search land pre-filtered.
   ponytail: catalog.json is a snapshot — re-run catalog.py (or switch to the Store API once buydb.in sends CORS headers). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const PAGE = 24;
const GROUPS = [            // [url key, catalog field, label]
  ['shape', 'sh', 'Shape'],
  ['material', 'mt', 'Material'],
  ['colour', 'col', 'Colour'],
];
const SW = { Black: '#16181d', Gold: '#c9a24e', Red: '#9b1c22', 'Double colour': 'linear-gradient(135deg,#16181d 50%,#c9a24e 50%)', Others: 'conic-gradient(#c9a24e,#6b3f1d,#8fa3c7,#c9a24e)' };
// homepage / old links use buydb slugs; map them to our labels
const ALIAS = { male: 'Men', female: 'Women', child: 'Children', kids: 'Children', unisex: 'Unisex', men: 'Men', women: 'Women', children: 'Children' };

const grid = $('#pgrid'), more = $('#more'), count = $('#rcount'), chips = $('#chips'), empty = $('#empty');
let ALL = [], shown = PAGE;
const st = { gender: '', q: '', two: false, sort: 'new', sel: { shape: new Set(), material: new Set(), colour: new Set() } };

/* ---------- URL <-> state ---------- */
const read = () => {
  const u = new URLSearchParams(location.search);
  const g = u.get('gender') || '';
  st.gender = ALIAS[g.toLowerCase()] || g;
  st.q = u.get('q') || u.get('s') || '';
  st.two = u.get('type') === '2-in-1';
  st.sort = u.get('sort') || 'new';
  GROUPS.forEach(([k]) => { st.sel[k] = new Set(u.getAll(k)); });
};
const write = () => {
  const u = new URLSearchParams();
  if (st.gender) u.set('gender', st.gender);
  if (st.q) u.set('q', st.q);
  if (st.two) u.set('type', '2-in-1');
  GROUPS.forEach(([k]) => st.sel[k].forEach(v => u.append(k, v)));
  if (st.sort !== 'new') u.set('sort', st.sort);
  history.replaceState(null, '', u.toString() ? '?' + u : location.pathname);
};

/* ---------- filtering ---------- */
const match = (it, skip) => {
  if (st.gender && it.g !== st.gender) return false;
  if (st.two && !it.two) return false;
  if (st.q) { const q = st.q.toLowerCase(); if (!`${it.m} ${it.c} ${it.sh} ${it.mt} ${it.col} ${it.two ? '2-in-1' : ''}`.toLowerCase().includes(q)) return false; }
  return GROUPS.every(([k, f]) => k === skip || !st.sel[k].size || st.sel[k].has(it[f]));
};
const sorted = list => {
  const by = { az: (a, b) => a.m.localeCompare(b.m, undefined, { numeric: true }), za: (a, b) => b.m.localeCompare(a.m, undefined, { numeric: true }) }[st.sort];
  return by ? [...list].sort(by) : list;
};

/* ---------- rendering ---------- */
const card = (it, k) => {
  const wa = 'https://wa.me/914843160620?text=' + encodeURIComponent(`Hello, I'd like to know more about the De Bril ${it.m} (${it.c}).`);
  return `<li class="card" style="--i:${k % PAGE}">
    <div class="ph"><a class="ph-a" href="${it.u}" tabindex="-1" aria-hidden="true"><img src="${it.i[0]}" alt="" width="450" height="450" loading="lazy">${it.i[1] ? `<img class="alt" src="${it.i[1]}" alt="" width="450" height="450" loading="lazy">` : ''}</a>
      ${it.two ? '<span class="badge">2-in-1</span>' : ''}
      <div class="cta"><a class="cta-v" href="${it.u}" aria-label="View ${esc(it.m)}, ${esc(it.c)}">View frame <i aria-hidden="true">→</i></a><a class="cta-w" href="${wa}" target="_blank" rel="noopener" aria-label="Enquire about ${esc(it.m)}, ${esc(it.c)} on WhatsApp">Enquire</a></div></div>
    <a class="tx" href="${it.u}"><b>${esc(it.m)}</b><span>${esc(it.c)}</span><small>${esc(it.sh)} · ${esc(it.mt)}</small><em class="tx-more" aria-hidden="true">View frame →</em></a></li>`;
};

const facets = () => {
  GROUPS.forEach(([k, f]) => {
    const pool = ALL.filter(it => match(it, k));
    $$(`[data-f="${k}"]`).forEach(inp => {
      const n = pool.filter(it => it[f] === inp.value).length;
      inp.checked = st.sel[k].has(inp.value);
      inp.closest('label').querySelector('.n').textContent = n;
      inp.closest('label').classList.toggle('is-zero', !n && !inp.checked);
    });
  });
  $('#two').checked = st.two;
  $$('.wear [data-g]').forEach(b => b.setAttribute('aria-pressed', b.dataset.g === st.gender));
  $('#sort').value = st.sort;
};

const render = (keep) => {
  const list = sorted(ALL.filter(it => match(it)));
  if (!keep) shown = PAGE;
  grid.innerHTML = list.slice(0, shown).map(card).join('');
  count.textContent = `${list.length} frame${list.length === 1 ? '' : 's'}`;
  empty.hidden = !!list.length;
  more.hidden = shown >= list.length;
  more.querySelector('span').textContent = `Show more · ${Math.max(0, list.length - shown)} left`;
  const act = [
    ...(st.q ? [['q', st.q, `“${st.q}”`]] : []),
    ...(st.two ? [['type', '', '2-in-1']] : []),
    ...GROUPS.flatMap(([k]) => [...st.sel[k]].map(v => [k, v, v])),
  ];
  chips.innerHTML = act.map(([k, v, l]) => `<button class="chip-x" type="button" data-rm="${k}" data-v="${esc(v)}" aria-label="Remove filter ${esc(l)}">${esc(l)} <span aria-hidden="true">×</span></button>`).join('')
    + (act.length > 1 ? '<button class="chip-clear" type="button" data-rm="all">Clear all</button>' : '');
  $('#fcount').textContent = act.length ? `(${act.length})` : '';
  $('#shop-h').textContent = st.gender ? `${st.gender === 'Unisex' ? 'Unisex' : st.gender + '’s'} frames` : 'All frames';
  facets(); write();
};

/* ---------- build the filter panel from the data ---------- */
const buildFilters = () => {
  $('#fgroups').innerHTML = GROUPS.map(([k, f, label]) => {
    const vals = [...new Set(ALL.map(it => it[f]).filter(Boolean))].sort();
    return `<fieldset class="fg"><legend>${label}</legend>${vals.map(v => `<label class="opt${k === 'colour' ? ' opt-sw' : ''}"><input type="checkbox" data-f="${k}" value="${esc(v)}">${k === 'colour' ? `<i style="--c:${SW[v] || '#ccc'}"></i>` : ''}<span>${esc(v)}</span><span class="n"></span></label>`).join('')}</fieldset>`;
  }).join('');
};

/* ---------- events ---------- */
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.f) { st.sel[t.dataset.f][t.checked ? 'add' : 'delete'](t.value); render(); }
  else if (t.id === 'two') { st.two = t.checked; render(); }
  else if (t.id === 'sort') { st.sort = t.value; render(); }
});
$$('.wear [data-g]').forEach(b => b.addEventListener('click', () => { st.gender = b.dataset.g; render(); }));
chips.addEventListener('click', e => {
  const b = e.target.closest('[data-rm]'); if (!b) return;
  const k = b.dataset.rm;
  if (k === 'all') { st.q = ''; st.two = false; GROUPS.forEach(([g]) => st.sel[g].clear()); }
  else if (k === 'q') st.q = '';
  else if (k === 'type') st.two = false;
  else st.sel[k].delete(b.dataset.v);
  render();
});
$('#empty-reset').addEventListener('click', () => { st.gender = ''; st.q = ''; st.two = false; GROUPS.forEach(([g]) => st.sel[g].clear()); render(); });
more.addEventListener('click', () => { shown += PAGE; render(true); });

// filters panel: a sidebar on desktop, a drawer on phones
const panel = $('#filters'), opener = $('#fopen');
const setPanel = on => { panel.classList.toggle('is-open', on); opener.setAttribute('aria-expanded', on); document.body.style.overflow = on ? 'hidden' : ''; if (on) panel.focus(); };
opener.addEventListener('click', () => setPanel(true));
$$('[data-fclose]').forEach(b => b.addEventListener('click', () => { setPanel(false); opener.focus(); }));
panel.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('is-open')) { setPanel(false); opener.focus(); } });

/* ---------- go ---------- */
fetch('catalog.json').then(r => r.json()).then(d => {
  ALL = d; read(); buildFilters(); render();
  $('#q').value = st.q;
}).catch(() => { count.textContent = 'Frames could not be loaded.'; });
})();
