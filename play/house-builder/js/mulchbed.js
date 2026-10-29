// ── MULCH BED PAINTER ─────────────────────────────────────────────────────────
// Draw a curved polygon (like path/pond tool), close it → creates a
// raised mulch planting bed that follows the terrain contour.
class MulchBedSystem {
    constructor(scene, world) {
        this.scene  = scene;
        this.world  = world;
        this.active = false;
        this.pts    = [];
        this.beds   = [];
        this._previewLine  = null;
        this._cursorMesh   = null;
        this._cursPos      = null;
        this._markers      = [];
        this._texCache     = null;
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────
    setActive(v) {
        this.active = v;
        if (this._cursorMesh) this._cursorMesh.visible = false;
        if (!v) this._cancelDraw();
        if (v && !this._cursorMesh) this._buildCursor();
    }

    updateCursor(worldPos) {
        this._cursPos = worldPos ? { x: worldPos.x, z: worldPos.z } : null;
        if (!this._cursorMesh) this._buildCursor();
        if (this._cursorMesh) {
            if (worldPos && this.active) {
                this._cursorMesh.visible = true;
                this._cursorMesh.position.set(worldPos.x, 0.06, worldPos.z);
                const st = this._status();
                this._cursorMesh.material.color.setHex(st.canClose ? 0x00ff44 : 0xc8660a);
            } else {
                this._cursorMesh.visible = false;
            }
        }
        if (this.active) this._updatePreviewLine();
    }

    interact() {
        if (!this.active || !this._cursPos) return false;
        const st = this._status();
        if (st.canClose) { this._finalize(); return true; }
        this.pts.push({ x: this._cursPos.x, z: this._cursPos.z });
        this._addMarker(this._cursPos.x, this._cursPos.z);
        this._updatePreviewLine();
        return true;
    }

    cancel() { this._cancelDraw(); }

    hintText() {
        if (!this.active) return '';
        const st = this._status();
        if (this.pts.length === 0) return '🍂 E = place first point · Q = exit';
        if (st.canClose)           return '🍂 E = CLOSE & fill mulch · Q = cancel';
        return `🍂 E = add point (${this.pts.length} placed) · Q = cancel`;
    }

    // ── PRIVATE ───────────────────────────────────────────────────────────────
    _status() {
        if (!this._cursPos || this.pts.length < 3) return { canClose: false };
        const f = this.pts[0];
        return { canClose: Math.hypot(this._cursPos.x - f.x, this._cursPos.z - f.z) < 2.5 };
    }

    _cancelDraw() {
        this.pts = [];
        this._markers.forEach(m => this.scene.remove(m));
        this._markers = [];
        if (this._previewLine) { this.scene.remove(this._previewLine); this._previewLine = null; }
    }

    _finalize() {
        if (this.pts.length < 3) return;
        const smoothPts = this._catmullRom(this.pts.slice());
        const mesh      = this._buildBed(smoothPts);
        this.scene.add(mesh);
        this.beds.push(mesh);
        this._cancelDraw();
    }

    _addMarker(x, z) {
        const gh = this.world.sampleHeight(x, z);
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.20, 7, 5),
            new THREE.MeshBasicMaterial({ color: 0xc8660a })
        );
        m.position.set(x, gh + 0.20, z);
        this.scene.add(m);
        this._markers.push(m);
    }

    _updatePreviewLine() {
        if (this._previewLine) { this.scene.remove(this._previewLine); this._previewLine = null; }
        const pts = [...this.pts, ...(this._cursPos ? [this._cursPos] : [])];
        if (pts.length < 2) return;
        const pos = [];
        for (const p of pts) { const h = this.world.sampleHeight(p.x, p.z); pos.push(p.x, h + 0.08, p.z); }
        pos.push(pts[0].x, this.world.sampleHeight(pts[0].x, pts[0].z) + 0.08, pts[0].z);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        this._previewLine = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0xc8660a }));
        this.scene.add(this._previewLine);
    }

    _buildCursor() {
        this._cursorMesh = new THREE.Mesh(
            new THREE.RingGeometry(0.45, 0.60, 20),
            new THREE.MeshBasicMaterial({ color: 0xc8660a, side: THREE.DoubleSide })
        );
        this._cursorMesh.rotation.x = -Math.PI / 2;
        this._cursorMesh.visible = false;
        this.scene.add(this._cursorMesh);
    }

    // ── CATMULL-ROM SPLINE ────────────────────────────────────────────────────
    _catmullRom(pts) {
        const n = pts.length;
        const SPP = Math.max(8, Math.ceil(80 / n));
        const result = [];
        for (let i = 0; i < n; i++) {
            const p0 = pts[(i - 1 + n) % n];
            const p1 = pts[i];
            const p2 = pts[(i + 1) % n];
            const p3 = pts[(i + 2) % n];
            for (let s = 0; s < SPP; s++) {
                const t = s / SPP, t2 = t*t, t3 = t2*t;
                const x = 0.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3);
                const z = 0.5*((2*p1.z)+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3);
                result.push({ x, z });
            }
        }
        return result;
    }

    // ── MULCH BED MESH ────────────────────────────────────────────────────────
    _buildBed(pts) {
        const MULCH_RISE = 0.14; // how high above terrain

        // Fan-triangulate the surface, sampling terrain height at each vertex
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        const cy = this.world.sampleHeight(cx, cz) + MULCH_RISE;

        const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
        const minZ = Math.min(...pts.map(p => p.z)), maxZ = Math.max(...pts.map(p => p.z));
        const rX = (maxX - minX) || 1, rZ = (maxZ - minZ) || 1;

        const pos = [], uv = [], colors = [];
        const mc1 = new THREE.Color(0x3D1E0A); // dark shredded bark
        const mc2 = new THREE.Color(0x5A2E10); // reddish cedar mulch
        const mc3 = new THREE.Color(0x4A2A0E); // medium brown

        for (let i = 0; i < pts.length; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length];
            const hy = this.world.sampleHeight(a.x, a.z) + MULCH_RISE;
            const by = this.world.sampleHeight(b.x, b.z) + MULCH_RISE;

            pos.push(cx, cy, cz,  a.x, hy, a.z,  b.x, by, b.z);

            uv.push(
                (cx - minX) / rX, (cz - minZ) / rZ,
                (a.x - minX) / rX, (a.z - minZ) / rZ,
                (b.x - minX) / rX, (b.z - minZ) / rZ
            );

            // Random mulch colour per triangle
            const pick = [mc1, mc2, mc3][Math.floor(Math.random() * 3)];
            const noise = (Math.random() - 0.5) * 0.06;
            for (let v = 0; v < 3; v++) {
                colors.push(
                    Math.min(1, Math.max(0, pick.r + noise)),
                    Math.min(1, Math.max(0, pick.g + noise)),
                    Math.min(1, Math.max(0, pick.b + noise))
                );
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uv), 2));
        geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(colors), 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.97,
            metalness: 0.0,
            map: this._getMulchTex(),
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        mesh.userData.isMulchBed = true;
        mesh.userData.noPaint = true;
        return mesh;
    }

    _getMulchTex() {
        if (this._texCache) return this._texCache;
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#3D1E0A';
        ctx.fillRect(0, 0, 256, 256);

        // Shredded bark / wood chip texture — short oriented strokes
        for (let i = 0; i < 2800; i++) {
            const x = Math.random() * 256, y = Math.random() * 256;
            const len = 6 + Math.random() * 18;
            const angle = Math.random() * Math.PI;
            const r = Math.floor(50 + Math.random() * 50);
            const g = Math.floor(25 + Math.random() * 25);
            const b = Math.floor(5 + Math.random() * 15);
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 1 + Math.random() * 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();
        }
        // Coarse chunks
        for (let i = 0; i < 120; i++) {
            const x = Math.random() * 256, y = Math.random() * 256;
            const r2 = 3 + Math.random() * 7;
            const cr = Math.floor(40 + Math.random() * 60);
            ctx.fillStyle = `rgb(${cr},${Math.floor(cr*0.52)},${Math.floor(cr*0.18)})`;
            ctx.beginPath();
            ctx.ellipse(x, y, r2, r2 * (0.4 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(4, 4);
        this._texCache = t;
        return t;
    }
}
