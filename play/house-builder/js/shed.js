class Shed {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.userData.isShed = true;

        // Default position — can be moved by player
        this.group.position.set(30, 0, -30);

        this._build();
        this._buildLamp();
        this._buildDesk();
        scene.add(this.group);
    }

    // ── STRUCTURE ─────────────────────────────────────────────────────────────
    _build() {
        const W = 20, D = 16, wallH = 9;
        const lm = (col, opt = {}) => new THREE.MeshLambertMaterial({ color: col, ...opt });
        const bx = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

        // Floor
        const floor = bx(W, 0.3, D, lm(0x8B7355));
        floor.position.y = 0.15;
        floor.receiveShadow = true;
        this.group.add(floor);

        // Walls — leave front gap for door (center 4 ft)
        const wallMat = lm(0x7A6045);
        const wallD   = 0.4;
        const doorW   = 4;

        // Back wall
        const back = bx(W, wallH, wallD, wallMat);
        back.position.set(0, wallH / 2, -D / 2 + wallD / 2);
        back.castShadow = true; back.receiveShadow = true;
        this.group.add(back);

        // Left wall
        const left = bx(wallD, wallH, D, wallMat);
        left.position.set(-W / 2 + wallD / 2, wallH / 2, 0);
        left.castShadow = true; left.receiveShadow = true;
        this.group.add(left);

        // Right wall
        const right = bx(wallD, wallH, D, wallMat);
        right.position.set(W / 2 - wallD / 2, wallH / 2, 0);
        right.castShadow = true; right.receiveShadow = true;
        this.group.add(right);

        // Front wall — two panels with door gap
        const sideW = (W - doorW) / 2;
        const fl = bx(sideW, wallH, wallD, wallMat);
        fl.position.set(-W / 2 + sideW / 2, wallH / 2, D / 2 - wallD / 2);
        fl.castShadow = true; fl.receiveShadow = true;
        this.group.add(fl);

        const fr = bx(sideW, wallH, wallD, wallMat);
        fr.position.set(W / 2 - sideW / 2, wallH / 2, D / 2 - wallD / 2);
        fr.castShadow = true; fr.receiveShadow = true;
        this.group.add(fr);

        // Door header above gap
        const dh = bx(doorW, wallH - 8, wallD, wallMat);
        dh.position.set(0, 8 + (wallH - 8) / 2, D / 2 - wallD / 2);
        this.group.add(dh);

        // Door panel
        const doorPivot = new THREE.Group();
        doorPivot.position.set(-doorW / 2, 0, D / 2);
        const doorPanel = bx(doorW - 0.1, 8, 0.1, lm(0x5c3d1e));
        doorPanel.position.set(doorW / 2, 4, 0);
        doorPivot.add(doorPanel);
        doorPivot.userData.isDoorPivot = true;
        doorPivot.userData.isOpen = false;
        doorPivot.userData.targetRotY = 0;
        this.group.add(doorPivot);
        this._door = doorPivot;

        // Drone drop pad — concrete circle with landing markings, outside the shed door
        this._buildDropPad(D);

        // Roof (simple gable)
        const roofMat = lm(0x5a3010);
        const peak = 4;
        [-1, 1].forEach(side => {
            const geo = new THREE.BufferGeometry();
            const v = new Float32Array([
                -W/2, 0, side*D/2,
                 W/2, 0, side*D/2,
                 W/2, peak, 0,
                -W/2, peak, 0
            ]);
            geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
            geo.setIndex(new THREE.BufferAttribute(new Uint16Array([0,2,1, 0,3,2]), 1));
            geo.computeVertexNormals();
            const rm = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x5a3010, side: THREE.DoubleSide }));
            rm.position.y = wallH;
            rm.castShadow = true;
            this.group.add(rm);
        });

        // Gable ends
        [-1, 1].forEach(xSide => {
            const geo = new THREE.BufferGeometry();
            const xOff = xSide * W / 2;
            const v = new Float32Array([xOff, 0, -D/2, xOff, 0, D/2, xOff, peak, 0]);
            geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
            geo.setIndex(new THREE.BufferAttribute(new Uint16Array([0, xSide>0?2:1, xSide>0?1:2]), 1));
            geo.computeVertexNormals();
            const gm = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x7A6045, side: THREE.DoubleSide }));
            gm.position.y = wallH;
            this.group.add(gm);
        });
    }

    // ── DRONE DROP PAD ────────────────────────────────────────────────────────
    _buildDropPad(D) {
        const lm = (col, opt = {}) => new THREE.MeshLambertMaterial({ color: col, ...opt });
        // Concrete base slab — 8×8 ft, 3 ft out from shed front
        const padZ = D / 2 + 9; // 9 ft in front of shed door
        const pad = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.06, 8),
            lm(0x888888)
        );
        pad.position.set(0, 0.03, padZ);
        pad.receiveShadow = true;
        this.group.add(pad);

        // Yellow border stripe
        const border = new THREE.Mesh(
            new THREE.BoxGeometry(8.1, 0.07, 8.1),
            lm(0xFFCC00)
        );
        border.position.set(0, 0.02, padZ);
        this.group.add(border);

        // Center H marking — two crossing bars
        const barMat = lm(0xFFCC00);
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 0.45), barMat);
        hBar.position.set(0, 0.05, padZ);
        this.group.add(hBar);
        const vBarL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 2.2), barMat);
        vBarL.position.set(-1.5, 0.05, padZ);
        this.group.add(vBarL);
        const vBarR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 2.2), barMat);
        vBarR.position.set(1.5, 0.05, padZ);
        this.group.add(vBarR);

        // Corner indicator lights
        [[-3,-3],[3,-3],[-3,3],[3,3]].forEach(([ox,oz]) => {
            const light = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.3),
                new THREE.MeshBasicMaterial({ color: 0xff4400 })
            );
            light.position.set(ox, 0.1, padZ + oz);
            this.group.add(light);
        });

        // Store pad local offset so drone.js can target it
        this.dropPadOffset = { x: 0, y: 0, z: padZ };
    }

    // ── FLICKERING GAS LAMP ───────────────────────────────────────────────────
    _buildLamp() {
        // Ceiling mount position near center
        const lampPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        lampPole.position.set(0, 8.4, 0);
        this.group.add(lampPole);

        const lampHead = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.25, 0.5, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        lampHead.position.set(0, 7.75, 0);
        this.group.add(lampHead);

        // Flame glow (small emissive sphere)
        this._flameGeo = new THREE.SphereGeometry(0.12, 6, 6);
        this._flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
        const flame = new THREE.Mesh(this._flameGeo, this._flameMat);
        flame.position.set(0, 7.6, 0);
        this.group.add(flame);

        // Point light for ambient flicker
        this._gasLight = new THREE.PointLight(0xffaa22, 1.4, 22);
        this._gasLight.position.set(0, 7.6, 0);
        this.group.add(this._gasLight);

        this._flickerT = 0;
    }

    // ── DESK + COMPUTER ───────────────────────────────────────────────────────
    _buildDesk() {
        const lm = (col) => new THREE.MeshLambertMaterial({ color: col });
        const bx = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

        const D_LOCAL = 16;
        const deskGroup = new THREE.Group();
        deskGroup.position.set(0, 0, -D_LOCAL / 2 + 2.5);

        // Desk surface
        const desk = bx(7, 0.25, 2.5, lm(0x9B7543));
        desk.position.y = 2.75;
        deskGroup.add(desk);

        // Legs
        [[-3, -0.9], [3, -0.9], [-3, 0.9], [3, 0.9]].forEach(([lx, lz]) => {
            const leg = bx(0.15, 2.75, 0.15, lm(0x7a5533));
            leg.position.set(lx, 1.375, lz);
            deskGroup.add(leg);
        });

        // Monitor base + stand
        const stand = bx(0.12, 1.0, 0.12, lm(0x222222));
        stand.position.set(0, 3.38, -0.5);
        deskGroup.add(stand);

        const monBase = bx(0.5, 0.08, 0.5, lm(0x222222));
        monBase.position.set(0, 2.9, -0.5);
        deskGroup.add(monBase);

        // Monitor frame
        const monFrame = bx(3.2, 2.0, 0.15, lm(0x1a1a1a));
        monFrame.position.set(0, 4.38, -0.55);
        deskGroup.add(monFrame);

        // Screen surface
        const screen = bx(2.9, 1.7, 0.05, new THREE.MeshBasicMaterial({ color: 0x112244 }));
        screen.position.set(0, 4.38, -0.475);
        screen.userData.isComputerScreen = true;
        deskGroup.add(screen);

        // Keyboard
        const kb = bx(1.8, 0.08, 0.55, lm(0x333333));
        kb.position.set(0, 2.9, 0.5);
        deskGroup.add(kb);

        // Chair
        const chairGroup = new THREE.Group();
        const seat = bx(1.6, 0.12, 1.6, lm(0x222244));
        seat.position.y = 1.8;
        chairGroup.add(seat);
        const back = bx(1.6, 1.5, 0.1, lm(0x222244));
        back.position.set(0, 2.55, -0.75);
        chairGroup.add(back);
        const cPole = bx(0.12, 1.8, 0.12, lm(0x555555));
        cPole.position.y = 0.9;
        chairGroup.add(cPole);
        chairGroup.position.set(0, 0, 1.8);
        deskGroup.add(chairGroup);

        // Tag desk group so it can be found for computer interaction
        deskGroup.userData.hasComputer = true;
        this._computerScreen = screen;

        this.group.add(deskGroup);
        this._deskGroup = deskGroup;
    }

    // ── TICK ──────────────────────────────────────────────────────────────────
    tick(dt) {
        this._flickerT += dt;
        // Perlin-ish flicker using multiple sines
        const f = 0.55
            + 0.22 * Math.sin(this._flickerT * 11.3)
            + 0.14 * Math.sin(this._flickerT * 23.7)
            + 0.09 * Math.sin(this._flickerT * 47.1);
        this._gasLight.intensity = Math.max(0.1, f * 1.6);
        const warm = Math.floor(0xaa + 0x55 * f);
        this._flameMat.color.setHex((0xff << 16) | (warm << 8) | 0x22);
    }

    // ── DOOR TICK ─────────────────────────────────────────────────────────────
    tickDoor() {
        const p = this._door;
        if (!p) return;
        const tgt = p.userData.targetRotY;
        p.rotation.y += (tgt - p.rotation.y) * 0.18;
        if (Math.abs(p.rotation.y - tgt) < 0.002) p.rotation.y = tgt;
    }

    toggleDoor() {
        const p = this._door;
        if (!p) return;
        p.userData.isOpen     = !p.userData.isOpen;
        p.userData.targetRotY = p.userData.isOpen ? -Math.PI / 2 : 0;
    }
}
