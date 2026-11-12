/* Contact form: no server. Builds the message and hands it to WhatsApp or the email app. */
(() => {
'use strict';
const f = document.getElementById('ctf'), err = document.getElementById('cterr');
let via = 'wa';
f.querySelectorAll('[data-via]').forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));
f.addEventListener('submit', e => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(f));
  const ok = v.name.trim() && v.reach.trim() && v.msg.trim();
  err.hidden = !!ok;
  if (!ok) { [...f.querySelectorAll('[required]')].find(i => !i.value.trim())?.focus(); return; }
  const text = `Hello De Bril,\n\nTopic: ${v.topic}\nName: ${v.name.trim()}\nContact: ${v.reach.trim()}${v.town.trim() ? `\nTown: ${v.town.trim()}` : ''}\n\n${v.msg.trim()}`;
  const url = via === 'wa'
    ? 'https://wa.me/914843160620?text=' + encodeURIComponent(text)
    : `mailto:main@bosymcorp.com?subject=${encodeURIComponent('De Bril: ' + v.topic)}&body=${encodeURIComponent(text)}`;
  via === 'wa' ? window.open(url, '_blank', 'noopener') : (location.href = url);
});
})();
