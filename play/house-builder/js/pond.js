// ── POND BUILDER ─────────────────────────────────────────────────────────────
// Custom curved pond drawing: place control points, close shape → animated water
class PondBuilder {
    constructor(scene, camera, world) {
        this.scene  = scene;
        this.camera = camera;
        this.world  = world || null;
        this.active = false;
        this.pts    = [];       // [{x,z}] placed edge points
        this.ponds  = [];       // placed pond groups in scene
        this.time   = 0;

        this._previewGroup = null;
        this._previewLine  = null;
        this._cursorMesh   = null;
        this._cursPos      = null;

        this._buildCursor();
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────

    setActive(v) {
        this.active = v;
        if (this._cursorMesh) this._cursorMesh.visible = false;
        if (!v) this._cancelDraw();
    }

    // Called every frame from _updatePlacement — pass ground raycast hit point or null
    updateCursor(worldPos) {
        this._cursPos = worldPos ? { x: worldPos.x, z: worldPos.z } : null;
        if (this._cursorMesh) {
            if (worldPos && this.active) {
                this._cursorMesh.visible = true;
                this._cursorMesh.position.set(worldPos.x, 0.08, worldPos.z);
                // Pulse scale
                const s = 1 + Math.sin(this.time * 4) * 0.12;
                this._cursorMesh.scale.set(s, 1, s);
                // Tint green if near close point
                const st = this._status();
                this._cursorMesh.material.color.setHex(st.canClose ? 0x00ff66 : 0x00ddff);
            } else {
                this._cursorMesh.visible = false;
            }
        }
        if (this.active) this._updatePreviewLine();
    }

    // Returns hint text for HUD
    hintText() {
        if (!this.active) return '';
        const st = this._status();
        if (this.pts.length === 0) return '💧 E = place first point · Q = exit pond mode';
        if (st.canClose)           return '💧 E = CLOSE & create pond · Q = cancel';
        return `💧 E = add point (${this.pts.length} placed) · Q = cancel`;
    }

    // E key pressed
    interact() {
        if (!this.active || !this._cursPos) return false;
        const st = this._status();
        if (st.canClose) { this._finalize(); return true; }
        this.pts.push({ x: this._cursPos.x, z: this._cursPos.z });
        this._addMarker(this._cursPos.x, this._cursPos.z);
        this._updatePreviewLine();
        return true;
    }

    // Q key pressed
    cancel() { this._cancelDraw(); }

    tick(dt) {
        this.time += dt;
        for (const p of this.ponds) {
            if (p.userData.waterMat) p.userData.waterMat.uniforms.time.value = this.time;
        }
    }

    // ── PRIVATE ───────────────────────────────────────────────────────────────

    _status() {
        if (!this._cursPos || this.pts.length < 3) return { canClose: false };
        const f = this.pts[0];
        return { canClose: Math.hypot(this._cursPos.x - f.x, this._cursPos.z - f.z) < 2.5 };
    }

    _cancelDraw() {
        this.pts = [];
        if (this._previewGroup) { this.scene.remove(this._previewGroup); this._previewGroup = null; }
        if (this._previewLine)  { this.scene.remove(this._previewLine);  this._previewLine  = null; }
    }

    _finalize() {
        if (this.pts.length < 3) return;
        const pond = this._buildPond(this.pts.slice());
        this.ponds.push(pond);
        this.scene.add(pond);
        this._cancelDraw();
    }

    // ── CATMULL-ROM SPLINE ────────────────────────────────────────────────────
    _catmullRom(pts) {
        const n = pts.length;
        const SPP = Math.max(8, Math.ceil(80 / n)); // samples per segment
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

    // ── POND GEOMETRY ─────────────────────────────────────────────────────────

    _buildPond(pts) {
        // Smooth the control points into a proper curve
        const smoothPts = this._catmullRom(pts);

        // Deform ground geometry so pond is actually depressed into terrain
        let waterY = -0.04;
        if (this.world?.deformPond) {
            waterY = this.world.deformPond(smoothPts);
        }

        const group = new THREE.Group();

        // Underwater bottom (dark sediment, sits below water level)
        const botGeo = this._makeSurface(smoothPts, waterY - 0.85);
        const botMat = new THREE.MeshStandardMaterial({ color: 0x080e0a, roughness: 0.98 });
        group.add(new THREE.Mesh(botGeo, botMat));

        // Sloped earth bank
        const bank = this._buildBank(smoothPts, waterY);
        if (bank) group.add(bank);

        // Animated water surface
        const waterGeo = this._makeSurface(smoothPts, waterY);
        const waterMat = this._makeWaterMat();
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.renderOrder = 1;
        group.add(waterMesh);
        group.userData.waterMat = waterMat;

        return group;
    }

    // Fan-triangulated flat surface at height y
    _makeSurface(pts, y) {
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
        const minZ = Math.min(...pts.map(p => p.z)), maxZ = Math.max(...pts.map(p => p.z));
        const rX = (maxX - minX) || 1, rZ = (maxZ - minZ) || 1;

        const pos = [], uv = [], norm = [];
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length];
            pos.push(cx, y, cz,   a.x, y, a.z,   b.x, y, b.z);
            uv.push(
                (cx - minX) / rX, (cz - minZ) / rZ,
                (a.x - minX) / rX, (a.z - minZ) / rZ,
                (b.x - minX) / rX, (b.z - minZ) / rZ
            );
            norm.push(0, 1, 0,  0, 1, 0,  0, 1, 0);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uv), 2));
        geo.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(norm), 3));
        return geo;
    }

    // Sloped earth ring: inner edge at waterY, outer edge slightly above
    _buildBank(pts, waterY) {
        const wY = waterY ?? -0.04;
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;

        const OFFSET = 0.8;
        const outer = pts.map(p => {
            const dx = p.x - cx, dz = p.z - cz;
            const len = Math.hypot(dx, dz) || 1;
            return { x: p.x + (dx / len) * OFFSET, z: p.z + (dz / len) * OFFSET };
        });

        const yI = wY, yO = wY + 0.18;
        const pos = [];
        for (let i = 0; i < pts.length; i++) {
            const iA = pts[i], iB = pts[(i + 1) % pts.length];
            const oA = outer[i], oB = outer[(i + 1) % pts.length];
            pos.push(iA.x, yI, iA.z,  oA.x, yO, oA.z,  iB.x, yI, iB.z);
            pos.push(oA.x, yO, oA.z,  oB.x, yO, oB.z,  iB.x, yI, iB.z);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.computeVertexNormals();

        // Blend two earth tones for a natural bank
        const mat = new THREE.MeshStandardMaterial({ color: 0x2a3518, roughness: 0.95, metalness: 0 });
        return new THREE.Mesh(geo, mat);
    }

    // ── WATER SHADER ──────────────────────────────────────────────────────────

    _makeWaterMat() {
        return new THREE.ShaderMaterial({
            uniforms: {
                time:         { value: 0 },
                deepColor:    { value: new THREE.Color(0x041218) },
                shallowColor: { value: new THREE.Color(0x0d4a5e) },
                foamColor:    { value: new THREE.Color(0x8ec8e0) },
                sunDir:       { value: new THREE.Vector3(0.55, 1.0, 0.38).normalize() },
            },
            vertexShader: `
                uniform float time;
                varying vec2  vUv;
                varying vec3  vWorldPos;
                varying vec3  vViewDir;
                varying float vWave;

                void main() {
                    vUv = uv;
                    vec3 pos = position;

                    // Multi-octave Gerstner-style waves
                    float w1 = sin(pos.x * 1.15 + time * 1.20) * cos(pos.z * 0.90 + time * 0.80) * 0.070;
                    float w2 = sin(pos.x * 2.40 - time * 1.55 + pos.z * 1.75) * 0.040;
                    float w3 = cos(pos.x * 0.65 + pos.z * 1.35 + time * 1.00) * 0.028;
                    float w4 = sin((pos.x - pos.z) * 3.20 + time * 1.80) * 0.015;
                    vWave = w1 + w2 + w3 + w4;
                    pos.y += vWave;

                    vec4 wp = modelMatrix * vec4(pos, 1.0);
                    vWorldPos = wp.xyz;
                    vViewDir  = normalize(cameraPosition - wp.xyz);
                    gl_Position = projectionMatrix * viewMatrix * wp;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3  deepColor;
                uniform vec3  shallowColor;
                uniform vec3  foamColor;
                uniform vec3  sunDir;

                varying vec2  vUv;
                varying vec3  vWorldPos;
                varying vec3  vViewDir;
                varying float vWave;

                void main() {
                    // ── Three animated ripple layers ──────────────────────────
                    vec2 uv1 = vUv * 4.5  + vec2( time*0.055,  time*0.038);
                    vec2 uv2 = vUv * 8.2  - vec2( time*0.048,  time*0.065) + 0.3;
                    vec2 uv3 = vUv * 14.0 + vec2( time*0.025, -time*0.042);

                    float r1 = sin(uv1.x * 6.283) * cos(uv1.y * 6.283);
                    float r2 = sin(uv2.x * 6.283 + uv2.y * 3.14);
                    float r3 = sin(uv3.x * 6.283) * sin(uv3.y * 6.283);
                    float ripple  = r1 * 0.50 + r2 * 0.30 + r3 * 0.20;
                    float rippleN = ripple * 0.5 + 0.5; // 0-1

                    // ── Caustics (bright wavy light patterns) ─────────────────
                    vec2 c1uv = vUv * 9.0  + vec2(time*0.09, time*0.07);
                    vec2 c2uv = vUv * 13.0 - vec2(time*0.07, time*0.05);
                    float caus = pow(
                        abs(sin(c1uv.x*3.1)) * abs(sin(c1uv.y*3.1 + time*0.5)) *
                        abs(cos(c2uv.x*2.4  + c2uv.y*1.8)),
                        1.6
                    ) * 0.32;

                    // ── Fresnel (edge brightening / reflectivity) ──────────────
                    float ndotv   = max(dot(vViewDir, vec3(0.0, 1.0, 0.0)), 0.0);
                    float fresnel = pow(1.0 - ndotv, 3.2);

                    // ── Base water color ──────────────────────────────────────
                    vec3 waterCol = mix(deepColor, shallowColor,
                                       rippleN * 0.55 + fresnel * 0.30);

                    // Caustic tint (cool blue-white)
                    waterCol += vec3(caus * 0.12, caus * 0.24, caus * 0.30);

                    // ── Specular (sharp + wide) ────────────────────────────────
                    vec3 pertNorm = normalize(vec3(r1 * 0.14, 1.0, r2 * 0.11));
                    vec3 halfVec  = normalize(sunDir + vViewDir);
                    float spec1   = pow(max(dot(pertNorm, halfVec), 0.0), 180.0) * 1.1;
                    float spec2   = pow(max(dot(pertNorm, halfVec), 0.0),  22.0) * 0.14;
                    waterCol += vec3(1.0, 0.95, 0.80) * spec1 + vec3(spec2);

                    // ── Edge foam ─────────────────────────────────────────────
                    float edgeFactor = 1.0 - min(
                        min(vUv.x, vUv.y),
                        min(1.0 - vUv.x, 1.0 - vUv.y)
                    ) * 7.0;
                    edgeFactor = max(edgeFactor, 0.0);
                    float foamNoise = abs(sin(uv1.x*11.0 + time*2.5)) *
                                      abs(sin(uv1.y * 9.0));
                    float foam = smoothstep(0.0, 0.6, edgeFactor) * foamNoise * 0.55;
                    waterCol   = mix(waterCol, foamColor, foam);

                    // ── Alpha ─────────────────────────────────────────────────
                    float alpha = 0.82 + fresnel * 0.14 + rippleN * 0.04;

                    gl_FragColor = vec4(waterCol, alpha);
                }
            `,
            transparent: true,
            side:        THREE.FrontSide,
            depthWrite:  false,
        });
    }

    // ── PREVIEW HELPERS ───────────────────────────────────────────────────────

    _buildCursor() {
        const geo = new THREE.RingGeometry(0.25, 0.48, 24);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ddff, side: THREE.DoubleSide,
            transparent: true, opacity: 0.88,
        });
        this._cursorMesh = new THREE.Mesh(geo, mat);
        this._cursorMesh.rotation.x = -Math.PI / 2;
        this._cursorMesh.visible = false;
        this.scene.add(this._cursorMesh);
    }

    _addMarker(x, z) {
        if (!this._previewGroup) {
            this._previewGroup = new THREE.Group();
            this.scene.add(this._previewGroup);
        }
        const isFirst = this.pts.length === 1; // just added, so length is 1
        const geo = new THREE.SphereGeometry(isFirst ? 0.30 : 0.20, 12, 8);
        const mat = new THREE.MeshBasicMaterial({ color: isFirst ? 0x00ff88 : 0x00aaff });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, 0.20, z);
        this._previewGroup.add(m);
        // Small vertical spike so it's visible at oblique angles
        const sGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
        const sM   = new THREE.Mesh(sGeo, mat);
        sM.position.set(x, 0.2, z);
        this._previewGroup.add(sM);
    }

    _updatePreviewLine() {
        if (this._previewLine) { this.scene.remove(this._previewLine); this._previewLine = null; }
        if (this.pts.length < 1) return;

        const all = [...this.pts];
        if (this._cursPos) all.push(this._cursPos);
        if (all.length < 2) return;

        const v = [];
        for (const p of all) v.push(p.x, 0.12, p.z);
        // Close loop back to first
        v.push(this.pts[0].x, 0.12, this.pts[0].z);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3));
        const st  = this._status();
        const mat = new THREE.LineBasicMaterial({ color: st.canClose ? 0x00ff66 : 0x00ddff });
        this._previewLine = new THREE.Line(geo, mat);
        this.scene.add(this._previewLine);
    }
}
