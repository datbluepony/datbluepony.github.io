// ── RAISED PLANTER BED SYSTEM ─────────────────────────────────────────────────
// Two-corner rect tool (like FloorSystem). Builds a cedar raised planter with
// wood-plank walls and a dirt fill 3/4 up. userData.isPlanter = true for seeds.
class PlanterBedSystem {
    constructor(scene, world) {
        this.scene    = scene;
        this.world    = world;
        this.mode     = false;
        this.beds     = [];
        this._startPt = null;
        this._preview = null;
        this._dimLabel = null;
        this._woodTex  = null;
        this._dirtTex  = null;
    }

    setMode(on) {
        this.mode = on;
        if (!on) this._cancel();
    }

    get drawingStarted() { return !!this._startPt; }

    updateCursor(worldPos) {
        if (!this.mode) { this._clearPreview(); return; }
        if (this._startPt && worldPos) {
            const sx = Math.round(worldPos.x * 2) / 2;
            const sz = Math.round(worldPos.z * 2) / 2;
            this._updatePreview(this._startPt, { x: sx, z: sz });
        } else {
            this._clearPreview();
        }
    }

    interact(worldPos) {
        if (!worldPos) return false;
        const snapped = { x: Math.round(worldPos.x * 2) / 2, z: Math.round(worldPos.z * 2) / 2 };
        if (!this._startPt) {
            this._startPt = snapped;
            return false;
        }
        this._place(this._startPt, snapped);
        this._startPt = null;
        this._clearPreview();
        return true;
    }

    cancel() { this._cancel(); }

    _cancel() {
        this._startPt = null;
        this._clearPreview();
    }

    _clearPreview() {
        if (this._preview)  { this.scene.remove(this._preview); this._preview = null; }
        if (this._dimLabel) { this._dimLabel.remove(); this._dimLabel = null; }
    }

    _updatePreview(a, b) {
        this._clearPreview();
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
        const minZ = Math.min(a.z, b.z), maxZ = Math.max(a.z, b.z);
        const w = (maxX - minX) || 0.2, d = (maxZ - minZ) || 0.2;
        const BED_H = 1.5;

        const mat = new THREE.MeshBasicMaterial({
            color: 0x7B3F1A, transparent: true, opacity: 0.38, depthWrite: false
        });
        this._preview = new THREE.Mesh(new THREE.BoxGeometry(w, BED_H, d), mat);
        this._preview.position.set(minX + w / 2, BED_H / 2, minZ + d / 2);
        this.scene.add(this._preview);

        // CSS dimension label
        this._dimLabel = document.createElement('div');
        Object.assign(this._dimLabel.style, {
            position:  'fixed',
            left:      '50%',
            top:       '41%',
            transform: 'translateX(-50%)',
            color:     '#fff',
            background: 'rgba(0,0,0,.62)',
            padding:   '5px 11px',
            borderRadius: '5px',
            fontSize:  '14px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex:    '1000',
        });
        this._dimLabel.textContent = `🌱 Planter  ${w.toFixed(1)} ft × ${d.toFixed(1)} ft`;
        document.body.appendChild(this._dimLabel);
    }

    _place(a, b) {
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
        const minZ = Math.min(a.z, b.z), maxZ = Math.max(a.z, b.z);
        const w = maxX - minX, d = maxZ - minZ;
        if (w < 0.5 || d < 0.5) return;

        const cx = minX + w / 2, cz = minZ + d / 2;
        const gh = this.world.sampleHeight(cx, cz);

        const BED_H = 1.5;
        const T     = 0.20;   // plank wall thickness

        const group = new THREE.Group();
        group.position.set(cx, gh, cz);

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x7B3F1A, roughness: 0.85, metalness: 0.0,
            map: this._getWoodTex(),
        });
        const dirtMat = new THREE.MeshStandardMaterial({
            color: 0x2E1A08, roughness: 0.97, metalness: 0.0,
            map: this._getDirtTex(),
        });
        const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x5A2E0A, roughness: 0.92 });

        const add = (ww, hh, dd, mat, px, py, pz) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, dd), mat);
            m.position.set(px, py, pz);
            m.castShadow = true;
            m.receiveShadow = true;
            group.add(m);
        };

        // ── Walls (4 cedar plank sides) ──────────────────────────────────────
        // Front / back  (runs along X)
        add(w,       BED_H, T,  woodMat,  0,         BED_H/2, d/2 - T/2);
        add(w,       BED_H, T,  woodMat,  0,         BED_H/2, -d/2 + T/2);
        // Left / right (runs along Z)
        add(T,       BED_H, d - T*2, woodMat, -w/2 + T/2, BED_H/2, 0);
        add(T,       BED_H, d - T*2, woodMat,  w/2 - T/2, BED_H/2, 0);

        // ── Corner posts (slightly darker square lumber) ───────────────────
        const POST = 0.28;
        const postH = BED_H + 0.06;
        const corners = [[-1,-1],[1,-1],[1,1],[-1,1]];
        for (const [cx2, cz2] of corners) {
            add(POST, postH, POST, darkWoodMat,
                cx2 * (w/2 - POST/2),
                postH/2 - 0.03,
                cz2 * (d/2 - POST/2));
        }

        // ── Bottom board ──────────────────────────────────────────────────
        add(w - T*2, 0.12, d - T*2, darkWoodMat, 0, 0.06, 0);

        // ── Horizontal plank lines (cap rails + mid rails) ─────────────────
        const capH = 0.12, capY = BED_H - capH/2;
        add(w + 0.02, capH, T - 0.04, woodMat,  0, capY,  d/2 - T/2);
        add(w + 0.02, capH, T - 0.04, woodMat,  0, capY, -d/2 + T/2);
        add(T - 0.04, capH, d,        woodMat, -w/2 + T/2, capY, 0);
        add(T - 0.04, capH, d,        woodMat,  w/2 - T/2, capY, 0);

        // ── Dirt fill (3/4 height) ────────────────────────────────────────
        const dirtH  = BED_H * 0.76 - 0.12;
        const innerW = w - T * 2 - 0.02;
        const innerD = d - T * 2 - 0.02;
        add(innerW, dirtH, innerD, dirtMat, 0, dirtH / 2 + 0.12, 0);

        group.userData.isPlanter  = true;
        group.userData.planterW   = w;
        group.userData.planterD   = d;
        group.userData.innerW     = innerW;
        group.userData.innerD     = innerD;
        group.userData.bedHeight  = BED_H;
        group.userData.dirtTopY   = gh + 0.12 + dirtH; // world Y of soil surface
        group.userData.cx         = cx;
        group.userData.cz         = cz;

        this.scene.add(group);
        this.beds.push(group);
    }

    // ── TEXTURE GENERATORS ────────────────────────────────────────────────────
    _getWoodTex() {
        if (this._woodTex) return this._woodTex;
        const c = document.createElement('canvas');
        c.width = c.height = 512;
        const ctx = c.getContext('2d');

        // Base cedar colour
        ctx.fillStyle = '#7B3F1A';
        ctx.fillRect(0, 0, 512, 512);

        // Horizontal planks separated by thin shadow lines
        const plankH = 44;
        for (let y = 0; y < 512; y += plankH) {
            // Random plank tint
            const v = Math.floor(Math.random() * 20) - 10;
            ctx.fillStyle = `rgb(${123+v},${63+v},${26+v})`;
            ctx.fillRect(0, y + 2, 512, plankH - 3);

            // Plank seam shadow
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fillRect(0, y, 512, 2);

            // Wood grain lines within this plank
            for (let i = 0; i < 18; i++) {
                const gx = Math.random() * 512;
                const alpha = 0.04 + Math.random() * 0.10;
                ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
                ctx.lineWidth = 0.5 + Math.random() * 1.2;
                ctx.beginPath();
                ctx.moveTo(gx, y + 2);
                ctx.bezierCurveTo(
                    gx + (Math.random()-0.5)*14, y + plankH * 0.33,
                    gx + (Math.random()-0.5)*14, y + plankH * 0.66,
                    gx + (Math.random()-0.5)*10, y + plankH - 2);
                ctx.stroke();
            }
        }

        // Knots
        for (let k = 0; k < 8; k++) {
            const kx = Math.random() * 512, ky = Math.random() * 512;
            const kr = 5 + Math.random() * 12;
            ctx.strokeStyle = 'rgba(50,20,5,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(kx, ky, kr, kr * 0.55, Math.random(), 0, Math.PI * 2);
            ctx.stroke();
        }

        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(3, 1.5);
        this._woodTex = t;
        return t;
    }

    _getDirtTex() {
        if (this._dirtTex) return this._dirtTex;
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#2E1A08';
        ctx.fillRect(0, 0, 256, 256);

        // Soil clump noise
        for (let i = 0; i < 1800; i++) {
            const x = Math.random() * 256, y = Math.random() * 256;
            const r = 1.5 + Math.random() * 4;
            const v = Math.floor(Math.random() * 30) - 10;
            ctx.fillStyle = `rgb(${46+v},${26+v},${8+v})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        // Pebbles
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * 256, y = Math.random() * 256;
            const v = 80 + Math.floor(Math.random() * 60);
            ctx.fillStyle = `rgb(${v},${v-5},${v-10})`;
            ctx.beginPath();
            ctx.ellipse(x, y, 3 + Math.random() * 5, 2 + Math.random() * 3, Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }

        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(3, 3);
        this._dirtTex = t;
        return t;
    }
}
