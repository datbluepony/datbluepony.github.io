const FLOOR_TYPES = [
    { id:'hardwood_oak',  name:'Oak Hardwood',  color:0xA07830, icon:'🪵' },
    { id:'hardwood_dark', name:'Dark Hardwood', color:0x3D2010, icon:'🪵' },
    { id:'tile_white',    name:'White Tile',    color:0xF0EDE8, icon:'⬜' },
    { id:'tile_gray',     name:'Gray Tile',     color:0x888880, icon:'🔲' },
    { id:'tile_black',    name:'Black Tile',    color:0x1a1a1a, icon:'⬛' },
    { id:'carpet_beige',  name:'Beige Carpet',  color:0xD4C8B0, icon:'🟫' },
    { id:'carpet_gray',   name:'Gray Carpet',   color:0x808080, icon:'🩶' },
    { id:'carpet_blue',   name:'Blue Carpet',   color:0x3A5080, icon:'🔵' },
    { id:'concrete_floor',name:'Concrete',      color:0x909090, icon:'🔲' },
    { id:'marble_white',  name:'White Marble',  color:0xF5F0E8, icon:'⬜' },
    { id:'stone_floor',   name:'Natural Stone', color:0x9A8870, icon:'🪨' },
    { id:'vinyl_gray',    name:'Vinyl Gray',    color:0xB0B0B0, icon:'🔲' },
];

class FloorSystem {
    constructor(scene, world) {
        this.scene    = scene;
        this.world    = world;
        this.mode     = false;
        this.typeIdx  = 0;
        this.floors   = [];
        this._startPt = null;
        this._preview = null;
        this._texCache = {};
    }

    get type()  { return FLOOR_TYPES[this.typeIdx]; }
    get types() { return FLOOR_TYPES; }
    setType(i)  { this.typeIdx = Math.max(0, Math.min(i, FLOOR_TYPES.length - 1)); }

    setMode(on) {
        this.mode = on;
        if (!on) { this._cancelDraw(); }
        const panel = document.getElementById('floor-panel');
        if (panel) panel.style.display = on ? 'flex' : 'none';
        document.getElementById('floor-mode-btn')?.classList.toggle('active', on);
    }

    // Called every frame with the ground hit point
    updateCursor(worldPos) {
        if (!this.mode || !this._startPt || !worldPos) { this._clearPreview(); return; }
        this._updatePreview(this._startPt, worldPos);
    }

    // First click = start, second click = place
    interact(worldPos) {
        if (!this._startPt) {
            this._startPt = new THREE.Vector3(Math.round(worldPos.x), 0, Math.round(worldPos.z));
            return false;
        }
        const end = new THREE.Vector3(Math.round(worldPos.x), 0, Math.round(worldPos.z));
        this._placeFloor(this._startPt, end);
        this._startPt = null;
        this._clearPreview();
        return true;
    }

    cancelDraw() { this._cancelDraw(); }

    get drawingStarted() { return !!this._startPt; }

    _cancelDraw() {
        this._startPt = null;
        this._clearPreview();
    }

    _clearPreview() {
        if (this._preview) { this.scene.remove(this._preview); this._preview = null; }
    }

    _updatePreview(a, b) {
        this._clearPreview();
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
        const minZ = Math.min(a.z, b.z), maxZ = Math.max(a.z, b.z);
        const w = maxX - minX || 0.1, d = maxZ - minZ || 0.1;
        const gh = this.world.sampleHeight(minX + w/2, minZ + d/2);
        const mat = new THREE.MeshBasicMaterial({
            color: this.type.color, transparent: true, opacity: 0.5, depthWrite: false
        });
        this._preview = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), mat);
        this._preview.position.set(minX + w/2, gh + 0.04, minZ + d/2);
        this.scene.add(this._preview);
    }

    _placeFloor(a, b) {
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
        const minZ = Math.min(a.z, b.z), maxZ = Math.max(a.z, b.z);
        const w = maxX - minX, d = maxZ - minZ;
        if (w < 0.5 || d < 0.5) return;

        // Deformed mesh — one vertex per foot, each sampled at terrain height
        const SW = Math.max(1, Math.ceil(w)), SD = Math.max(1, Math.ceil(d));
        const verts = [], uvs = [], idxs = [];
        for (let iz = 0; iz <= SD; iz++) {
            for (let ix = 0; ix <= SW; ix++) {
                const wx = minX + w * ix / SW;
                const wz = minZ + d * iz / SD;
                verts.push(wx, this.world.sampleHeight(wx, wz) + 0.03, wz);
                uvs.push((wx - minX) / 4, (wz - minZ) / 4);
            }
        }
        for (let iz = 0; iz < SD; iz++) {
            for (let ix = 0; ix < SW; ix++) {
                const b2 = iz * (SW + 1) + ix;
                idxs.push(b2, b2 + SW + 1, b2 + 1, b2 + 1, b2 + SW + 1, b2 + SW + 2);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvs),   2));
        geo.setIndex(idxs);
        geo.computeVertexNormals();

        const t   = this.type;
        const tex = this._getTex(t.id).clone();
        tex.needsUpdate = true;
        const mat = new THREE.MeshLambertMaterial({ color: t.color, map: tex });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        mesh.userData.isFloor   = true;
        mesh.userData.floorType = t.id;
        mesh.userData.noPaint   = true;
        this.scene.add(mesh);
        this.floors.push(mesh);
    }

    deleteFloor(mesh) {
        const i = this.floors.indexOf(mesh);
        if (i !== -1) { this.scene.remove(mesh); this.floors.splice(i, 1); }
    }

    allMeshes() { return this.floors; }

    // ── TEXTURE GENERATORS ─────────────────────────────────────────────────────
    _getTex(id) {
        if (this._texCache[id]) return this._texCache[id];
        const c = document.createElement('canvas');
        c.width = c.height = 512;
        const ctx = c.getContext('2d');
        const gen = FloorSystem._gens[id];
        if (gen) gen(ctx, 512, 512);
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(4, 4);
        this._texCache[id] = t;
        return t;
    }

    // ── BUILD UI ───────────────────────────────────────────────────────────────
    buildUI() {
        const panel = document.getElementById('floor-type-panel');
        if (!panel) return;
        panel.innerHTML = '';
        FLOOR_TYPES.forEach((t, i) => {
            const btn = document.createElement('button');
            btn.className = 'floor-type-btn' + (i === this.typeIdx ? ' active' : '');
            btn.innerHTML = `<span class="floor-swatch" style="background:#${t.color.toString(16).padStart(6,'0')}"></span>${t.name}`;
            btn.addEventListener('click', () => {
                this.typeIdx = i;
                this.buildUI();
            });
            panel.appendChild(btn);
        });
    }
}

// ── CANVAS TEXTURE GENERATORS (static, shared) ───────────────────────────────
FloorSystem._gens = {
    hardwood_oak(ctx, W, H) {
        const plankH = 60, plankW = 128;
        ctx.fillStyle = '#a07830'; ctx.fillRect(0, 0, W, H);
        for (let row = 0; row < Math.ceil(H / plankH); row++) {
            const off = (row % 2) * plankW / 2;
            for (let col = -1; col < Math.ceil(W / plankW) + 1; col++) {
                const px = col * plankW + off;
                const rv = Math.floor((Math.random() - 0.5) * 24);
                ctx.fillStyle = `rgb(${160+rv},${118+rv},${48+rv})`;
                ctx.fillRect(px + 2, row * plankH + 2, plankW - 4, plankH - 4);
                // Wood grain lines
                for (let g = 0; g < 6; g++) {
                    ctx.strokeStyle = `rgba(0,0,0,${Math.random()*0.12+0.03})`;
                    ctx.lineWidth = Math.random() * 1.5 + 0.5;
                    ctx.beginPath();
                    ctx.moveTo(px + Math.random() * plankW, row * plankH);
                    ctx.lineTo(px + Math.random() * plankW, row * plankH + plankH);
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, row * plankH + 1, plankW - 2, plankH - 2);
            }
        }
    },
    hardwood_dark(ctx, W, H) {
        const plankH = 60, plankW = 128;
        ctx.fillStyle = '#3d2010'; ctx.fillRect(0, 0, W, H);
        for (let row = 0; row < Math.ceil(H / plankH); row++) {
            const off = (row % 2) * plankW / 2;
            for (let col = -1; col < Math.ceil(W / plankW) + 1; col++) {
                const px = col * plankW + off;
                const rv = Math.floor((Math.random() - 0.5) * 16);
                ctx.fillStyle = `rgb(${75+rv},${42+rv},${20+rv})`;
                ctx.fillRect(px + 2, row * plankH + 2, plankW - 4, plankH - 4);
                for (let g = 0; g < 5; g++) {
                    ctx.strokeStyle = `rgba(0,0,0,${Math.random()*0.15+0.04})`;
                    ctx.lineWidth = Math.random() + 0.5;
                    ctx.beginPath();
                    ctx.moveTo(px + Math.random() * plankW, row * plankH);
                    ctx.lineTo(px + Math.random() * plankW, row * plankH + plankH);
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, row * plankH + 1, plankW - 2, plankH - 2);
            }
        }
    },
    tile_white(ctx, W, H) {
        const sz = 80;
        ctx.fillStyle = '#f0ede8'; ctx.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += sz) {
            for (let x = 0; x < W; x += sz) {
                const v = Math.floor(Math.random() * 12);
                ctx.fillStyle = `rgb(${240+v},${237+v},${232+v})`;
                ctx.fillRect(x + 3, y + 3, sz - 6, sz - 6);
            }
        }
        ctx.strokeStyle = 'rgba(180,175,168,0.9)'; ctx.lineWidth = 3;
        for (let y = 0; y <= H; y += sz) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
        for (let x = 0; x <= W; x += sz) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    },
    tile_gray(ctx, W, H) {
        const sz = 80;
        ctx.fillStyle = '#888880'; ctx.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += sz) {
            for (let x = 0; x < W; x += sz) {
                const v = Math.floor(Math.random() * 14) - 7;
                ctx.fillStyle = `rgb(${136+v},${136+v},${128+v})`;
                ctx.fillRect(x + 3, y + 3, sz - 6, sz - 6);
            }
        }
        ctx.strokeStyle = 'rgba(90,90,85,0.8)'; ctx.lineWidth = 3;
        for (let y = 0; y <= H; y += sz) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
        for (let x = 0; x <= W; x += sz) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    },
    tile_black(ctx, W, H) {
        const sz = 64;
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += sz) {
            for (let x = 0; x < W; x += sz) {
                const v = Math.floor(Math.random() * 20);
                ctx.fillStyle = `rgb(${25+v},${25+v},${25+v})`;
                ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);
            }
        }
        ctx.strokeStyle = 'rgba(60,60,60,0.7)'; ctx.lineWidth = 2;
        for (let y = 0; y <= H; y += sz) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
        for (let x = 0; x <= W; x += sz) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    },
    carpet_beige(ctx, W, H) {
        ctx.fillStyle = '#d4c8b0'; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 30000; i++) {
            const v = Math.floor(Math.random() * 28) - 14;
            ctx.fillStyle = `rgba(${212+v},${200+v},${176+v},0.5)`;
            ctx.fillRect(Math.random()*W, Math.random()*H, Math.random()*2+0.5, Math.random()*2+0.5);
        }
    },
    carpet_gray(ctx, W, H) {
        ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 30000; i++) {
            const v = Math.floor(Math.random() * 24) - 12;
            ctx.fillStyle = `rgba(${128+v},${128+v},${128+v},0.4)`;
            ctx.fillRect(Math.random()*W, Math.random()*H, Math.random()*2+0.5, Math.random()*2+0.5);
        }
    },
    carpet_blue(ctx, W, H) {
        ctx.fillStyle = '#3a5080'; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 30000; i++) {
            const v = Math.floor(Math.random() * 20) - 10;
            ctx.fillStyle = `rgba(${58+v},${80+v},${128+v},0.4)`;
            ctx.fillRect(Math.random()*W, Math.random()*H, Math.random()*2+0.5, Math.random()*2+0.5);
        }
    },
    concrete_floor(ctx, W, H) {
        ctx.fillStyle = '#909090'; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 8000; i++) {
            const v = Math.floor(Math.random() * 30) - 15;
            ctx.fillStyle = `rgba(${144+v},${144+v},${144+v},0.35)`;
            const s = Math.random() * 3 + 1;
            ctx.fillRect(Math.random()*W, Math.random()*H, s, s*Math.random()*2);
        }
        ctx.strokeStyle = 'rgba(80,80,80,0.2)'; ctx.lineWidth = 1;
        for (let y = 0; y < H; y += 128) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
        for (let x = 0; x < W; x += 128) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    },
    marble_white(ctx, W, H) {
        ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, W, H);
        for (let v = 0; v < 30; v++) {
            ctx.strokeStyle = `rgba(${160+Math.random()*40},${155+Math.random()*40},${148+Math.random()*40},${Math.random()*0.3+0.05})`;
            ctx.lineWidth = Math.random() * 2 + 0.5;
            ctx.beginPath();
            let mx = Math.random() * W, my = Math.random() * H;
            ctx.moveTo(mx, my);
            for (let s = 0; s < 8; s++) {
                mx += (Math.random() - 0.5) * 120;
                my += (Math.random() - 0.5) * 120;
                ctx.quadraticCurveTo(Math.random()*W, Math.random()*H, mx, my);
            }
            ctx.stroke();
        }
    },
    stone_floor(ctx, W, H) {
        ctx.fillStyle = '#9a8870'; ctx.fillRect(0, 0, W, H);
        const stoneW = [70,90,55,80,65], stoneH = [55,65,48,60,58];
        let y = 0, row = 0;
        while (y < H + 65) {
            const sh = stoneH[row % stoneH.length];
            const offset = (row % 2) * 35;
            let x = -offset;
            while (x < W + 90) {
                const sw = stoneW[(x+row) % stoneW.length] + Math.floor(Math.random()*10 - 5);
                const rv = Math.floor(Math.random()*20 - 10);
                ctx.fillStyle = `rgb(${154+rv},${136+rv},${112+rv})`;
                ctx.fillRect(x+3, y+3, sw-6, sh-6);
                ctx.strokeStyle = 'rgba(80,70,58,0.5)'; ctx.lineWidth = 2.5;
                ctx.strokeRect(x+2, y+2, sw-4, sh-4);
                x += sw + 5;
            }
            y += sh + 5; row++;
        }
    },
    vinyl_gray(ctx, W, H) {
        const plankH = 48, plankW = 150;
        ctx.fillStyle = '#b0b0b0'; ctx.fillRect(0, 0, W, H);
        for (let row = 0; row < Math.ceil(H / plankH); row++) {
            const off = (row % 2) * plankW / 3;
            for (let col = -1; col < Math.ceil(W / plankW) + 1; col++) {
                const px = col * plankW + off;
                const rv = Math.floor(Math.random() * 16) - 8;
                ctx.fillStyle = `rgb(${176+rv},${176+rv},${176+rv})`;
                ctx.fillRect(px + 2, row * plankH + 2, plankW - 4, plankH - 4);
                ctx.strokeStyle = 'rgba(100,100,100,0.4)'; ctx.lineWidth = 1.5;
                ctx.strokeRect(px + 1, row * plankH + 1, plankW - 2, plankH - 2);
            }
        }
    },
};
