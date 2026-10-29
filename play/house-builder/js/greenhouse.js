// ── GREENHOUSE BUILDER ────────────────────────────────────────────────────────
// Draw a polygon footprint (like pond tool). On close: auto-builds a black
// powder-coated steel + glass greenhouse with a gabled glass roof.
// First wall segment auto-gets a sliding glass door.

class GreenhouseSystem {
    constructor(scene, world) {
        this.scene   = scene;
        this.world   = world;
        this.active  = false;
        this.pts     = [];       // [{x,z}] control points
        this.houses  = [];       // placed greenhouse groups

        this._previewGroup = null;
        this._previewLine  = null;
        this._cursorMesh   = null;
        this._cursPos      = null;
        this._markers      = [];
        this._t            = 0;
        this._doors    = [];   // [{group, leaves:[{mesh,closedX,openX}], open:false}]

        this._buildCursor();
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────
    setActive(v) {
        this.active = v;
        if (this._cursorMesh) this._cursorMesh.visible = false;
        if (!v) this._cancelDraw();
    }

    updateCursor(worldPos) {
        if (worldPos) {
            // 0.5 ft grid snap
            let sx = Math.round(worldPos.x * 2) / 2;
            let sz = Math.round(worldPos.z * 2) / 2;
            // 90° axis-lock from previous point
            if (this.pts.length > 0) {
                const last = this.pts[this.pts.length - 1];
                if (Math.abs(sx - last.x) >= Math.abs(sz - last.z)) sz = last.z;
                else sx = last.x;
                sx = Math.round(sx * 2) / 2;
                sz = Math.round(sz * 2) / 2;
            }
            this._cursPos = { x: sx, z: sz };
        } else {
            this._cursPos = null;
        }
        if (this._cursorMesh) {
            if (this._cursPos && this.active) {
                this._cursorMesh.visible = true;
                this._cursorMesh.position.set(this._cursPos.x, 0.08, this._cursPos.z);
                const st = this._status();
                this._cursorMesh.material.color.setHex(st.canClose ? 0x00ff44 : 0x44ffcc);
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

    tick(dt) { this._t += dt; }

    hintText() {
        if (!this.active) return '';
        const st = this._status();
        if (this.pts.length === 0) return '🌿 First corner = door wall · snaps 90° · E place · Q exit';
        if (st.canClose)           return '🌿 E = CLOSE & build greenhouse · Q = cancel';
        return `🌿 E = add corner (${this.pts.length} placed, min 3) · snaps 90° · Q = cancel`;
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
        if (this._previewGroup) { this.scene.remove(this._previewGroup); this._previewGroup = null; }
        if (this._previewLine)  { this.scene.remove(this._previewLine);  this._previewLine  = null; }
    }

    _finalize() {
        if (this.pts.length < 3) return;
        const gh = this._buildGreenhouse(this.pts.slice());
        this.houses.push(gh);
        this.scene.add(gh);
        this._cancelDraw();
    }

    _addMarker(x, z) {
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0x44ffcc })
        );
        m.position.set(x, 0.22, z);
        this.scene.add(m);
        this._markers.push(m);
    }

    _updatePreviewLine() {
        if (this._previewLine) { this.scene.remove(this._previewLine); this._previewLine = null; }
        const pts = [...this.pts, ...(this._cursPos ? [this._cursPos] : [])];
        if (pts.length < 2) return;
        const positions = [];
        const LINE_Y = 0.55; // raised above grass for visibility
        for (const p of pts) positions.push(p.x, LINE_Y, p.z);
        positions.push(pts[0].x, LINE_Y, pts[0].z);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        // Two overlapping lines (bright + white glow) to fake thickness
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
        this._previewLine = new THREE.Group();
        this._previewLine.add(new THREE.LineLoop(geo, mat));
        // Slightly raised second pass in yellow for contrast
        const positions2 = [];
        for (const p of pts) positions2.push(p.x, LINE_Y + 0.04, p.z);
        positions2.push(pts[0].x, LINE_Y + 0.04, pts[0].z);
        const geo2 = new THREE.BufferGeometry();
        geo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions2), 3));
        this._previewLine.add(new THREE.LineLoop(geo2, new THREE.LineBasicMaterial({ color: 0xffee00 })));
        this.scene.add(this._previewLine);
    }

    _buildCursor() {
        this._cursorMesh = new THREE.Mesh(
            new THREE.RingGeometry(0.55, 0.72, 24),
            new THREE.MeshBasicMaterial({ color: 0x44ffcc, side: THREE.DoubleSide })
        );
        this._cursorMesh.rotation.x = -Math.PI / 2;
        this._cursorMesh.visible = false;
        this.scene.add(this._cursorMesh);
    }

    // ── GREENHOUSE GEOMETRY ───────────────────────────────────────────────────
    _buildGreenhouse(pts) {
        const group = new THREE.Group();

        // Black powder-coated steel frame
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a, roughness: 0.45, metalness: 0.85,
        });
        // Glass panels — slightly blue-tinted
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xb8d8f0, roughness: 0.04, metalness: 0.12,
            transparent: true, opacity: 0.38,
            side: THREE.DoubleSide,
        });

        const WALL_H    = 8.0;  // eave height in feet
        const POST_W    = 0.18; // frame member cross-section
        const RAIL_H    = 0.14;
        const PANEL_GAP = 0.04;

        // Find bounding box for roof
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const p of pts) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
        }
        const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
        const bw = maxX - minX, bd = maxZ - minZ;
        const baseH = this.world.sampleHeight(cx, cz);

        const add = (geo, mat, px, py, pz, ry = 0) => {
            const m = new THREE.Mesh(geo, mat);
            m.position.set(px, py, pz);
            m.rotation.y = ry;
            m.castShadow = true;
            m.receiveShadow = true;
            group.add(m);
        };

        // ── Walls: for each segment of the polygon ──────────────────────────
        const n = pts.length;
        for (let i = 0; i < n; i++) {
            const a = pts[i], b = pts[(i + 1) % n];
            const dx = b.x - a.x, dz = b.z - a.z;
            const segLen = Math.hypot(dx, dz);
            const angle  = Math.atan2(-dz, dx); // align box X-axis along wall direction
            const mx     = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;

            // Bottom, mid, top rails
            const railGeo = new THREE.BoxGeometry(segLen, RAIL_H, POST_W);
            add(railGeo, frameMat, mx, RAIL_H / 2,        mz, angle);
            add(railGeo, frameMat, mx, WALL_H - RAIL_H/2, mz, angle);
            add(railGeo, frameMat, mx, WALL_H / 2,        mz, angle);

            // Corner posts
            const postGeo = new THREE.BoxGeometry(POST_W, WALL_H, POST_W);
            add(postGeo, frameMat, a.x, WALL_H / 2, a.z);

            // Intermediate vertical posts every ~4 ft
            const POST_SPACING = 4.0;
            const numPosts = Math.max(0, Math.floor(segLen / POST_SPACING) - 1);
            for (let p = 1; p <= numPosts; p++) {
                const t  = p / (numPosts + 1);
                const px2 = a.x + dx * t, pz2 = a.z + dz * t;
                add(postGeo, frameMat, px2, WALL_H / 2, pz2);
            }

            // Glass fill — one clean panel per segment
            const fillH = WALL_H - RAIL_H * 2;
            if (i === 0) {
                // Door wall: door at centre + glass flanks on each side
                const doorW = Math.min(segLen * 0.45, 4.0);
                this._buildDoor(group, frameMat, glassMat, mx, mz, angle, WALL_H, doorW);
                const flankW = (segLen - doorW) / 2 - POST_W;
                if (flankW > 0.4) {
                    const wdx = dx / segLen, wdz = dz / segLen;
                    const off = doorW / 2 + POST_W * 0.5 + flankW / 2;
                    for (const fs of [-1, 1]) {
                        add(new THREE.BoxGeometry(flankW, fillH, 0.04), glassMat,
                            mx + wdx * fs * off, WALL_H / 2, mz + wdz * fs * off, angle);
                    }
                }
            } else {
                add(new THREE.BoxGeometry(segLen - POST_W, fillH, 0.04), glassMat, mx, WALL_H / 2, mz, angle);
            }
        }

        // ── Gabled roof (explicit vertex geometry — no rotation math) ────────
        const RIDGE_H  = bw * 0.32;
        const roofApex = WALL_H + RIDGE_H;
        const isZLong  = bd >= bw;
        const roofLen  = isZLong ? bd : bw;
        const roofSpan = isZLong ? bw : bd;
        const hl       = roofLen / 2;
        const slopeLen = Math.hypot(RIDGE_H, roofSpan / 2);

        // Quads via BufferGeometry — positions in group-local space (group Y offset = baseH)
        const makeRoofQuad = (p0, p1, p2, p3) => {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                p0.x,p0.y,p0.z, p1.x,p1.y,p1.z, p2.x,p2.y,p2.z,
                p0.x,p0.y,p0.z, p2.x,p2.y,p2.z, p3.x,p3.y,p3.z,
            ]), 3));
            geo.computeVertexNormals();
            const m = new THREE.Mesh(geo, glassMat);
            m.castShadow = true;
            group.add(m);
        };

        if (isZLong) {
            // Left panel: eave at x = cx - roofSpan/2, ridge at x = cx
            makeRoofQuad(
                {x: cx - roofSpan/2, y: WALL_H,   z: cz - hl},
                {x: cx - roofSpan/2, y: WALL_H,   z: cz + hl},
                {x: cx,              y: roofApex,  z: cz + hl},
                {x: cx,              y: roofApex,  z: cz - hl}
            );
            // Right panel: eave at x = cx + roofSpan/2
            makeRoofQuad(
                {x: cx + roofSpan/2, y: WALL_H,   z: cz + hl},
                {x: cx + roofSpan/2, y: WALL_H,   z: cz - hl},
                {x: cx,              y: roofApex,  z: cz - hl},
                {x: cx,              y: roofApex,  z: cz + hl}
            );
        } else {
            // Left panel: eave at z = cz - roofSpan/2, ridge at z = cz
            makeRoofQuad(
                {x: cx - hl, y: WALL_H,   z: cz - roofSpan/2},
                {x: cx - hl, y: roofApex, z: cz},
                {x: cx + hl, y: roofApex, z: cz},
                {x: cx + hl, y: WALL_H,   z: cz - roofSpan/2}
            );
            // Right panel: eave at z = cz + roofSpan/2
            makeRoofQuad(
                {x: cx + hl, y: WALL_H,   z: cz + roofSpan/2},
                {x: cx - hl, y: WALL_H,   z: cz + roofSpan/2},
                {x: cx - hl, y: roofApex, z: cz},
                {x: cx + hl, y: roofApex, z: cz}
            );
        }

        // Rafters — use lookAt so -Z faces ridge; cylinder Y → -Z via rotation.x
        const RAFTER_SP = 4.0;
        const nRafters  = Math.max(2, Math.ceil(roofLen / RAFTER_SP));
        for (const side of [-1, 1]) {
            for (let r = 0; r <= nRafters; r++) {
                const t = r / nRafters;
                let eaveX, eaveZ, ridgeX, ridgeZ;
                if (isZLong) {
                    const rz = cz - hl + roofLen * t;
                    eaveX = cx + side * roofSpan / 2; eaveZ = rz;
                    ridgeX = cx; ridgeZ = rz;
                } else {
                    const rx = cx - hl + roofLen * t;
                    eaveX = rx; eaveZ = cz + side * roofSpan / 2;
                    ridgeX = rx; ridgeZ = cz;
                }
                const midX = (eaveX + ridgeX) / 2;
                const midZ = (eaveZ + ridgeZ) / 2;
                const midY = WALL_H + RIDGE_H / 2;

                const raftGrp = new THREE.Group();
                raftGrp.position.set(midX, midY, midZ);
                raftGrp.lookAt(new THREE.Vector3(ridgeX, roofApex, ridgeZ));

                const cyl = new THREE.Mesh(
                    new THREE.CylinderGeometry(POST_W / 2, POST_W / 2, slopeLen, 6),
                    frameMat
                );
                cyl.rotation.x = Math.PI / 2; // Y-axis aligns with group -Z (toward ridge)
                cyl.castShadow = true;
                raftGrp.add(cyl);
                group.add(raftGrp);
            }
        }

        // Ridge beam
        add(new THREE.BoxGeometry(
            isZLong ? POST_W : roofLen + 0.3,
            POST_W,
            isZLong ? roofLen + 0.3 : POST_W
        ), frameMat, cx, roofApex, cz);

        // Gable end triangular glass fills
        for (const side of [-1, 1]) {
            this._buildGableEnd(group, frameMat, glassMat,
                cx, cz, isZLong,
                side, roofSpan, roofLen, WALL_H, RIDGE_H);
        }

        // Gutters (thin horizontal strips along eaves)
        const gutterMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.7 });
        const gutW = isZLong ? POST_W : roofLen;
        const gutD = isZLong ? roofLen : POST_W;
        for (const side of [-1, 1]) {
            const gx = isZLong ? (cx + side * roofSpan/2) : cx;
            const gz = isZLong ? cz : (cz + side * roofSpan/2);
            add(new THREE.BoxGeometry(gutW, 0.12, gutD + 0.3), gutterMat, gx, WALL_H - 0.06, gz);
        }

        group.position.set(0, baseH, 0);
        group.userData.isGreenhouse = true;
        return group;
    }

    _buildDoor(group, frameMat, glassMat, cx, cz, angle, wallH, panW) {
        const DOOR_W = Math.min(panW * 0.6, 3.5);
        const DOOR_H = wallH - 0.6;
        const FT = 0.18;

        const doorFrameMat = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8, roughness: 0.25, metalness: 0.75,
        });
        const doorGlassMat = new THREE.MeshStandardMaterial({
            color: 0xc8e8ff, roughness: 0.03, metalness: 0.08,
            transparent: true, opacity: 0.65,
            side: THREE.DoubleSide,
        });

        const doorState = { leaves: [], open: false };
        this._doors.push(doorState);

        const doorGroup = new THREE.Group();
        doorGroup.position.set(cx, 0, cz);
        doorGroup.rotation.y = angle;
        doorGroup.userData.isGHDoor = true;
        group.add(doorGroup);

        const addF = (w, h, d, y) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), doorFrameMat);
            m.position.y = y;
            m.castShadow = true;
            doorGroup.add(m);
        };
        addF(DOOR_W + FT * 2, FT, FT, 0);
        addF(FT, DOOR_H + FT, FT, DOOR_H / 2);
        addF(FT, DOOR_H + FT, FT, DOOR_H / 2);
        doorGroup.children[doorGroup.children.length-1].position.x =  DOOR_W * 0.5;
        doorGroup.children[doorGroup.children.length-2].position.x = -DOOR_W * 0.5;
        addF(DOOR_W + FT * 2, FT, FT, DOOR_H + FT / 2);

        const leafW = (DOOR_W - FT * 2) / 2;
        for (const side of [-1, 1]) {
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, DOOR_H - FT * 2 - 0.02, 0.06), doorGlassMat);
            const closedX = side * leafW / 2;
            const openX   = side * (leafW / 2 + leafW + FT);
            leaf.position.set(closedX, DOOR_H / 2, 0);
            leaf.userData.isGHDoor  = true;
            leaf.userData.closedX   = closedX;
            leaf.userData.openX     = openX;
            doorGroup.add(leaf);
            doorState.leaves.push(leaf);

            const bar = new THREE.Mesh(new THREE.BoxGeometry(leafW, FT, FT), doorFrameMat);
            bar.position.set(closedX, DOOR_H / 2, 0);
            doorGroup.add(bar);
            doorState.barRefs = doorState.barRefs || [];
            doorState.barRefs.push({ bar, side, closedX, openX });
        }

        const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.95 });
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.60, 0.07), handleMat);
        handle.position.set(0.14, DOOR_H / 2, 0.08);
        doorGroup.add(handle);
    }

    _buildGableEnd(group, frameMat, glassMat, cx, cz, isZLong, side, roofSpan, roofLen, wallH, ridgeH) {
        // Build triangle fill for gable end
        const STEPS = 6;
        const halfLen = roofLen / 2;
        for (let s = 0; s < STEPS; s++) {
            const t0 = s / STEPS, t1 = (s + 1) / STEPS;
            const y0 = wallH + ridgeH * t0, y1 = wallH + ridgeH * t1;
            const yw = (roofSpan / 2) * (1 - t0);

            const panelW = isZLong ? yw * 2 : 0.05;
            const panelH = (y1 - y0);
            const panelD = isZLong ? 0.05 : yw * 2;

            if (panelW < 0.1 && panelD < 0.1) continue;

            const gx = isZLong ? cx : (cx + side * halfLen);
            const gz = isZLong ? (cz + side * halfLen) : cz;

            const m = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelD), glassMat);
            m.position.set(gx, (y0 + y1) / 2, gz);
            m.castShadow = false;
            group.add(m);
        }

        // Gable rafter X
        const endX = isZLong ? cx : (cx + side * halfLen);
        const endZ = isZLong ? (cz + side * halfLen) : cz;
        for (const rs of [-1, 1]) {
            const ex = isZLong ? (cx + rs * roofSpan / 2) : endX;
            const ez = isZLong ? endZ : (cz + rs * roofSpan / 2);
            const len = Math.hypot(ex - endX, wallH - (wallH + ridgeH), ez - endZ);
            const midX = (ex + endX) / 2, midZ = (ez + endZ) / 2;
            const raf = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, Math.hypot(ex - endX, ez - endZ, ridgeH)), frameMat);
            raf.position.set(midX, wallH + ridgeH / 2, midZ);
            raf.rotation.y = Math.atan2(ex - endX, ez - endZ);
            raf.rotation.x = -Math.atan2(ridgeH, Math.hypot(ex - endX, ez - endZ));
            group.add(raf);
        }
    }

    findDoor(mesh) {
        let node = mesh;
        while (node) {
            if (node.userData.isGHDoor) {
                // Find which doorState owns this node
                for (const ds of this._doors) {
                    if (ds.leaves.includes(node)) return ds;
                    if (ds.leaves.some(l => {
                        let p = l.parent;
                        while (p) { if (p === node) return true; p = p.parent; }
                        return false;
                    })) return ds;
                }
                // Check if node itself is the doorGroup containing leaves
                for (const ds of this._doors) {
                    for (const leaf of ds.leaves) {
                        let p = leaf;
                        while (p) { if (p === node) return ds; p = p.parent; }
                    }
                }
            }
            node = node.parent;
        }
        return null;
    }

    toggleDoor(doorState) {
        if (!doorState) return;
        doorState.open = !doorState.open;
        for (const leaf of doorState.leaves) {
            leaf.position.x = doorState.open ? leaf.userData.openX : leaf.userData.closedX;
        }
        if (doorState.barRefs) {
            for (const br of doorState.barRefs) {
                br.bar.position.x = doorState.open ? br.openX : br.closedX;
            }
        }
    }
}
