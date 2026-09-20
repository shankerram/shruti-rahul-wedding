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
  const UNTIE_MS = reduced ? 50 : 1650;   // cord untie choreography before the leaf moves
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
    for (let i = 0; i < 26; i++) dropPetal(i, 2.4);
    let n = 26;
    petalTimer = setInterval(() => { if (!document.hidden) dropPetal(n++, 0); }, 600);
  }
  function stopPetals() {
    if (petalTimer) { clearInterval(petalTimer); petalTimer = null; }
  }


  /* ---------- the cord: one thread, morphed between shapes ----------
     Shapes are point lists (start + 3 per cubic segment) in the tie SVG's coordinates
     (card = 0..1000). Piece L runs from the left band edge, through the knot, both loops
     and down the tail; piece R from the right band edge into the knot. Stage 0 = tied bow,
     1 = knot loosened, 2 = loops pulled through so the cord hangs slack, 3 = lying open on
     the table below the leaf, where the two pieces meet end to end as a single thread. */
  const cordL = document.getElementById('cordL'), cordR = document.getElementById('cordR');
  const frayL = document.getElementById('frayL'), frayR = document.getElementById('frayR');
  const K = 470, KY = 470;                                   // knot centre
  const L0 = [[-20,472],[150,466],[330,476],[452,470],
    [470,440],[505,455],[500,485],  [480,505],[455,490],[462,470],                       // knot
    [540,440],[600,370],[650,320],  [700,270],[760,280],[750,340],  [740,400],[640,430],[560,460],  [520,475],[490,480],[470,470],   // loop A
    [420,500],[350,560],[310,620],  [270,680],[290,730],[340,700],  [390,670],[420,590],[450,520],  [460,495],[470,480],[472,472],   // loop B
    [495,530],[515,600],[520,700],  [522,760],[540,820],[530,880],  [528,900],[526,920],[524,935]];                                 // tail
  const R0 = [[1040,468],[900,462],[700,474],[520,470],[505,460],[495,462],[490,470],[488,474],[486,476],[485,478]];
  const scaleAbout = (p, s, dy = 0) => [K + (p[0] - K) * s, KY + (p[1] - KY) * s + dy];
  // stage 1: knot opened, loops slack, tail dropped a little
  const L1 = L0.map((p, i) => i >= 4 && i <= 33 ? scaleAbout(p, 1.22) : i > 33 ? [p[0] + 6, p[1] + 30] : p);
  const R1 = R0.map((p, i) => i >= 4 ? [p[0] - 10, p[1] + 26] : p);
  // stage 2: loops gone; the freed length hangs as one slack line from the sagging band
  const lerpPts = (a, b, n) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0 : i / (n - 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; });
  const wob = (pts, amp) => pts.map((p, i) => [p[0] + Math.sin(i * 1.7) * amp, p[1] + Math.cos(i * 1.3) * amp * .6]);
  const L2 = [[-20,478],[150,490],[330,512],[452,522], ...wob(lerpPts([462,545],[508,760],30), 3.5), ...lerpPts([520,800],[560,960],9)];
  const R2 = [[1040,478],[900,490],[700,512],[520,526], ...lerpPts([508,540],[498,600],6)];
  // stage 3: lying on the table just below the leaf, one continuous wavy line
  const tableY = (x) => 1030 + 13 * Math.sin((x + 280) / 62);
  const L3 = Array.from({ length: 43 }, (_, i) => { const x = -280 + 800 * i / 42; return [x, tableY(x)]; });
  const R3 = Array.from({ length: 10 }, (_, i) => { const x = 1260 - 740 * i / 9; return [x, tableY(x)]; });
  const STAGES = [[L0, R0], [L1, R1], [L2, R2], [L3, R3]];
  const DUR = [320, 560, 720];                                // ms per stage transition
  const toD = (pts) => { let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`; for (let i = 1; i < pts.length; i += 3) d += ` C${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${pts[i+1][0].toFixed(1)} ${pts[i+1][1].toFixed(1)} ${pts[i+2][0].toFixed(1)} ${pts[i+2][1].toFixed(1)}`; return d; };
  const mix = (a, b, t) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);
  function drawCord(L, R) {
    const dL = toD(L), dR = toD(R);
    cordL.querySelectorAll(':scope > path').forEach(p => p.setAttribute('d', dL));
    cordR.querySelectorAll(':scope > path').forEach(p => p.setAttribute('d', dR));
    const e = L[L.length - 1], s = R[0];
    frayL.setAttribute('transform', `translate(${e[0].toFixed(1)} ${e[1].toFixed(1)})`);
    frayL.style.opacity = Math.max(0, Math.min(1, 1 - (cordPos - 2.1) * 3));   // the tail end meets the other piece once open
    frayR.setAttribute('transform', `translate(${s[0].toFixed(1)} ${s[1].toFixed(1)})`);
  }
  let cordStage = 0, cordPos = 0;                            // 0 tied … 3 open
  const easeInOut = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function setCord(pos) {                                    // pos 0..3, fractional between stages
    cordPos = pos;
    const i = Math.min(2, Math.floor(pos)), t = pos - i;
    const [La, Ra] = STAGES[i], [Lb, Rb] = STAGES[i + 1];
    drawCord(mix(La, Lb, t), mix(Ra, Rb, t));
  }
  function moveCord(toStage) {                               // animate stage by stage, forward or back
    return new Promise((resolve) => {
      if (reduced) { cordStage = toStage; setCord(toStage); resolve(); return; }
      const dir = toStage > cordStage ? 1 : -1;
      const step = () => {
        if (cordStage === toStage) { resolve(); return; }
        const from = cordStage, to = cordStage + dir, dur = DUR[Math.min(from, to)];
        const t0 = performance.now();
        const frame = (now) => {
          const t = Math.min(1, (now - t0) / dur);
          setCord(from + (to - from) * easeInOut(t));
          if (t < 1) requestAnimationFrame(frame); else { cordStage = to; step(); }
        };
        requestAnimationFrame(frame);
      };
      step();
    });
  }
  setCord(0);

  /* ---------- open: untie, then unfold ---------- */
  function open() {
    if (state !== 'closed') return;
    state = 'untying';
    setHint('');
    scene.classList.add('untied');
    moveCord(3);                                         // loosen, pull through, fall open
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
      moveCord(0).then(() => {                           // the cord gathers, loops form and pull tight
        scene.classList.remove('untied');
        wrap.setAttribute('role', 'button');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-label', 'Open the invitation');
        state = 'closed';
        setHint('Tap the knot to open');
      });
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
  let touchX = null, pinched = false;
  card.addEventListener('touchstart', (e) => { if (e.touches.length > 1) { pinched = true; touchX = null; return; } pinched = false; touchX = e.touches[0].clientX; }, { passive: true });
  card.addEventListener('touchmove', (e) => { if (e.touches.length > 1) pinched = true; }, { passive: true });
  card.addEventListener('touchend', (e) => {
    if (pinched || e.touches.length > 0) return;         // a zoom gesture, not a swipe
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
    cordStage = 3; setCord(3);
    state = 'open';
    renderControls();
    controls.hidden = false;
    controls.classList.add('is-visible');
    hint.textContent = openHint;
    startPetals();
  }
})();
