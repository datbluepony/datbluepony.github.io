// ── PAINT COLORS ──────────────────────────────────────────────────────────────
const PAINTS = [
    // ── Interior / solid colors ───────────────────────────────────────────────
    { name:'White',        color:0xFFFFFF, rough:0.85 },
    { name:'Cream',        color:0xFFFAE6, rough:0.85 },
    { name:'Light Gray',   color:0xD0D0D0, rough:0.85 },
    { name:'Dark Gray',    color:0x555555, rough:0.85 },
    { name:'Charcoal',     color:0x222222, rough:0.85 },
    { name:'Warm Red',     color:0xCC3322, rough:0.85 },
    { name:'Navy Blue',    color:0x0A1F5E, rough:0.85 },
    { name:'Forest Green', color:0x1B5E20, rough:0.85 },
    { name:'Sky Blue',     color:0x5B9BD5, rough:0.85 },
    { name:'Mustard',      color:0xE6A817, rough:0.85 },
    { name:'Terracotta',   color:0xC66B3D, rough:0.85 },
    { name:'Lavender',     color:0x9B7EB8, rough:0.85 },
    { name:'Sage',         color:0x7B9E7A, rough:0.85 },
    { name:'Blush Pink',   color:0xE8A0A0, rough:0.85 },
    { name:'Marble',       color:0xF5F0E8, rough:0.05, metalness:0.0 },
    { name:'Dark Marble',  color:0x2A2A2A, rough:0.05, metalness:0.1 },
    { name:'Oak Wood',     color:0xA0732A, rough:0.9  },
    { name:'Dark Wood',    color:0x3D2010, rough:0.9  },
    { name:'Brick',        color:0xA03020, rough:0.95 },
    { name:'Concrete',     color:0x888888, rough:0.98 },
    { name:'Stainless',    color:0xBBBBBB, rough:0.15, metalness:0.9 },
    { name:'Brass Gold',   color:0xD4AF37, rough:0.2,  metalness:0.85},
    { name:'Copper',       color:0xB87333, rough:0.25, metalness:0.8 },
    { name:'Glass',        color:0x88CCFF, rough:0.0,  transparent:true, opacity:0.25 },
    // ── Exterior siding / textures ────────────────────────────────────────────
    { name:'Lap Siding White',   color:0xF0EDE5, rough:0.80, tex:'lap_white'  },
    { name:'Lap Siding Blue',    color:0x6B8FAD, rough:0.78, tex:'lap_blue'   },
    { name:'Lap Siding Gray',    color:0x9EA8B0, rough:0.80, tex:'lap_gray'   },
    { name:'Board & Batten',     color:0xDDD8CE, rough:0.82, tex:'board_batten'},
    { name:'Cedar Shake',        color:0x9A6B45, rough:0.92, tex:'cedar_shake'},
    { name:'Shiplap White',      color:0xF8F6F0, rough:0.80, tex:'shiplap'    },
    { name:'Stucco Beige',       color:0xE8DFC8, rough:0.94, tex:'stucco'     },
    { name:'Stone Veneer',       color:0x9A8B78, rough:0.90, tex:'stone_veneer'},
    { name:'Exposed Brick',      color:0xA84030, rough:0.93, tex:'exp_brick'  },
    // ── Super-gloss marble & granite ─────────────────────────────────────────
    { name:'Calacatta Marble',   color:0xFAF7F0, rough:0.0,  metalness:0.04, tex:'marble_calacatta' },
    { name:'Nero Marquina',      color:0x141414, rough:0.0,  metalness:0.06, tex:'marble_nero'      },
    { name:'Rosé Marble',        color:0xEDD4C0, rough:0.0,  metalness:0.03, tex:'marble_rose'      },
    { name:'Emerald Granite',    color:0x243D30, rough:0.03, metalness:0.10, tex:'granite_emerald'  },
    { name:'Blue Bahia Granite', color:0x141E35, rough:0.02, metalness:0.12, tex:'granite_blue'     },
];

// ── RAY GUN ───────────────────────────────────────────────────────────────────
class PaintGun {
    constructor(scene, camera) {
        this.scene    = scene;
        this.camera   = camera;
        this.active   = false;
        this.sel      = 0;

        this.raycaster     = new THREE.Raycaster();
        this.raycaster.far = 40;

        // Animation offset vars (updated in tick, consumed in updatePosition)
        this._animY   = 0;   // vertical bob offset
        this._animDZ  = 0;   // recoil Z push-back delta
        this._animRX  = 0;   // pitch rotation
        this._animRZ  = 0;   // roll rotation

        // Animation state
        this._bobT        = 0;
        this._recoilT     = 0;
        this._doingRecoil = false;
        this._reloadT     = 0;
        this._reloadDur   = 0.72;
        this._reloading   = false;
        this._canFire     = true;

        // Camera shake
        this._shakeT   = 0;
        this._shakeDur = 0.28;

        // Live FX
        this._sparks  = [];
        this._beams   = [];
        this._flashes = [];

        this._glowColor  = PAINTS[0].color;
        this._glowMeshes = [];
        this._texCache   = {};

        this._buildGun();
        this._buildUI();
    }

    // ── SIDING TEXTURE GENERATORS ─────────────────────────────────────────────
    _getWallTex(id) {
        if (this._texCache[id]) return this._texCache[id];
        const c = document.createElement('canvas');
        c.width = c.height = 512;
        const ctx = c.getContext('2d');
        this._texGens[id]?.(ctx, 512, 512);
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(2, 2);
        this._texCache[id] = t;
        return t;
    }

    get _texGens() { return PaintGun._texGens || (PaintGun._texGens = this._buildTexGens()); }

    _buildTexGens() {
        const rnd = (a,b) => a + Math.random()*(b-a);
        const ri  = (a,b) => Math.floor(rnd(a, b+1));

        return {
            // Horizontal lap siding — overlapping boards with shadow at top edge
            _lapSiding(ctx, W, H, baseR, baseG, baseB) {
                const boardH = 40;
                ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
                ctx.fillRect(0, 0, W, H);
                for (let y = 0; y < H; y += boardH) {
                    // Board face (slight variation)
                    const dv = ri(-8, 8);
                    ctx.fillStyle = `rgb(${baseR+dv},${baseG+dv},${baseB+dv})`;
                    ctx.fillRect(0, y + 3, W, boardH - 3);
                    // Shadow line at bottom (thick lap shadow)
                    ctx.fillStyle = 'rgba(0,0,0,0.25)';
                    ctx.fillRect(0, y, W, 4);
                    // Highlight at top of each board
                    ctx.fillStyle = 'rgba(255,255,255,0.12)';
                    ctx.fillRect(0, y + 3, W, 2);
                    // Surface texture noise
                    for (let i = 0; i < 120; i++) {
                        const nv = ri(-12, 12);
                        ctx.fillStyle = `rgba(${nv>0?255:0},${nv>0?255:0},${nv>0?255:0},${Math.abs(nv)/180})`;
                        ctx.fillRect(rnd(0,W), rnd(y,y+boardH), rnd(1,4), 1);
                    }
                }
            },
            lap_white(ctx, W, H) { this._lapSiding(ctx, W, H, 240, 237, 229); },
            lap_blue (ctx, W, H) { this._lapSiding(ctx, W, H, 107, 143, 173); },
            lap_gray (ctx, W, H) { this._lapSiding(ctx, W, H, 158, 168, 176); },

            shiplap(ctx, W, H) {
                ctx.fillStyle = '#f0ede5';
                ctx.fillRect(0, 0, W, H);
                const bH = 32;
                for (let y = 0; y < H; y += bH) {
                    ctx.fillStyle = `rgba(0,0,0,0.18)`;
                    ctx.fillRect(0, y, W, 2);
                    ctx.fillStyle = `rgba(255,255,255,0.15)`;
                    ctx.fillRect(0, y + 2, W, 2);
                    for (let i = 0; i < 80; i++) {
                        ctx.fillStyle = `rgba(0,0,0,${rnd(0.01,0.05)})`;
                        ctx.fillRect(rnd(0,W), rnd(y,y+bH), rnd(20,120), 1);
                    }
                }
            },

            board_batten(ctx, W, H) {
                ctx.fillStyle = '#ddd8ce';
                ctx.fillRect(0, 0, W, H);
                const boardW = 52, battenW = 14, gap = 4;
                let x = 0;
                while (x < W) {
                    // Wide board
                    const dv = ri(-10, 10);
                    ctx.fillStyle = `rgb(${221+dv},${216+dv},${206+dv})`;
                    ctx.fillRect(x, 0, boardW, H);
                    ctx.fillStyle = 'rgba(0,0,0,0.12)';
                    ctx.fillRect(x, 0, 2, H);
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(x + boardW - 2, 0, 2, H);
                    x += boardW + gap;
                    // Batten (raised narrow strip)
                    ctx.fillStyle = '#cac4ba';
                    ctx.fillRect(x, 0, battenW, H);
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                    ctx.fillRect(x, 0, 2, H);
                    ctx.fillRect(x + battenW - 2, 0, 2, H);
                    ctx.fillStyle = 'rgba(255,255,255,0.14)';
                    ctx.fillRect(x + 3, 0, battenW - 6, H);
                    x += battenW + gap;
                }
            },

            cedar_shake(ctx, W, H) {
                ctx.fillStyle = '#8B5E3C';
                ctx.fillRect(0, 0, W, H);
                const rowH = 36;
                for (let y = 0; y < H; y += rowH) {
                    const offset = (Math.floor(y / rowH) % 2) * 30;
                    const shakeW = 38 + ri(0, 12);
                    for (let x = -shakeW; x < W + shakeW; x += shakeW + ri(2,6)) {
                        const sx = x + offset;
                        const rv = ri(-18, 18), gv = ri(-12, 12);
                        ctx.fillStyle = `rgb(${139+rv},${94+gv},${60+ri(-10,10)})`;
                        ctx.fillRect(sx, y + 3, shakeW - 2, rowH - 3);
                        // Grain lines
                        for (let g = 0; g < 4; g++) {
                            ctx.strokeStyle = `rgba(0,0,0,${rnd(0.05,0.18)})`;
                            ctx.lineWidth = 0.8;
                            ctx.beginPath();
                            ctx.moveTo(sx + rnd(2, shakeW-2), y + 3);
                            ctx.lineTo(sx + rnd(2, shakeW-2), y + rowH);
                            ctx.stroke();
                        }
                        ctx.fillStyle = 'rgba(0,0,0,0.22)';
                        ctx.fillRect(sx, y, shakeW - 1, 4);
                    }
                }
            },

            stucco(ctx, W, H) {
                ctx.fillStyle = '#e8dfc8';
                ctx.fillRect(0, 0, W, H);
                for (let i = 0; i < 12000; i++) {
                    const v = ri(-15, 15);
                    const sz = rnd(1, 4);
                    ctx.fillStyle = `rgba(${v>0?255:0},${v>0?255:0},${v>0?200:0},${Math.abs(v)/220})`;
                    ctx.fillRect(rnd(0,W), rnd(0,H), sz, sz * rnd(0.5,1.5));
                }
                for (let i = 0; i < 600; i++) {
                    ctx.fillStyle = `rgba(0,0,0,${rnd(0.03,0.08)})`;
                    ctx.beginPath();
                    ctx.ellipse(rnd(0,W), rnd(0,H), rnd(2,8), rnd(1,5), rnd(0,Math.PI), 0, Math.PI*2);
                    ctx.fill();
                }
            },

            stone_veneer(ctx, W, H) {
                ctx.fillStyle = '#7a7060';
                ctx.fillRect(0, 0, W, H);
                const stoneW = [45,55,38,60,42], stoneH = [28,32,25,30,35];
                let y = 0, row = 0;
                while (y < H + 36) {
                    const sh = stoneH[row % stoneH.length];
                    const offset = (row % 2) * 22;
                    let x = -offset;
                    while (x < W + 55) {
                        const sw = stoneW[(x + row * 3) % stoneW.length] + ri(-6, 6);
                        const rv = ri(-20, 20);
                        ctx.fillStyle = `rgb(${154+rv},${139+rv},${120+rv})`;
                        ctx.fillRect(x + 3, y + 3, sw - 6, sh - 6);
                        ctx.fillStyle = `rgba(255,255,255,0.1)`;
                        ctx.fillRect(x + 4, y + 4, sw - 8, 5);
                        ctx.fillStyle = `rgba(0,0,0,0.2)`;
                        ctx.fillRect(x + 4, y + sh - 8, sw - 8, 5);
                        x += sw + 4;
                    }
                    y += sh + 4; row++;
                }
            },

            exp_brick(ctx, W, H) {
                ctx.fillStyle = '#b8907a';
                ctx.fillRect(0, 0, W, H);
                const bW = 78, bH = 26, gap = 5;
                let row2 = 0;
                for (let y = 0; y < H + bH; y += bH + gap, row2++) {
                    const off = (row2 % 2) * (bW / 2);
                    for (let x = -bW; x < W + bW; x += bW + gap) {
                        const bx = x + off;
                        const rv = ri(-18, 18);
                        ctx.fillStyle = `rgb(${168+rv},${80+ri(-12,12)},${50+ri(-10,10)})`;
                        ctx.fillRect(bx+1, y+1, bW-2, bH-2);
                        ctx.fillStyle = 'rgba(255,180,120,0.14)'; ctx.fillRect(bx+1, y+1, bW-2, 5);
                        ctx.fillStyle = 'rgba(0,0,0,0.20)';      ctx.fillRect(bx+1, y+bH-5, bW-2, 4);
                        for (let d = 0; d < 6; d++) {
                            ctx.fillStyle = `rgba(0,0,0,${rnd(0.02,0.06)})`;
                            ctx.fillRect(bx+ri(4,bW-4), y+ri(2,bH-4), rnd(2,10), 1);
                        }
                    }
                }
            },

            // ── shared marble vein helper ────────────────────────────────────
            _marbleVeins(ctx, W, H, veinColor, count, maxWidth, alpha) {
                for (let v = 0; v < count; v++) {
                    const edge = ri(0, 3);
                    let x1, y1;
                    if (edge === 0)      { x1 = rnd(0,W); y1 = 0; }
                    else if (edge === 1) { x1 = W;        y1 = rnd(0,H); }
                    else if (edge === 2) { x1 = rnd(0,W); y1 = H; }
                    else                 { x1 = 0;        y1 = rnd(0,H); }
                    const cpx1 = rnd(W*0.1, W*0.9), cpy1 = rnd(H*0.1, H*0.9);
                    const cpx2 = rnd(W*0.1, W*0.9), cpy2 = rnd(H*0.1, H*0.9);
                    const x2 = rnd(0, W), y2 = rnd(0, H);
                    const w = rnd(0.6, maxWidth);
                    // Wide soft glow
                    ctx.strokeStyle = veinColor.replace(')',`,${alpha * 0.5})`).replace('rgb','rgba');
                    ctx.lineWidth = w + 5;
                    ctx.beginPath(); ctx.moveTo(x1, y1);
                    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
                    ctx.stroke();
                    // Medium halo
                    ctx.strokeStyle = veinColor.replace(')',`,${alpha * 0.75})`).replace('rgb','rgba');
                    ctx.lineWidth = w + 1.5;
                    ctx.beginPath(); ctx.moveTo(x1, y1);
                    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
                    ctx.stroke();
                    // Crisp inner vein — full opacity
                    ctx.strokeStyle = veinColor.replace(')',`,${alpha})`).replace('rgb','rgba');
                    ctx.lineWidth = w;
                    ctx.beginPath(); ctx.moveTo(x1, y1);
                    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
                    ctx.stroke();
                    // Bright white highlight line along vein center
                    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.55})`;
                    ctx.lineWidth = Math.max(0.5, w * 0.3);
                    ctx.beginPath(); ctx.moveTo(x1, y1);
                    ctx.bezierCurveTo(cpx1+1, cpy1-1, cpx2+1, cpy2-1, x2, y2);
                    ctx.stroke();
                }
            },

            marble_calacatta(ctx, W, H) {
                // Bright warm white base
                ctx.fillStyle = '#fdfbf6';
                ctx.fillRect(0, 0, W, H);
                // Cloud tone patches for depth
                for (let i = 0; i < 2000; i++) {
                    const v = ri(-8, 5);
                    ctx.fillStyle = `rgba(${230+v},${225+v},${210+v},${rnd(0.04,0.10)})`;
                    ctx.fillRect(rnd(0,W), rnd(0,H), rnd(15,80), rnd(8,40));
                }
                // Bold dark-gold primary veins
                this._marbleVeins(ctx, W, H, 'rgb(130,108,62)', 5, 3.5, 0.92);
                // Secondary charcoal veins
                this._marbleVeins(ctx, W, H, 'rgb(90,86,80)', 8, 2.0, 0.80);
                // Fine capillary veins
                this._marbleVeins(ctx, W, H, 'rgb(160,148,120)', 16, 0.8, 0.65);
                // Strong gloss sheen — large bright patch
                const gr = ctx.createRadialGradient(W*0.3, H*0.25, 0, W*0.3, H*0.25, W*0.65);
                gr.addColorStop(0,   'rgba(255,255,255,0.55)');
                gr.addColorStop(0.3, 'rgba(255,255,255,0.18)');
                gr.addColorStop(0.7, 'rgba(255,255,255,0.04)');
                gr.addColorStop(1,   'rgba(255,255,255,0.0)');
                ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
            },

            marble_nero(ctx, W, H) {
                // Deep black base with subtle warm gray variation
                ctx.fillStyle = '#181818';
                ctx.fillRect(0, 0, W, H);
                for (let i = 0; i < 5000; i++) {
                    const v = ri(0, 30);
                    ctx.fillStyle = `rgba(${v},${v},${v},${rnd(0.04,0.09)})`;
                    ctx.fillRect(rnd(0,W), rnd(0,H), rnd(2,12), rnd(2,10));
                }
                // Stark bright-white primary veins — high contrast
                this._marbleVeins(ctx, W, H, 'rgb(248,246,240)', 5, 3.2, 0.98);
                // Off-white secondary
                this._marbleVeins(ctx, W, H, 'rgb(210,205,195)', 8, 1.6, 0.85);
                // Silver micro-veins
                this._marbleVeins(ctx, W, H, 'rgb(175,170,165)', 14, 0.7, 0.65);
                // Gloss corner reflection — hot white
                const gr = ctx.createRadialGradient(W*0.12, H*0.08, 0, W*0.5, H*0.5, W*0.75);
                gr.addColorStop(0,   'rgba(255,255,255,0.45)');
                gr.addColorStop(0.25,'rgba(255,255,255,0.12)');
                gr.addColorStop(0.6, 'rgba(255,255,255,0.02)');
                gr.addColorStop(1,   'rgba(255,255,255,0.0)');
                ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
            },

            marble_rose(ctx, W, H) {
                // Bright peachy-pink base
                ctx.fillStyle = '#f0d0bc';
                ctx.fillRect(0, 0, W, H);
                for (let i = 0; i < 2000; i++) {
                    const v = ri(-12, 10);
                    ctx.fillStyle = `rgba(${220+v},${175+v},${155+v},${rnd(0.05,0.12)})`;
                    ctx.fillRect(rnd(0,W), rnd(0,H), rnd(12,75), rnd(6,38));
                }
                // Deep rose-wine primary veins — dark for contrast
                this._marbleVeins(ctx, W, H, 'rgb(148,72,72)', 5, 3.0, 0.90);
                // Mauve secondary veins
                this._marbleVeins(ctx, W, H, 'rgb(170,105,100)', 9, 1.5, 0.75);
                // Gold capillary veins
                this._marbleVeins(ctx, W, H, 'rgb(185,155,110)', 14, 0.6, 0.55);
                // Warm gloss sheen
                const gr = ctx.createRadialGradient(W*0.65, H*0.18, 0, W*0.65, H*0.4, W*0.6);
                gr.addColorStop(0,   'rgba(255,240,235,0.60)');
                gr.addColorStop(0.3, 'rgba(255,225,215,0.20)');
                gr.addColorStop(0.7, 'rgba(255,210,200,0.04)');
                gr.addColorStop(1,   'rgba(255,255,255,0.0)');
                ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
            },

            granite_emerald(ctx, W, H) {
                // Dark forest green base
                ctx.fillStyle = '#1a2e22';
                ctx.fillRect(0, 0, W, H);
                // Crystal populations — brighter range for visibility
                const pops = [
                    { r:[20,55],   g:[70,115],  b:[40,80],   n:2800, sz:[1,4]  }, // dark matrix
                    { r:[60,120],  g:[145,190], b:[85,130],  n:1800, sz:[1,5]  }, // mid green
                    { r:[130,190], g:[200,240], b:[120,170], n:900,  sz:[1,4]  }, // bright green crystal
                    { r:[220,255], g:[245,255], b:[190,230], n:450,  sz:[2,6]  }, // near-white sparkle
                    { r:[240,255], g:[255,255], b:[220,255], n:150,  sz:[3,7]  }, // hot sparkle
                    { r:[60,100],  g:[50,80],   b:[30,60],   n:800,  sz:[1,3]  }, // dark inclusions
                ];
                for (const p of pops) {
                    for (let i = 0; i < p.n; i++) {
                        const r=ri(p.r[0],p.r[1]), g=ri(p.g[0],p.g[1]), b=ri(p.b[0],p.b[1]);
                        const sz = rnd(p.sz[0], p.sz[1]);
                        ctx.fillStyle = `rgb(${r},${g},${b})`;
                        ctx.save();
                        ctx.translate(rnd(0,W), rnd(0,H));
                        ctx.rotate(rnd(0, Math.PI));
                        ctx.fillRect(-sz/2, -sz/4, sz, sz/2);
                        ctx.restore();
                    }
                }
                // Strong gloss sheen
                const gr = ctx.createRadialGradient(W*0.25, H*0.2, 0, W*0.4, H*0.4, W*0.7);
                gr.addColorStop(0,   'rgba(200,255,220,0.55)');
                gr.addColorStop(0.3, 'rgba(140,220,170,0.18)');
                gr.addColorStop(0.7, 'rgba(80,160,110,0.04)');
                gr.addColorStop(1,   'rgba(0,0,0,0.0)');
                ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
            },

            granite_blue(ctx, W, H) {
                // Deep midnight blue-black base
                ctx.fillStyle = '#0d1322';
                ctx.fillRect(0, 0, W, H);
                // Crystal populations — boosted brightness
                const pops = [
                    { r:[15,45],   g:[25,55],   b:[70,130],  n:2500, sz:[1,4]  }, // dark blue matrix
                    { r:[40,90],   g:[65,110],  b:[150,210], n:1600, sz:[1,5]  }, // mid azure
                    { r:[100,170], g:[150,200], b:[220,255], n:700,  sz:[1,4]  }, // bright azure crystal
                    { r:[210,250], g:[225,250], b:[235,255], n:400,  sz:[2,6]  }, // white sparkle
                    { r:[240,255], g:[245,255], b:[255,255], n:120,  sz:[3,8]  }, // hot white
                    { r:[120,170], g:[80,130],  b:[190,240], n:500,  sz:[1,5]  }, // violet
                    { r:[190,230], g:[185,220], b:[175,215], n:250,  sz:[2,7]  }, // silver
                ];
                for (const p of pops) {
                    for (let i = 0; i < p.n; i++) {
                        const r=ri(p.r[0],p.r[1]), g=ri(p.g[0],p.g[1]), b=ri(p.b[0],p.b[1]);
                        const sz = rnd(p.sz[0], p.sz[1]);
                        ctx.fillStyle = `rgb(${r},${g},${b})`;
                        ctx.save();
                        ctx.translate(rnd(0,W), rnd(0,H));
                        ctx.rotate(rnd(0, Math.PI));
                        ctx.fillRect(-sz/2, -sz/4, sz, sz/2);
                        ctx.restore();
                    }
                }
                // Icy blue gloss sheen
                const gr = ctx.createRadialGradient(W*0.72, H*0.12, 0, W*0.6, H*0.45, W*0.72);
                gr.addColorStop(0,   'rgba(180,230,255,0.60)');
                gr.addColorStop(0.3, 'rgba(100,170,240,0.20)');
                gr.addColorStop(0.65,'rgba(50,100,180,0.04)');
                gr.addColorStop(1,   'rgba(0,0,0,0.0)');
                ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
            },
        };
    }

    // ── GUN MODEL ─────────────────────────────────────────────────────────────

    _part(geo, mat, x, y, z) {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        return m;
    }

    // Lambert materials are correctly lit by ambient + directional — no env map needed
    _darkMat() {
        return new THREE.MeshLambertMaterial({ color: 0x1a1a2e, emissive: 0x050510 });
    }

    _accentMat() {
        return new THREE.MeshLambertMaterial({ color: 0x2a2e4a, emissive: 0x08081a });
    }

    _glowMat(alpha = 1) {
        const m = new THREE.MeshBasicMaterial({
            color: this._glowColor, transparent: alpha < 1, opacity: alpha,
        });
        this._glowMeshes.push(m);
        return m;
    }

    _buildGun() {
        const G = new THREE.Group();
        this._gunGroup = G;

        // ── BODY ─────────────────────────────────────────────────────────────
        G.add(this._part(new THREE.BoxGeometry(0.18, 0.20, 0.38), this._darkMat(), 0, 0, 0));

        // Side vents
        for (const sx of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
                G.add(this._part(new THREE.BoxGeometry(0.006, 0.048, 0.038), this._accentMat(),
                    sx * 0.093, 0.012, -0.05 - i * 0.095));
            }
        }

        // ── TANK / ENERGY CHAMBER ─────────────────────────────────────────────
        const tank = this._part(new THREE.SphereGeometry(0.155, 14, 10), this._darkMat(), 0, 0.225, 0.01);
        tank.scale.set(1.30, 1.0, 1.20);
        G.add(tank);

        const chamberMat = this._glowMat(0.88);
        const chamber = this._part(new THREE.SphereGeometry(0.098, 10, 8), chamberMat, 0, 0.225, 0.01);
        chamber.scale.set(1.30, 1.0, 1.20);
        G.add(chamber);
        this._chamberMesh = chamber;

        // ── BARREL ───────────────────────────────────────────────────────────
        const bar = this._part(new THREE.CylinderGeometry(0.040, 0.054, 0.60, 10), this._darkMat(), 0, 0.020, -0.48);
        bar.rotation.x = Math.PI / 2;
        G.add(bar);

        // Hex shroud segments
        for (let i = 0; i < 4; i++) {
            const sh = this._part(new THREE.CylinderGeometry(0.060, 0.060, 0.055, 6), this._accentMat(), 0, 0.020, -0.255 - i * 0.118);
            sh.rotation.x = Math.PI / 2;
            G.add(sh);
        }

        // Glowing ring accents
        for (let i = 0; i < 4; i++) {
            const ring = this._part(new THREE.TorusGeometry(0.060, 0.009, 6, 14), this._glowMat(), 0, 0.020, -0.255 - i * 0.118);
            ring.rotation.x = Math.PI / 2;
            G.add(ring);
        }

        // ── MUZZLE ───────────────────────────────────────────────────────────
        const muzzleBell = this._part(new THREE.CylinderGeometry(0.078, 0.054, 0.055, 10), this._accentMat(), 0, 0.020, -0.782);
        muzzleBell.rotation.x = Math.PI / 2;
        G.add(muzzleBell);

        for (const r of [0.072, 0.052, 0.032]) {
            const mr = this._part(new THREE.TorusGeometry(r, 0.005, 5, 14), this._glowMat(), 0, 0.020, -0.812);
            mr.rotation.x = Math.PI / 2;
            G.add(mr);
        }

        const diskMat = this._glowMat(0.95);
        this._muzzleDisk = this._part(new THREE.CircleGeometry(0.030, 12), diskMat, 0, 0.020, -0.815);
        G.add(this._muzzleDisk);

        // ── GRIP ─────────────────────────────────────────────────────────────
        const grip = this._part(new THREE.BoxGeometry(0.092, 0.235, 0.115),
            new THREE.MeshLambertMaterial({ color: 0x0e0e1e }), 0, -0.218, 0.115);
        grip.rotation.x = -0.20;
        G.add(grip);

        for (let i = 0; i < 4; i++) {
            const ridge = this._part(new THREE.BoxGeometry(0.095, 0.010, 0.115),
                this._accentMat(), 0, -0.14 - i * 0.038, 0.115);
            ridge.rotation.x = -0.20;
            G.add(ridge);
        }

        // Trigger guard
        const tg = this._part(new THREE.TorusGeometry(0.055, 0.011, 5, 10, Math.PI), this._darkMat(), 0, -0.092, 0.065);
        tg.rotation.z = Math.PI / 2;
        G.add(tg);

        // ── STOCK ────────────────────────────────────────────────────────────
        G.add(this._part(new THREE.BoxGeometry(0.090, 0.078, 0.30), this._darkMat(), 0, -0.045, 0.267));
        G.add(this._part(new THREE.BoxGeometry(0.072, 0.12, 0.06),  this._accentMat(), 0, -0.02, 0.41));

        // ── ANTENNA / FIN ─────────────────────────────────────────────────────
        G.add(this._part(new THREE.BoxGeometry(0.036, 0.225, 0.068), this._darkMat(), 0, 0.44, 0.088));
        G.add(this._part(new THREE.BoxGeometry(0.020, 0.030, 0.068), this._accentMat(), 0, 0.56, 0.088));

        const finTip = this._part(new THREE.SphereGeometry(0.022, 6, 4), this._glowMat(), 0, 0.580, 0.088);
        G.add(finTip);

        // ── SCOPE RAIL ───────────────────────────────────────────────────────
        G.add(this._part(new THREE.BoxGeometry(0.058, 0.020, 0.30), this._accentMat(), 0, 0.118, -0.075));

        // ── POINT LIGHTS (small range — only illuminates gun model) ──────────
        this._gunLight = new THREE.PointLight(this._glowColor, 2.8, 1.5);
        this._gunLight.position.set(0, 0.225, 0);
        G.add(this._gunLight);

        this._muzzleLight = new THREE.PointLight(this._glowColor, 0, 0.8);
        this._muzzleLight.position.set(0, 0.020, -0.82);
        G.add(this._muzzleLight);

        // Gun lives in main scene; updatePosition() tracks it to the camera each frame
        G.visible = false;
        this.scene.add(G);
    }

    // ── UI ────────────────────────────────────────────────────────────────────

    _buildUI() {
        this.menuEl = document.getElementById('paint-menu');
        this._renderMenu();
    }

    _renderMenu() {
        if (!this.menuEl) return;
        this.menuEl.innerHTML = '<div style="font-size:0.7rem;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;text-align:center">🎨 D-pad ▲▼ cycle</div>';
        PAINTS.forEach((p, i) => {
            const el = document.createElement('div');
            el.className = 'paint-option' + (i === this.sel ? ' selected' : '');
            el.innerHTML = `<div class="paint-swatch" style="background:#${p.color.toString(16).padStart(6,'0')}"></div><span>${p.name}</span>`;
            el.addEventListener('click', () => { this.sel = i; this._applySelection(); this._renderMenu(); });
            this.menuEl.appendChild(el);
        });
        requestAnimationFrame(() => {
            const sel = this.menuEl.querySelector('.paint-option.selected');
            if (sel) sel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }

    _applySelection() {
        const p = PAINTS[this.sel];
        this._glowColor = p.color;
        this._glowMeshes.forEach(m => m.color.setHex(p.color));
        this._gunLight.color.setHex(p.color);
        this._muzzleLight.color.setHex(p.color);
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────

    toggle(on) {
        this.active = on;
        this._gunGroup.visible = on;
        this.menuEl.style.display = on ? 'flex' : 'none';
        if (on) {
            this._applySelection();
            window.G?.audio?.playGunEquip();
        } else {
            this._gunLight.intensity   = 0;
            this._muzzleLight.intensity = 0;
        }
    }

    cyclePrev() { this.sel = (this.sel - 1 + PAINTS.length) % PAINTS.length; this._applySelection(); this._renderMenu(); }
    cycleNext() { this.sel = (this.sel + 1) % PAINTS.length;                 this._applySelection(); this._renderMenu(); }

    // Called every frame from main loop to keep gun glued to camera in world space
    updatePosition(cam) {
        if (!this._gunGroup || !this.active) return;
        const off = new THREE.Vector3(0.36, -0.31 + this._animY, -0.65 + this._animDZ);
        off.applyQuaternion(cam.quaternion);
        this._gunGroup.position.copy(cam.position).add(off);
        this._gunGroup.quaternion.copy(cam.quaternion);
        this._gunGroup.rotateY(0.075);
        this._gunGroup.rotateX(this._animRX);
        this._gunGroup.rotateZ(this._animRZ);
    }

    shoot(cam, targets) {
        if (!this._canFire) return false;

        this.raycaster.setFromCamera({ x:0, y:0 }, cam);
        const meshes = [];
        targets.forEach(t => {
            if (t.userData.noPaint || t.userData.isPath) return;
            t.traverse(c => { if (c.isMesh) meshes.push(c); });
        });
        const hits = this.raycaster.intersectObjects(meshes);
        if (!hits.length) return false;

        const hit = hits[0];
        this._paint(hit.object, hit.face ? hit.face.materialIndex : null);

        const muzzleWorld = this._muzzleWorldPos();
        this._spawnBeam(muzzleWorld, hit.point);
        this._spawnSparks(hit.point, hit.face?.normal ?? new THREE.Vector3(0,1,0));
        this._spawnMuzzleFlash(muzzleWorld);

        this._doingRecoil = true;
        this._recoilT     = 0;
        this._shakeT      = this._shakeDur;
        this._muzzleLight.intensity = 6;

        this._canFire   = false;
        this._reloading = true;
        this._reloadT   = 0;

        window.G?.audio?.playGunFire();
        return true;
    }

    // ── INTERNALS ─────────────────────────────────────────────────────────────

    _muzzleWorldPos() {
        const off = new THREE.Vector3(0.36, -0.29, -1.465);
        off.applyQuaternion(this.camera.quaternion);
        return this.camera.position.clone().add(off);
    }

    _paint(mesh, faceMatIdx) {
        const p = PAINTS[this.sel];

        const applyToMat = (mat) => {
            const m = mat.clone();
            m.color.setHex(p.color);
            if (m.roughness !== undefined) {
                m.roughness = p.rough     ?? 0.85;
                m.metalness = p.metalness ?? 0.0;
            }
            m.transparent = !!p.transparent;
            m.opacity     = p.transparent ? (p.opacity ?? 0.3) : 1;
            if (p.tex) {
                m.map = this._getWallTex(p.tex);
            } else {
                m.map = null;
            }
            m.needsUpdate = true;
            return m;
        };

        if (Array.isArray(mesh.material)) {
            // Wall mesh: only paint the face that was hit
            if (faceMatIdx !== null && faceMatIdx !== undefined) {
                const mats = mesh.material.map(m => m.clone());
                mats[faceMatIdx] = applyToMat(mesh.material[faceMatIdx]);
                mesh.material = mats;
            }
        } else {
            mesh.material = applyToMat(mesh.material);
        }
    }

    _spawnBeam(from, to) {
        const dir = to.clone().sub(from);
        const len = dir.length();
        if (len < 0.1) return;
        const mid = from.clone().add(to).multiplyScalar(0.5);

        const mat = new THREE.MeshBasicMaterial({
            color: this._glowColor, transparent: true, opacity: 0.9,
            depthWrite: false,
        });
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.032, len, 6), mat);
        beam.position.copy(mid);
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
        this.scene.add(beam);
        this._beams.push({ mesh: beam, life: 1.0, decay: 7.5 });
    }

    _spawnMuzzleFlash(pos) {
        // Small bright burst — no expansion (expansion caused the blue-screen flood)
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 1.0, depthWrite: false,
        });
        const flash = new THREE.Mesh(new THREE.SphereGeometry(0.10, 6, 4), mat);
        flash.position.copy(pos);
        this.scene.add(flash);
        this._flashes.push({ mesh: flash, life: 1.0, decay: 22.0, expand: false });

        // Colored ring accent (thin torus, not a sphere) so it looks dramatic but stays small
        const ringMat = new THREE.MeshBasicMaterial({
            color: this._glowColor, transparent: true, opacity: 0.85, depthWrite: false,
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 4, 12), ringMat);
        ring.position.copy(pos);
        ring.quaternion.copy(this.camera.quaternion);
        this.scene.add(ring);
        this._flashes.push({ mesh: ring, life: 1.0, decay: 14.0, expand: true });
    }

    _spawnSparks(pos, normal) {
        const col = this._glowColor;
        for (let i = 0; i < 18; i++) {
            const r   = 0.03 + Math.random() * 0.05;
            const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1.0, depthWrite: false });
            const sp  = new THREE.Mesh(new THREE.SphereGeometry(r, 4, 4), mat);
            sp.position.copy(pos);
            sp.velocity = new THREE.Vector3(
                (Math.random()-0.5) * 0.45 + normal.x * 0.18,
                Math.random()       * 0.38 + normal.y * 0.18,
                (Math.random()-0.5) * 0.45 + normal.z * 0.18,
            );
            sp.life  = 1.0;
            sp.decay = 0.030 + Math.random() * 0.045;
            this.scene.add(sp);
            this._sparks.push(sp);
        }

        const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0, depthWrite: false });
        const orb    = new THREE.Mesh(new THREE.SphereGeometry(0.10, 6, 4), orbMat);
        orb.position.copy(pos);
        orb.velocity = new THREE.Vector3(0,0,0);
        orb.life  = 1.0;
        orb.decay = 0.12;
        this.scene.add(orb);
        this._sparks.push(orb);
    }

    // ── TICK (animation) ──────────────────────────────────────────────────────
    // Only updates _anim* offset vars; updatePosition() applies them to the gun group

    tick(dt) {
        if (!this.active) {
            this._tickFX(dt);
            return;
        }

        this._bobT += dt;

        // ── IDLE BOB ──────────────────────────────────────────────────────────
        this._animY  = Math.sin(this._bobT * 1.75) * 0.007;
        this._animRZ = Math.sin(this._bobT * 0.88) * 0.0032;
        this._animRX = 0;

        // ── RELOAD ANIMATION ─────────────────────────────────────────────────
        let glowScale = 1.0;
        if (this._reloading) {
            this._reloadT += dt;
            const p = Math.min(1, this._reloadT / this._reloadDur);

            if (p < 0.35) {
                const t = p / 0.35;
                this._animRX  = t * 0.42;
                this._animRZ += t * 0.14;
                this._animY  -= t * 0.07;
                glowScale = 1 - t * 0.85;
            } else if (p < 0.65) {
                this._animRX  = 0.42;
                this._animRZ += 0.14;
                this._animY  -= 0.07;
                glowScale = 0.15;
            } else {
                const t = (p - 0.65) / 0.35;
                this._animRX  = (1-t) * 0.42;
                this._animRZ += (1-t) * 0.14;
                this._animY  -= (1-t) * 0.07;
                glowScale = t;
            }

            if (p >= 1) {
                this._reloading = false;
                this._canFire   = true;
                glowScale = 1.0;
                window.G?.audio?.playGunReload();
            }
        }

        // ── RECOIL ANIMATION ─────────────────────────────────────────────────
        if (this._doingRecoil) {
            this._recoilT += dt / 0.18;
            const p = Math.min(1, this._recoilT);
            if (p < 0.35) {
                const t = p / 0.35;
                this._animDZ  =  t * 0.055;
                this._animRX -= t * 0.12;
                this._animY  += t * 0.018;
            } else {
                const t = (p - 0.35) / 0.65;
                this._animDZ  = (1-t) * 0.055;
                this._animRX -= (1-t) * 0.12;
                this._animY  += (1-t) * 0.018;
            }
            if (p >= 1) { this._doingRecoil = false; this._animDZ = 0; }
        } else {
            this._animDZ = 0;
        }

        // ── GLOW PULSE ───────────────────────────────────────────────────────
        const pulse = 0.85 + Math.sin(this._bobT * 3.5) * 0.15;
        this._gunLight.intensity = 2.8 * pulse * glowScale;
        this._chamberMesh.scale.setScalar(glowScale * 0.92 + 0.08);

        if (this._muzzleLight.intensity > 0) {
            this._muzzleLight.intensity = Math.max(0, this._muzzleLight.intensity - dt * 35);
        }

        // ── CAMERA SHAKE ─────────────────────────────────────────────────────
        if (this._shakeT > 0) {
            this._shakeT -= dt;
            if (this._shakeT < 0) this._shakeT = 0;
            const f   = this._shakeT / this._shakeDur;
            const mag = f * f * 0.028;
            const right = new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);
            const up    = new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);
            this.camera.position.addScaledVector(right, (Math.random()-0.5) * mag);
            this.camera.position.addScaledVector(up,    (Math.random()-0.5) * mag * 0.5);
        }

        this._tickFX(dt);
    }

    _tickFX(dt) {
        for (let i = this._sparks.length-1; i >= 0; i--) {
            const s = this._sparks[i];
            s.position.add(s.velocity);
            s.velocity.y -= 0.015;
            s.life -= s.decay;
            s.material.opacity = Math.max(0, s.life);
            if (s.life <= 0) { this.scene.remove(s); this._sparks.splice(i,1); }
        }

        for (let i = this._beams.length-1; i >= 0; i--) {
            const b = this._beams[i];
            b.life -= b.decay * dt;
            b.mesh.material.opacity = Math.max(0, b.life);
            if (b.life <= 0) { this.scene.remove(b.mesh); this._beams.splice(i,1); }
        }

        for (let i = this._flashes.length-1; i >= 0; i--) {
            const f = this._flashes[i];
            f.life -= f.decay * dt;
            f.mesh.material.opacity = Math.max(0, f.life);
            if (f.expand) f.mesh.scale.setScalar(1 + (1 - f.life) * 1.2);
            if (f.life <= 0) { this.scene.remove(f.mesh); this._flashes.splice(i,1); }
        }
    }

    // No-op — gun renders as part of main scene
    renderGun(_renderer) {}
}
