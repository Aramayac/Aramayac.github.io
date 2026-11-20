/* Mobile menu: burger toggles a full-screen panel. Esc, link click or widening the window closes it. */
(() => {
  const b = document.querySelector('.burger'), m = document.getElementById('mnav'); if (!b || !m) return;
  const isOpen = () => b.getAttribute('aria-expanded') === 'true';
  const open = () => { m.hidden = false; requestAnimationFrame(() => m.classList.add('open'));
    b.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('menu-open');
    const f = m.querySelector('a'); if (f) setTimeout(() => f.focus({preventScroll:true}), 60); };
  const close = (refocus) => { if (!isOpen()) return; m.classList.remove('open'); b.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open'); setTimeout(() => { if (!isOpen()) m.hidden = true; }, 320); if (refocus) b.focus(); };
  b.addEventListener('click', () => isOpen() ? close(true) : open());
  m.addEventListener('click', e => { if (e.target.closest('a')) close(false); });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { close(true); return; }
    if (e.key === 'Tab') { const f = [b, ...m.querySelectorAll('a')], i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length-1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });
  const mq = matchMedia('(min-width:1101px)'); const onMq = e => { if (e.matches) close(false); };
  mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener(onMq);
})();
