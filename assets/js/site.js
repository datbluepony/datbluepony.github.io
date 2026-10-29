// Page behaviour: clock, nav, staged intro, reveals, filters, Hub switcher, lightbox, lazy videos and embeds.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- clock (Southwest Florida, 12-hour) ----
  const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  const tick = () => { const p = fmt.formatToParts(new Date()); $('#clk').textContent = p.filter(x => x.type === 'hour' || x.type === 'minute' || x.type === 'literal' && x.value === ':').map(x => x.value).join(''); $('#ampm').textContent = (p.find(x => x.type === 'dayPeriod') || {}).value || ''; };
  tick(); setInterval(tick, 15000);

  // ---- top bar: solid after the hero, nav pill follows the section in view ----
  const top = $('#top'), links = $$('.top nav a'), pill = $('.top nav .pill');
  const movePill = a => { if (!a) { pill.style.opacity = 0; return; } pill.style.opacity = 1; pill.style.width = a.offsetWidth + 'px'; pill.style.transform = `translateX(${a.offsetLeft}px)`; };
  addEventListener('scroll', () => top.classList.toggle('solid', scrollY > 40), { passive: true });
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const a = links.find(l => l.getAttribute('href') === '#' + e.target.id);
    links.forEach(l => l.classList.toggle('on', l === a)); movePill(a);
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => spy.observe(s));
  new IntersectionObserver(([e]) => { if (e.isIntersecting) { links.forEach(l => l.classList.remove('on')); movePill(null); } }, { threshold: .4 }).observe($('#hero'));

  // ---- palm frond line art, drawn once along a curve (like the Hub's) ----
  (() => {
    const svg = $('#frond'); if (!svg) return;
    const P = t => [60 + 400 * t, 500 - 420 * t + 160 * t * t]; // stem curve
    let d = 'M' + P(0).join(' ');
    for (let i = 1; i <= 40; i++) d += ' L' + P(i / 40).map(v => v.toFixed(1)).join(' ');
    for (let i = 2; i < 38; i++) {
      const t = i / 40, [x, y] = P(t), [x2, y2] = P(t + .01), a = Math.atan2(y2 - y, x2 - x), L = 150 * Math.sin(Math.PI * t) + 20;
      for (const s of [-1, 1]) {
        const b = a + s * (1.05 - .35 * t), ex = x + Math.cos(b) * L, ey = y + Math.sin(b) * L + 30 * t;
        const cx = x + Math.cos(b - s * .25) * L * .55, cy = y + Math.sin(b - s * .25) * L * .55;
        d += ` M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      }
    }
    svg.innerHTML = `<path d="${d}" fill="none" stroke="#ece8dc" stroke-width="1.2" stroke-linecap="round"/>`;
  })();

  // ---- staged hero entrance + odometer ----
  const hero = $('#hero');
  const heroVid = $('#heroVid');
  requestAnimationFrame(() => setTimeout(() => hero.classList.add('go'), 60));
  if (heroVid) { heroVid.playbackRate = 1; setTimeout(() => heroVid.play().catch(() => {}), reduce ? 0 : 900); }
  const odo = () => $$('#odo .num').forEach((el, k) => {
    const n = +el.dataset.n, str = n.toLocaleString('en-US') + (el.dataset.suffix || '');
    el.innerHTML = [...str].map(ch => /\d/.test(ch) ? `<span class="roll"><span>${Array.from({ length: 10 }, (_, i) => `<i>${i}</i>`).join('')}</span></span>` : `<span>${ch}</span>`).join('');
    const rolls = $$('.roll > span', el), digits = [...str].filter(c => /\d/.test(c));
    rolls.forEach((r, i) => { r.style.transitionDelay = (k * 160 + i * 90) + 'ms'; requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transform = `translateY(-${digits[i]}em)`; })); });
  });
  setTimeout(odo, reduce ? 0 : 1250);

  // ---- reveal on scroll ----
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
  $$('.rv').forEach(el => rv.observe(el));

  // ---- work filters ----
  const fbtn = $$('.filters button'), cards = $$('#grid .wk');
  fbtn.forEach(b => b.onclick = () => {
    fbtn.forEach(x => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.f;
    // FLIP: remember positions, filter, then animate from old to new
    const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
    cards.forEach(c => c.classList.toggle('hide', f !== 'all' && !c.dataset.c.split(' ').includes(f)));
    cards.forEach(c => {
      if (c.classList.contains('hide')) return;
      const a = first.get(c), z = c.getBoundingClientRect();
      if (!a || a.width === 0) { c.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.1,1)' }); return; }
      c.animate([{ transform: `translate(${a.left - z.left}px, ${a.top - z.top}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.7,.1,1)' });
    });
  });

  // ---- Hub screen switcher ----
  const tabs = $$('#hubtabs button'), imgs = $$('#hubstack img'), hp = $('#hubtabs .pill'), cap = $('#hubcap');
  let hubI = 0, hubTimer = null, userTook = false;
  const placeHub = b => { hp.style.width = b.offsetWidth + 'px'; hp.style.height = b.offsetHeight + 'px'; hp.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`; };
  const showHub = i => {
    hubI = i; tabs.forEach((t, k) => t.setAttribute('aria-selected', k === i)); placeHub(tabs[i]);
    imgs.forEach((im, k) => im.classList.toggle('on', k === i)); cap.innerHTML = imgs[i].dataset.cap;
  };
  tabs.forEach((t, i) => t.onclick = () => { userTook = true; clearInterval(hubTimer); showHub(i); });
  addEventListener('resize', () => placeHub(tabs[hubI]));
  showHub(0);
  $('#hubstack').addEventListener('click', () => openLB(imgs.map(im => ({ src: im.src, cap: im.dataset.cap })), hubI));
  new IntersectionObserver(([e]) => {
    clearInterval(hubTimer);
    if (e.isIntersecting && !userTook && !reduce) hubTimer = setInterval(() => showHub((hubI + 1) % tabs.length), 5200);
  }, { threshold: .5 }).observe($('#hubstack'));
  document.fonts && document.fonts.ready.then(() => { placeHub(tabs[hubI]); });

  // ---- videos: play only while on screen ----
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
  }), { threshold: .25 });
  $$('video[data-auto]').forEach(v => vio.observe(v));

  // ---- click-to-load embeds ----
  $$('.embed .poster').forEach(p => p.onclick = () => {
    const f = document.createElement('iframe');
    f.src = p.dataset.src; f.title = p.querySelector('span').textContent.trim(); f.allow = 'fullscreen; gamepad; autoplay'; f.style.height = '100%';
    const box = p.parentElement; box.appendChild(f); f.style.position = 'absolute'; f.style.inset = '0'; f.style.width = '100%';
    p.style.transition = 'opacity .5s'; p.style.opacity = 0; setTimeout(() => p.remove(), 500); f.focus();
  });

  // ---- gauges ----
  const gio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const g = e.target, v = +g.dataset.v;
    $('.val', g).style.strokeDashoffset = 100 - v / 60 * 100; gio.unobserve(g);
  }), { threshold: .4 });
  $$('.gauge').forEach(g => gio.observe(g));

  // ---- lightbox ----
  const lb = $('#lb'), lbImg = $('img', lb), lbCap = $('.cap', lb);
  let items = [], at = 0;
  function openLB(list, i) { items = list; at = i; paint(); lb.classList.add('on'); document.body.style.overflow = 'hidden'; $('.x', lb).focus(); }
  function paint() { lbImg.style.opacity = 0; const it = items[at]; const im = new Image(); im.onload = () => { lbImg.src = it.src; lbImg.alt = ''; lbImg.style.opacity = 1; }; im.src = it.src; lbCap.innerHTML = it.cap || ''; $('.pv', lb).hidden = $('.nx', lb).hidden = items.length < 2; }
  function close() { lb.classList.remove('on'); document.body.style.overflow = ''; }
  const step = d => { at = (at + d + items.length) % items.length; paint(); };
  $('.x', lb).onclick = close; $('.pv', lb).onclick = () => step(-1); $('.nx', lb).onclick = () => step(1);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('im')) close(); });
  addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
  $$('.shot[data-lb]').forEach(s => s.addEventListener('click', () => {
    const group = $$(`.shot[data-lb="${s.dataset.lb}"]`);
    openLB(group.map(g => { const fc = g.closest('figure')?.querySelector('figcaption'); return { src: g.querySelector('img').src, cap: fc ? fc.innerHTML : '' }; }), group.indexOf(s));
  }));
  window.__openLB = openLB;
})();
