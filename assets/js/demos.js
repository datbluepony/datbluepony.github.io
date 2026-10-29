// Interactive pieces. Each one only runs while it's on screen.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whenVisible = (el, on, off, threshold = .15) => new IntersectionObserver(([e]) => e.isIntersecting ? on() : off && off(), { threshold }).observe(el);

  /* ============ 1. Tire-to-voice pipeline ============ */
  (() => {
    const STAGES = [
      [0.00, 'Tire crosses the line', 'Frigate watches the 640×480 stream at 4 fps on the CPU (~76 ms a look). A signal-only driveway zone fires the moment something enters.'],
      [0.25, 'Event reaches hub-api', 'Over MQTT. The live feed adds the car\'s ground point to its path and wakes the scene engine.'],
      [1.85, 'Grab the sharp frame', 'A 2560×1920 keyframe from a RAM buffer, matched to the moment using the measured 1.6 s stream delay.'],
      [1.95, 'Find the car again', 'YOLOX-nano re-finds it precisely in the sharp frame in ~0.1 s, after aiming Frigate\'s box at where the car is now.'],
      [3.45, 'Describe it', 'CLIP reads type, color and front/rear; a vote over ~3,000 labeled examples blends in. Known cars need color + verified photos + shape.'],
      [3.50, 'Settle on one answer', 'One look ≥ 72% sure (97% right on my labels) or two that agree. Until then it says nothing.'],
      [3.55, 'Write the sentence', 'Where comes from camera-zone shapes: drove by, pulled into the driveway, into the garage, up to the door.'],
      [3.80, 'Say it', 'The Hub\'s request is already waiting (long-poll). Chime, then the pre-recorded natural voice 170–420 ms later.'],
    ];
    const SAY = "Jenna's Model 3 just pulled into the driveway.";
    const END = 4.6, track = $('#track'), T = $('#pipeT'), bar = $('#pipeBar'), say = $('#pipeSay'), btn = $('#pipePlay');
    if (!track) return;
    track.innerHTML = STAGES.map(([t, b, p]) => `<div class="stage"><span class="at">t = ${t.toFixed(2)} s</span><b>${b}</b><p>${p}</p></div>`).join('');
    const els = $$('.stage', track);
    const words = SAY.split(' ');
    say.innerHTML = words.map(w => `<span>${w}</span>`).join(' ');
    const wEls = $$('span', say);
    let raf = 0, t0 = 0, playing = false, autoplayed = false;
    const set = t => {
      T.textContent = Math.min(t, END).toFixed(2); bar.style.width = Math.min(100, t / END * 100) + '%';
      let cur = -1; STAGES.forEach(([st], i) => { const on = t >= st; els[i].classList.toggle('on', on); if (on) cur = i; });
      els.forEach((e, i) => e.classList.toggle('now', i === cur && t < END));
      const k = Math.max(0, (t - 4.0) / .55); wEls.forEach((w, i) => w.classList.toggle('on', i < k * words.length));
    };
    // timeline runs in "presentation time": slow early stages so each can be read
    const PRES = 11000; // ms for the whole 4.6 s story
    const map = p => { const pts = [[0, 0], [.09, .25], [.27, 1.85], [.36, 1.95], [.55, 3.45], [.63, 3.5], [.7, 3.55], [.8, 3.8], [.86, 4.0], [1, END]]; for (let i = 1; i < pts.length; i++) if (p <= pts[i][0]) { const [a, x] = pts[i - 1], [b, y] = pts[i]; return x + (y - x) * (p - a) / (b - a); } return END; };
    const frame = now => { const p = Math.min(1, (now - t0) / PRES); set(map(p)); if (p < 1) raf = requestAnimationFrame(frame); else stop(); };
    const icon = n => btn.innerHTML = `<svg><use href="#i-${n}"/></svg>`;
    function start() { cancelAnimationFrame(raf); playing = true; icon('pause'); t0 = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { playing = false; icon('play'); cancelAnimationFrame(raf); }
    btn.onclick = () => playing ? stop() : start();
    set(0);
    whenVisible($('#pipe'), () => { if (!autoplayed && !reduce) { autoplayed = true; setTimeout(start, 500); } }, null, .45);
  })();

  /* ============ 2. Accuracy chart ============ */
  (() => {
    const svg = $('#accSvg'); if (!svg) return;
    const D = [
      ['Oct 21', 'describer only', 20, 40, null], ['Oct 21', '+ my examples', 31, 40, null], ['Oct 22', 'tuned', 42, 57, [25, 27]],
      ['Oct 22', '88 reviewed', 60, 86, [40, 45]], ['Oct 22', 'round 3', 74, 96, null], ['Oct 24', 'round 4', 203, 263, [148, 164]], ['Oct 24', 'round 5', 321, 385, [262, 276]],
    ];
    const W = 720, H = 330, L = 46, R = 58, Tm = 14, B = 52, x = i => L + i * (W - L - R) / (D.length - 1), y = v => Tm + (100 - v) / 60 * (H - Tm - B);
    const pct = (a, b) => a / b * 100;
    let g = '<g class="grid">'; for (let v = 40; v <= 100; v += 10) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`; g += '</g><g class="axis">';
    for (let v = 40; v <= 100; v += 20) g += `<text x="${L - 10}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`;
    D.forEach((d, i) => g += `<text x="${x(i)}" y="${H - B + 22}" text-anchor="middle">${d[0]}</text><text x="${x(i)}" y="${H - B + 37}" text-anchor="middle" style="opacity:.7">${d[1]}</text>`);
    g += '</g>';
    const s1 = D.map((d, i) => [x(i), y(pct(d[2], d[3]))]), s2 = D.map((d, i) => d[4] ? [x(i), y(pct(...d[4]))] : null).filter(Boolean);
    const path = pts => 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L');
    g += `<path class="s2" d="${path(s2)}" fill="none" stroke-width="2" stroke-linejoin="round"/><path class="s1" d="${path(s1)}" fill="none" stroke-width="2" stroke-linejoin="round"/>`;
    s2.forEach(p => g += `<circle class="dot2" cx="${p[0]}" cy="${p[1]}" r="5"/>`); s1.forEach(p => g += `<circle class="dot1" cx="${p[0]}" cy="${p[1]}" r="5"/>`);
    const l1 = s1[s1.length - 1], l2 = s2[s2.length - 1];
    g += `<text class="lbl" x="${l1[0] + 12}" y="${l1[1] + 4}">83%</text><text class="lbl" x="${l2[0] + 12}" y="${l2[1] + 4}">95%</text>`;
    g += `<line class="xh" id="accX" y1="${Tm}" y2="${H - B}" x1="-10" x2="-10"/>`;
    D.forEach((d, i) => { const w = (W - L - R) / (D.length - 1); g += `<rect data-i="${i}" x="${x(i) - w / 2}" y="${Tm}" width="${w}" height="${H - Tm - B + 40}" fill="transparent"/>`; });
    svg.innerHTML = g;
    const tip = $('#accTip'), xh = $('#accX'), box = $('#acc');
    $$('rect[data-i]', svg).forEach(r => {
      const show = () => {
        const i = +r.dataset.i, d = D[i]; xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i));
        tip.innerHTML = `<div style="font-weight:600;margin-bottom:.35rem">${d[0]} · ${d[1]}</div><div class="r"><span><i style="background:var(--sea-deep)"></i>All answers</span><b>${pct(d[2], d[3]).toFixed(0)}% <span class="muted">(${d[2]}/${d[3]})</span></b></div>` +
          (d[4] ? `<div class="r"><span><i style="background:var(--amber-deep)"></i>When ≥ 80% sure</span><b>${pct(...d[4]).toFixed(0)}% <span class="muted">(${d[4][0]}/${d[4][1]})</span></b></div>` : '<div class="r muted" style="font-size:.75rem">confident subset not measured this round</div>');
        const bb = svg.getBoundingClientRect(), bx = box.getBoundingClientRect(), px = bb.left - bx.left + x(i) / W * bb.width;
        tip.style.left = Math.min(bx.width - 220, Math.max(8, px + 14)) + 'px'; tip.style.top = (bb.top - bx.top + 40) + 'px'; tip.style.opacity = 1;
      };
      r.addEventListener('mouseenter', show); r.addEventListener('click', show);
    });
    svg.addEventListener('mouseleave', () => { tip.style.opacity = 0; xh.setAttribute('x1', -10); xh.setAttribute('x2', -10); });
    $('#accTable').innerHTML = '<tr><th>When</th><th>Round</th><th>All answers</th><th>When ≥ 80% sure</th></tr>' + D.map(d => `<tr><td>${d[0]}</td><td>${d[1]}</td><td>${d[2]}/${d[3]} (${pct(d[2], d[3]).toFixed(0)}%)</td><td>${d[4] ? `${d[4][0]}/${d[4][1]} (${pct(...d[4]).toFixed(0)}%)` : '—'}</td></tr>`).join('');
  })();

  /* ============ 3. Fog of war ============ */
  (() => {
    const cv = $('#fog'); if (!cv) return;
    const W = cv.width, H = cv.height, ctx = cv.getContext('2d');
    const base = document.createElement('canvas'); base.width = W; base.height = H; const b = base.getContext('2d');
    const fog = document.createElement('canvas'); fog.width = W; fog.height = H; const f = fog.getContext('2d');
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // streets: a jittered grid + one river + two diagonals
    const xs = [], ys = []; for (let x = 60; x < W; x += 92 + rnd() * 50) xs.push(x); for (let y = 50; y < H; y += 78 + rnd() * 40) ys.push(y);
    const river = t => [t * W, H * .62 + Math.sin(t * 6.3) * 38 + Math.sin(t * 15) * 9];
    function drawBase() {
      b.fillStyle = '#0c1422'; b.fillRect(0, 0, W, H);
      for (let i = 0; i < 320; i++) { b.fillStyle = `rgba(52,78,118,${.35 + rnd() * .4})`; const w = 10 + rnd() * 26, h = 8 + rnd() * 20; b.fillRect(rnd() * W, rnd() * H, w, h); }
      b.fillStyle = 'rgba(40,110,78,.45)'; b.beginPath(); b.ellipse(W * .78, H * .22, 90, 50, .3, 0, 7); b.fill();
      b.beginPath(); for (let i = 0; i <= 80; i++) { const [px, py] = river(i / 80); i ? b.lineTo(px, py - 22) : b.moveTo(px, py - 22); } for (let i = 80; i >= 0; i--) { const [px, py] = river(i / 80); b.lineTo(px, py + 22); } b.closePath();
      const gr = b.createLinearGradient(0, H * .5, 0, H * .8); gr.addColorStop(0, '#0b2a44'); gr.addColorStop(1, '#08203a'); b.fillStyle = gr; b.fill();
      const road = (draw, w, c, glow) => { b.save(); b.strokeStyle = c; b.lineWidth = w; b.lineCap = 'round'; b.shadowColor = glow; b.shadowBlur = glow ? 10 : 0; b.beginPath(); draw(); b.stroke(); b.restore(); };
      const grid = () => { xs.forEach(x => { b.moveTo(x, 0); b.lineTo(x + 18, H); }); ys.forEach(y => { b.moveTo(0, y); b.lineTo(W, y + 12); }); };
      road(grid, 6, '#173556'); road(grid, 2, '#3f97de', '#2f8fe0');
      const hw = () => { b.moveTo(0, H * .95); b.bezierCurveTo(W * .3, H * .7, W * .55, H * .2, W, H * .08); };
      road(hw, 10, '#1a4170'); road(hw, 3, '#7fd6ff', '#3fb6ff');
      for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * H; b.fillStyle = ['#f5c542', '#c58cff', '#5fe0a8'][i % 3]; b.shadowColor = b.fillStyle; b.shadowBlur = 8; b.beginPath(); b.arc(x, y, 3.2, 0, 7); b.fill(); }
      b.shadowBlur = 0;
    }
    const CELL = 20, cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL); let seen = new Uint8Array(cols * rows), seenN = 0;
    function resetFog() {
      f.globalCompositeOperation = 'source-over'; f.fillStyle = '#04060a'; f.fillRect(0, 0, W, H);
      for (let i = 0; i < 1400; i++) { f.fillStyle = `rgba(40,55,80,${rnd() * .08})`; f.beginPath(); f.arc(rnd() * W, rnd() * H, 6 + rnd() * 40, 0, 7); f.fill(); }
      seen = new Uint8Array(cols * rows); seenN = 0; trail.length = 0; upd();
    }
    const R = 56;
    function reveal(x, y) {
      f.globalCompositeOperation = 'destination-out';
      const g = f.createRadialGradient(x, y, R * .35, x, y, R); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = g; f.beginPath(); f.arc(x, y, R, 0, 7); f.fill();
      const c0 = Math.floor((x - R * .7) / CELL), c1 = Math.floor((x + R * .7) / CELL), r0 = Math.floor((y - R * .7) / CELL), r1 = Math.floor((y + R * .7) / CELL);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && c >= 0 && r < rows && c < cols && !seen[r * cols + c]) { const dx = (c + .5) * CELL - x, dy = (r + .5) * CELL - y; if (dx * dx + dy * dy < (R * .7) ** 2) { seen[r * cols + c] = 1; seenN++; } }
    }
    const upd = () => { $('#fogKm').textContent = (seenN * .0016).toFixed(2) + ' km²'; $('#fogPct').textContent = Math.round(seenN / (cols * rows) * 100) + '%'; };
    // car: follows the pointer, or drives itself along the grid
    const car = { x: xs[1], y: ys[1], h: 0, tx: xs[1], ty: ys[1] }; const trail = [];
    let ptr = null, lastPtr = 0, auto = { ax: 'x', target: null };
    const P = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    cv.addEventListener('pointermove', e => { ptr = P(e); lastPtr = performance.now(); $('#fogHint').style.opacity = 0; });
    cv.addEventListener('pointerdown', e => { ptr = P(e); lastPtr = performance.now(); });
    const nearest = (arr, v) => arr.reduce((a, c) => Math.abs(c - v) < Math.abs(a - v) ? c : a, arr[0]);
    function autopilot() {
      if (!auto.target || Math.hypot(auto.target[0] - car.x, auto.target[1] - car.y) < 4) {
        // pick a neighbouring intersection, preferring unexplored ground
        const cx = nearest(xs, car.x), cy = nearest(ys, car.y), opts = [];
        const xi = xs.indexOf(cx), yi = ys.indexOf(cy);
        [[xi + 1, yi], [xi - 1, yi], [xi, yi + 1], [xi, yi - 1]].forEach(([a, c]) => { if (a >= 0 && c >= 0 && a < xs.length && c < ys.length) opts.push([xs[a] + c / ys.length * 18 * 0, ys[c]]); });
        opts.sort((p, q) => { const sp = seen[Math.min(rows - 1, Math.floor(p[1] / CELL)) * cols + Math.min(cols - 1, Math.floor(p[0] / CELL))], sq = seen[Math.min(rows - 1, Math.floor(q[1] / CELL)) * cols + Math.min(cols - 1, Math.floor(q[0] / CELL))]; return sp - sq || Math.random() - .5; });
        auto.target = opts[0];
      }
      return auto.target;
    }
    let raf = 0, last = 0;
    function frame(now) {
      const dt = Math.min(50, now - (last || now)); last = now;
      let tx, ty, sp;
      if (ptr && now - lastPtr < 1800) { [tx, ty] = ptr; sp = .0055; auto.target = null; }
      else { [tx, ty] = autopilot(); sp = 0; }
      const dx = tx - car.x, dy = ty - car.y, d = Math.hypot(dx, dy);
      if (sp) { car.x += dx * Math.min(1, sp * dt); car.y += dy * Math.min(1, sp * dt); }
      else if (d > .5) { const v = Math.min(d, .16 * dt); car.x += dx / d * v; car.y += dy / d * v; }
      if (d > 1) { const nh = Math.atan2(dy, dx); let dh = nh - car.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); car.h += dh * Math.min(1, .012 * dt); }
      const lt = trail[trail.length - 1];
      if (!lt || Math.hypot(lt[0] - car.x, lt[1] - car.y) > 4) { trail.push([car.x, car.y, now]); reveal(car.x, car.y); upd(); }
      while (trail.length && now - trail[0][2] > 2600) trail.shift();
      ctx.drawImage(base, 0, 0); ctx.drawImage(fog, 0, 0);
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) { const a = 1 - (now - trail[i][2]) / 2600; ctx.strokeStyle = `rgba(111,211,255,${a * .8})`; ctx.lineWidth = 3 * a + .5; ctx.beginPath(); ctx.moveTo(trail[i - 1][0], trail[i - 1][1]); ctx.lineTo(trail[i][0], trail[i][1]); ctx.stroke(); }
      ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.h);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, 'rgba(111,211,255,.35)'); g.addColorStop(1, 'rgba(111,211,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8f6ff'; ctx.shadowColor = '#6fd3ff'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -7); ctx.lineTo(-4, 0); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill(); ctx.restore();
      raf = requestAnimationFrame(frame);
    }
    drawBase(); resetFog(); $('#fogReset').onclick = () => { resetFog(); car.x = xs[1]; car.y = ys[1]; auto.target = null; };
    ctx.drawImage(base, 0, 0); ctx.drawImage(fog, 0, 0);
    whenVisible(cv, () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); }, () => cancelAnimationFrame(raf));
  })();

  /* ============ 4. Route planner (BFS over streets, around the lake) ============ */
  (() => {
    const cv = $('#route'); if (!cv) return;
    const W = cv.width, H = cv.height, ctx = cv.getContext('2d'), C = 96, Rr = 42, cw = W / C, ch = H / Rr;
    const STREET = 1, LAKE = 2, LOT = 3, grid = new Uint8Array(C * Rr), id = (c, r) => r * C + c;
    const inLake = (c, r) => { const dx = (c - 50) / 15, dy = (r - 21) / 9.5; return dx * dx + dy * dy + .12 * Math.sin(c * .7) * Math.cos(r * .9) < 1; };
    const inLake2 = (c, r) => { const dx = (c - 18) / 7, dy = (r - 30) / 5; return dx * dx + dy * dy < 1; };
    for (let r = 0; r < Rr; r++) for (let c = 0; c < C; c++) if (inLake(c, r) || inLake2(c, r)) grid[id(c, r)] = LAKE;
    const hs = [3, 11, 19, 27, 35, 39], vs = [3, 13, 24, 35, 46, 57, 68, 79, 92];
    hs.forEach(r => { for (let c = 3; c <= 92; c++) if (grid[id(c, r)] !== LAKE) grid[id(c, r)] = STREET; });
    vs.forEach(c => { for (let r = 3; r <= 39; r++) if (grid[id(c, r)] !== LAKE) grid[id(c, r)] = STREET; });
    // lots: cells next to a street, not street or lake, every other cell along the street
    const lots = [];
    for (let r = 1; r < Rr - 1; r++) for (let c = 1; c < C - 1; c++) {
      if (grid[id(c, r)]) continue;
      const adj = [[c, r - 1], [c, r + 1], [c - 1, r], [c + 1, r]].find(([a, b]) => grid[id(a, b)] === STREET);
      if (adj && (c + r) % 2 === 0) { grid[id(c, r)] = LOT; lots.push({ c, r, s: adj }); }
    }
    const AG = ['#4ea8ff', '#ff6fae', '#ffd23f'];
    const bfs = (sc, sr) => { const dist = new Int32Array(C * Rr).fill(-1), par = new Int32Array(C * Rr).fill(-1), q = [id(sc, sr)]; dist[q[0]] = 0;
      for (let h = 0; h < q.length; h++) { const u = q[h], c = u % C, r = (u / C) | 0;
        for (const [a, b] of [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]) { if (a < 0 || b < 0 || a >= C || b >= Rr) continue; const v = id(a, b); if (grid[v] !== STREET || dist[v] >= 0) continue; dist[v] = dist[u] + 1; par[v] = u; q.push(v); } }
      return { dist, par }; };
    let plan = null, raf = 0, t0 = 0;
    function newRun() {
      const n = 9 + Math.floor(Math.random() * 6), pick = []; const pool = lots.slice();
      while (pick.length < n && pool.length) { const L = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; if (pick.every(p => Math.abs(p.c - L.c) + Math.abs(p.r - L.r) > 6)) pick.push({ ...L, a: pick.length % 3 }); }
      // greedy nearest-by-street-distance order, from the entrance
      let cur = [3, 19], left = pick.slice(), path = [], order = [];
      while (left.length) {
        const { dist, par } = bfs(...cur); left.sort((p, q) => dist[id(...p.s)] - dist[id(...q.s)]); const nx = left.shift();
        let v = id(...nx.s), seg = []; while (v >= 0) { seg.push(v); v = par[v]; } seg.reverse(); path.push(...seg); order.push(nx); cur = nx.s;
      }
      plan = { pick, path, order }; $('#rtLots').textContent = pick.length; $('#rtDist').textContent = '0 m'; t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
    }
    const cx = c => (c + .5) * cw, cy = r => (r + .5) * ch;
    function scene() {
      ctx.fillStyle = '#0d2236'; ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < Rr; r++) for (let c = 0; c < C; c++) { const g = grid[id(c, r)]; if (g === LAKE) { ctx.fillStyle = '#0b3a5a'; ctx.fillRect(c * cw, r * ch, cw + .5, ch + .5); } else if (g === LOT) { ctx.fillStyle = '#173a57'; ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4); } }
      ctx.strokeStyle = '#4f7fa8'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.globalAlpha = .55;
      ctx.beginPath(); for (let r = 0; r < Rr; r++) for (let c = 0; c < C; c++) if (grid[id(c, r)] === STREET) { if (c + 1 < C && grid[id(c + 1, r)] === STREET) { ctx.moveTo(cx(c), cy(r)); ctx.lineTo(cx(c + 1), cy(r)); } if (r + 1 < Rr && grid[id(c, r + 1)] === STREET) { ctx.moveTo(cx(c), cy(r)); ctx.lineTo(cx(c), cy(r + 1)); } } ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(160,200,230,.55)'; ctx.font = '600 11px Inter, sans-serif'; ctx.fillText('LAKE', cx(48), cy(21)); ctx.fillText('ENTRANCE', cx(0), cy(17.4));
    }
    function star(x, y, r, col) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
    function draw(now) {
      scene(); if (!plan) return;
      const e = (now - t0) / 1000, starsIn = Math.min(plan.pick.length, e / .12);
      plan.pick.forEach((p, i) => { if (i < starsIn) { const k = Math.min(1, starsIn - i); star(cx(p.c), cy(p.r), 9 * (k < 1 ? 1 + (1 - k) * .8 : 1), AG[p.a]); } });
      const pe = Math.max(0, e - plan.pick.length * .12 - .4), n = Math.min(plan.path.length, Math.floor(pe * 60));
      if (n > 1) {
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3.2; ctx.lineJoin = 'round'; ctx.shadowColor = '#ffb703'; ctx.shadowBlur = 8; ctx.beginPath();
        for (let i = 0; i < n; i++) { const v = plan.path[i], c = v % C, r = (v / C) | 0; i ? ctx.lineTo(cx(c), cy(r)) : ctx.moveTo(cx(c), cy(r)); } ctx.stroke(); ctx.shadowBlur = 0;
        const v = plan.path[n - 1], c = v % C, r = (v / C) | 0; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx(c), cy(r), 5, 0, 7); ctx.fill();
        $('#rtDist').textContent = (n * 8).toLocaleString('en-US') + ' m';
        // numbered pins once reached
        let reached = 0; plan.order.forEach((p, k) => { const sv = id(...p.s), at = plan.path.indexOf(sv); if (at >= 0 && at < n) { reached++; ctx.fillStyle = '#0d2236'; ctx.strokeStyle = AG[p.a]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx(p.c) + 11, cy(p.r) - 11, 8.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '700 10px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(k + 1, cx(p.c) + 11, cy(p.r) - 7.5); ctx.textAlign = 'left'; } });
      }
      if (n < plan.path.length || e < 1) raf = requestAnimationFrame(draw);
    }
    $('#rtNew').onclick = newRun; scene();
    let done = false; whenVisible(cv, () => { if (!done) { done = true; newRun(); } }, null, .4);
  })();

  /* ============ 5. STAG score ============ */
  (() => {
    const box = $('#sliders'); if (!box) return;
    const DIM = [['Title match', 30, 26], ['Skill overlap', 22, 22], ['Domain fit', 12, 12], ['Location', 12, 12], ['Freshness', 8, 8], ['Seniority', 8, 4], ['Salary', 8, 8]];
    const CAPS = [['No title match', 48], ['Far-away on-site', 42], ['Below salary floor', 45], ['Blocking gap (clearance, PhD, license)', 25]];
    box.innerHTML = DIM.map(([n, m, v], i) => `<div class="sl"><label for="d${i}">${n}</label><input type="range" id="d${i}" min="0" max="${m}" value="${v}"><output>${v}/${m}</output></div>`).join('') +
      `<div class="caps">${CAPS.map(([n, c], i) => `<label><input type="checkbox" data-cap="${c}" id="c${i}"> ${n} <span class="muted">≤ ${c}</span></label>`).join('')}</div>`;
    const ins = $$('input[type=range]', box), cks = $$('input[type=checkbox]', box);
    const TIERS = [[80, 'Apply immediately', 'var(--sea)'], [68, 'Strong apply', 'var(--olive)'], [55, 'Consider', 'var(--amber)'], [40, 'Low priority', 'var(--muted)'], [0, 'Skip', 'var(--coral)']];
    const upd = () => {
      let s = 0; ins.forEach((el, i) => { const v = +el.value; s += v; el.nextElementSibling.textContent = `${v}/${DIM[i][1]}`; el.style.setProperty('--p', v / DIM[i][1] * 100 + '%'); });
      const raw = s; let why = '';
      cks.forEach((c, i) => { if (c.checked && s > +c.dataset.cap) { s = +c.dataset.cap; why = `Capped at ${c.dataset.cap}: ${CAPS[i][0].toLowerCase()}. Without the cap it would be ${raw}.`; } });
      const t = TIERS.find(x => s >= x[0]);
      $('#ringN').textContent = s; $('#ringV').style.strokeDashoffset = 100 - s; $('#ringV').style.stroke = t[2];
      $('#ringTier').textContent = t[1]; $('#ringTier').style.color = t[2]; $('#ringWhy').textContent = why || 'Weighted sum of the seven dimensions, out of 100.';
    };
    box.addEventListener('input', upd); upd();
  })();

  /* ============ 6. Exposure ============ */
  (() => {
    const box = $('#expo'); if (!box) return;
    const st = { pos: 3, risk: 6 }, r = $('#riskR');
    const seg = k => $(`.seg[data-k="${k}"]`, box);
    const paint = () => {
      $$('button', seg('pos')).forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === st.pos));
      r.value = st.risk; r.style.setProperty('--p', (st.risk - 1) / 5 * 100 + '%'); $('#riskO').textContent = st.risk + '%';
      const loss = st.pos * st.risk, w = Math.min(100, loss / 18 * 100);
      $('#eLoss').textContent = '−' + (+loss.toFixed(1)) + '%'; $('#eBar').style.width = w + '%'; $('#eBar').style.background = loss > 5 ? 'var(--coral)' : 'var(--olive)';
      $('#eLim').style.left = (5 / 18 * 100) + '%';
      $('#eTxt').innerHTML = loss > 5 ? `${st.pos} correlated position${st.pos > 1 ? 's' : ''} × ${st.risk}% = <b style="color:var(--coral)">${+loss.toFixed(1)}% gone on one wrong call</b> — past the 5% daily stop (red line) in a single trade.` : `<b style="color:var(--olive)">${+loss.toFixed(1)}% worst case</b> — inside the 5% daily stop, with room for the next trade to recover it.`;
      const old = st.pos === 3 && st.risk === 6, nw = st.pos === 1 && st.risk === 2;
      $$('button', seg('mode')).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === 'old' ? old : nw));
    };
    seg('pos').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { st.pos = +b.dataset.v; paint(); } });
    seg('mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; Object.assign(st, b.dataset.v === 'old' ? { pos: 3, risk: 6 } : { pos: 1, risk: 2 }); paint(); });
    r.addEventListener('input', () => { st.risk = +r.value; paint(); });
    paint();
  })();

  /* ============ 7. STL viewer (three.js loaded only when needed) ============ */
  (() => {
    const box = $('#stl'); if (!box) return;
    let started = false;
    const load = () => new Promise((ok, bad) => { if (window.THREE) return ok(); const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
    whenVisible(box, async () => {
      if (started) return; started = true;
      try { await load(); } catch { box.querySelector('.hint').textContent = 'Could not load the 3D viewer.'; return; }
      const buf = await (await fetch('assets/models/charge-dock.stl')).arrayBuffer(), dv = new DataView(buf), n = dv.getUint32(80, true);
      const pos = new Float32Array(n * 9), nor = new Float32Array(n * 9);
      for (let i = 0; i < n; i++) { const o = 84 + i * 50; const nx = dv.getFloat32(o, true), ny = dv.getFloat32(o + 4, true), nz = dv.getFloat32(o + 8, true);
        for (let v = 0; v < 3; v++) { const k = i * 9 + v * 3, p = o + 12 + v * 12; pos[k] = dv.getFloat32(p, true); pos[k + 1] = dv.getFloat32(p + 8, true); pos[k + 2] = -dv.getFloat32(p + 4, true); nor[k] = nx; nor[k + 1] = nz; nor[k + 2] = -ny; } }
      const T = THREE, geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.computeBoundingBox();
      const c = new T.Vector3(); geo.boundingBox.getCenter(c); geo.translate(-c.x, -geo.boundingBox.min.y, -c.z);
      const cv = box.querySelector('canvas'), rend = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); rend.setPixelRatio(Math.min(2, devicePixelRatio));
      const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 4 / 3, 1, 2000);
      scene.add(new T.HemisphereLight(0xf2efe2, 0x20231a, .75)); const sun = new T.DirectionalLight(0xffffff, .85); sun.position.set(120, 200, 140); scene.add(sun); const rim = new T.DirectionalLight(0x7cc6bf, .35); rim.position.set(-150, 80, -120); scene.add(rim);
      const mesh = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x7d8757, roughness: .72, metalness: .02 })); const pivot = new T.Group(); pivot.add(mesh); scene.add(pivot);
      const floor = new T.Mesh(new T.CircleGeometry(110, 64), new T.MeshBasicMaterial({ color: 0x0f100c, transparent: true, opacity: .55 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.2; scene.add(floor);
      cam.position.set(0, 170, 300); cam.lookAt(0, 14, 0);
      let rx = .15, ry = .7, vx = 0, vy = 0, drag = null, idle = 0, vis = true;
      const size = () => { const w = box.clientWidth, h = box.clientHeight; rend.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      size(); addEventListener('resize', size);
      box.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; box.setPointerCapture(e.pointerId); });
      box.addEventListener('pointermove', e => { if (!drag) return; vy = (e.clientX - drag[0]) * .008; vx = (e.clientY - drag[1]) * .006; ry += vy; rx = Math.max(-.5, Math.min(.9, rx + vx)); drag = [e.clientX, e.clientY]; idle = 0; });
      box.addEventListener('pointerup', () => drag = null);
      const loop = () => { if (!vis) return; if (!drag) { ry += vy; vy *= .94; idle++; if (idle > 90) ry += .004; } pivot.rotation.set(rx, ry, 0); rend.render(scene, cam); requestAnimationFrame(loop); };
      loop();
      whenVisible(box, () => { if (!vis) { vis = true; loop(); } }, () => vis = false);
    });
  })();
})();
