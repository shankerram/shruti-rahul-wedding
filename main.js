(() => {
  const scene = document.getElementById('scene');
  const wrap = document.getElementById('wrap');
  const card = document.getElementById('card');
  const tie = document.getElementById('tie');
  const hint = document.getElementById('hint');
  const controls = document.getElementById('controls');
  const turnBtn = document.getElementById('turnBtn');
  const closeBtn = document.getElementById('closeBtn');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const UNTIE_MS = reduced ? 50 : 1250;   // thread choreography before the leaf moves
  const FOLD_MS = reduced ? 50 : 1900;    // both lobes swung open

  let state = 'closed';                   // closed | untying | opening | open | closing
  let showingBack = false;
  let flipping = false;
  let timers = [];

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function setHint(text) {
    if (!text) { hint.classList.add('is-hidden'); return; }
    hint.classList.add('is-hidden');
    later(() => { hint.textContent = text; hint.classList.remove('is-hidden'); }, 420);
  }

  /* ---------- marigold petals ---------- */
  const petalBox = document.getElementById('petals');
  const PETAL_COLORS = ['#f0821e', '#ffb32a', '#e8761b', '#ffc93c', '#d8571a', '#ff9c22'];
  function rainPetals(n) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'petal';
      const w = 7 + Math.random() * 11, h = w * (.62 + Math.random() * .32);
      const dur = 5.5 + Math.random() * 5.5, delay = Math.random() * 2.4;
      p.style.cssText = `left:${Math.random() * 100}%;width:${w}px;height:${h}px;
        background:linear-gradient(145deg,${PETAL_COLORS[i % PETAL_COLORS.length]} 20%,${PETAL_COLORS[(i + 3) % PETAL_COLORS.length]});
        box-shadow:0 1px 4px rgba(90,40,0,.45), inset 0 -2px 3px rgba(140,60,0,.3);
        --dx:${(Math.random() * 260 - 130).toFixed(0)}px;--rot:${(Math.random() * 900 - 380).toFixed(0)}deg;
        animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s`;
      petalBox.appendChild(p);
      setTimeout(() => p.remove(), (dur + delay) * 1000 + 200);
    }
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

    later(() => {
      state = 'opening';
      scene.classList.add('open');
      rainPetals(30);
    }, UNTIE_MS);

    later(() => {
      state = 'open';
      controls.hidden = false;
      requestAnimationFrame(() => controls.classList.add('is-visible'));
      setHint('Tap the card to turn it over');
      turnBtn.focus({ preventScroll: true });
    }, UNTIE_MS + FOLD_MS);
  }

  /* ---------- close: fold the leaf back and re-tie ---------- */
  function close() {
    if (state !== 'open' || flipping) return;
    state = 'closing';
    controls.classList.remove('is-visible');
    setHint('');
    if (showingBack) flip(true);         // put card 1 on top before wrapping
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

  /* ---------- flip: lift the card and turn it over ---------- */
  function flip(instant = false) {
    if (state !== 'open' && !instant) return;
    if (flipping) return;
    const from = showingBack ? 180 : 0;
    const to = showingBack ? 0 : 180;
    showingBack = !showingBack;
    turnBtn.textContent = showingBack ? 'Turn back to the front' : 'Turn the card over';

    if (instant || reduced) {
      card.style.transform = `translateZ(6px) rotateY(${to}deg)`;
      return;
    }
    flipping = true;
    const lift = Math.round(card.getBoundingClientRect().width * 0.55);
    const anim = card.animate([
      { transform: `translateZ(6px) rotateY(${from}deg)` },
      { transform: `translateZ(${lift}px) rotateY(${(from + to) / 2}deg)`, offset: 0.5, easing: 'ease-in' },
      { transform: `translateZ(6px) rotateY(${to}deg)` }
    ], { duration: 1100, easing: 'ease-out', fill: 'forwards' });
    anim.onfinish = () => {
      card.style.transform = `translateZ(6px) rotateY(${to}deg)`;
      anim.cancel();
      flipping = false;
    };
  }

  /* ---------- wiring ---------- */
  tie.addEventListener('click', (e) => { e.stopPropagation(); open(); });
  wrap.addEventListener('click', (e) => {
    if (state === 'closed') { open(); return; }
    if (state === 'open' && card.contains(e.target)) flip();
  });
  wrap.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && state === 'closed') { e.preventDefault(); open(); }
  });
  turnBtn.addEventListener('click', () => flip());
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (state !== 'open') return;
    if (e.key === 'ArrowRight' && !showingBack) flip();
    else if (e.key === 'ArrowLeft' && showingBack) flip();
    else if (e.key === 'Escape') close();
  });

  // swipe on the open card
  let touchX = null;
  card.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  card.addEventListener('touchend', (e) => {
    if (touchX === null || state !== 'open') return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 40) flip();
  });

  // ?open in the URL skips straight to the opened card (handy for sharing a screenshot)
  if (new URLSearchParams(location.search).has('open')) {
    scene.classList.add('untied', 'open');
    state = 'open';
    controls.hidden = false;
    controls.classList.add('is-visible');
    hint.textContent = 'Tap the card to turn it over';
  }
})();
