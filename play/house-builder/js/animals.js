// ── NPC ANIMALS ───────────────────────────────────────────────────────────────
class AnimalSystem {
    constructor(scene, world) {
        this.scene  = scene;
        this.world  = world;
        this._birds   = [];
        this._rabbits = [];
        this._t       = 0;
        this._spawn();
    }

    _spawn() {
        for (let i = 0; i < 5; i++) this._spawnBird(i);
        for (let i = 0; i < 6; i++) this._spawnRabbit(i);
    }

    // ── BIRD ─────────────────────────────────────────────────────────────────────
    _spawnBird(idx) {
        const FEATHER_COLS = [0x1a1a22, 0x2c3a0f, 0x3a2a14, 0x1e2e44, 0x3a2020];
        const BELLY_COLS   = [0x5a5050, 0x8a9a6a, 0x8a6a40, 0x7090b8, 0x8a5050];
        const fc = FEATHER_COLS[idx % FEATHER_COLS.length];
        const bc = BELLY_COLS[idx % BELLY_COLS.length];

        const featherMat = new THREE.MeshLambertMaterial({ color: fc });
        const bellyMat   = new THREE.MeshLambertMaterial({ color: bc });
        const beakMat    = new THREE.MeshLambertMaterial({ color: 0xE8B840 });
        const eyeMat     = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });

        const g = new THREE.Group();

        // Body — slightly elongated sphere
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 9, 7), featherMat);
        body.scale.set(0.9, 0.82, 1.25);
        g.add(body);

        // Belly patch
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), bellyMat);
        belly.scale.set(0.7, 0.65, 0.6);
        belly.position.set(0, -0.08, 0.08);
        g.add(belly);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.20, 9, 7), featherMat);
        head.position.set(0, 0.14, 0.34);
        g.add(head);

        // Beak (upper + lower)
        const beakU = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.20, 5), beakMat);
        beakU.rotation.z = -Math.PI / 2;
        beakU.rotation.y = 0;
        beakU.position.set(0.16, 0.14, 0.34);
        g.add(beakU);
        const beakL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), beakMat);
        beakL.rotation.z = -Math.PI / 2;
        beakL.position.set(0.12, 0.10, 0.34);
        g.add(beakL);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.045, 6, 5);
        [-0.09, 0.09].forEach(ox => {
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(ox, 0.19, 0.50);
            g.add(eye);
        });

        // Wing pivot groups (left = negative X side, right = positive X)
        const leftPivot  = new THREE.Group(); leftPivot.position.set(-0.22, 0, 0);
        const rightPivot = new THREE.Group(); rightPivot.position.set( 0.22, 0, 0);

        // Primary feathers (large wing segment)
        const makeWing = (dir) => {
            const wg = new THREE.Group();
            // Main wing slab
            const slab = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 0.42), featherMat);
            slab.position.x = dir * 0.42;
            wg.add(slab);
            // Primary feather tips — 5 tapered boxes
            for (let f = 0; f < 5; f++) {
                const fw = 0.09 - f * 0.008, fh = 0.04;
                const fd = 0.32 + f * 0.04;
                const tip = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, fd), featherMat);
                tip.position.set(dir * (0.9 + f * 0.02), 0, 0.02 + f * 0.02);
                wg.add(tip);
            }
            return wg;
        };

        leftPivot.add(makeWing(-1));
        rightPivot.add(makeWing(1));
        g.add(leftPivot);
        g.add(rightPivot);

        // Tail fan
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.38), featherMat);
        tail.position.set(0, -0.06, -0.42);
        tail.rotation.x = -0.25;
        g.add(tail);

        // Feet (two small sticks each)
        const footMat = new THREE.MeshLambertMaterial({ color: 0xD4A030 });
        [-0.10, 0.10].forEach(fx => {
            const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 5), footMat);
            shin.position.set(fx, -0.35, 0.04);
            g.add(shin);
        });

        g.castShadow = true;
        g.scale.setScalar(0.85 + Math.random() * 0.3);
        this.scene.add(g);

        const r     = 25 + idx * 14 + Math.random() * 10;
        const cx    = (Math.random() - 0.5) * 50;
        const cz    = (Math.random() - 0.5) * 50;
        const h     = 18 + Math.random() * 14;
        const spd   = 0.22 + Math.random() * 0.14;
        const phase = (idx / 5) * Math.PI * 2;

        this._birds.push({ g, leftPivot, rightPivot, r, cx, cz, h, spd, phase, t: phase });
    }

    // ── RABBIT ────────────────────────────────────────────────────────────────────
    _spawnRabbit(idx) {
        const FUR  = [0xCCBBAA, 0x7A6858, 0xF0E0D0, 0x504038, 0xA8B898, 0xE8D8C0];
        const DARK = [0x3A2818, 0x1A120C, 0x5A4030, 0x100808, 0x303828, 0x604030];
        const furMat  = new THREE.MeshLambertMaterial({ color: FUR[idx % FUR.length] });
        const darkMat = new THREE.MeshLambertMaterial({ color: DARK[idx % DARK.length] });
        const noseMat = new THREE.MeshLambertMaterial({ color: 0xFF9090 });
        const eyeMat  = new THREE.MeshLambertMaterial({ color: 0x080408 });

        const g = new THREE.Group();

        // Body — stout oval
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 9, 7), furMat);
        body.scale.set(0.85, 0.82, 1.15);
        g.add(body);

        // Haunches (slightly darker rear mass)
        const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 7), darkMat);
        haunch.scale.set(0.9, 0.78, 0.88);
        haunch.position.set(0, -0.06, -0.28);
        g.add(haunch);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 9, 7), furMat);
        head.position.set(0, 0.26, 0.36);
        g.add(head);
        // Store head ref for bobbing
        g.userData.head = head;

        // Ears — long upright boxes
        const earGeo = new THREE.BoxGeometry(0.085, 0.58, 0.075);
        const earInnerGeo = new THREE.BoxGeometry(0.04, 0.44, 0.025);
        const earInnerMat = new THREE.MeshLambertMaterial({ color: 0xFF9090 });
        [[-0.11, 0.11], [0.11, -0.11]].forEach(([ox, rot]) => {
            const ear = new THREE.Mesh(earGeo, furMat);
            ear.position.set(ox, 0.62, 0.32);
            ear.rotation.z = rot * 0.18;
            ear.rotation.x = -0.08;
            g.add(ear);
            const inner = new THREE.Mesh(earInnerGeo, earInnerMat);
            inner.position.set(ox, 0.62, 0.335);
            inner.rotation.z = rot * 0.18;
            inner.rotation.x = -0.08;
            g.add(inner);
        });

        // Eyes with shine dots
        [-0.12, 0.12].forEach(ox => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 6), eyeMat);
            eye.position.set(ox, 0.32, 0.56);
            g.add(eye);
            const shine = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4),
                new THREE.MeshBasicMaterial({ color: 0xffffff }));
            shine.position.set(ox + 0.03, 0.34, 0.62);
            g.add(shine);
        });

        // Nose
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), noseMat);
        nose.position.set(0, 0.26, 0.60);
        g.add(nose);

        // Whisker stubs (short flat boxes)
        const wGeo = new THREE.BoxGeometry(0.18, 0.012, 0.012);
        const wMat = new THREE.MeshBasicMaterial({ color: 0xf0ead8 });
        for (let wx = -1; wx <= 1; wx += 2) {
            for (let wy = 0; wy < 2; wy++) {
                const w = new THREE.Mesh(wGeo, wMat);
                w.position.set(wx * 0.14, 0.26 + wy * 0.02, 0.60);
                w.rotation.y = -wx * 0.3;
                g.add(w);
            }
        }

        // Front paws
        const pawGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.22, 8);
        [-0.16, 0.16].forEach(ox => {
            const paw = new THREE.Mesh(pawGeo, furMat);
            paw.position.set(ox, -0.28, 0.26);
            paw.rotation.x = 0.3;
            g.add(paw);
        });

        // Hind legs — large jointed
        [-0.19, 0.19].forEach(ox => {
            const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.32), furMat);
            thigh.position.set(ox, -0.20, -0.22);
            g.add(thigh);
            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.40), furMat);
            foot.position.set(ox, -0.35, -0.10);
            g.add(foot);
        });

        // Tail puff
        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), new THREE.MeshLambertMaterial({ color: 0xf0ece8 }));
        tail.position.set(0, 0.06, -0.50);
        g.add(tail);

        g.scale.setScalar(0.85 + Math.random() * 0.3);
        g.castShadow = true;
        this.scene.add(g);

        const sx = (Math.random() - 0.5) * 70;
        const sz = (Math.random() - 0.5) * 70;
        const gh = this.world.sampleHeight(sx, sz);
        g.position.set(sx, gh + 0.30, sz);

        this._rabbits.push({
            g,
            state: 'idle',
            stateT: 0,
            stateDur: 1.2 + Math.random() * 2.5,
            speed: 3.0 + Math.random() * 2.5,
            heading: Math.random() * Math.PI * 2,
            hopPhase: 0,
        });
    }

    // ── TICK ─────────────────────────────────────────────────────────────────────
    tick(dt) {
        this._t += dt;
        this._tickBirds(dt);
        this._tickRabbits(dt);
    }

    _tickBirds(dt) {
        for (const b of this._birds) {
            b.t += dt * b.spd;

            // Figure-8 looping orbit with gentle altitude sway
            const x = b.cx + Math.cos(b.t) * b.r;
            const z = b.cz + Math.sin(b.t * 1.25) * b.r * 0.60;
            const y = b.h  + Math.sin(b.t * 2.0) * 2.2 + Math.cos(b.t * 0.70) * 1.0;
            b.g.position.set(x, y, z);

            // Face direction of motion
            const nx = b.cx + Math.cos(b.t + 0.06) * b.r;
            const nz = b.cz + Math.sin((b.t + 0.06) * 1.25) * b.r * 0.60;
            b.g.rotation.y = Math.atan2(x - nx, z - nz);

            // Bank (roll) in turns — proportional to horizontal curve
            const dx = x - nx, dz = z - nz;
            const cross = dx * Math.cos(b.g.rotation.y) - dz * Math.sin(b.g.rotation.y);
            b.g.rotation.z = cross * 0.45;

            // Wing flap
            const flap = Math.sin(this._t * 7.8) * 0.75;
            b.leftPivot.rotation.z  = -flap;
            b.rightPivot.rotation.z =  flap;

            // Slight pitch oscillation with flap cycle
            b.g.rotation.x = Math.cos(this._t * 7.8) * 0.05;
        }
    }

    _tickRabbits(dt) {
        for (const r of this._rabbits) {
            r.stateT += dt;

            const head = r.g.userData.head;
            const half = (this.world.size / 2) - 6;

            if (r.state === 'idle') {
                // Slow head-bob (sniffing)
                if (head) head.rotation.x = Math.sin(this._t * 2.2 + r.stateT) * 0.09;

                if (r.stateT > r.stateDur) {
                    // Transition: pick new direction, start hopping
                    r.heading  += (Math.random() - 0.5) * Math.PI * 1.4;
                    r.state    = 'hopping';
                    r.stateT   = 0;
                    r.stateDur = 0.6 + Math.random() * 3.0;
                    r.hopPhase = 0;
                }
            } else if (r.state === 'hopping') {
                r.hopPhase += dt;

                // Hop cycle ~ 0.38s per hop
                const HOP  = 0.38;
                const frac = (r.hopPhase % HOP) / HOP;
                const rise = Math.max(0, Math.sin(frac * Math.PI)) * 0.60;

                // Horizontal movement
                const mx = Math.sin(r.heading) * r.speed * dt;
                const mz = Math.cos(r.heading) * r.speed * dt;
                const nx = Math.max(-half, Math.min(half, r.g.position.x + mx));
                const nz = Math.max(-half, Math.min(half, r.g.position.z + mz));

                // Bounce off lot edges
                if (Math.abs(nx) >= half - 0.5 || Math.abs(nz) >= half - 0.5)
                    r.heading = Math.atan2(-mz, -mx) + (Math.random() - 0.5) * 0.8;

                const gh = this.world.sampleHeight(nx, nz);
                r.g.position.set(nx, gh + 0.30 + rise * 0.5, nz);
                r.g.rotation.y = r.heading;

                // Body compress at take-off, stretch at landing
                const bodyChild = r.g.children[0];
                if (bodyChild) bodyChild.scale.y = 0.82 + (frac < 0.5 ? frac * 0.36 : (1 - frac) * 0.36);

                if (r.stateT > r.stateDur) {
                    r.state    = 'idle';
                    r.stateT   = 0;
                    r.stateDur = 1.0 + Math.random() * 3.5;
                }
            }
        }
    }
}
