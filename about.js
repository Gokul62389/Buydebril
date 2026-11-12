/* About page motion: blocks rise in as they scroll into view (staggered within a group),
   the numbers count up. Skipped entirely for reduced motion.
   Uses a scroll sweep rather than IntersectionObserver: a fast scroll or jump can carry a block
   past the viewport without it ever "intersecting", which would leave it hidden for good. */
(() => {
'use strict';
if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// [group selector, children that rise one after another]
const GROUPS = [
  ['.ab-story', 'h2, .ab-story-copy p'],
  ['.ab-nums', ':scope > div'],
  ['.ab-pillars', 'article'],
  ['.ab-mats', '.ab-mats-head, li'],
  ['.ab-close', '.twoin-media, .twoin-copy > *'],
];
let todo = [];
GROUPS.forEach(([g, kids]) => $$(g).forEach(sec => $$(kids, sec).forEach((el, i) => {
  el.classList.add('rv');
  el.style.setProperty('--i', i);
  todo.push(el);
})));

// numbers count up from 0 when revealed ("2-in-1" is left as is)
const countUp = b => {
  const to = +b.dataset.to, t0 = performance.now(), dur = 1400;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur);
    b.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
$$('.ab-nums b').forEach(b => {
  if (!/^\d+$/.test(b.textContent.trim())) return;
  b.dataset.to = b.textContent.trim();
  b.textContent = '0';
});

// reveal everything whose top has reached 88% of the screen, including anything already scrolled past
let raf = 0;
const sweep = () => {
  raf = 0;
  const line = innerHeight * .88;
  todo = todo.filter(el => {
    if (el.getBoundingClientRect().top > line) return true;
    el.classList.add('is-in');
    const b = el.querySelector('b[data-to]');
    if (b) countUp(b);
    return false;
  });
  if (!todo.length) { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); }
};
const onScroll = () => { raf ||= requestAnimationFrame(sweep); };
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
sweep();
})();
