const WALL_D = 0.5;
const WALL_HEIGHTS = [8, 9, 10, 12];

const OPENING_DEFS = {
    door: {
        label: '🚪 Door', icon: '🚪',
        sizes: [
            { label: "2'8\" Single",   w: 2.667, h: 8.0, style: 'single'  },
            { label: "3'0\" Single",   w: 3.0,   h: 8.0, style: 'single'  },
            { label: "3'6\" Single",   w: 3.5,   h: 8.0, style: 'single'  },
            { label: "6' French",      w: 6.0,   h: 8.0, style: 'french'  },
            { label: "8' Double",      w: 8.0,   h: 8.0, style: 'double'  },
            { label: "3' Dutch",       w: 3.0,   h: 8.0, style: 'dutch'   },
            { label: "4' Sliding",     w: 4.0,   h: 8.0, style: 'sliding' },
            { label: "6' Sliding",     w: 6.0,   h: 8.0, style: 'sliding' },
            { label: "3' Arched",      w: 3.0,   h: 8.0, style: 'arched'  },
        ],
    },
    doorway: {
        label: '🏛️ Doorway', icon: '🏛️',
        sizes: [
            { label: "3' Square",      w: 3.0,  h: 8.0, arch: 'square'  },
            { label: "4' Square",      w: 4.0,  h: 8.0, arch: 'square'  },
            { label: "6' Wide",        w: 6.0,  h: 8.0, arch: 'square'  },
            { label: "8' Grand",       w: 8.0,  h: 9.0, arch: 'square'  },
            { label: "3' Round Arch",  w: 3.0,  h: 7.5, arch: 'round'   },
            { label: "4' Round Arch",  w: 4.0,  h: 7.5, arch: 'round'   },
            { label: "6' Round Arch",  w: 6.0,  h: 7.5, arch: 'round'   },
            { label: "3' Gothic",      w: 3.0,  h: 7.5, arch: 'gothic'  },
            { label: "4' Gothic",      w: 4.0,  h: 7.5, arch: 'gothic'  },
            { label: "6' Gothic",      w: 6.0,  h: 7.5, arch: 'gothic'  },
        ],
    },
    window: {
        label: '🪟 Window', icon: '🪟',
        sizes: [
            { label: "2×3 Small",      w: 2.0, h: 3.0, sillH: 3.5, style: 'standard' },
            { label: "3×4 Standard",   w: 3.0, h: 4.0, sillH: 3.0, style: 'standard' },
            { label: "4×4 Standard",   w: 4.0, h: 4.0, sillH: 3.0, style: 'standard' },
            { label: "6×4 Wide",       w: 6.0, h: 4.0, sillH: 3.0, style: 'standard' },
            { label: "3×5 Tall",       w: 3.0, h: 5.0, sillH: 2.5, style: 'standard' },
            { label: "4×5 Tall",       w: 4.0, h: 5.0, sillH: 2.5, style: 'standard' },
            { label: "8×4 Bay",        w: 8.0, h: 4.0, sillH: 3.0, style: 'standard' },
            { label: "2×6 Narrow",     w: 2.0, h: 6.0, sillH: 1.5, style: 'standard' },
            { label: "3×4 Round Top",  w: 3.0, h: 4.0, sillH: 3.0, style: 'arched'   },
            { label: "4×4 Round Top",  w: 4.0, h: 4.0, sillH: 3.0, style: 'arched'   },
            { label: "3×4 Gothic",     w: 3.0, h: 4.0, sillH: 3.0, style: 'gothic'   },
        ],
    },
    stained: {
        label: '🌈 Stained Glass', icon: '🌈',
        sizes: [
            { label: "3×4 Blue",       w: 3.0, h: 4.0, sillH: 3.0, style: 'stained', glassCol: 0x3377ff },
            { label: "3×4 Red",        w: 3.0, h: 4.0, sillH: 3.0, style: 'stained', glassCol: 0xff3333 },
            { label: "3×4 Green",      w: 3.0, h: 4.0, sillH: 3.0, style: 'stained', glassCol: 0x33cc66 },
            { label: "3×4 Amber",      w: 3.0, h: 4.0, sillH: 3.0, style: 'stained', glassCol: 0xffaa00 },
            { label: "3×4 Purple",     w: 3.0, h: 4.0, sillH: 3.0, style: 'stained', glassCol: 0xaa44ff },
            { label: "4×5 Blue",       w: 4.0, h: 5.0, sillH: 2.5, style: 'stained', glassCol: 0x3377ff },
            { label: "4×5 Amber",      w: 4.0, h: 5.0, sillH: 2.5, style: 'stained', glassCol: 0xffaa00 },
            { label: "3×4 Rose",       w: 3.0, h: 4.0, sillH: 3.0, style: 'stained', glassCol: 0xff66aa },
            { label: "3×6 Cathedral",  w: 3.0, h: 6.0, sillH: 1.5, style: 'stained_arch', glassCol: 0x3377ff },
            { label: "4×6 Cathedral",  w: 4.0, h: 6.0, sillH: 1.5, style: 'stained_arch', glassCol: 0xffaa00 },
        ],
    },
    garage: {
        label: '🏠 Garage', icon: '🏠',
        sizes: [
            { label: "Single 9'",   w: 9.0,  h: 7.5 },
            { label: "Double 16'",  w: 16.0, h: 7.5 },
            { label: "Triple 24'",  w: 24.0, h: 7.5 },
            { label: "RV 12'H",     w: 12.0, h: 12.0 },
        ],
    },
};

const EXT_COL   = 0xd4cfc8;
const INT_COL   = 0xf5f5f0;
const EDGE_COL  = 0xb0a898;
const FRAME_COL = 0x8B6914;
const GLASS_COL = 0x88ccff;

class Building {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.walls = [];         // [{id,start,end,height,extColor,intColor,openings[],group}]

        this.mode        = false;
        this.subMode     = 'draw';   // 'draw' | 'opening' | 'erase'
        this.heightIdx   = 1;        // index into WALL_HEIGHTS
        this.openingType = 'door';
        this.openingSizeIdx = 0;

        this._drawStart    = null;
        this._previewGroup = null;
        this._wallCursorPos = null;

        this._targetWall       = null;
        this._openingCursorX   = 0;
        this._openingPreview   = null;

        this._delTarget    = null;
        this._deleteGhost  = null;
        this._doorAnims    = [];

        // Dummy ghost so main.js visibility checks don't throw
        this.ghost = new THREE.Object3D();
        this.scene.add(this.ghost);

        this._makeDeleteGhost();
    }

    get wallHeight() { return WALL_HEIGHTS[this.heightIdx]; }

    // ── DELETE GHOST ────────────────────────────────────────────────────────
    _makeDeleteGhost() {
        const mat = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.38 });
        this._deleteGhost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
        this._deleteGhost.visible = false;
        this.scene.add(this._deleteGhost);
    }

    // ── MATERIALS ────────────────────────────────────────────────────────────
    _wallMats(extCol = EXT_COL, intCol = INT_COL) {
        return [
            new THREE.MeshLambertMaterial({ color: EDGE_COL }),  // [0] right +x
            new THREE.MeshLambertMaterial({ color: EDGE_COL }),  // [1] left  -x
            new THREE.MeshLambertMaterial({ color: 0x888880 }),  // [2] top
            new THREE.MeshLambertMaterial({ color: 0x888880 }),  // [3] bottom
            new THREE.MeshLambertMaterial({ color: extCol }),    // [4] exterior (+z)
            new THREE.MeshLambertMaterial({ color: intCol }),    // [5] interior (-z)
        ];
    }

    _panelMesh(w, h, x, y, extCol, intCol) {
        if (w < 0.01 || h < 0.01) return null;
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, WALL_D),
            this._wallMats(extCol, intCol)
        );
        m.position.set(x + w / 2, y + h / 2, 0);
        m.userData.isWall = true;
        m.userData.wallFace = 'dual';
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
    }

    _addPanel(group, w, h, x, y, extCol, intCol) {
        const m = this._panelMesh(w, h, x, y, extCol, intCol);
        if (m) group.add(m);
    }

    _lm(col) { return new THREE.MeshLambertMaterial({ color: col }); }

    // ── WALL MESH GENERATION ─────────────────────────────────────────────────
    _buildWallGroup(wallDef) {
        const { start, end, height, extColor = EXT_COL, intColor = INT_COL, openings = [] } = wallDef;
        const dx  = end.x - start.x, dz = end.z - start.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.1) return null;

        const group = new THREE.Group();
        group.userData.isWall   = true;
        group.userData.wallType = 'solid';
        group.position.set(start.x, 0, start.z);
        group.rotation.y = Math.atan2(-dz, dx);

        // Build from sorted openings
        const sorted = [...openings].sort((a, b) => a.offsetX - b.offsetX);
        let cursor = 0;

        for (const op of sorted) {
            if (op.offsetX > cursor + 0.01) {
                this._addPanel(group, op.offsetX - cursor, height, cursor, 0, extColor, intColor);
            }
            this._addOpeningGeom(group, op, height, extColor, intColor);
            cursor = op.offsetX + op.width;
        }

        if (cursor < len - 0.01) {
            this._addPanel(group, len - cursor, height, cursor, 0, extColor, intColor);
        }

        if (group.children.length === 0) {
            this._addPanel(group, len, height, 0, 0, extColor, intColor);
        }

        group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        return group;
    }

    // ── ARCH HELPERS ─────────────────────────────────────────────────────────
    _addArch(group, x, width, yBase, archType, extColor) {
        const cx  = x + width / 2;
        const R   = width / 2;
        const t   = 0.30;
        const fD  = WALL_D + 0.14;
        const mat = this._lm(FRAME_COL);

        if (archType === 'round') {
            // 10 box segments arranged in a semicircle
            const segs = 10;
            for (let i = 0; i < segs; i++) {
                const aMid   = Math.PI * (1 - (i + 0.5) / segs); // PI→0
                const segLen = R * Math.PI / segs * 1.18;
                const mesh   = new THREE.Mesh(
                    new THREE.BoxGeometry(segLen, t, fD), mat
                );
                mesh.position.set(cx + R * Math.cos(aMid), yBase + R * Math.sin(aMid), 0);
                mesh.rotation.z = Math.PI / 2 - aMid;
                group.add(mesh);
            }

        } else if (archType === 'gothic') {
            // Two diagonal beams meeting at a pointed apex — clearly different from round
            const peakY  = yBase + R * 1.35;
            const dy     = peakY - yBase;
            const diagLen = Math.sqrt(R * R + dy * dy);
            const angle  = Math.atan2(dy, R);

            const left = new THREE.Mesh(new THREE.BoxGeometry(diagLen, t, fD), mat);
            left.position.set(cx - R / 2, yBase + dy / 2, 0);
            left.rotation.z = angle;
            group.add(left);

            const right = new THREE.Mesh(new THREE.BoxGeometry(diagLen, t, fD), mat);
            right.position.set(cx + R / 2, yBase + dy / 2, 0);
            right.rotation.z = -angle;
            group.add(right);
        }
        // square: flat header panel already added by caller
    }

    _addOpeningGeom(group, op, wallHeight, extColor, intColor) {
        const { type, offsetX: x, width, height: opH, sillH = 0 } = op;

        if (type === 'doorway') {
            const arch    = op.arch || 'square';
            const headerH = wallHeight - opH;
            if (headerH > 0.01) this._addPanel(group, width, headerH, x, opH, extColor, intColor);
            const fW = 0.12, fD2 = WALL_D + 0.10;
            const fMat = this._lm(FRAME_COL);
            const lj = new THREE.Mesh(new THREE.BoxGeometry(fW, opH, fD2), fMat);
            lj.position.set(x - fW / 2, opH / 2, 0); group.add(lj);
            const rj = new THREE.Mesh(new THREE.BoxGeometry(fW, opH, fD2), fMat);
            rj.position.set(x + width + fW / 2, opH / 2, 0); group.add(rj);
            if (arch === 'square') {
                const hdr = new THREE.Mesh(new THREE.BoxGeometry(width + fW * 2, 0.2, fD2), fMat);
                hdr.position.set(x + width / 2, opH + 0.1, 0); group.add(hdr);
            } else {
                this._addArch(group, x, width, opH, arch, extColor);
            }
            return;
        }

        if (type === 'door' || type === 'garage') {
            const headerH = wallHeight - opH;
            if (headerH > 0.01) this._addPanel(group, width, headerH, x, opH, extColor, intColor);

            if (type === 'door') {
                const style = op.style || 'single';
                const fW = 0.14, fD = WALL_D + 0.10;
                const fMat   = this._lm(FRAME_COL);
                const darkMat = this._lm(0x6B4226);
                const doorMat = this._lm(style === 'dutch' ? 0x5a7a3a : 0x8B6040);

                // Jambs
                const lj = new THREE.Mesh(new THREE.BoxGeometry(fW, opH + 0.18, fD), fMat);
                lj.position.set(x - fW / 2, opH / 2, 0); group.add(lj);
                const rj = new THREE.Mesh(new THREE.BoxGeometry(fW, opH + 0.18, fD), fMat);
                rj.position.set(x + width + fW / 2, opH / 2, 0); group.add(rj);
                const hd = new THREE.Mesh(new THREE.BoxGeometry(width + fW * 2, 0.22, fD), fMat);
                hd.position.set(x + width / 2, opH + 0.11, 0); group.add(hd);
                const sl = new THREE.Mesh(new THREE.BoxGeometry(width + fW * 2, 0.14, fD + 0.06), fMat);
                sl.position.set(x + width / 2, 0.07, 0); group.add(sl);

                // Casing
                const casW = 0.12, casD = 0.06;
                for (const cx2 of [x - fW - casW / 2, x + width + fW + casW / 2]) {
                    const cas = new THREE.Mesh(new THREE.BoxGeometry(casW, opH + 0.3, casD), darkMat);
                    cas.position.set(cx2, opH / 2, WALL_D / 2 + casD / 2); group.add(cas);
                }
                const topCas = new THREE.Mesh(new THREE.BoxGeometry(width + fW * 2 + casW * 2, casW, casD), darkMat);
                topCas.position.set(x + width / 2, opH + casW / 2, WALL_D / 2 + casD / 2); group.add(topCas);

                // Arched door: add arch over door opening
                if (style === 'arched') {
                    this._addArch(group, x, width, opH * 0.82, 'round', extColor);
                }

                // For double / french: two panels
                const panelCount = (style === 'french' || style === 'double') ? 2 : 1;
                const panW = (width - 0.18) / panelCount, panH = opH - 0.12;

                for (let pi = 0; pi < panelCount; pi++) {
                    const px = x + 0.09 + pi * (panW + 0.06);
                    const pivot = new THREE.Group();
                    pivot.position.set(px, 0.12, WALL_D / 2 + 0.07);
                    pivot.userData.isDoorPivot = true;
                    pivot.userData.isOpen      = false;
                    pivot.userData.targetRotY  = 0;
                    pivot.userData.openDir     = pi === 1 ? -1 : 1; // second panel opens opposite

                    if (style === 'sliding') {
                        // Sliding doors don't pivot — just visual panels, no animation
                        const panel = new THREE.Mesh(new THREE.BoxGeometry(panW, panH, 0.10), doorMat);
                        panel.position.set(panW / 2, panH / 2, 0);
                        // Glass strip for sliding doors
                        const glassMat = new THREE.MeshLambertMaterial({ color: GLASS_COL, transparent: true, opacity: 0.5 });
                        const gp = new THREE.Mesh(new THREE.BoxGeometry(panW - 0.3, panH - 0.4, 0.06), glassMat);
                        gp.position.set(panW / 2, panH / 2, 0.07);
                        pivot.add(panel); pivot.add(gp);
                    } else {
                        const panel = new THREE.Mesh(new THREE.BoxGeometry(panW, panH, 0.12), doorMat);
                        panel.position.set(panW / 2, panH / 2, 0);
                        panel.userData.isDoorPanel = true;
                        pivot.add(panel);

                        // Dutch door: horizontal split
                        if (style === 'dutch') {
                            const splitY = panH * 0.52;
                            const topPanel = new THREE.Mesh(new THREE.BoxGeometry(panW, panH - splitY, 0.12), doorMat);
                            topPanel.position.set(panW / 2, splitY + (panH - splitY) / 2, 0.01);
                            const splitBar = new THREE.Mesh(new THREE.BoxGeometry(panW, 0.08, 0.14), fMat);
                            splitBar.position.set(panW / 2, splitY, 0.01);
                            pivot.add(topPanel); pivot.add(splitBar);
                        }

                        // Raised panel detail
                        const raisedMat = this._lm(0x7A5535);
                        const inset = 0.16;
                        const pW2 = Math.max(0.2, panW / 2 - inset - 0.08);
                        const pHt = Math.max(0.2, panH / 2 - inset * 1.5);
                        for (const [px2, py2] of [
                            [inset / 2 + pW2 / 2,         inset + pHt / 2],
                            [panW - inset / 2 - pW2 / 2,  inset + pHt / 2],
                            [inset / 2 + pW2 / 2,         panH / 2 + inset / 2 + pHt / 2],
                            [panW - inset / 2 - pW2 / 2,  panH / 2 + inset / 2 + pHt / 2],
                        ]) {
                            const rp = new THREE.Mesh(new THREE.BoxGeometry(pW2, pHt, 0.04), raisedMat);
                            rp.position.set(px2, py2, 0.08); pivot.add(rp);
                        }

                        // Knob (only on first/single panel)
                        if (pi === 0 || panelCount === 1) {
                            const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), this._lm(0xD4AF37));
                            knob.position.set(panW - 0.35, panH * 0.48, 0.10); pivot.add(knob);
                        }
                    }

                    group.add(pivot);
                    this._doorAnims.push(pivot);
                }

            } else {
                // Garage door slats
                const slats = Math.max(4, Math.round(opH / 1.4));
                const slatH = opH / slats;
                const slatMat = this._lm(0xaaaaaa);
                const railMat = this._lm(0x888888);
                for (let i = 0; i < slats; i++) {
                    const s = new THREE.Mesh(new THREE.BoxGeometry(width - 0.3, slatH - 0.10, 0.10), slatMat);
                    s.position.set(x + width / 2, i * slatH + slatH / 2, WALL_D / 2 + 0.05); group.add(s);
                    const r = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.08, 0.14), railMat);
                    r.position.set(x + width / 2, i * slatH, WALL_D / 2 + 0.07); group.add(r);
                }
            }
            return;
        }

        if (type === 'window' || type === 'stained') {
            const style    = op.style || 'standard';
            const glassCol = op.glassCol || GLASS_COL;
            const topY     = sillH + opH;
            if (sillH > 0.01) this._addPanel(group, width, sillH, x, 0, extColor, intColor);
            const hdrH = wallHeight - topY;
            if (hdrH > 0.01) this._addPanel(group, width, hdrH, x, topY, extColor, intColor);

            const fW = 0.14, fD = WALL_D + 0.08;
            const fMat = this._lm(FRAME_COL);

            const lj2 = new THREE.Mesh(new THREE.BoxGeometry(fW, opH + fW * 2, fD), fMat);
            lj2.position.set(x - fW / 2, sillH + opH / 2, 0); group.add(lj2);
            const rj2 = new THREE.Mesh(new THREE.BoxGeometry(fW, opH + fW * 2, fD), fMat);
            rj2.position.set(x + width + fW / 2, sillH + opH / 2, 0); group.add(rj2);

            const topTrim = new THREE.Mesh(new THREE.BoxGeometry(width + fW * 2, fW, fD), fMat);
            topTrim.position.set(x + width / 2, topY + fW / 2, 0); group.add(topTrim);
            const sillTrim = new THREE.Mesh(new THREE.BoxGeometry(width + fW * 2.5, fW * 1.8, fD + 0.12), fMat);
            sillTrim.position.set(x + width / 2, sillH - fW * 0.9, 0); group.add(sillTrim);

            // Glass — stained glass gets full opacity + vivid color
            const isStained = style === 'stained' || style === 'stained_arch';
            const glassMat  = new THREE.MeshLambertMaterial({
                color: glassCol, transparent: true,
                opacity: isStained ? 0.82 : 0.45,
            });

            const paneCount = width > 4 ? 2 : 1;
            const paneW     = (width - fW) / paneCount;
            for (let pi = 0; pi < paneCount; pi++) {
                const gl = new THREE.Mesh(new THREE.BoxGeometry(paneW - 0.06, opH - fW, 0.05), glassMat);
                gl.position.set(x + fW / 2 + paneW * (pi + 0.5), sillH + opH / 2, 0); group.add(gl);
            }
            if (paneCount > 1) {
                const mull = new THREE.Mesh(new THREE.BoxGeometry(fW * 0.7, opH, fD), fMat);
                mull.position.set(x + width / 2, sillH + opH / 2, 0); group.add(mull);
            }

            // Cross mullion for stained glass
            if (isStained) {
                const hMull = new THREE.Mesh(new THREE.BoxGeometry(width - fW * 0.5, fW * 0.6, fD * 0.7), fMat);
                hMull.position.set(x + width / 2, sillH + opH * 0.45, 0); group.add(hMull);
            }

            // Arched top window
            if (style === 'arched' || style === 'stained_arch') {
                this._addArch(group, x, width, topY, 'round', extColor);
            }

            // Gothic top window
            if (style === 'gothic') {
                this._addArch(group, x, width, topY, 'gothic', extColor);
            }

            // Exterior casing
            const casW2 = 0.10, casD2 = 0.05;
            const darkMat2 = this._lm(0x6B4226);
            for (const cx2 of [x - fW - casW2 / 2, x + width + fW + casW2 / 2]) {
                const c2 = new THREE.Mesh(new THREE.BoxGeometry(casW2, opH + fW * 2 + casW2, casD2), darkMat2);
                c2.position.set(cx2, sillH + opH / 2, WALL_D / 2 + casD2 / 2); group.add(c2);
            }
            const topC2 = new THREE.Mesh(new THREE.BoxGeometry(width + fW * 2 + casW2 * 2, casW2, casD2), darkMat2);
            topC2.position.set(x + width / 2, topY + fW + casW2 / 2, WALL_D / 2 + casD2 / 2); group.add(topC2);
        }
    }

    // ── MODE MANAGEMENT ──────────────────────────────────────────────────────
    setMode(on) {
        this.mode = on;
        this.ghost.visible = false;
        if (!on) {
            this._cancelDraw();
            this.setDeleteTarget(null);
            this._clearOpeningPreview();
            this._targetWall = null;
        }
        if (on) this._buildPanel();
    }

    setSubMode(mode) {
        this.subMode = mode;
        this._cancelDraw();
        this.setDeleteTarget(null);
        this._clearOpeningPreview();
        this._targetWall = null;
        this._buildPanel();
    }

    cycleHeight(dir) {
        this.heightIdx = (this.heightIdx + dir + WALL_HEIGHTS.length) % WALL_HEIGHTS.length;
        this._buildPanel();
    }

    cycleSubMode(dir) {
        const modes = ['draw', 'opening', 'erase'];
        const i = modes.indexOf(this.subMode);
        this.setSubMode(modes[(i + dir + modes.length) % modes.length]);
    }

    cycleOpeningType(dir) {
        const keys = Object.keys(OPENING_DEFS);
        const i = keys.indexOf(this.openingType);
        this.openingType = keys[(i + dir + keys.length) % keys.length];
        this.openingSizeIdx = 0;
        this._buildPanel();
    }

    cycleOpeningSize(dir) {
        const sizes = OPENING_DEFS[this.openingType].sizes;
        this.openingSizeIdx = (this.openingSizeIdx + dir + sizes.length) % sizes.length;
        this._buildPanel();
    }

    // ── DRAW MODE ────────────────────────────────────────────────────────────
    setWallCursor(pos) {
        this._wallCursorPos = pos ? new THREE.Vector3(pos.x, 0, pos.z) : null;
        this._updatePreview();
    }

    _updatePreview() {
        if (this._previewGroup) { this.scene.remove(this._previewGroup); this._previewGroup = null; }
        if (!this._drawStart || !this._wallCursorPos) return;
        const g = this._buildWallGroup({
            start: this._drawStart, end: this._wallCursorPos,
            height: this.wallHeight, openings: [],
        });
        if (!g) return;
        g.traverse(c => {
            if (!c.isMesh) return;
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach(m => { m.transparent = true; m.opacity = 0.5; });
        });
        this.scene.add(g);
        this._previewGroup = g;
    }

    getPreviewLength() {
        if (!this._drawStart || !this._wallCursorPos) return 0;
        const dx = this._wallCursorPos.x - this._drawStart.x;
        const dz = this._wallCursorPos.z - this._drawStart.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    placeWallPoint(pos) {
        const p = new THREE.Vector3(pos.x, 0, pos.z);
        if (!this._drawStart) {
            this._drawStart = p;
            return false;
        }
        const dx = p.x - this._drawStart.x, dz = p.z - this._drawStart.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.5) { this._cancelDraw(); return false; }

        const wallDef = {
            id: Date.now(),
            start:    this._drawStart.clone(),
            end:      p.clone(),
            height:   this.wallHeight,
            extColor: EXT_COL,
            intColor: INT_COL,
            openings: [],
        };
        wallDef.group = this._buildWallGroup(wallDef);
        if (!wallDef.group) { this._cancelDraw(); return false; }
        this.scene.add(wallDef.group);
        this.walls.push(wallDef);
        this._cancelDraw();
        return true;
    }

    _cancelDraw() {
        this._drawStart = null;
        if (this._previewGroup) { this.scene.remove(this._previewGroup); this._previewGroup = null; }
    }

    // ── OPENING MODE ─────────────────────────────────────────────────────────
    setOpeningTarget(wallDef, hitPoint) {
        this._targetWall = wallDef;
        if (!wallDef || !hitPoint) { this._clearOpeningPreview(); return; }
        const { start, end, group } = wallDef;
        const dx = end.x - start.x, dz = end.z - start.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (!group || len < 0.1) return;
        const local = group.worldToLocal(hitPoint.clone());
        this._openingCursorX = Math.max(0, Math.min(len, local.x));
        this._updateOpeningPreview(wallDef);
    }

    _getOpDef() {
        return OPENING_DEFS[this.openingType].sizes[this.openingSizeIdx];
    }

    _clampOpeningOffset(wallDef) {
        const { start, end } = wallDef;
        const dx = end.x - start.x, dz = end.z - start.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const opDef = this._getOpDef();
        const halfW = opDef.w / 2;
        return Math.max(halfW + 0.3, Math.min(len - halfW - 0.3, this._openingCursorX - halfW));
    }

    _updateOpeningPreview(wallDef) {
        this._clearOpeningPreview();
        const opDef = this._getOpDef();
        const op = {
            type: this.openingType, offsetX: this._clampOpeningOffset(wallDef),
            width: opDef.w, height: opDef.h, sillH: opDef.sillH || 0,
        };
        const g = new THREE.Group();
        g.position.copy(wallDef.group.position);
        g.rotation.copy(wallDef.group.rotation);
        this._addOpeningGeom(g, op, wallDef.height, 0x00ff88, 0x00ff88);
        g.traverse(c => {
            if (c.isMesh) {
                const mats = Array.isArray(c.material) ? c.material : [c.material];
                mats.forEach(m => { m = m.clone(); m.transparent = true; m.opacity = 0.55; });
            }
        });
        this.scene.add(g);
        this._openingPreview = g;
    }

    _clearOpeningPreview() {
        if (this._openingPreview) { this.scene.remove(this._openingPreview); this._openingPreview = null; }
    }

    placeOpening() {
        if (!this._targetWall) return false;
        const w = this._targetWall;
        const opDef = this._getOpDef();
        const { start, end } = w;
        const dx = end.x - start.x, dz = end.z - start.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (opDef.w + 0.6 > len) return false;

        w.openings.push({
            type: this.openingType, offsetX: this._clampOpeningOffset(w),
            width: opDef.w, height: opDef.h, sillH: opDef.sillH || 0,
        });
        this._rebuildWall(w);
        this._clearOpeningPreview();
        return true;
    }

    _rebuildWall(wallDef) {
        if (wallDef.group) this.scene.remove(wallDef.group);
        wallDef.group = this._buildWallGroup(wallDef);
        if (wallDef.group) this.scene.add(wallDef.group);
    }

    // ── ERASE MODE ────────────────────────────────────────────────────────────
    setDeleteTarget(wallDef) {
        this._delTarget = wallDef;
        if (!wallDef) { this._deleteGhost.visible = false; return; }
        const { start, end, height } = wallDef;
        const dx = end.x - start.x, dz = end.z - start.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        this._deleteGhost.scale.set(len + 0.2, height + 0.2, WALL_D + 0.2);
        this._deleteGhost.position.set((start.x + end.x) / 2, height / 2, (start.z + end.z) / 2);
        this._deleteGhost.rotation.y = Math.atan2(-dz, dx);
        this._deleteGhost.visible = true;
    }

    deleteTarget() {
        if (!this._delTarget) return;
        const i = this.walls.indexOf(this._delTarget);
        if (i !== -1) { this.scene.remove(this._delTarget.group); this.walls.splice(i, 1); }
        this._delTarget = null;
        this._deleteGhost.visible = false;
    }

    // ── DOOR ANIMATION ────────────────────────────────────────────────────────
    findWallDef(mesh) {
        let obj = mesh;
        while (obj) {
            const wd = this.walls.find(w => w.group === obj);
            if (wd) return wd;
            obj = obj.parent;
        }
        return null;
    }

    _findWall(mesh) {
        const wd = this.findWallDef(mesh);
        return wd ? wd.group : null;
    }

    toggleDoor(wallGroup) {
        let pivot = null;
        wallGroup.traverse(c => { if (c.userData.isDoorPivot && !pivot) pivot = c; });
        if (!pivot) return;
        pivot.userData.isOpen     = !pivot.userData.isOpen;
        pivot.userData.targetRotY = pivot.userData.isOpen ? -Math.PI / 2 : 0;
        if (!this._doorAnims.includes(pivot)) this._doorAnims.push(pivot);
    }

    tickDoors() {
        for (let i = this._doorAnims.length - 1; i >= 0; i--) {
            const p = this._doorAnims[i];
            if (!p || !p.userData) { this._doorAnims.splice(i, 1); continue; }
            const tgt = p.userData.targetRotY;
            p.rotation.y += (tgt - p.rotation.y) * 0.18;
            if (Math.abs(p.rotation.y - tgt) < 0.002) {
                p.rotation.y = tgt;
                this._doorAnims.splice(i, 1);
            }
        }
    }

    // ── ROOF ─────────────────────────────────────────────────────────────────
    generateRoof() {
        if (this.walls.length < 2) return;
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        this.walls.forEach(w => {
            [w.start, w.end].forEach(pt => {
                minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
                minZ = Math.min(minZ, pt.z); maxZ = Math.max(maxZ, pt.z);
            });
        });
        const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
        const ov = 0.5;
        const rw = (maxX - minX) + ov * 2, rd = (maxZ - minZ) + ov * 2;
        const baseY = Math.max(...this.walls.map(w => w.height));
        const peak = 6;

        if (this.roof) this.scene.remove(this.roof);
        const rg = new THREE.Group();
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x7a3f1e, side: THREE.DoubleSide });
        const ridgeMat = new THREE.MeshLambertMaterial({ color: 0x5c2e10 });

        [-1, 1].forEach(side => {
            const geo = new THREE.BufferGeometry();
            const v = new Float32Array([-rw/2,0,side*rd/2, rw/2,0,side*rd/2, rw/2,peak,0, -rw/2,peak,0]);
            const idx = new Uint16Array([0,2,1, 0,3,2]);
            geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
            geo.setIndex(new THREE.BufferAttribute(idx, 1));
            geo.computeVertexNormals();
            rg.add(new THREE.Mesh(geo, roofMat));
        });
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.5, 0.4, 0.4), ridgeMat);
        ridge.position.y = peak; rg.add(ridge);
        [-rw/2, rw/2].forEach(xOff => {
            const geo = new THREE.BufferGeometry();
            const v = new Float32Array([xOff,0,-rd/2, xOff,0,rd/2, xOff,peak,0]);
            geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
            geo.setIndex(new THREE.BufferAttribute(new Uint16Array([0,2,1]), 1));
            geo.computeVertexNormals();
            rg.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xd4cfc8, side: THREE.DoubleSide })));
        });
        rg.position.set(cx, baseY, cz);
        rg.traverse(c => { if (c.isMesh) c.castShadow = true; });
        this.roof = rg;
        this.scene.add(rg);
    }

    wallMeshes() { return this.walls.map(w => w.group).filter(Boolean); }

    // All placed wall start/end points — used for corner snapping
    allEndpoints() {
        const pts = [];
        for (const w of this.walls) {
            pts.push(new THREE.Vector3(w.start.x, 0, w.start.z));
            pts.push(new THREE.Vector3(w.end.x,   0, w.end.z));
        }
        return pts;
    }

    // ── BUILD PANEL UI ────────────────────────────────────────────────────────
    _buildPanel() {
        const panel = document.getElementById('build-panel');
        if (!panel) return;
        panel.innerHTML = '';

        // Sub-mode tabs
        const tabs = document.createElement('div');
        tabs.className = 'build-tabs';
        for (const [sm, lbl] of [['draw','✏️ Draw'],['opening','🪟 Open'],['erase','🗑️ Erase']]) {
            const b = document.createElement('button');
            b.className = 'build-tab-btn' + (this.subMode === sm ? ' active' : '');
            b.textContent = lbl;
            b.addEventListener('click', () => this.setSubMode(sm));
            tabs.appendChild(b);
        }
        panel.appendChild(tabs);

        const hint = document.createElement('div');
        hint.className = 'build-hint';
        panel.appendChild(hint);

        if (this.subMode === 'draw') {
            hint.textContent = 'Click ground twice to draw a wall';
            this._appendLabel(panel, 'Wall Height');
            const hRow = document.createElement('div');
            hRow.className = 'build-row';
            WALL_HEIGHTS.forEach((h, i) => {
                const b = document.createElement('button');
                b.className = 'wall-type-btn' + (i === this.heightIdx ? ' active' : '');
                b.textContent = h + "'";
                b.addEventListener('click', () => { this.heightIdx = i; this._buildPanel(); });
                hRow.appendChild(b);
            });
            panel.appendChild(hRow);

        } else if (this.subMode === 'opening') {
            hint.textContent = 'Aim at wall, then E / ✕ to add';
            this._appendLabel(panel, 'Opening Type');
            for (const [key, def] of Object.entries(OPENING_DEFS)) {
                const b = document.createElement('button');
                b.className = 'wall-type-btn' + (this.openingType === key ? ' active' : '');
                b.textContent = def.label;
                b.addEventListener('click', () => { this.openingType = key; this.openingSizeIdx = 0; this._buildPanel(); });
                panel.appendChild(b);
            }
            this._appendLabel(panel, 'Size');
            OPENING_DEFS[this.openingType].sizes.forEach((sz, i) => {
                const b = document.createElement('button');
                b.className = 'wall-type-btn' + (i === this.openingSizeIdx ? ' active' : '');
                b.textContent = sz.label;
                b.addEventListener('click', () => { this.openingSizeIdx = i; this._buildPanel(); });
                panel.appendChild(b);
            });

        } else {
            hint.textContent = 'Aim at wall, E / ✕ to delete';
        }

        // Path + roof always at bottom
        const hr = document.createElement('hr'); hr.className = 'panel-divider';
        panel.appendChild(hr);
        const pb = document.createElement('button');
        pb.id = 'path-tool-btn'; pb.className = 'tool-btn';
        pb.textContent = '🛤️ Path Tool [P]';
        pb.addEventListener('click', () => window.G?._togglePath());
        panel.appendChild(pb);

        const ps = document.createElement('div');
        ps.id = 'path-section';
        ps.style.cssText = 'display:none;flex-direction:column;gap:5px;width:100%';
        ps.innerHTML = `<div id="path-points-label" style="font-size:0.7rem;color:#aaa;text-align:center;padding:2px 0">E/✕ place points</div><div id="path-type-panel" style="display:flex;flex-direction:column;gap:4px"></div><div style="font-size:0.62rem;color:#555;text-align:center;line-height:1.5">△/□=Finish &nbsp; ⭕=Undo</div>`;
        panel.appendChild(ps);
        window.G?.paths?.buildUI?.();

        const rb = document.createElement('button');
        rb.className = 'tool-btn'; rb.textContent = '🏠 Gen Roof [F]';
        rb.addEventListener('click', () => window.G?.building?.generateRoof());
        panel.appendChild(rb);
    }

    _appendLabel(parent, text) {
        const h = document.createElement('h3');
        h.textContent = text;
        parent.appendChild(h);
    }
}
