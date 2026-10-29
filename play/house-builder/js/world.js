class World {
    constructor(scene, acres) {
        this.scene = scene;
        this.acres = acres;
        // 1 acre square root ≈ 63.6m. Scale: 1 unit = 1 foot, 1 acre ≈ 208 feet side
        this.size = Math.round(Math.sqrt(acres) * 208);
        this.cellSize = 10; // 10 feet per wall segment
        this.ground = null;

        this._build();
    }

    _build() {
        this._sky();
        this._ground();
        this._grid();
        this._lighting();
        this._boundary();
        this._trees();
        try { this._buildSun(); }    catch(e) { console.warn('Sun init failed:', e); }
        try { this._buildClouds(); } catch(e) { console.warn('Cloud init failed:', e); }
    }

    _sky() {
        // Fallback clear colour (seen if dome glitches)
        this.scene.background = new THREE.Color(0x6bbfe8);
        this.scene.fog = new THREE.FogExp2(0x8fd4ee, 0.0012);
        this._buildSkyDome();
    }

    _buildSkyDome() {
        const geo = new THREE.SphereGeometry(1400, 32, 18);
        const mat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            uniforms: {
                topColor:   { value: new THREE.Color(0x0d4fa8) },
                midColor:   { value: new THREE.Color(0x5aaedd) },
                horizColor: { value: new THREE.Color(0xbcd8ee) },
            },
            vertexShader: `
                varying vec3 vDir;
                void main() {
                    vDir = normalize(position);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 midColor;
                uniform vec3 horizColor;
                varying vec3 vDir;
                void main() {
                    float h = vDir.y; // -1..1
                    vec3 col;
                    if (h >= 0.0) {
                        col = mix(midColor, topColor, pow(h, 0.55));
                    } else {
                        col = mix(horizColor, midColor, clamp(1.0 + h * 5.0, 0.0, 1.0));
                    }
                    gl_FragColor = vec4(col, 1.0);
                }
            `,
        });
        this._skyDome = new THREE.Mesh(geo, mat);
        this.scene.add(this._skyDome);
    }

    // ── SW Florida terrain noise: long-wavelength, very low amplitude ───────────
    _terrainH(wx, wz) {
        const h = Math.sin(wx*0.016 + 0.50) * Math.cos(wz*0.019 + 1.20) * 0.38
                + Math.sin(wx*0.038 + wz*0.033 + 2.10) * 0.12
                + Math.cos(wx*0.085 + wz*0.068 - 0.80) * 0.055
                + Math.sin(wx*0.20  + wz*0.16  + 3.50) * 0.018;
        return Math.max(0, h + 0.22); // always >= 0, max ~1 unit over entire lot
    }

    // Public: query terrain height at world (x, z). Does NOT reflect pond deformation.
    sampleHeight(wx, wz) { return this._terrainH(wx, wz); }

    _ground() {
        // South Florida St. Augustine / Bahia grass — medium-dark warm green with slight yellow cast
        const seg = 96; // higher segments so terrain detail looks smoother
        const geo = new THREE.PlaneGeometry(this.size, this.size, seg, seg);

        const count  = geo.attributes.position.count;
        const posArr = geo.attributes.position;
        const colors = new Float32Array(count * 3);
        const c1 = new THREE.Color(0x4e8b35);
        const c2 = new THREE.Color(0x3d7228);
        const c3 = new THREE.Color(0x5a9040);

        for (let i = 0; i < count; i++) {
            const lx = posArr.getX(i);   // local X = world X
            const ly = posArr.getY(i);   // local Y = -world Z
            const wz = -ly;

            // Apply SW Florida terrain undulation (set local Z = world Y height)
            const h = this._terrainH(lx, wz);
            posArr.setZ(i, h);

            // Vertex colour: slightly darker in lower areas (wet/shadowed), lighter on highs
            const r = Math.random();
            const pick = r < 0.5 ? c1 : r < 0.85 ? c2 : c3;
            // Tint low areas slightly darker (looks damp)
            const tint = (Math.random() - 0.5) * 0.04 - h * 0.02;
            colors[i*3]   = Math.min(1, Math.max(0, pick.r + tint));
            colors[i*3+1] = Math.min(1, Math.max(0, pick.g + tint));
            colors[i*3+2] = Math.min(1, Math.max(0, pick.b + tint));
        }
        posArr.needsUpdate = true;
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
        this.ground = new THREE.Mesh(geo, mat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.ground.name = 'ground';
        this.ground.userData.surface = 'floor';
        this.ground.userData.noPaint = true;
        this.scene.add(this.ground);

        // Thin dirt/sand border strip at lot edge — common in Florida lots
        this._groundBorder();
    }

    _groundBorder() {
        const h    = this.size / 2;
        const bw   = 8; // 8-foot border strip
        const mat  = new THREE.MeshLambertMaterial({ color: 0xc8a96e }); // sandy Florida soil
        const sides = [
            { w: this.size + bw*2, d: bw, x: 0,  z:  h + bw/2 },
            { w: this.size + bw*2, d: bw, x: 0,  z: -h - bw/2 },
            { w: bw, d: this.size, x:  h + bw/2, z: 0 },
            { w: bw, d: this.size, x: -h - bw/2, z: 0 },
        ];
        sides.forEach(s => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.d), mat);
            m.rotation.x = -Math.PI / 2;
            m.position.set(s.x, 0.005, s.z);
            m.receiveShadow = true;
            this.scene.add(m);
        });
    }

    // ── Pond terrain deformation ─────────────────────────────────────────────
    // smoothPts: [{x,z}] — the Catmull-Rom spline points of the pond outline
    // Returns: the world Y of the water surface (rim height - small inset)
    deformPond(smoothPts) {
        const pos = this.ground.geometry.attributes.position;

        // Centroid + max radius of the pond outline
        const cx = smoothPts.reduce((s, p) => s + p.x, 0) / smoothPts.length;
        const cz = smoothPts.reduce((s, p) => s + p.z, 0) / smoothPts.length;
        const maxR = Math.max(...smoothPts.map(p => Math.hypot(p.x - cx, p.z - cz)));

        const MAX_DEPTH = 1.5;
        const BLEND_W   = maxR * 0.35 + 1.0; // blend ring width around polygon edge

        for (let i = 0; i < pos.count; i++) {
            const lx = pos.getX(i);
            const wz = -pos.getY(i); // PlaneGeometry local Y = -world Z
            const wx = lx;

            const d = Math.hypot(wx - cx, wz - cz);
            if (d > maxR + BLEND_W) continue;

            const curH = pos.getZ(i);

            if (this._pointInPoly(wx, wz, smoothPts)) {
                // Bowl: deepest at centroid, tapers to rim
                const t = d / maxR;
                const depth = MAX_DEPTH * Math.pow(Math.max(0, 1 - t * 0.85), 1.6);
                pos.setZ(i, curH - depth);
            } else {
                // Outer blend ring: gentle inward slope
                const bT = (d - maxR) / BLEND_W; // 0 at edge → 1 at blend end
                const slope = Math.pow(Math.max(0, 1 - bT), 2.2) * MAX_DEPTH * 0.10;
                pos.setZ(i, curH - slope);
            }
        }

        pos.needsUpdate = true;
        this.ground.geometry.computeVertexNormals();

        // Water Y: average terrain height at edge points, slightly below the rim
        const edgeSample = smoothPts.filter((_, i) => i % 5 === 0);
        const edgeH = edgeSample.reduce((s, p) => s + this._terrainH(p.x, p.z), 0) / edgeSample.length;
        return edgeH - 0.08;
    }

    _pointInPoly(px, pz, poly) {
        let inside = false;
        const n = poly.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = poly[i].x, zi = poly[i].z;
            const xj = poly[j].x, zj = poly[j].z;
            if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    _grid() {
        const divs = Math.floor(this.size / this.cellSize);
        this.gridHelper = new THREE.GridHelper(this.size, divs, 0x00ff88, 0x226644);
        this.gridHelper.material.opacity = 0.22;
        this.gridHelper.material.transparent = true;
        this.gridHelper.position.y = 0.02;
        this.scene.add(this.gridHelper);
    }

    _lighting() {
        // South Florida: bright high sun, warm shadows, strong fill from humid sky
        const ambient = new THREE.AmbientLight(0xd8eeff, 0.55);
        this.scene.add(ambient);

        // High noon-ish sun — Florida sun is nearly overhead in summer
        const sun = new THREE.DirectionalLight(0xfff5d8, 1.3);
        sun.position.set(80, 400, 60);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 1400;
        const sc = this.size / 2 + 60;
        sun.shadow.camera.left   = -sc;
        sun.shadow.camera.right  =  sc;
        sun.shadow.camera.top    =  sc;
        sun.shadow.camera.bottom = -sc;
        sun.shadow.bias = -0.0003;
        this.scene.add(sun);

        // Sky fill — blue-white bounce from humid Florida sky
        const fill = new THREE.DirectionalLight(0x9dc8ff, 0.4);
        fill.position.set(-80, 100, -60);
        this.scene.add(fill);

        // Subtle warm ground bounce
        const bounce = new THREE.HemisphereLight(0x9dc8ff, 0x5a8c30, 0.2);
        this.scene.add(bounce);
    }

    _boundary() {
        const h = this.size / 2;
        const postMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
        const postGeo = new THREE.BoxGeometry(1, 5, 1);
        const corners = [[-h,-h],[h,-h],[h,h],[-h,h]];
        corners.forEach(([x,z]) => {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(x, 2.5, z);
            post.castShadow = true;
            this.scene.add(post);
        });

        // Fence rails along edges
        const railMat = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
        const segments = 8;
        for (let s = 0; s < segments; s++) {
            const t = -h + (s + 0.5) * (this.size / segments);
            const railLen = this.size / segments - 1;
            const rGeo = new THREE.BoxGeometry(railLen, 0.3, 0.3);

            [-h, h].forEach(z => {
                const r = new THREE.Mesh(rGeo, railMat);
                r.position.set(t, 3, z);
                this.scene.add(r);
            });

            const rGeo2 = new THREE.BoxGeometry(0.3, 0.3, railLen);
            [-h, h].forEach(x => {
                const r = new THREE.Mesh(rGeo2, railMat);
                r.position.set(x, 3, t);
                this.scene.add(r);
            });
        }
    }

    _trees() {
        // South Florida perimeter vegetation: palms, live oaks, slash pines, sabal palms
        const h     = this.size / 2 - 12;
        const count = Math.min(Math.floor(this.acres * 5), 50);

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
            const r     = h * (0.82 + Math.random() * 0.16);
            const x     = Math.cos(angle) * r;
            const z     = Math.sin(angle) * r;
            const type  = Math.random();

            if (type < 0.45) {
                this._spawnPalm(x, z);            // cabbage/sabal palm — most common
            } else if (type < 0.7) {
                this._spawnSlashPine(x, z);        // slash pine — Florida forest staple
            } else {
                this._spawnLiveOak(x, z);          // live oak — broad spreading canopy
            }
        }
    }

    _spawnPalm(x, z) {
        const s = 0.9 + Math.random() * 0.7;
        const h = 14 * s;
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a7055 });

        // Slightly curved trunk (lean)
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25 * s, 0.4 * s, h, 6),
            trunkMat
        );
        trunk.position.set(x, h / 2, z);
        trunk.rotation.z = (Math.random() - 0.5) * 0.12;
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Frond crown — a few overlapping cones pointing outward
        const frondMat = new THREE.MeshLambertMaterial({ color: 0x3a7a28 });
        for (let f = 0; f < 5; f++) {
            const frond = new THREE.Mesh(
                new THREE.ConeGeometry(2.5 * s, 4 * s, 5),
                frondMat
            );
            frond.position.set(x, h + 1.5 * s, z);
            frond.rotation.z = (Math.PI / 4) + (Math.random() - 0.5) * 0.3;
            frond.rotation.y = (f / 5) * Math.PI * 2;
            frond.castShadow = true;
            this.scene.add(frond);
        }
        // Center crown ball
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(1.8 * s, 6, 5),
            frondMat
        );
        crown.position.set(x, h + 0.5 * s, z);
        this.scene.add(crown);
    }

    _spawnSlashPine(x, z) {
        const s = 1.0 + Math.random() * 0.6;
        const h = 22 * s;
        const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x6b4020 });
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x1e5c1e });

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3 * s, 0.55 * s, h, 6),
            trunkMat
        );
        trunk.position.set(x, h / 2, z);
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Sparse upper canopy (slash pines are tall and open)
        for (let i = 0; i < 3; i++) {
            const layer = new THREE.Mesh(
                new THREE.ConeGeometry((2.5 - i * 0.5) * s, (3 + i) * s, 6),
                foliageMat
            );
            layer.position.set(x, (h * 0.65 + i * 4 * s), z);
            layer.castShadow = true;
            this.scene.add(layer);
        }
    }

    _spawnLiveOak(x, z) {
        const s = 0.8 + Math.random() * 0.5;
        const h = 12 * s;
        const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x5a3a18 });
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x2a5c1a });

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5 * s, 0.75 * s, h * 0.5, 7),
            trunkMat
        );
        trunk.position.set(x, h * 0.25, z);
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Wide spreading canopy — two overlapping spheres
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(6 * s, 7, 5),
            foliageMat
        );
        canopy.scale.y = 0.55; // flatten it wide
        canopy.position.set(x, h * 0.65, z);
        canopy.castShadow = true;
        this.scene.add(canopy);

        const canopy2 = new THREE.Mesh(
            new THREE.SphereGeometry(4.5 * s, 6, 5),
            new THREE.MeshLambertMaterial({ color: 0x1e4c14 })
        );
        canopy2.scale.y = 0.5;
        canopy2.position.set(x + 2 * s, h * 0.7, z + 1.5 * s);
        canopy2.castShadow = true;
        this.scene.add(canopy2);
    }

    snap(x, z) {
        const c = this.cellSize / 2; // 5-foot snap so walls connect at corners/edges
        return { x: Math.round(x / c) * c, z: Math.round(z / c) * c };
    }

    toggleGrid(v) { this.gridHelper.visible = v; }

    inBounds(x, z) {
        const h = this.size / 2 - 5;
        return Math.abs(x) < h && Math.abs(z) < h;
    }

    // ── SUN ───────────────────────────────────────────────────────────────────
    _buildSun() {
        // Sun direction matches DirectionalLight (80, 400, 60), placed far away
        const dir = new THREE.Vector3(80, 400, 60).normalize();
        const dist = 1800;
        this._sunPos = dir.clone().multiplyScalar(dist);

        // Core disk — bright white-yellow
        const diskTex = this._makeSunTex();
        const diskMat = new THREE.MeshBasicMaterial({
            map: diskTex, transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        });
        this._sunDisk = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), diskMat);
        this._sunDisk.position.copy(this._sunPos);
        this._sunDisk.renderOrder = 1;
        this.scene.add(this._sunDisk);

        // Outer corona halo — larger, softer
        const haloCv = document.createElement('canvas'); haloCv.width = haloCv.height = 256;
        const hCtx = haloCv.getContext('2d');
        const hGr = hCtx.createRadialGradient(128,128,0, 128,128,128);
        hGr.addColorStop(0,   'rgba(255,248,200,0.70)');
        hGr.addColorStop(0.25,'rgba(255,230,140,0.35)');
        hGr.addColorStop(0.55,'rgba(255,210,80,0.10)');
        hGr.addColorStop(1,   'rgba(255,180,50,0.0)');
        hCtx.fillStyle = hGr; hCtx.fillRect(0,0,256,256);
        const haloMat = new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(haloCv), transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        });
        const halo = new THREE.Mesh(new THREE.PlaneGeometry(380, 380), haloMat);
        halo.position.copy(this._sunPos);
        halo.renderOrder = 0;
        this.scene.add(halo);

        // Screen-space lens flare overlay
        this._flareCanvas = document.createElement('canvas');
        this._flareCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5';
        document.body.appendChild(this._flareCanvas);
        this._flareCtx = this._flareCanvas.getContext('2d');

        // Flare orb definitions: t = offset along center→sun axis (0=center,1=sun,-1=opposite)
        this._flareOrbs = [
            { t:1.25, r:28, col:'rgba(255,240,180,{a})', a:0.40 },
            { t:1.08, r:12, col:'rgba(255,255,200,{a})', a:0.55 },
            { t:0.85, r:18, col:'rgba(200,220,255,{a})', a:0.30 },
            { t:0.55, r:40, col:'rgba(255,210,100,{a})', a:0.18 },
            { t:0.20, r:22, col:'rgba(180,200,255,{a})', a:0.25 },
            { t:-0.15,r:55, col:'rgba(255,180,100,{a})', a:0.12 },
            { t:-0.50,r:14, col:'rgba(200,240,255,{a})', a:0.28 },
            { t:-0.80,r:30, col:'rgba(255,220,140,{a})', a:0.16 },
        ];
    }

    _makeSunTex() {
        const cv = document.createElement('canvas'); cv.width = cv.height = 256;
        const ctx = cv.getContext('2d');
        // Core white-hot center
        const gr = ctx.createRadialGradient(128,128,0, 128,128,128);
        gr.addColorStop(0,    'rgba(255,255,255,1.0)');
        gr.addColorStop(0.08, 'rgba(255,255,230,1.0)');
        gr.addColorStop(0.22, 'rgba(255,250,180,0.95)');
        gr.addColorStop(0.42, 'rgba(255,230,100,0.70)');
        gr.addColorStop(0.65, 'rgba(255,210,60,0.30)');
        gr.addColorStop(1,    'rgba(255,180,0,0.0)');
        ctx.fillStyle = gr; ctx.fillRect(0,0,256,256);
        // Sunbeam rays — 12 thin lines radiating out
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const rayGr = ctx.createLinearGradient(128,128,
                128 + Math.cos(angle)*128, 128 + Math.sin(angle)*128);
            rayGr.addColorStop(0,   'rgba(255,255,200,0.25)');
            rayGr.addColorStop(0.5, 'rgba(255,240,150,0.06)');
            rayGr.addColorStop(1,   'rgba(255,220,100,0.0)');
            ctx.strokeStyle = rayGr;
            ctx.lineWidth = 2 + (i % 3 === 0 ? 2 : 0);
            ctx.beginPath();
            ctx.moveTo(128, 128);
            ctx.lineTo(128 + Math.cos(angle)*128, 128 + Math.sin(angle)*128);
            ctx.stroke();
        }
        return new THREE.CanvasTexture(cv);
    }

    // ── CLOUDS ────────────────────────────────────────────────────────────────
    _buildClouds() {
        this._clouds = [];
        const cloudTex = this._makeCloudTex();
        const count = 22;
        const spread = this.size * 1.4;

        for (let i = 0; i < count; i++) {
            const cloud = this._makeCloud(cloudTex, spread);
            this.scene.add(cloud.group);
            this._clouds.push(cloud);
        }
    }

    _makeCloudTex() {
        const cv = document.createElement('canvas'); cv.width = cv.height = 256;
        const ctx = cv.getContext('2d');
        // Soft rounded cloud puff
        const gr = ctx.createRadialGradient(128,128,0, 128,128,128);
        gr.addColorStop(0,    'rgba(255,255,255,0.95)');
        gr.addColorStop(0.35, 'rgba(248,250,255,0.80)');
        gr.addColorStop(0.65, 'rgba(240,245,255,0.40)');
        gr.addColorStop(0.85, 'rgba(230,238,255,0.12)');
        gr.addColorStop(1,    'rgba(220,232,255,0.0)');
        ctx.fillStyle = gr; ctx.fillRect(0,0,256,256);
        return new THREE.CanvasTexture(cv);
    }

    _makeCloud(tex, spread) {
        const group = new THREE.Group();
        // Each cloud: 5-9 overlapping billboard puffs at varied sizes/offsets
        const puffCount = 5 + Math.floor(Math.random() * 5);
        const mat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, depthWrite: false,
            side: THREE.DoubleSide, opacity: 0.88,
        });
        for (let p = 0; p < puffCount; p++) {
            const s = 60 + Math.random() * 90;
            const puff = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.62), mat.clone());
            puff.position.set(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 35,
            );
            group.add(puff);
        }
        // Random position across the sky
        const x = (Math.random() - 0.5) * spread;
        const z = (Math.random() - 0.5) * spread;
        const y = 200 + Math.random() * 160;
        group.position.set(x, y, z);
        // Give each cloud a slow drift speed and direction
        const speed  = 0.8 + Math.random() * 1.4;
        const angle  = Math.random() * Math.PI * 2;
        return {
            group,
            vx: Math.cos(angle) * speed,
            vz: Math.sin(angle) * speed,
            spread,
        };
    }

    // ── TICK: called every frame from main.js ─────────────────────────────────
    tick(dt, camera, renderer) {
        // Sky dome follows camera so it always surrounds the player
        if (this._skyDome) this._skyDome.position.copy(camera.position);
        try { if (this._clouds) this._tickClouds(dt, camera); } catch(e) {}
        try { if (this._flareCanvas) this._tickFlare(camera); } catch(e) {}
    }

    _tickClouds(dt, camera) {
        for (const c of this._clouds) {
            c.group.position.x += c.vx * dt;
            c.group.position.z += c.vz * dt;
            // Billboard each puff to face camera
            c.group.children.forEach(puff => puff.lookAt(camera.position));
            // Wrap around lot boundary
            const half = c.spread / 2;
            if (c.group.position.x >  half) c.group.position.x = -half;
            if (c.group.position.x < -half) c.group.position.x =  half;
            if (c.group.position.z >  half) c.group.position.z = -half;
            if (c.group.position.z < -half) c.group.position.z =  half;
        }
        // Sun disk always faces camera
        if (this._sunDisk) this._sunDisk.lookAt(camera.position);
    }

    _tickFlare(camera) {
        if (!this._flareCanvas || !this._sunPos) return;
        const cv  = this._flareCanvas;
        const ctx = this._flareCtx;
        // Resize canvas to window if needed
        if (cv.width !== window.innerWidth || cv.height !== window.innerHeight) {
            cv.width  = window.innerWidth;
            cv.height = window.innerHeight;
        }
        ctx.clearRect(0, 0, cv.width, cv.height);

        // Project sun world pos to screen
        const proj = this._sunPos.clone().project(camera);
        // proj is in NDC (-1..1); skip if behind camera
        if (proj.z > 1) return;
        const sx = (proj.x *  0.5 + 0.5) * cv.width;
        const sy = (proj.y * -0.5 + 0.5) * cv.height;
        const cx = cv.width  / 2;
        const cy = cv.height / 2;

        // Fade out when sun near screen edge; guard against NaN
        if (!isFinite(sx) || !isFinite(sy)) return;
        const edgeDist = Math.min(sx, sy, cv.width-sx, cv.height-sy);
        const visibility = Math.max(0, Math.min(1, edgeDist / 120));
        if (visibility <= 0) return;

        for (const orb of this._flareOrbs) {
            const ox = cx + (sx - cx) * orb.t;
            const oy = cy + (sy - cy) * orb.t;
            const alpha = orb.a * visibility;
            const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r);
            const col = orb.col.replace('{a}', alpha.toFixed(3));
            const col0 = orb.col.replace('{a}', (alpha * 0.0).toFixed(3));
            gr.addColorStop(0, col);
            gr.addColorStop(1, col0);
            ctx.fillStyle = gr;
            ctx.beginPath();
            ctx.arc(ox, oy, orb.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central streak — horizontal and vertical lens smear through sun position
        const streakAlpha = 0.18 * visibility;
        ctx.strokeStyle = `rgba(255,250,200,${streakAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx - 80, sy); ctx.lineTo(sx + 80, sy); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, sy - 60); ctx.lineTo(sx, sy + 60); ctx.stroke();
    }
}
