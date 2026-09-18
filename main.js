(() => {
  const scene = document.getElementById('scene');
  const wrap = document.getElementById('wrap');
  const card = document.getElementById('card');
  const tie = document.getElementById('tie');
  const hint = document.getElementById('hint');
  const controls = document.getElementById('controls');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const closeBtn = document.getElementById('closeBtn');
  const dots = document.getElementById('dots');
  const frontImg = card.querySelector('.face.front img');
  const backImg = card.querySelector('.face.back img');

  // the invitation's pages, listed in the hidden .pages block of each route's index.html
  // a page marked data-sway has its garlands dangling over a copy with them painted out
  const pages = [...document.querySelectorAll('.pages img')].map(img => ({ src: img.getAttribute('src'), alt: img.alt, sway: img.hasAttribute('data-sway') }));
  const stillOf = (src) => src.replace(/\.jpg$/, '-still.jpg');   // the page with its garlands painted out
  const maskOf = (src) => src.replace(/\.jpg$/, '-mask.png');     // the garlands alone
  const N = pages.length;
  let cur = 0;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const UNTIE_MS = reduced ? 50 : 1250;   // thread choreography before the leaf moves
  const FOLD_MS = reduced ? 50 : 1900;    // both lobes swung open

  let state = 'closed';                   // closed | untying | opening | open | closing
  let flipping = false;
  let timers = [];

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

  function setHint(text) {
    if (!text) { hint.classList.add('is-hidden'); return; }
    hint.classList.add('is-hidden');
    later(() => { hint.textContent = text; hint.classList.remove('is-hidden'); }, 420);
  }
  const openHint = N > 2 ? 'Tap the card for the next page' : 'Tap the card to turn it over';

  /* ---------- pages ---------- */
  function setFace(img, i) {
    const { src, alt, sway: dangles } = pages[i];
    img.alt = alt;
    const sway = img.nextElementSibling;                 // the garland layer that dangles over the page
    if (!dangles || !sway) {
      img.src = src;
      if (sway) { sway.style.backgroundImage = 'none'; sway.style.webkitMaskImage = 'none'; sway.style.maskImage = 'none'; }
      return;
    }
    img.src = stillOf(src);                              // still page beneath, garlands removed
    sway.style.backgroundImage = `url("${src}")`;        // the garlands, cut from the full page
    const mask = `url("${maskOf(src)}")`;
    sway.style.webkitMaskImage = mask; sway.style.maskImage = mask;
  }
  function renderControls() {
    if (N > 2) {
      nextBtn.textContent = cur === N - 1 ? 'Back to the first page' : 'Next page';
      prevBtn.hidden = cur === 0;
      dots.hidden = false;
      dots.innerHTML = pages.map((_, i) => `<i class="${i === cur ? 'on' : ''}"></i>`).join('');
      dots.setAttribute('aria-label', `Page ${cur + 1} of ${N}`);
    } else {
      nextBtn.textContent = cur === 0 ? 'Turn the card over' : 'Turn back to the front';
      prevBtn.hidden = true;
      dots.hidden = true;
    }
  }
  function preloadPages() { pages.forEach(p => { for (const s of p.sway ? [p.src, stillOf(p.src), maskOf(p.src)] : [p.src]) { const im = new Image(); im.src = s; } }); }

  /* ---------- marigold petals ---------- */
  const petalBox = document.getElementById('petals');
  const PETAL_COLORS = ['#f0821e', '#ffb32a', '#e8761b', '#ffc93c', '#d8571a', '#ff9c22'];
  let petalTimer = null;
  function dropPetal(i, maxDelay) {
    const p = document.createElement('i');
    p.className = 'petal';
    const unit = Math.max(10, Math.min(innerWidth, innerHeight) * 0.016);   // grows with the screen
    const w = unit * (0.8 + Math.random() * 1.2), h = w * (.62 + Math.random() * .32);
    const dur = 6 + Math.random() * 6, delay = Math.random() * maxDelay;
    p.style.cssText = `left:${Math.random() * 100}%;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;
      background:linear-gradient(145deg,${PETAL_COLORS[i % PETAL_COLORS.length]} 20%,${PETAL_COLORS[(i + 3) % PETAL_COLORS.length]});
      box-shadow:0 1px 4px rgba(90,40,0,.45), inset 0 -2px 3px rgba(140,60,0,.3);
      --dx:${(Math.random() * 260 - 130).toFixed(0)}px;--rot:${(Math.random() * 900 - 380).toFixed(0)}deg;
      animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s`;
    petalBox.appendChild(p);
    setTimeout(() => p.remove(), (dur + delay) * 1000 + 200);
  }
  // a burst as the leaf unfolds, then a gentle steady drift for as long as the card is open
  function startPetals() {
    if (reduced || petalTimer) return;
    for (let i = 0; i < 40; i++) dropPetal(i, 2.4);
    let n = 40;
    petalTimer = setInterval(() => { if (!document.hidden) dropPetal(n++, 0); }, 380);
  }
  function stopPetals() {
    if (petalTimer) { clearInterval(petalTimer); petalTimer = null; }
  }

  /* ---------- open: untie, then unfold ---------- */
  function open() {
    if (state !== 'closed') return;
    state = 'untying';
    setHint('');
    scene.classList.add('untied');
    wrap.setAttribute('aria-label', 'Wedding invitation');
    wrap.removeAttribute('role');
    wrap.removeAttribute('tabindex');
    preloadPages();

    later(() => {
      state = 'opening';
      scene.classList.add('open');
      startPetals();
    }, UNTIE_MS);

    later(() => {
      state = 'open';
      renderControls();
      controls.hidden = false;
      requestAnimationFrame(() => controls.classList.add('is-visible'));
      setHint(openHint);
      nextBtn.focus({ preventScroll: true });
    }, UNTIE_MS + FOLD_MS);
  }

  /* ---------- close: fold the leaf back and re-tie ---------- */
  function close() {
    if (state !== 'open' || flipping) return;
    state = 'closing';
    controls.classList.remove('is-visible');
    setHint('');
    if (cur !== 0) { cur = 0; setFace(frontImg, 0); }   // first page back on top before wrapping
    stopPetals();
    scene.classList.remove('open');
    later(() => {
      controls.hidden = true;
      scene.classList.remove('untied');
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('aria-label', 'Open the invitation');
      state = 'closed';
      setHint('Tap the knot to open');
    }, FOLD_MS);
  }

  /* ---------- turn: lift the card and turn it to page `to` ---------- */
  function turn(to, dir) {
    if (state !== 'open' || flipping || to === cur || to < 0 || to >= N) return;
    setFace(backImg, to);                 // the reverse side carries the page we are turning to
    const end = dir * 180;
    const finish = () => {
      cur = to;
      setFace(frontImg, to);
      card.style.transform = 'translateZ(6px) rotateY(0deg)';
      flipping = false;
      renderControls();
    };
    if (reduced) { finish(); return; }
    flipping = true;
    const lift = Math.round(card.getBoundingClientRect().width * 0.55);
    const anim = card.animate([
      { transform: 'translateZ(6px) rotateY(0deg)' },
      { transform: `translateZ(${lift}px) rotateY(${end / 2}deg)`, offset: 0.5, easing: 'ease-in' },
      { transform: `translateZ(6px) rotateY(${end}deg)` }
    ], { duration: 1100, easing: 'ease-out', fill: 'forwards' });
    anim.onfinish = () => { finish(); anim.cancel(); };
  }
  const next = () => turn(cur === N - 1 ? 0 : cur + 1, 1);
  const prev = () => turn(cur === 0 ? N - 1 : cur - 1, -1);

  /* ---------- wiring ---------- */
  tie.addEventListener('click', (e) => { e.stopPropagation(); open(); });
  wrap.addEventListener('click', (e) => {
    if (state === 'closed') { open(); return; }
    if (state === 'open' && card.contains(e.target)) next();
  });
  wrap.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && state === 'closed') { e.preventDefault(); open(); }
  });
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (state !== 'open') return;
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'Escape') close();
  });

  // swipe on the open card
  let touchX = null;
  card.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  card.addEventListener('touchend', (e) => {
    if (touchX === null || state !== 'open') return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (dx < -40) next();
    else if (dx > 40) prev();
  });

  setFace(frontImg, 0);
  setFace(backImg, Math.min(1, N - 1));

  // ?open in the URL skips straight to the opened card (handy for sharing a screenshot)
  if (new URLSearchParams(location.search).has('open')) {
    scene.classList.add('untied', 'open');
    state = 'open';
    renderControls();
    controls.hidden = false;
    controls.classList.add('is-visible');
    hint.textContent = openHint;
    startPetals();
  }
})();
