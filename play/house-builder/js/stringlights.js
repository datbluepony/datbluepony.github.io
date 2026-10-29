// ── STRING LIGHTS SYSTEM ──────────────────────────────────────────────────────
// Place posts, connect with drooping warm string lights. Droop scales with span.
class StringLightSystem {
    constructor(scene, world) {
        this.scene   = scene;
        this.world   = world;
        this.active  = false;

        this._anchors        = [];   // placed {pos, mesh}
        this._strings        = [];   // placed THREE.Group
        this._pendingAnchor  = null; // {pos, mesh} — first click
        this._cursorMesh     = null;
        this._previewString  = null;
        this._cursPos        = null;
        this._t              = 0;
        this._postHeight     = 7.0;  // ft — adjustable with D-pad / arrows

        this._buildCursor();
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────
    setActive(v) {
        this.active = v;
        if (this._cursorMesh) this._cursorMesh.visible = false;
        if (!v) {
            this._pendingAnchor = null;
            this._clearPreviewString();
        }
    }

    updateCursor(worldPos) {
        if (!worldPos || !this.active) {
            this._cursPos = null;
            if (this._cursorMesh) this._cursorMesh.visible = false;
            return;
        }
        const sx = Math.round(worldPos.x * 2) / 2;
        const sz = Math.round(worldPos.z * 2) / 2;
        const sy = this.world.sampleHeight(sx, sz);
        this._cursPos = { x: sx, y: sy, z: sz };
        if (this._cursorMesh) {
            this._cursorMesh.visible = true;
            this._cursorMesh.position.set(sx, sy, sz);
        }
        if (this._pendingAnchor) {
            this._updatePreviewString(this._pendingAnchor.pos, this._cursPos);
        }
    }

    interact() {
        if (!this.active || !this._cursPos) return false;
        const hookY = this._postHeight + 0.35;
        const pos   = { ...this._cursPos, hookY };

        if (!this._pendingAnchor) {
            const mesh = this._buildPost(pos);
            this._pendingAnchor = { pos, mesh };
            return false;
        } else {
            const mesh = this._buildPost(pos);
            this._buildString(this._pendingAnchor.pos, pos);
            this._clearPreviewString();
            // Chain: second post becomes next start
            this._pendingAnchor = { pos, mesh };
            return true;
        }
    }

    cancel() {
        this._pendingAnchor = null;
        this._clearPreviewString();
    }

    tick(dt) { this._t += dt; }

    adjustHeight(delta) {
        this._postHeight = Math.min(14, Math.max(3, this._postHeight + delta));
        // Rebuild cursor to reflect new height
        if (this._cursorMesh) { this.scene.remove(this._cursorMesh); this._cursorMesh = null; }
        this._buildCursor();
        if (this._cursPos && this.active) {
            this._cursorMesh.visible = true;
            this._cursorMesh.position.set(this._cursPos.x, this._cursPos.y, this._cursPos.z);
        }
    }

    hintText() {
        const h = this._postHeight.toFixed(1);
        if (!this._pendingAnchor) return `💡 E = place post (${h} ft)  ·  ↕ = height  ·  Q = exit`;
        return `💡 E = connect string (${h} ft posts)  ·  ↕ = height  ·  Q = cancel`;
    }

    // ── PRIVATE ───────────────────────────────────────────────────────────────
    _buildCursor() {
        const h = this._postHeight;
        const g = new THREE.Group();
        const postMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.6 });
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, h, 8), postMat);
        post.position.y = h / 2;
        g.add(post);
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), postMat);
        top.position.y = h + 0.1;
        g.add(top);
        g.visible = false;
        this.scene.add(g);
        this._cursorMesh = g;
    }

    _buildPost(pos) {
        const h = this._postHeight;
        const g = new THREE.Group();

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.92 });
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, h + 0.2, 8), woodMat);
        post.position.y = (h + 0.2) / 2;
        post.castShadow = true;
        g.add(post);

        // Metal cap + arm hook
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.35, metalness: 0.85 });
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 10), metalMat);
        cap.position.y = h + 0.26;
        g.add(cap);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 6), metalMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(0.32, h + 0.35, 0);
        g.add(arm);
        const hook = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 12, Math.PI), metalMat);
        hook.position.set(0.59, h + 0.25, 0);
        hook.rotation.z = Math.PI / 2;
        g.add(hook);

        // Store the hook height on the post so _catenary can read it
        g.userData.hookY = h + 0.35;

        g.position.set(pos.x, pos.y, pos.z);
        this.scene.add(g);
        this._anchors.push({ pos, mesh: g, hookY: h + 0.35 });
        return g;
    }

    _catenary(p1, p2, n) {
        const span  = Math.hypot(p2.x - p1.x, p2.z - p1.z);
        const droop = Math.max(0.4, span * 0.14); // more span → more sag
        const pts   = [];
        // Use each anchor's stored hookY if available, else fall back to current _postHeight
        const h1 = p1.hookY ?? (this._postHeight + 0.35);
        const h2 = p2.hookY ?? (this._postHeight + 0.35);
        for (let i = 0; i <= n; i++) {
            const t  = i / n;
            const x  = p1.x + (p2.x - p1.x) * t;
            const z  = p1.z + (p2.z - p1.z) * t;
            const yBase = (p1.y + h1) + ((p2.y + h2) - (p1.y + h1)) * t;
            const sag   = droop * 4 * t * (1 - t);
            const wobble = Math.sin(t * 7.3 + span * 0.1) * 0.04 * Math.min(1, span / 8);
            pts.push(new THREE.Vector3(x, yBase - sag + wobble, z));
        }
        return pts;
    }

    _buildString(p1, p2) {
        const span = Math.hypot(p2.x - p1.x, p2.z - p1.z);
        if (span < 0.5) return;

        const group   = new THREE.Group();
        const nCurve  = Math.max(24, Math.ceil(span * 3));
        const pts     = this._catenary(p1, p2, nCurve);
        const curve   = new THREE.CatmullRomCurve3(pts);

        // Black cord
        const cordMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const cord    = new THREE.Mesh(
            new THREE.TubeGeometry(curve, nCurve, 0.018, 5, false),
            cordMat
        );
        group.add(cord);

        // Warm bulbs
        const bulbMat = new THREE.MeshStandardMaterial({
            color: 0xffe5a0,
            emissive: new THREE.Color(0xff8800),
            emissiveIntensity: 1.4,
            roughness: 0.35,
        });
        const bulbGeo   = new THREE.SphereGeometry(0.11, 8, 6);
        const BULB_STEP = 1.5; // ft between bulbs
        const nBulbs    = Math.max(3, Math.floor(span / BULB_STEP));

        for (let i = 0; i <= nBulbs; i++) {
            const tval  = i / nBulbs;
            const bpos  = curve.getPoint(tval);
            // Vary pendant drop slightly
            const drop  = 0.08 + Math.sin(i * 1.9) * 0.04;
            const bulb  = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.set(bpos.x, bpos.y - drop, bpos.z);
            group.add(bulb);

            // Tiny pendant wire from cord to bulb
            const pendGeo = new THREE.CylinderGeometry(0.008, 0.008, drop + 0.02, 4);
            const pend    = new THREE.Mesh(pendGeo, cordMat);
            pend.position.set(bpos.x, bpos.y - drop / 2, bpos.z);
            group.add(pend);
        }

        // Warm point lights (sparse — 2-3 per string)
        for (const lt of [0.25, 0.5, 0.75]) {
            const lp    = curve.getPoint(lt);
            const light = new THREE.PointLight(0xff8822, 0.9, 18);
            light.position.set(lp.x, lp.y - 0.1, lp.z);
            group.add(light);
        }

        this.scene.add(group);
        this._strings.push(group);
    }

    _updatePreviewString(p1, p2) {
        this._clearPreviewString();
        if (!p2) return;
        const span = Math.hypot(p2.x - p1.x, p2.z - p1.z);
        if (span < 0.3) return;
        const pts  = this._catenary(p1, p2, Math.max(10, Math.ceil(span * 2)));
        const curve = new THREE.CatmullRomCurve3(pts);
        const geo  = new THREE.TubeGeometry(curve, Math.max(8, Math.ceil(span * 2)), 0.03, 4, false);
        const mat  = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.65 });
        this._previewString = new THREE.Mesh(geo, mat);
        this.scene.add(this._previewString);
    }

    _clearPreviewString() {
        if (this._previewString) { this.scene.remove(this._previewString); this._previewString = null; }
    }
}
