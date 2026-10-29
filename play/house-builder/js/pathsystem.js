// ── PATH TYPES ────────────────────────────────────────────────────────────────
const PATH_TYPES = [
    { id:'concrete', name:'Driveway',    icon:'🛣️',  width:12, height:0.15, roughness:0.92, metalness:0.0 },
    { id:'stone',    name:'Walkway',     icon:'🪨',  width: 4, height:0.10, roughness:0.95, metalness:0.0 },
    { id:'gravel',   name:'Gravel',      icon:'🟡',  width: 5, height:0.08, roughness:1.00, metalness:0.0 },
    { id:'brick',    name:'Brick Path',  icon:'🧱',  width: 4, height:0.10, roughness:0.90, metalness:0.0 },
    { id:'slate',    name:'Slate Steps', icon:'🪨',  width: 5, height:0.12, roughness:0.88, metalness:0.0 },
    { id:'dirt',     name:'Dirt Path',   icon:'🟤',  width: 6, height:0.06, roughness:1.00, metalness:0.0 },
    { id:'grass',    name:'Grass Strip', icon:'🟩',  width: 6, height:0.04, roughness:1.00, metalness:0.0 },
];

// ── TEXTURE GENERATORS ────────────────────────────────────────────────────────
const _texCache = {};

function _rnd(min, max) { return min + Math.random() * (max - min); }
function _ri(min, max)  { return Math.floor(_rnd(min, max + 1)); }

function _getTexture(id) {
    if (_texCache[id]) return _texCache[id];
    const c   = document.createElement('canvas');
    c.width   = 512;
    c.height  = 512;
    const ctx = c.getContext('2d');
    _texGenerators[id]?.(ctx, 512, 512);
    const tex  = new THREE.CanvasTexture(c);
    tex.wrapS  = tex.wrapT = THREE.RepeatWrapping;
    _texCache[id] = tex;
    return tex;
}

const _texGenerators = {

    // ── CONCRETE ─────────────────────────────────────────────────────────────
    concrete(ctx, W, H) {
        // Six panels — each a slightly different gray so joints are obvious
        const panelDefs = [
            [0,     0,   W/3,   H/2,  '#aeacaa'],
            [W/3,   0,   W*2/3, H/2,  '#b4b2af'],
            [W*2/3, 0,   W,     H/2,  '#aaa8a5'],
            [0,     H/2, W/3,   H,    '#b2b0ad'],
            [W/3,   H/2, W*2/3, H,    '#a8a6a3'],
            [W*2/3, H/2, W,     H,    '#b0aeab'],
        ];
        panelDefs.forEach(([x0,y0,x1,y1,col]) => {
            ctx.fillStyle = col;
            ctx.fillRect(x0, y0, x1-x0, y1-y0);
        });

        // Large aggregate chunks (visible from distance)
        for (let i = 0; i < 700; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const v = _ri(130, 190);
            const s = _rnd(3, 9);
            ctx.fillStyle = `rgb(${v},${v-1},${v-4})`;
            ctx.fillRect(x, y, s, s);
        }

        // Fine surface texture noise
        for (let i = 0; i < 4500; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const v = _ri(128, 185);
            ctx.fillStyle = `rgb(${v},${v},${v-2})`;
            ctx.fillRect(x, y, _rnd(1,3), _rnd(1,3));
        }

        // Oil/tire stains — dark radial blobs in drive-lane areas
        for (let i = 0; i < 6; i++) {
            const gx = _rnd(W*0.15, W*0.85);
            const gy = _rnd(H*0.1, H*0.9);
            const rad = _rnd(18, 60);
            const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
            grad.addColorStop(0,   `rgba(30,28,24,${_rnd(0.28, 0.45)})`);
            grad.addColorStop(0.6, `rgba(30,28,24,${_rnd(0.08, 0.18)})`);
            grad.addColorStop(1,    'rgba(30,28,24,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(gx-rad, gy-rad, rad*2, rad*2);
        }

        // Cracks inside panels
        ctx.lineCap = 'round';
        for (let i = 0; i < 10; i++) {
            ctx.strokeStyle = `rgba(60,56,50,${_rnd(0.40, 0.65)})`;
            ctx.lineWidth = _rnd(0.8, 2.2);
            ctx.beginPath();
            let cx = _rnd(30, W-30), cy = _rnd(30, H-30);
            ctx.moveTo(cx, cy);
            for (let s = 0; s < _ri(3,7); s++) {
                cx += _rnd(-38, 38);
                cy += _rnd(-22, 22);
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        }

        // Thin hairline sub-cracks
        for (let i = 0; i < 14; i++) {
            ctx.strokeStyle = `rgba(70,66,58,${_rnd(0.2, 0.35)})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(_rnd(0, W), _rnd(0, H));
            ctx.quadraticCurveTo(_rnd(0,W), _rnd(0,H), _rnd(0,W), _rnd(0,H));
            ctx.stroke();
        }

        // ── EXPANSION JOINTS — thick, dark, with shadow + highlight ──────────
        const drawJoint = (x0,y0,x1,y1) => {
            // Outer shadow strip
            ctx.strokeStyle = '#4a4845'; ctx.lineWidth = 9;
            ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
            // Inner dark groove
            ctx.strokeStyle = '#2e2c29'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
            // Center darkest line
            ctx.strokeStyle = '#1c1b18'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
            // Highlight on one edge (lit side)
            const horiz = (y1 === y0);
            const dx = horiz ? 0 : 1, dy = horiz ? 1 : 0;
            ctx.strokeStyle = 'rgba(200,198,195,0.55)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x0+dx, y0+dy); ctx.lineTo(x1+dx, y1+dy); ctx.stroke();
        };

        drawJoint(0, H/2, W, H/2);        // horizontal midline
        drawJoint(W/3, 0, W/3, H);        // vertical 1/3
        drawJoint(2*W/3, 0, 2*W/3, H);    // vertical 2/3
        // Tile-seam joints at top/bottom edges for seamless tiling
        drawJoint(0, 2, W, 2);
        drawJoint(0, H-2, W, H-2);

        // Pebble aggregate at joint edges (concrete detail)
        for (let i = 0; i < 40; i++) {
            const jx = (Math.random() < 0.5) ? W/3 : 2*W/3;
            const jy = Math.random() * H;
            const dist = _rnd(4, 18);
            const side = Math.random() < 0.5 ? -1 : 1;
            ctx.fillStyle = `rgba(${_ri(100,160)},${_ri(98,155)},${_ri(95,150)},${_rnd(0.4,0.8)})`;
            ctx.beginPath();
            ctx.ellipse(jx + side*dist, jy, _rnd(2,6), _rnd(2,5), Math.random()*Math.PI, 0, Math.PI*2);
            ctx.fill();
        }
    },

    // ── STONE PAVERS ─────────────────────────────────────────────────────────
    stone(ctx, W, H) {
        // Mortar / grout background
        ctx.fillStyle = '#4d4b47';
        ctx.fillRect(0, 0, W, H);

        const stoneColors = ['#8a8278','#928c82','#7e7870','#968e84','#857f76','#9c9488'];
        const gap = 14; // grout thickness in pixels

        // Irregular flagstone layout — random polygon-ish rectangles
        for (let attempt = 0; attempt < 80; attempt++) {
            const sw  = _ri(80, 160);
            const sh  = _ri(70, 140);
            const x   = _ri(-sw/2, W - sw/2);
            const y   = _ri(-sh/2, H - sh/2);
            const col = stoneColors[_ri(0, stoneColors.length - 1)];
            const r   = _ri(6, 14); // corner radius

            // Slight color variation per stone
            const voff = _ri(-12, 12);
            const base = parseInt(col.slice(1,3), 16);
            const bv   = Math.min(255, Math.max(80, base + voff));
            const hex  = bv.toString(16).padStart(2, '0');
            ctx.fillStyle = `#${hex}${hex}${(bv - 4).toString(16).padStart(2,'0')}`;

            // Rounded rect
            ctx.beginPath();
            ctx.moveTo(x + r + gap, y + gap);
            ctx.lineTo(x + sw - r - gap, y + gap);
            ctx.arcTo(x + sw - gap, y + gap, x + sw - gap, y + r + gap, r);
            ctx.lineTo(x + sw - gap, y + sh - r - gap);
            ctx.arcTo(x + sw - gap, y + sh - gap, x + sw - r - gap, y + sh - gap, r);
            ctx.lineTo(x + r + gap, y + sh - gap);
            ctx.arcTo(x + gap, y + sh - gap, x + gap, y + sh - r - gap, r);
            ctx.lineTo(x + gap, y + r + gap);
            ctx.arcTo(x + gap, y + gap, x + r + gap, y + gap, r);
            ctx.closePath();
            ctx.fill();

            // Stone edge highlight
            ctx.strokeStyle = `rgba(255,255,255,0.12)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Stone edge shadow (bottom/right)
            ctx.strokeStyle = `rgba(0,0,0,0.25)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + gap + r, y + sh - gap);
            ctx.lineTo(x + sw - gap, y + sh - gap);
            ctx.lineTo(x + sw - gap, y + gap + r);
            ctx.stroke();
        }
    },

    // ── GRAVEL ───────────────────────────────────────────────────────────────
    gravel(ctx, W, H) {
        // Sandy base
        ctx.fillStyle = '#c0a87a';
        ctx.fillRect(0, 0, W, H);

        // Base noise
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const v = _ri(155, 200);
            ctx.fillStyle = `rgb(${v},${_ri(140,180)},${_ri(100,140)})`;
            ctx.fillRect(x, y, _rnd(1,3), _rnd(1,3));
        }

        // Individual pebbles
        const pebbleColors = [
            '#a09080','#909088','#b8a890','#787068','#c8b898',
            '#888880','#a8a098','#706860','#d0c0a0','#b0a890',
        ];
        for (let i = 0; i < 350; i++) {
            const cx  = Math.random() * W;
            const cy  = Math.random() * H;
            const rx  = _rnd(4, 11);
            const ry  = _rnd(3, 8);
            const rot = Math.random() * Math.PI;
            const col = pebbleColors[_ri(0, pebbleColors.length - 1)];
            const voff = _ri(-15, 15);
            const rv   = parseInt(col.slice(1,3), 16) + voff;
            const gv   = parseInt(col.slice(3,5), 16) + voff;
            const bv   = parseInt(col.slice(5,7), 16) + voff;
            const clamp = v => Math.min(255, Math.max(60, v));

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);

            // Pebble body
            ctx.fillStyle = `rgb(${clamp(rv)},${clamp(gv)},${clamp(bv)})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.fillStyle = `rgba(255,255,255,0.18)`;
            ctx.beginPath();
            ctx.ellipse(-rx*0.2, -ry*0.25, rx*0.45, ry*0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shadow
            ctx.fillStyle = `rgba(0,0,0,0.22)`;
            ctx.beginPath();
            ctx.ellipse(rx*0.2, ry*0.3, rx*0.5, ry*0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },

    // ── BRICK ────────────────────────────────────────────────────────────────
    brick(ctx, W, H) {
        // Mortar base
        ctx.fillStyle = '#c4aa82';
        ctx.fillRect(0, 0, W, H);

        const BW   = 85;  // brick width px  (~8" at 4ft = 512px scale)
        const BH   = 28;  // brick height px (~2.6")
        const GAP  = 5;   // mortar thickness
        const brickCols = ['#b04030','#a83828','#b84838','#c05040','#a03020','#bc4c3c'];

        let row = 0;
        for (let y = 0; y < H + BH; y += BH + GAP, row++) {
            const offset = (row % 2) * (BW / 2);
            for (let x = -BW; x < W + BW; x += BW + GAP) {
                const bx = x + offset;
                const col = brickCols[_ri(0, brickCols.length - 1)];
                const voff = _ri(-12, 12);
                const rv = Math.min(200, Math.max(100, parseInt(col.slice(1,3), 16) + voff));
                const gv = Math.min(80,  Math.max(20,  parseInt(col.slice(3,5), 16) + _ri(-8,8)));
                const bv = Math.min(60,  Math.max(10,  parseInt(col.slice(5,7), 16) + _ri(-6,6)));

                // Brick face
                ctx.fillStyle = `rgb(${rv},${gv},${bv})`;
                ctx.fillRect(bx + 1, y + 1, BW - 2, BH - 2);

                // Top highlight
                ctx.fillStyle = `rgba(255,200,150,0.15)`;
                ctx.fillRect(bx + 1, y + 1, BW - 2, 4);

                // Bottom shadow
                ctx.fillStyle = `rgba(0,0,0,0.22)`;
                ctx.fillRect(bx + 1, y + BH - 5, BW - 2, 4);

                // Surface texture dots
                for (let d = 0; d < 8; d++) {
                    const dx = bx + _ri(4, BW - 4);
                    const dy = y  + _ri(4, BH - 4);
                    const dv = _ri(-20, 20);
                    ctx.fillStyle = `rgba(${dv>0?255:0},0,0,${Math.abs(dv)/120})`;
                    ctx.fillRect(dx, dy, 2, 2);
                }
            }
        }
    },

    // ── SLATE STEPPING STONES (random-shape slates, transparent gaps into grass)
    slate(ctx, W, H) {
        ctx.clearRect(0, 0, W, H);

        const slatePalette = [
            '#3c4555','#454e62','#50596c','#3a4250',
            '#484f60','#52596a','#3e4858','#4a5265',
        ];

        // Random-polygon stone generator
        const drawStone = (cx, cy, rx, ry, angle, col) => {
            const nPts = _ri(6, 10);
            ctx.beginPath();
            for (let i = 0; i < nPts; i++) {
                const a = angle + (i / nPts) * Math.PI * 2;
                // Jagged radii for natural slate shape
                const jitter = 0.58 + Math.random() * 0.42;
                const px = cx + Math.cos(a) * rx * jitter;
                const py = cy + Math.sin(a) * ry * jitter;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();

            // Stone fill — slight tone variation
            const voff = _ri(-18, 18);
            const rv = Math.min(200, Math.max(30, parseInt(col.slice(1,3),16) + voff));
            const gv = Math.min(200, Math.max(30, parseInt(col.slice(3,5),16) + voff));
            const bv = Math.min(200, Math.max(30, parseInt(col.slice(5,7),16) + voff));
            ctx.fillStyle = `rgb(${rv},${gv},${bv})`;
            ctx.fill();

            // Cleft lines (slate splits along natural lines)
            ctx.save();
            ctx.clip();
            ctx.strokeStyle = `rgba(20,22,30,${_rnd(0.3,0.55)})`;
            ctx.lineWidth = _rnd(0.8, 1.8);
            for (let l = 0; l < _ri(2, 5); l++) {
                const lx1 = cx + _rnd(-rx*0.9, rx*0.9);
                const ly1 = cy + _rnd(-ry*0.9, ry*0.9);
                ctx.beginPath();
                ctx.moveTo(lx1, ly1);
                ctx.quadraticCurveTo(
                    cx + _rnd(-rx*0.5, rx*0.5),
                    cy + _rnd(-ry*0.5, ry*0.5),
                    cx + _rnd(-rx*0.9, rx*0.9),
                    cy + _rnd(-ry*0.9, ry*0.9)
                );
                ctx.stroke();
            }
            ctx.restore();

            // Top-left edge highlight (light source from upper-left)
            ctx.strokeStyle = 'rgba(180,190,210,0.30)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Bottom-right shadow edge
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Moss / lichen patches near edges
            if (Math.random() < 0.55) {
                ctx.save();
                ctx.clip();
                const mx = cx + _rnd(-rx*0.6, rx*0.6);
                const my = cy + _rnd(-ry*0.6, ry*0.6);
                const mossCol = `rgba(${_ri(35,75)},${_ri(80,130)},${_ri(25,55)},${_rnd(0.25,0.55)})`;
                ctx.fillStyle = mossCol;
                ctx.beginPath();
                ctx.ellipse(mx, my, _rnd(6, 22), _rnd(4, 16), Math.random()*Math.PI, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
            }
        };

        // Layout: scatter stones in a roughly 2-column grid with lots of variation
        // Tile covers path-width × path-width in UV space
        // Place about 6-10 stones per tile, random sizes
        const placed = [];
        const attempts = 80;
        for (let attempt = 0; attempt < attempts; attempt++) {
            const rx = _rnd(W * 0.10, W * 0.38);
            const ry = _rnd(H * 0.08, H * 0.22);
            const cx = _rnd(rx * 0.6, W - rx * 0.6);
            const cy = _rnd(ry * 0.6, H - ry * 0.6);
            const GAP = 14; // minimum gap in px between stone edges

            // Check overlap with already-placed stones
            let ok = true;
            for (const p of placed) {
                const dx = cx - p.cx, dy = cy - p.cy;
                const minDist = rx + p.rx + GAP;
                if (dx*dx + dy*dy < minDist*minDist * 0.55) { ok = false; break; }
            }
            if (!ok) continue;

            placed.push({ cx, cy, rx, ry });
            const col = slatePalette[_ri(0, slatePalette.length-1)];
            const angle = _rnd(-0.4, 0.4); // slight rotation
            drawStone(cx, cy, rx, ry, angle, col);
        }

        // Edge alpha blend so slate also "settles" into surrounding ground
        ctx.globalCompositeOperation = 'destination-in';
        const edgeMask = ctx.createLinearGradient(0, 0, W, 0);
        edgeMask.addColorStop(0.00, 'rgba(0,0,0,0.0)');
        edgeMask.addColorStop(0.06, 'rgba(0,0,0,0.75)');
        edgeMask.addColorStop(0.14, 'rgba(0,0,0,1.0)');
        edgeMask.addColorStop(0.86, 'rgba(0,0,0,1.0)');
        edgeMask.addColorStop(0.94, 'rgba(0,0,0,0.75)');
        edgeMask.addColorStop(1.00, 'rgba(0,0,0,0.0)');
        ctx.fillStyle = edgeMask;
        ctx.fillRect(0, 0, W, H);

        // Organic edge irregularity (smaller bites — stones define edges naturally)
        ctx.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 60; i++) {
            const onLeft = Math.random() < 0.5;
            const cx = onLeft ? Math.random() * W * 0.20 : W - Math.random() * W * 0.20;
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.55 + 0.1})`;
            ctx.beginPath();
            ctx.ellipse(cx, Math.random()*H, _rnd(3,18), _rnd(6,35), Math.random()*Math.PI, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
    },

    // ── DIRT PATH (seamless edge blend into surrounding ground) ──────────────
    dirt(ctx, W, H) {
        ctx.clearRect(0, 0, W, H);

        // Dark earth base
        ctx.fillStyle = '#6b4c30';
        ctx.fillRect(0, 0, W, H);

        // Soil color noise
        for (let i = 0; i < 5000; i++) {
            const x  = Math.random() * W;
            const y  = Math.random() * H;
            const rv = _ri(80, 140);
            const gv = _ri(55,  90);
            const bv = _ri(25,  55);
            ctx.fillStyle = `rgb(${rv},${gv},${bv})`;
            ctx.fillRect(x, y, _rnd(1,5), _rnd(1,4));
        }

        // Tire / footpath tracks (two parallel darker stripes)
        const trackW = 28;
        const tx1 = W * 0.28, tx2 = W * 0.72;
        [tx1, tx2].forEach(tx => {
            const grad = ctx.createLinearGradient(tx - trackW, 0, tx + trackW, 0);
            grad.addColorStop(0,   'rgba(0,0,0,0)');
            grad.addColorStop(0.3, 'rgba(0,0,0,0.25)');
            grad.addColorStop(0.5, 'rgba(0,0,0,0.35)');
            grad.addColorStop(0.7, 'rgba(0,0,0,0.25)');
            grad.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(tx - trackW, 0, trackW * 2, H);
        });

        // Small rocks/pebbles scattered
        for (let i = 0; i < 60; i++) {
            const cx = Math.random() * W;
            const cy = Math.random() * H;
            const r  = _rnd(2, 7);
            ctx.fillStyle = `rgb(${_ri(100,150)},${_ri(85,120)},${_ri(65,95)})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r*0.7, Math.random()*Math.PI, 0, Math.PI*2);
            ctx.fill();
        }

        // Subtle roots / cracks
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random()*W, Math.random()*H);
            ctx.quadraticCurveTo(
                Math.random()*W, Math.random()*H,
                Math.random()*W, Math.random()*H
            );
            ctx.stroke();
        }

        // ── EDGE BLEND: fade alpha at left/right edges so dirt melts into grass ──

        // 1) Smooth horizontal alpha gradient — center solid, edges fade to transparent
        ctx.globalCompositeOperation = 'destination-in';
        const edgeMask = ctx.createLinearGradient(0, 0, W, 0);
        edgeMask.addColorStop(0.00, 'rgba(0,0,0,0.0)');
        edgeMask.addColorStop(0.08, 'rgba(0,0,0,0.6)');
        edgeMask.addColorStop(0.18, 'rgba(0,0,0,1.0)');
        edgeMask.addColorStop(0.82, 'rgba(0,0,0,1.0)');
        edgeMask.addColorStop(0.92, 'rgba(0,0,0,0.6)');
        edgeMask.addColorStop(1.00, 'rgba(0,0,0,0.0)');
        ctx.fillStyle = edgeMask;
        ctx.fillRect(0, 0, W, H);

        // 2) Irregular organic edge "bites" — random transparent blobs in the edge zone
        ctx.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 130; i++) {
            const onLeft = Math.random() < 0.5;
            const edgeZone = W * 0.32;
            const cx = onLeft ? Math.random() * edgeZone : W - Math.random() * edgeZone;
            const cy = Math.random() * H;
            const alpha = Math.random() * 0.65 + 0.1;
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, _rnd(4, 26), _rnd(8, 48), Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3) Overlay sparse grass tufts at the blended edges so it looks like the
        //    ground grass is peeking through rather than a hard cutoff
        ctx.globalCompositeOperation = 'source-over';
        const gcols = ['#3a7a28','#428c30','#4a9838','#326618','#509040'];
        for (let i = 0; i < 50; i++) {
            const onLeft = Math.random() < 0.5;
            const cx = onLeft ? Math.random() * W * 0.30 : W - Math.random() * W * 0.30;
            const cy = Math.random() * H;
            ctx.globalAlpha = Math.random() * 0.55 + 0.1;
            ctx.fillStyle = gcols[_ri(0, gcols.length - 1)];
            ctx.beginPath();
            ctx.ellipse(cx, cy, _rnd(3, 14), _rnd(6, 24), Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    },

    // ── GRASS STRIP ──────────────────────────────────────────────────────────
    grass(ctx, W, H) {
        // Dark base soil
        ctx.fillStyle = '#2d5220';
        ctx.fillRect(0, 0, W, H);

        // Dense grass blades using short strokes
        const grassCols = [
            '#3a7a28','#428c30','#4a9838','#38721e','#509040',
            '#326618','#5aa045','#3e8030','#2a5818','#48a03c',
        ];

        // Base layer — fat blobs
        for (let i = 0; i < 1200; i++) {
            const x   = Math.random() * W;
            const y   = Math.random() * H;
            const col = grassCols[_ri(0, grassCols.length - 1)];
            ctx.fillStyle = col;
            ctx.fillRect(x, y, _rnd(2,8), _rnd(2,6));
        }

        // Blade strokes
        for (let i = 0; i < 800; i++) {
            const x   = Math.random() * W;
            const y   = Math.random() * H;
            const h   = _rnd(6, 18);
            const lean = _rnd(-3, 3);
            const col  = grassCols[_ri(0, grassCols.length - 1)];
            ctx.strokeStyle = col;
            ctx.lineWidth   = _rnd(1, 2.5);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + lean, y - h * 0.6, x + lean * 1.5, y - h);
            ctx.stroke();
        }

        // Sun-bleached lighter tips
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            ctx.fillStyle = `rgba(180,220,100,${_rnd(0.1,0.3)})`;
            ctx.fillRect(x, y, _rnd(1,3), _rnd(1,3));
        }

        // Slightly darker thatch areas
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            ctx.fillStyle = `rgba(0,0,0,${_rnd(0.05,0.12)})`;
            ctx.beginPath();
            ctx.ellipse(x, y, _rnd(15,40), _rnd(10,25), Math.random()*Math.PI, 0, Math.PI*2);
            ctx.fill();
        }
    },
};

// ── PATH SYSTEM ───────────────────────────────────────────────────────────────
class PathSystem {
    constructor(scene, world) {
        this.scene      = scene;
        this.world      = world;
        this.mode       = false;
        this.typeIdx    = 0;
        this.points     = [];
        this.paths      = [];
        this.dotMeshes  = [];
        this.previewMesh = null;
        this.cursorDot   = null;
        this.deleteMode  = false;
        this._delTarget  = null;
        this._delHighlight = null;

        this._buildCursorDot();
    }

    get type() { return PATH_TYPES[this.typeIdx]; }

    _buildCursorDot() {
        const geo = new THREE.SphereGeometry(0.4, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        this.cursorDot = new THREE.Mesh(geo, mat);
        this.cursorDot.visible = false;
        this.scene.add(this.cursorDot);
    }

    setMode(on) {
        this.mode = on;
        this.cursorDot.visible = on;
        const sec = document.getElementById('path-section');
        if (sec) sec.style.display = on ? 'flex' : 'none';
        if (!on) {
            this._clearWork();
            this.setDeleteMode(false);
        }
        this._updateUI();
    }

    setDeleteMode(on) {
        this.deleteMode = on;
        if (!on) this._setDelTarget(null);
        this._updateDeleteBtn();
    }

    _updateDeleteBtn() {
        const btn = document.getElementById('path-delete-btn');
        if (btn) btn.classList.toggle('active', this.deleteMode);
    }

    // Called each frame from _detectHover when delete mode active
    hoverPath(mesh) { this._setDelTarget(mesh || null); }

    _setDelTarget(mesh) {
        this._delTarget = mesh;
        if (!this._delHighlight) {
            const m = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.4 });
            this._delHighlight = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), m);
            this.scene.add(this._delHighlight);
        }
        if (!mesh) { this._delHighlight.visible = false; return; }
        const box = new THREE.Box3().setFromObject(mesh);
        const sz  = box.getSize(new THREE.Vector3());
        const ctr = box.getCenter(new THREE.Vector3());
        this._delHighlight.position.copy(ctr);
        this._delHighlight.scale.set(sz.x + 0.3, sz.y + 0.3, sz.z + 0.3);
        this._delHighlight.visible = true;
    }

    deletePath() {
        if (!this._delTarget) return false;
        const i = this.paths.indexOf(this._delTarget);
        if (i !== -1) { this.scene.remove(this._delTarget); this.paths.splice(i, 1); }
        this._setDelTarget(null);
        return true;
    }

    cycleType(dir) {
        this.typeIdx = (this.typeIdx + dir + PATH_TYPES.length) % PATH_TYPES.length;
        if (this.previewMesh) this._rebuildPreview(this.points);
        this._updateUI();
        return this.type;
    }

    _updateUI() {
        const panel = document.getElementById('path-type-panel');
        if (panel) {
            panel.querySelectorAll('.path-type-btn').forEach((b, i) => {
                b.classList.toggle('active', i === this.typeIdx);
            });
        }
        const lbl = document.getElementById('path-points-label');
        if (lbl) lbl.textContent = this.points.length > 0
            ? `${this.points.length} point${this.points.length > 1 ? 's' : ''} — △/□ to finish`
            : 'E / ✕ to place points';
    }

    buildUI() {
        const panel = document.getElementById('path-type-panel');
        if (!panel) return;
        panel.innerHTML = '';
        PATH_TYPES.forEach((t, i) => {
            const btn = document.createElement('button');
            btn.className = 'path-type-btn' + (i === this.typeIdx ? ' active' : '');
            btn.dataset.idx = i;
            btn.textContent = `${t.icon} ${t.name}`;
            btn.addEventListener('click', () => {
                this.typeIdx = i;
                this._updateUI();
                if (this.previewMesh) this._rebuildPreview(this.points);
            });
            panel.appendChild(btn);
        });
        // Delete path button
        const del = document.createElement('button');
        del.id = 'path-delete-btn';
        del.className = 'path-type-btn' + (this.deleteMode ? ' active' : '');
        del.style.cssText = 'color:#ff6666;border-color:rgba(255,80,80,0.3)';
        del.textContent = '🗑️ Delete Path';
        del.addEventListener('click', () => this.setDeleteMode(!this.deleteMode));
        panel.appendChild(del);
    }

    updateCursor(pos) {
        if (!this.mode || !pos) { this.cursorDot.visible = false; return; }
        this.cursorDot.visible = true;
        this.cursorDot.position.set(pos.x, 0.4, pos.z);
        if (this.points.length >= 1) {
            this._rebuildPreview([...this.points, pos]);
        } else {
            if (this.previewMesh) { this.scene.remove(this.previewMesh); this.previewMesh = null; }
        }
    }

    addPoint(pos) {
        const pt = new THREE.Vector3(pos.x, 0, pos.z);

        if (this.points.length >= 1) {
            const prev  = this.points[this.points.length - 1];
            const stick = this._buildStick(prev, pt);
            this.scene.add(stick);
            this.dotMeshes.push(stick);
        }

        this.points.push(pt);

        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        );
        dot.position.set(pt.x, 0.6, pt.z);
        this.scene.add(dot);
        this.dotMeshes.push(dot);
        this._updateUI();
        return this.points.length;
    }

    _buildStick(a, b) {
        const dx  = b.x - a.x, dz = b.z - a.z;
        const len = Math.sqrt(dx*dx + dz*dz);
        if (len < 0.01) return new THREE.Object3D();
        const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, len, 6),
            new THREE.MeshBasicMaterial({ color: 0xff8800 })
        );
        stick.position.set((a.x+b.x)/2, 0.6, (a.z+b.z)/2);
        stick.rotation.order = 'YXZ';
        stick.rotation.z     = Math.PI / 2;
        stick.rotation.y     = Math.atan2(dx, dz);
        return stick;
    }

    undoPoint() {
        if (this.points.length === 0) return false;
        this.points.pop();
        const dot = this.dotMeshes.pop();
        if (dot) this.scene.remove(dot);
        if (this.points.length >= 1) {
            const stick = this.dotMeshes.pop();
            if (stick) this.scene.remove(stick);
        }
        if (this.points.length >= 1) this._rebuildPreview(this.points);
        else if (this.previewMesh) { this.scene.remove(this.previewMesh); this.previewMesh = null; }
        this._updateUI();
        return true;
    }

    finish() {
        if (this.points.length < 2) return false;
        const mesh = this._buildPathMesh(this.points, false);
        mesh.userData.isPath = true;
        this.scene.add(mesh);
        this.paths.push(mesh);
        this._clearWork();
        return true;
    }

    _clearWork() {
        this.points = [];
        this.dotMeshes.forEach(d => this.scene.remove(d));
        this.dotMeshes = [];
        if (this.previewMesh) { this.scene.remove(this.previewMesh); this.previewMesh = null; }
        this._updateUI();
    }

    _rebuildPreview(pts) {
        if (this.previewMesh) { this.scene.remove(this.previewMesh); this.previewMesh = null; }
        if (!pts || pts.length < 2) return;
        this.previewMesh = this._buildPathMesh(pts, true);
        this.scene.add(this.previewMesh);
    }

    _buildPathMesh(pts, isPreview) {
        const t     = this.type;
        const halfW = t.width / 2;

        const curvePts = pts.map(p => new THREE.Vector3(p.x, 0, p.z));
        const curve    = new THREE.CatmullRomCurve3(curvePts);
        const samples  = Math.max(60, pts.length * 20);

        const sampled = [];
        for (let i = 0; i <= samples; i++) sampled.push(curve.getPoint(i / samples));

        const verts    = [];
        const uvs      = [];
        const idxs     = [];
        let   uAccum   = 0;
        let   prevPerp = null;

        for (let i = 0; i <= samples; i++) {
            const pt   = sampled[i];
            const prev = sampled[Math.max(0, i - 1)];
            const next = sampled[Math.min(samples, i + 1)];

            const tang = new THREE.Vector3(next.x - prev.x, 0, next.z - prev.z);
            if (tang.lengthSq() < 1e-8) tang.set(1, 0, 0);
            tang.normalize();

            let perp = new THREE.Vector3(-tang.z, 0, tang.x);
            if (prevPerp !== null && perp.dot(prevPerp) < 0) perp.negate();
            prevPerp = new THREE.Vector3(perp.x, 0, perp.z);

            if (i > 0) uAccum += pt.distanceTo(sampled[i - 1]);
            const uv = uAccum / t.width;

            // Sample terrain at each edge vertex so path lies on terrain surface
            const lx = pt.x - perp.x * halfW, lz = pt.z - perp.z * halfW;
            const rx = pt.x + perp.x * halfW, rz = pt.z + perp.z * halfW;
            const yL = this.world.sampleHeight(lx, lz) + 0.02;
            const yR = this.world.sampleHeight(rx, rz) + 0.02;

            verts.push(lx, yL, lz,  rx, yR, rz);
            uvs.push(0, uv,  1, uv);

            if (i > 0) {
                const b = (i - 1) * 2;
                idxs.push(b, b+2, b+1,  b+1, b+2, b+3);
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvs),   2));
        geo.setIndex(idxs);
        geo.computeVertexNormals();

        let mat;
        if (isPreview) {
            mat = new THREE.MeshLambertMaterial({
                color: 0x88ccff, transparent: true, opacity: 0.5,
                depthWrite: false, side: THREE.DoubleSide,
            });
        } else {
            const tex        = _getTexture(t.id);
            const blendEdges = t.id === 'dirt' || t.id === 'slate'; // these fade into ground
            mat = new THREE.MeshStandardMaterial({
                map:          tex,
                roughness:    t.roughness,
                metalness:    t.metalness,
                side:         THREE.DoubleSide,
                transparent:  blendEdges,
                // depthWrite true keeps z-ordering correct even with edge transparency
                depthWrite:   true,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits:  -1,
            });
        }

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = !isPreview;
        mesh.userData.isPath  = true;
        mesh.userData.noPaint = true;
        return mesh;
    }

    allMeshes() { return this.paths; }
}
