const S = { LOT:'lot', PLAY:'play', INV:'inv', PAUSE:'pause' };

class Game {
    constructor() {
        this.state       = S.LOT;
        this.clock       = new THREE.Clock();
        this.yaw         = 0;
        this.pitch       = 0;
        this.keys        = {};
        this._hoverTarget = null;
        this._pathCursorPos = null;

        this._renderer();
        this._scene();
        this._camera();
        this._events();

        this.ctrl = new GameController();
        document.getElementById('lot-select-screen').style.display = 'flex';
    }

    _renderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
        document.getElementById('game-canvas').appendChild(this.renderer.domElement);
    }

    _scene() { this.scene = new THREE.Scene(); }

    _camera() {
        this.cam = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 3000);
        this.cam.position.set(0, 6, 20);
    }

    _events() {
        window.addEventListener('resize', () => {
            this.cam.aspect = window.innerWidth / window.innerHeight;
            this.cam.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.locked = false;
        this.renderer.domElement.addEventListener('click', () => {
            if (this.state === S.PLAY && !this.inv?.open)
                this.renderer.domElement.requestPointerLock();
        });
        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === this.renderer.domElement;
        });
        document.addEventListener('mousemove', e => {
            if (this.modeWheel?.open) {
                this.modeWheel.aimMouse(e.clientX, e.clientY);
                return;
            }
            if (!this.locked) return;
            this.yaw   -= e.movementX * 0.0018;
            this.pitch  = Math.max(-1.3, Math.min(1.3, this.pitch - e.movementY * 0.0018));
        });

        document.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (this.state === S.PLAY || this.state === S.INV) this._key(e);
        });
        document.addEventListener('keyup',   e => { this.keys[e.code] = false; });

        document.addEventListener('mousedown', e => {
            if (e.button === 0 && this.state === S.PLAY && this.gun?.active) this._shoot();
        });
    }

    _key(e) {
        if (this._computerOpen) {
            if (e.code === 'KeyO' || e.code === 'Escape') this._closeComputer();
            return;
        }
        if (e.code === 'Tab')    { e.preventDefault(); this._toggleInv(); }
        if (e.code === 'KeyB')   this._setActiveMode(this._activeMode === 'build' ? 'explore' : 'build');
        if (e.code === 'KeyG')   this._setActiveMode(this._activeMode === 'paint' ? 'explore' : 'paint');
        if (e.code === 'KeyP')   this._togglePath();
        if (e.code === 'KeyL')   this._setActiveMode(this._activeMode === 'floor' ? 'explore' : 'floor');
        if (e.code === 'KeyN')   this._setActiveMode(this._activeMode === 'pond'        ? 'explore' : 'pond');
        if (e.code === 'KeyM')   this._setActiveMode(this._activeMode === 'mulch'       ? 'explore' : 'mulch');
        if (e.code === 'KeyH')   this._setActiveMode(this._activeMode === 'greenhouse'  ? 'explore' : 'greenhouse');
        if (e.code === 'KeyI')   this._setActiveMode(this._activeMode === 'lights'       ? 'explore' : 'lights');
        if (this._activeMode === 'lights') {
            if (e.code === 'ArrowUp')   { e.preventDefault(); this.stringLights?.adjustHeight( 0.5); }
            if (e.code === 'ArrowDown') { e.preventDefault(); this.stringLights?.adjustHeight(-0.5); }
        }
        if (e.code === 'KeyJ')   this._setActiveMode(this._activeMode === 'planter'     ? 'explore' : 'planter');
        if (e.code === 'KeyF')   this.building?.generateRoof();
        if (e.code === 'KeyE')   this._interact();
        if (e.code === 'KeyQ')   this._cancel();
        if (e.code === 'KeyR') {
            if (this.objs && this.inv?.activeItem()) { this.objs.rotateLeft(); this._manualRotate = true; }
        }
        if (e.code === 'Escape') this._togglePause();
        if (e.code === 'Delete' || e.code === 'Backspace') {
            e.preventDefault();
            if (this.paths?.mode && this.paths.deleteMode && this.paths._delTarget) {
                this.paths.deletePath();
            } else if (this.building?.mode && this.building.subMode === 'erase' && this.building._delTarget) {
                this.building.deleteTarget();
            }
        }
    }

    // ── START ─────────────────────────────────────────────────────────────────
    start(acres) {
        document.getElementById('lot-select-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';

        this.world    = new World(this.scene, acres);
        this.building = new Building(this.scene, this.world);
        this.objs     = new ObjectSystem(this.scene, this.world);
        this.inv      = new Inventory();
        this.gun      = new PaintGun(this.scene, this.cam);
        this.paths    = new PathSystem(this.scene, this.world);
        this.paths.buildUI();
        this.audio    = new AudioManager();
        this._moving  = false;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 60;

        this.shed    = new Shed(this.scene);
        this.floors  = new FloorSystem(this.scene, this.world);
        this.floors.buildUI();
        this.drones  = new DroneSystem(this.scene);
        this._shopUI = DroneSystem.buildShopUI(items => this.drones.orderCart(items));

        this._computerOpen = false;
        this._cursorX = 400;
        this._cursorY = 290;
        this._activeMode = 'explore';
        this._angleGuides = null;
        this._lastWallAngle = undefined;
        this._initComputerUI();
        this._placeSampleCabinets();

        // Pond builder
        this.pond = new PondBuilder(this.scene, this.cam, this.world);

        // Garden tools
        this.planterBeds = new PlanterBedSystem(this.scene, this.world);
        this.greenhouse  = new GreenhouseSystem(this.scene, this.world);
        this.mulchBeds   = new MulchBedSystem(this.scene, this.world);

        // Animals
        this.animals = new AnimalSystem(this.scene, this.world);
        this.stringLights = new StringLightSystem(this.scene, this.world);

        // Mode wheel (GTA-style radial selector on L2 hold)
        this.modeWheel = new ModeWheel(this);
        this._l2HoldT = 0;

        // Environment cube map — makes metallic materials reflect the actual scene
        this._initEnvMap();

        // Resume AudioContext on first user gesture (browser autoplay policy)
        const resumeAudio = () => { this.audio._ensureInit(); this.audio.resume(); };
        document.addEventListener('keydown',   resumeAudio, { once: true });
        document.addEventListener('mousedown', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });

        this.state = S.PLAY;
        this._loop();
    }

    // ── ENV MAP (cube-camera reflections) ────────────────────────────────────
    _initEnvMap() {
        try {
            const rt = new THREE.WebGLCubeRenderTarget(256, {
                generateMipmaps: true,
                minFilter: THREE.LinearMipmapLinearFilter,
            });
            this._envCam = new THREE.CubeCamera(0.5, 2000, rt);
            this._envCam.position.set(0, 8, 0);
            this.scene.add(this._envCam);
            this.scene.environment = rt.texture;
            this._envFrame = 0;
            // First update on start so metallic items aren't black on load
            this._envCam.update(this.renderer, this.scene);
        } catch(e) { console.warn('EnvMap init failed:', e); }
    }

    // ── LOOP ──────────────────────────────────────────────────────────────────
    _loop() {
        requestAnimationFrame(() => this._loop());
        const dt = Math.min(this.clock.getDelta(), 0.05);
        this._dt = dt;

        this.ctrl.update();

        if (this.state === S.PLAY || this.state === S.INV) {
            if (!this.inv.open && !this._computerOpen) this._move(dt);
            if (!this._computerOpen) {
                this._controllerButtons();
                this._updatePlacement();
                this._detectHover();
            } else {
                this._tickComputer(dt);
            }
            this.world?.tick(dt, this.cam, this.renderer);
            this.building.tickDoors();
            this.objs?.tickCabinets();
            this.shed?.tick(dt);
            this.shed?.tickDoor();
            const shedBase = this.shed ? this.shed.group.position : new THREE.Vector3(30, 0, -30);
            const padOff   = this.shed?.dropPadOffset ?? { x: 0, y: 0, z: 17 };
            const dropTarget = new THREE.Vector3(shedBase.x + padOff.x, 0, shedBase.z + padOff.z);
            this.drones?.tick(dt, dropTarget);
            this.drones?.tickSound(this.cam.position, this.audio);
            this.gun.updatePosition(this.cam);
            this.gun.tick(dt);
            this.audio?.tick(dt, this._moving && !this.inv?.open);
            this._tickPlaceAnims(dt);
            this.pond?.tick(dt);
            this.greenhouse?.tick(dt);
            this.animals?.tick(dt);
            this.stringLights?.tick(dt);

            // Re-bake env map every ~2 seconds so new objects get reflected
            this._envFrame = (this._envFrame || 0) + 1;
            if (this._envFrame % 120 === 0 && this._envCam) {
                try { this._envCam.update(this.renderer, this.scene); } catch(e) {}
            }
        }

        this._hud();
        this.renderer.render(this.scene, this.cam);
        this.gun?.renderGun(this.renderer);
    }

    // ── MOVEMENT ──────────────────────────────────────────────────────────────
    _move(dt) {
        if (this.modeWheel?.open) return;
        const c      = this.ctrl;
        const sprint = c.L3 || this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        const speed  = sprint ? 28 : 14;

        this.yaw   -= c.rx * 0.04;
        this.pitch  = Math.max(-1.3, Math.min(1.3, this.pitch - c.ry * 0.04));
        this.cam.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

        const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const rgt = new THREE.Vector3( Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        const mx = c.lx || (this.keys['KeyD'] ? 1 : this.keys['KeyA'] ? -1 : 0);
        const mz = c.ly || (this.keys['KeyS'] ? 1 : this.keys['KeyW'] ? -1 : 0);

        const move = new THREE.Vector3();
        this._moving = (Math.abs(mx) > 0.1 || Math.abs(mz) > 0.1);
        if (this._moving) {
            move.addScaledVector(rgt, mx).addScaledVector(fwd, -mz);
            if (move.length() > 1) move.normalize();
            move.multiplyScalar(speed * dt);
        }

        this.cam.position.add(move);

        // ── Terrain-following gravity + jump ──────────────────────────────────
        if (this._velY === undefined) { this._velY = 0; this._onGround = true; }

        const wantJump = this.keys['Space'] || (c.jSquare && !this.paths.mode && this._activeMode !== 'pond');
        if (wantJump && this._onGround && !this._jumpUsed) {
            this._velY    = 11;
            this._onGround = false;
            this._jumpUsed = true;
        }
        if (!wantJump) this._jumpUsed = false;

        if (!this._onGround) {
            this._velY += -28 * dt;
            this.cam.position.y += this._velY * dt;
        }

        // Raycast down to find actual ground surface
        if (!this._groundRay) this._groundRay = new THREE.Raycaster();
        const rayOrigin = new THREE.Vector3(this.cam.position.x, this.cam.position.y + 20, this.cam.position.z);
        this._groundRay.set(rayOrigin, new THREE.Vector3(0, -1, 0));
        this._groundRay.far = 60;
        const hits = this._groundRay.intersectObject(this.world.ground);
        const groundY = hits.length > 0 ? hits[0].point.y : 0;
        const eyeH = groundY + 6;

        if (this.cam.position.y <= eyeH) {
            this.cam.position.y = eyeH;
            if (this._velY < 0) { this._velY = 0; this._onGround = true; }
        } else if (this.cam.position.y > eyeH + 0.02 && this._velY === 0) {
            this._onGround = false; // walked off a ledge
        }

        const half = this.world.size / 2 - 3;
        this.cam.position.x = Math.max(-half, Math.min(half, this.cam.position.x));
        this.cam.position.z = Math.max(-half, Math.min(half, this.cam.position.z));
    }

    // ── MODE SYSTEM ───────────────────────────────────────────────────────────
    // _activeMode: 'explore' | 'build' | 'floor' | 'paint'
    _cycleMode() {
        const order = ['explore', 'build', 'floor', 'paint', 'pond', 'mulch', 'greenhouse', 'planter', 'lights'];
        const i = order.indexOf(this._activeMode);
        this._setActiveMode(order[(i + 1) % order.length]);
    }

    _setActiveMode(mode) {
        // Tear down old mode
        if (this.building?.mode)    { this.building.setMode(false);       }
        if (this.floors?.mode)      { this.floors.setMode(false);         }
        if (this.gun?.active)       { this.gun.toggle(false);             }
        if (this.pond?.active)      { this.pond.setActive(false);         }
        if (this.mulchBeds?.active) { this.mulchBeds.setActive(false);    }
        if (this.greenhouse?.active){ this.greenhouse.setActive(false);   }
        if (this.planterBeds?.mode) { this.planterBeds.setMode(false);    }
        if (this.stringLights?.active) { this.stringLights.setActive(false); }
        this._hideAngleGuides();

        this._activeMode = mode;

        if (mode === 'build') {
            this.building.setMode(true);
            this.paths.setMode(false); this._updatePathBtn(false);
        } else if (mode === 'floor') {
            this.floors?.setMode(true);
        } else if (mode === 'paint') {
            this.gun.toggle(true);
        } else if (mode === 'pond') {
            this.pond?.setActive(true);
        } else if (mode === 'mulch') {
            this.mulchBeds?.setActive(true);
        } else if (mode === 'greenhouse') {
            this.greenhouse?.setActive(true);
        } else if (mode === 'planter') {
            this.planterBeds?.setMode(true);
        } else if (mode === 'lights') {
            this.stringLights?.setActive(true);
        }

        const isGarden = ['pond','mulch','greenhouse','planter','lights'].includes(mode);

        // Hotbar: only visible in explore mode
        document.getElementById('hotbar').style.display         = mode === 'explore'     ? 'flex'  : 'none';
        document.getElementById('build-hud').style.display      = mode === 'build'        ? 'block' : 'none';
        document.getElementById('floor-hud').style.display      = mode === 'floor'        ? 'block' : 'none';
        document.getElementById('paint-hud').style.display      = mode === 'paint'        ? 'block' : 'none';
        document.getElementById('pond-hud').style.display       = mode === 'pond'         ? 'block' : 'none';
        document.getElementById('garden-hud').style.display     = isGarden && mode !== 'pond' ? 'block' : 'none';
        // Sidebar panels — always hidden
        document.getElementById('build-panel').style.display    = 'none';
        document.getElementById('floor-panel').style.display    = 'none';
        // Toolbar button active states
        document.getElementById('build-mode-btn')?.classList.toggle('active', mode === 'build');
        document.getElementById('floor-mode-btn')?.classList.toggle('active', mode === 'floor');
        document.getElementById('gun-btn')?.classList.toggle('active', mode === 'paint');
        document.getElementById('pond-mode-btn')?.classList.toggle('active', mode === 'pond');
        document.getElementById('planter-mode-btn')?.classList.toggle('active', mode === 'planter');
        document.getElementById('mulch-mode-btn')?.classList.toggle('active', mode === 'mulch');
        document.getElementById('greenhouse-mode-btn')?.classList.toggle('active', mode === 'greenhouse');
        document.getElementById('lights-mode-btn')?.classList.toggle('active', mode === 'lights');
        if (mode === 'build') this._renderBuildHUD();
        if (mode === 'floor') this._renderFloorHUD();
        if (isGarden && mode !== 'pond') this._renderGardenHUD(mode);
        this.audio?.playModeSwitch?.();
    }

    // ── CONTROLLER BUTTONS ────────────────────────────────────────────────────
    _controllerButtons() {
        const c = this.ctrl;

        // ── CHEST OPEN: full D-pad nav, ✕ transfer, ⭕ close ─────────────────
        if (this._openChest) {
            this._tickChestController(c, this._dt ?? 0.016);
            return;
        }

        // ── INVENTORY OPEN: D-pad navigates slots, Cross moves items ──────────
        if (this.inv.open) {
            if (c.jDLeft)    this.inv.navFocus(-1, 0);
            if (c.jDRight)   this.inv.navFocus( 1, 0);
            if (c.jDUp)      this.inv.navFocus( 0,-1);
            if (c.jDDown)    this.inv.navFocus( 0, 1);
            if (c.jCross)    this.inv.crossFocused();
            if (c.jTriangle || c.jCircle) this._toggleInv();
            if (c.jOptions)  this._togglePause();
            return;
        }

        // ── MODE WHEEL: hold L2 → radial wheel open, release → commit ──────
        const dt = this._dt ?? 0.016;
        if (this.modeWheel) {
            if (c.L2) {
                this._l2HoldT = (this._l2HoldT || 0) + dt;
                // Small threshold so accidental touches don't flash the wheel
                if (this._l2HoldT > 0.12 && !this.modeWheel.open) {
                    this.modeWheel.show(this._activeMode);
                }
                if (this.modeWheel.open) this.modeWheel.aimJoystick(c.lx, c.ly);
            } else {
                this._l2HoldT = 0;
                if (this.modeWheel.open) this.modeWheel.hide(); // release → commit
            }
        }
        if (this.modeWheel?.open) return; // swallow all other buttons while wheel is open

        // Paths finish (square/triangle)
        if (this.paths.mode) {
            if (c.jTriangle || c.jSquare) {
                if (this.paths.points.length >= 2) { this.paths.finish(); this.audio?.playPathFinish(); }
                else { this.paths.setMode(false); this._updatePathBtn(false); }
            }
        } else {
            if (c.jTriangle) this._toggleInv();
        }

        // Cross / R2: interact (place, open doors, use computer, drone pickup)
        if (c.jCross || c.jR2) this._interact();

        // Circle: pick up objects OR cancel/delete
        if (c.jCircle) {
            if (this._hoverTarget?.type === 'object') {
                this._tryPickUp();
            } else if (this.building?.mode && this.building.subMode === 'erase' && this.building._delTarget) {
                this.building.deleteTarget();
            } else {
                this._cancel();
            }
        }

        // L1 / R1 — context sensitive
        if (this._activeMode === 'build' && this.building.subMode === 'opening') {
            if (c.jL1) this.building.cycleOpeningSize(-1);
            if (c.jR1) this.building.cycleOpeningSize(1);
        } else if (this._activeMode === 'explore') {
            if (c.jL1) this.inv.prevSlot();
            if (c.jR1) this.inv.nextSlot();
        }

        // D-pad — context sensitive
        if (this.paths.mode) {
            if (c.jDUp)   this.paths.cycleType(-1);
            if (c.jDDown) this.paths.cycleType(1);
        } else if (this._activeMode === 'paint') {
            if (c.jDUp || c.jDLeft)   this.gun.cyclePrev();
            if (c.jDDown || c.jDRight) this.gun.cycleNext();
        } else if (this._activeMode === 'build') {
            const sm = this.building.subMode;
            // D-pad left/right: cycle sub-mode
            if (c.jDLeft)  this.building.cycleSubMode(-1);
            if (c.jDRight) this.building.cycleSubMode(1);
            // D-pad up/down: context within sub-mode
            if (sm === 'draw') {
                if (c.jDUp)   this.building.cycleHeight(-1);
                if (c.jDDown) this.building.cycleHeight(1);
            } else if (sm === 'opening') {
                if (c.jDUp)   this.building.cycleOpeningType(-1);
                if (c.jDDown) this.building.cycleOpeningType(1);
            }
        } else if (this._activeMode === 'floor') {
            if (c.jDLeft || c.jDUp)   { this.floors.setType(this.floors.typeIdx - 1); this._renderFloorHUD(); }
            if (c.jDRight || c.jDDown) { this.floors.setType(this.floors.typeIdx + 1); this._renderFloorHUD(); }
        } else if (this._activeMode === 'lights') {
            if (c.jDUp)   this.stringLights?.adjustHeight( 0.5);
            if (c.jDDown) this.stringLights?.adjustHeight(-0.5);
        } else if (this._activeMode === 'explore' && this.inv.activeItem()) {
            if (c.jDLeft)  { this.objs.rotateLeft();  this._manualRotate = true; }
            if (c.jDRight) { this.objs.rotateRight(); this._manualRotate = true; }
        }

        if (c.jR3) this._togglePath();
        if (c.jL3) this.building?.generateRoof();
        if (c.jOptions) this._togglePause();
    }

    // ── HOVER DETECTION ───────────────────────────────────────────────────────
    _detectHover() {
        if (this.gun.active) { this._hoverTarget = null; return; }

        // Path delete mode: highlight path under crosshair
        if (this.paths.mode) {
            if (this.paths.deleteMode) {
                this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
                const hits = this.raycaster.intersectObjects(this.paths.paths, true);
                this.paths.hoverPath(hits.length ? hits[0].object : null);
            } else {
                this.paths.hoverPath(null);
            }
            this._hoverTarget = null;
            return;
        }

        if (this.building.mode) {
            // Erase sub-mode: highlight wall under crosshair for deletion
            if (this.building.subMode === 'erase') {
                this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
                const hits = this.raycaster.intersectObjects(this.building.wallMeshes(), true);
                if (hits.length) {
                    const wd = this.building.findWallDef(hits[0].object);
                    this.building.setDeleteTarget(wd || null);
                } else {
                    this.building.setDeleteTarget(null);
                }
            } else {
                this.building.setDeleteTarget(null);
            }
            this._hoverTarget = null;
            return;
        }

        this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
        const shedMeshes = [];
        this.shed?.group.traverse(c => { if (c.isMesh) shedMeshes.push(c); });
        const targets = [...this.building.wallMeshes(), ...this.objs.allMeshes(), ...shedMeshes];
        const hits    = this.raycaster.intersectObjects(targets, true);

        if (!hits.length) { this._hoverTarget = null; return; }

        const hit = hits[0];

        // Check building wall with a door — only activate when looking AT the door panel
        const wall = this.building._findWall(hit.object);
        if (wall) {
            let hitIsDoor = false;
            let node = hit.object;
            while (node && node !== wall) {
                if (node.userData.isDoorPanel || node.userData.isDoorPivot) { hitIsDoor = true; break; }
                node = node.parent;
            }
            if (hitIsDoor) { this._hoverTarget = { type: 'door', mesh: wall }; return; }
        }

        // Check greenhouse sliding door
        if (this.greenhouse) {
            const ghDoor = this.greenhouse.findDoor(hit.object);
            if (ghDoor) {
                this._hoverTarget = { type: 'ghDoor', door: ghDoor };
                return;
            }
        }

        // Check shed door
        if (this.shed) {
            let node = hit.object;
            while (node) {
                if (node.userData.isDoorPivot) {
                    this._hoverTarget = { type: 'shedDoor', mesh: node };
                    return;
                }
                node = node.parent;
            }
        }

        // Check chest lid (priority over generic pickup)
        {
            let node = hit.object;
            while (node) {
                if (node.userData.isChest) {
                    this._hoverTarget = { type: 'chest', mesh: node };
                    return;
                }
                if (node.userData.objType === 'placeable') break;
                node = node.parent;
            }
        }

        // Check cabinet door or drawer (priority over generic pickup)
        {
            let node = hit.object;
            while (node) {
                if (node.userData.isCabinetDoor) {
                    this._hoverTarget = { type: 'cabinetDoor', mesh: node };
                    return;
                }
                if (node.userData.isCabinetDrawer) {
                    this._hoverTarget = { type: 'cabinetDrawer', mesh: node };
                    return;
                }
                if (node.userData.objType === 'placeable') break;
                node = node.parent;
            }
        }

        // Check placeable object
        let obj = hit.object;
        while (obj && obj.userData.objType !== 'placeable' && obj.parent) obj = obj.parent;
        if (obj && obj.userData.objType === 'placeable') {
            this._hoverTarget = { type: 'object', mesh: obj };
            return;
        }

        this._hoverTarget = null;
    }

    // ── PLACEMENT PREVIEW ────────────────────────────────────────────────────
    _updatePlacement() {
        this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);

        // Floor mode: project to ground
        if (this.floors?.mode) {
            const hits = this.raycaster.intersectObject(this.world.ground);
            if (hits.length) {
                this.floors.updateCursor(hits[0].point);
            } else {
                this.floors.updateCursor(null);
            }
            this.objs.updateGhost(null, false);
            return;
        }

        // Path mode: project to ground, 1-foot grid snap
        if (this.paths.mode) {
            const hits = this.raycaster.intersectObject(this.world.ground);
            if (hits.length) {
                const p = hits[0].point;
                this._pathCursorPos = new THREE.Vector3(Math.round(p.x), 0, Math.round(p.z));
                this.paths.updateCursor(this._pathCursorPos);
            } else {
                this._pathCursorPos = null;
                this.paths.updateCursor(null);
            }
            this.objs.updateGhost(null, false);
            return;
        }

        if (this.building.mode) {
            const sm = this.building.subMode;

            if (sm === 'draw') {
                const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                const pt    = new THREE.Vector3();
                if (this.raycaster.ray.intersectPlane(plane, pt)) {
                    let sp = new THREE.Vector3(Math.round(pt.x), 0, Math.round(pt.z));
                    const start = this.building._drawStart;
                    if (start) {
                        // Angle snapping from start point
                        if (!this._angleGuidesOrigin || this._angleGuidesOrigin.distanceTo(start) > 0.05) {
                            this._showAngleGuides(start);
                        }
                        const dx = sp.x - start.x, dz = sp.z - start.z;
                        const len = Math.sqrt(dx*dx + dz*dz);
                        if (len > 0.5) {
                            const rawAngle  = Math.atan2(dz, dx);
                            const snapAngle = Math.round(rawAngle / (Math.PI/4)) * (Math.PI/4);
                            if (Math.abs(rawAngle - snapAngle) < 0.15) {
                                sp.x = Math.round(start.x + Math.cos(snapAngle) * len);
                                sp.z = Math.round(start.z + Math.sin(snapAngle) * len);
                            }
                            this._lastWallAngle = Math.atan2(sp.z - start.z, sp.x - start.x);
                        }
                    } else {
                        this._hideAngleGuides();
                    }

                    // Corner snap: pull to nearest existing endpoint within 1.8 ft
                    const CORNER_THRESH = 1.8;
                    const endpoints = this.building.allEndpoints();
                    let bestD = CORNER_THRESH, bestPt = null;
                    for (const ep of endpoints) {
                        const d = Math.hypot(sp.x - ep.x, sp.z - ep.z);
                        if (d < bestD) { bestD = d; bestPt = ep; }
                    }
                    if (bestPt) { sp.x = bestPt.x; sp.z = bestPt.z; }
                    this._snapToCorner = !!bestPt;

                    this.building.setWallCursor(this.world.inBounds(sp.x, sp.z) ? sp : null);
                } else {
                    this.building.setWallCursor(null);
                    this._snapToCorner = false;
                }

            } else if (sm === 'opening') {
                const hits = this.raycaster.intersectObjects(this.building.wallMeshes(), true);
                if (hits.length) {
                    const wd = this.building.findWallDef(hits[0].object);
                    this.building.setOpeningTarget(wd || null, wd ? hits[0].point : null);
                } else {
                    this.building.setOpeningTarget(null, null);
                }
            }
            // erase sub-mode: handled by _detectHover

            this.objs.updateGhost(null, false);
            return;
        }

        // Object placement
        if (!this.gun.active && this.inv.activeItem()) {
            const targets = [this.world.ground, ...this.building.wallMeshes(), ...this.objs.allMeshes()];
            const hits    = this.raycaster.intersectObjects(targets, true);
            if (hits.length) {
                const def = this.inv.activeItem()?.def;
                if (def) {
                    if (this.objs.ghostDef !== def) { this.objs.setGhostDef(def); this._manualRotate = false; }
                    const pos = this._snapPos(hits[0]);
                    this.objs.updateGhost(pos, this.world.inBounds(pos.x, pos.z));
                }
            } else {
                this.objs.updateGhost(null, false);
            }
        } else {
            this.objs.updateGhost(null, false);
        }

        // Pond / mulch / greenhouse / planter / lights cursors
        const needsGroundCursor = this.pond?.active || this.mulchBeds?.active
            || this.greenhouse?.active || this.planterBeds?.mode || this.stringLights?.active;
        if (needsGroundCursor) {
            this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
            const hits = this.raycaster.intersectObject(this.world.ground);
            const pt = hits.length ? hits[0].point : null;
            if (this.pond?.active)         this.pond.updateCursor(pt);
            if (this.mulchBeds?.active)    this.mulchBeds.updateCursor(pt);
            if (this.greenhouse?.active)   this.greenhouse.updateCursor(pt);
            if (this.planterBeds?.mode)    this.planterBeds.updateCursor(pt);
            if (this.stringLights?.active) this.stringLights.updateCursor(pt);
        }
    }

    _snapPos(hit) {
        const pos = hit.point.clone();
        const sn  = this.world.snap(pos.x, pos.z);
        pos.x = sn.x;
        pos.z = sn.z;
        pos.y = this.objs.snapY(hit);
        const def = this.inv.activeItem()?.def;
        const isSnapItem = def?.cat === 'cabinet' || def?.cat === 'kitchen' || def?.id === 'fridge';
        if (isSnapItem || def?.snap === 'wall') {
            const wn = this._getWallNormal(hit);
            if (wn) {
                const offset = def.d / 2 + 0.22;
                pos.x = hit.point.x + wn.x * offset;
                pos.z = hit.point.z + wn.z * offset;
                pos.y = def.snap === 'wall' ? hit.point.y : 0;
                if (!this._manualRotate) {
                    this.objs.setGhostYaw(-Math.atan2(wn.x, wn.z));
                }
            }
            // Edge snap runs even when wall normal found — lets you slide along wall to adjacent cabinet
            // Works for both floor and wall (upper) cabinets; y is not affected
            if (isSnapItem) {
                const snapped = this.objs.snapCabinetEdge(pos, def);
                if (snapped) { pos.x = snapped.x; pos.z = snapped.z; }
            }
        }
        return pos;
    }

    _getWallNormal(hit) {
        const wallList = this.building.wallMeshes();
        let obj = hit.object;
        while (obj) {
            if (wallList.includes(obj)) {
                if (!hit.face) return null;
                const n = hit.face.normal.clone().transformDirection(obj.matrixWorld);
                return Math.abs(n.y) < 0.15 ? n : null; // ignore floor/ceiling
            }
            obj = obj.parent;
        }
        return null;
    }

    // ── ACTIONS ───────────────────────────────────────────────────────────────
    _interact() {
        if (this._openChest) { this._closeChestUI(); return; }
        if (this.gun.active) { this._shoot(); return; }

        // Garden draw modes — place / close shape
        if (this.pond?.active)       { this.pond.interact();       return; }
        if (this.mulchBeds?.active)  { this.mulchBeds.interact();  return; }
        if (this.greenhouse?.active) { this.greenhouse.interact();  return; }
        if (this.stringLights?.active) { this.stringLights.interact(); return; }

        // Planter bed mode
        if (this.planterBeds?.mode) {
            this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
            const hits = this.raycaster.intersectObject(this.world.ground);
            if (hits.length) this.planterBeds.interact(hits[0].point);
            return;
        }

        // Floor mode: place floor rectangle
        if (this.floors?.mode) {
            this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
            const hits = this.raycaster.intersectObject(this.world.ground);
            if (hits.length) {
                const placed = this.floors.interact(hits[0].point);
                if (placed) this.audio?.playFloorPlace?.() ?? this.audio?.playPlace();
            }
            return;
        }

        // Drone delivery pickup
        if (!this.gun.active && !this.building.mode && !this.paths.mode && !this.floors?.mode) {
            if (this.drones?.hasPendingPickup) {
                this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
                const allScene = [];
                this.scene.traverse(c => { if (c.isMesh) allScene.push(c); });
                const hits = this.raycaster.intersectObjects(allScene);
                if (hits.length && hits[0].distance < 6 && this.drones.isDeliveryBox(hits[0].object)) {
                    const items = this.drones.pickUpDelivery();
                    if (items) {
                        items.forEach(({ id, qty }) => {
                            const def = CATALOG.find(c => c.id === id);
                            if (def) { for (let q = 0; q < qty; q++) this.inv.addItem(def); }
                        });
                        this.audio?.playPickup();
                    }
                    return;
                }
            }
        }

        // Path mode: delete or add point
        if (this.paths.mode) {
            if (this.paths.deleteMode) {
                if (this.paths._delTarget) this.paths.deletePath();
            } else if (this._pathCursorPos) {
                this.paths.addPoint(this._pathCursorPos);
                this.audio?.playPathPoint();
            }
            return;
        }

        // Build mode — action depends on sub-mode
        if (this.building.mode) {
            const sm = this.building.subMode;
            if (sm === 'draw') {
                // Use the cursor position already computed (with angle snap + corner snap)
                // rather than re-casting, which would miss the snapping and place crooked walls
                const pos = this.building._wallCursorPos;
                if (pos && this.world.inBounds(pos.x, pos.z)) {
                    const placed = this.building.placeWallPoint(pos);
                    if (placed) this.audio?.playWallPlace?.() ?? this.audio?.playPlace();
                }
            } else if (sm === 'opening') {
                const placed = this.building.placeOpening();
                if (placed) this.audio?.playPlace();
            } else if (sm === 'erase') {
                if (this.building._delTarget) {
                    this.building.deleteTarget();
                }
            }
            return;
        }

        // Computer: check if looking at screen
        if (!this.gun.active && !this.building.mode && !this.paths.mode) {
            this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
            const screenMeshes = [];
            this.shed?.group.traverse(c => { if (c.userData.isComputerScreen) screenMeshes.push(c); });
            const hits = this.raycaster.intersectObjects(screenMeshes);
            if (hits.length && hits[0].distance < 12) {
                this._openComputer();
                return;
            }
        }

        // Explore mode: door open/close or object pickup
        if (this._hoverTarget) {
            if (this._hoverTarget.type === 'door') {
                let wasOpen = false;
                this._hoverTarget.mesh.traverse(c => { if (c.userData.isDoorPivot) wasOpen = c.userData.isOpen; });
                this.building.toggleDoor(this._hoverTarget.mesh);
                this.audio?.playDoor(!wasOpen);
                return;
            }
            if (this._hoverTarget.type === 'ghDoor') {
                this.greenhouse.toggleDoor(this._hoverTarget.door);
                this.audio?.playDoor?.(this._hoverTarget.door.open);
                return;
            }
            if (this._hoverTarget.type === 'shedDoor') {
                const wasOpen = this.shed?._door?.userData.isOpen ?? false;
                this.shed?.toggleDoor();
                this.audio?.playDoor(!wasOpen);
                return;
            }
            if (this._hoverTarget.type === 'chest') {
                this._openChestUI(this._hoverTarget.mesh);
                return;
            }
            if (this._hoverTarget.type === 'cabinetDoor') {
                const d = this._hoverTarget.mesh;
                d.userData.isOpen     = !d.userData.isOpen;
                d.userData.targetRotY = d.userData.isOpen ? d.userData.openRotY : 0;
                this.audio?.playDoor(d.userData.isOpen);
                return;
            }
            if (this._hoverTarget.type === 'cabinetDrawer') {
                const d = this._hoverTarget.mesh;
                d.userData.isOpen    = !d.userData.isOpen;
                d.userData.targetPosZ = d.userData.isOpen ? d.userData.openPosZ : 0;
                this.audio?.playDoor(d.userData.isOpen);
                return;
            }
            if (this._hoverTarget.type === 'object') {
                return; // pickup is ⭕ only
            }
        }

        // Hotbar item: place object
        const item = this.inv.activeItem();
        if (item?.def) {
            this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
            const targets = [this.world.ground, ...this.building.wallMeshes()];
            const hits    = this.raycaster.intersectObjects(targets, true);
            if (hits.length) {
                const pos = this._snapPos(hits[0]);
                if (this.world.inBounds(pos.x, pos.z)) {
                    const placed = this.objs.place(pos);
                    if (placed) this._startPlaceAnim(placed);
                    this.inv.consumeActive();
                    this.audio?.playObjectPlace?.() ?? this.audio?.playPlace();
                }
            }
        }
    }

    _shoot() {
        // Ground and paths excluded — noPaint flag handles it, but don't bother passing them
        const targets = [...this.building.wallMeshes(), ...this.objs.allMeshes()];
        this.gun.shoot(this.cam, targets);
        this.audio?.playPaintSpray();
    }

    // ── COMPUTER ──────────────────────────────────────────────────────────────
    _initComputerUI() {
        const desktop = document.getElementById('computer-desktop');
        desktop.addEventListener('click', e => {
            const closeBtn = e.target.closest('.app-close');
            if (closeBtn) {
                const win = document.getElementById(`app-${closeBtn.dataset.close}`);
                if (win) win.style.display = 'none';
                return;
            }
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                const win = document.getElementById(`app-${icon.dataset.app}`);
                if (win) win.style.display = win.style.display === 'none' ? 'block' : 'none';
            }
        });
        // Clock
        setInterval(() => {
            const el = document.getElementById('desktop-clock');
            if (el) { const d = new Date(); el.textContent = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); }
        }, 5000);
    }

    _openComputer() {
        this._computerOpen = true;
        document.getElementById('computer-overlay').style.display = 'flex';
        if (this.locked) document.exitPointerLock();
        this._cursorX = 400;
        this._cursorY = 290;
        this._updateVirtualCursor();
        this._shopNavT = 0;
        // If shop is already open, re-focus first item
        if (document.getElementById('app-shop')?.style.display !== 'none') {
            this._shopUI?.reset();
        }
    }

    _closeComputer() {
        this._computerOpen = false;
        document.getElementById('computer-overlay').style.display = 'none';
        this.renderer.domElement.requestPointerLock();
    }

    _tickComputer(dt) {
        const c = this.ctrl;

        // When shop window is open, use dedicated shop controller
        const shopOpen = document.getElementById('app-shop')?.style.display !== 'none';
        if (shopOpen && this._shopUI) {
            this._tickShopController(c, dt);
            if (c.jCircle) this._closeComputer();
            return;
        }

        // Desktop cursor — left stick moves it, cross clicks
        this._cursorX = Math.max(0, Math.min(860, this._cursorX + c.lx * 280 * dt));
        this._cursorY = Math.max(0, Math.min(552, this._cursorY + c.ly * 280 * dt));
        this._updateVirtualCursor();
        if (c.jCross) this._computerClick();
        if (c.jCircle) this._closeComputer();
    }

    _tickShopController(c, dt) {
        const ui = this._shopUI;
        // Nav cooldown prevents holding stick from flying across grid too fast
        this._shopNavT = (this._shopNavT || 0) + dt;
        const canNav = this._shopNavT > 0.14;

        // D-pad or left stick for directional nav
        const dx = c.jDRight ? 1 : c.jDLeft ? -1 : 0;
        const dy = c.jDDown  ? 1 : c.jDUp   ? -1 : 0;
        const sx = canNav && Math.abs(c.lx) > 0.5 ? Math.sign(c.lx) : 0;
        const sy = canNav && Math.abs(c.ly) > 0.5 ? Math.sign(c.ly) : 0;
        const mx = dx || sx, my = dy || sy;

        if (mx !== 0 || my !== 0) {
            this._shopNavT = 0;
            if (!ui.isCartFocus()) ui.navCatalog(mx, my);
            else ui.navCart(my);
        }

        // X: add focused catalog item | add more of focused cart item
        if (c.jCross) {
            if (!ui.isCartFocus()) ui.addFocused();
            else ui.addCartFocused();
        }
        // Square: remove one from focused cart item
        if (c.jSquare && ui.isCartFocus()) ui.removeCartFocused();
        // R1: switch to cart focus, L1: switch to catalog
        if (c.jR1) { ui.focusCart(); this._shopNavT = 0; }
        if (c.jL1) { ui.focusCatalog(); this._shopNavT = 0; }
        // Triangle: place order
        if (c.jTriangle) ui.placeOrder();
    }

    _updateVirtualCursor() {
        const el = document.getElementById('virtual-cursor');
        if (el) { el.style.left = this._cursorX + 'px'; el.style.top = this._cursorY + 'px'; }
    }

    _computerClick() {
        const desktop = document.getElementById('computer-desktop');
        if (!desktop) return;
        const rect = desktop.getBoundingClientRect();
        const cx   = rect.left + this._cursorX;
        const cy   = rect.top  + this._cursorY;
        const el   = document.elementFromPoint(cx, cy);
        if (el && el.closest('#computer-frame')) el.click();
    }

    _placeSampleCabinets() {
        const items = ['cab_base_1d','cab_base_2d','cab_base_drw','cab_pantry','cab_upper_1d','cab_upper_2d','cab_corner','chest'];
        let x = -22;
        const z = -12;
        items.forEach(id => {
            const def = CATALOG.find(d => d.id === id);
            if (!def) return;
            x += def.w / 2;
            this.objs.placeDirectly(id, x, z);
            x += def.w / 2 + 1.0;
        });
    }

    _tryPickUp() {
        if (this._hoverTarget?.type !== 'object') return;
        const def = this.objs.pickUp(this._hoverTarget.mesh);
        if (def) {
            this.inv.addItem(def);
            this._hoverTarget = null;
            this.audio?.playPickup();
        }
    }

    // ── PLACEMENT ANIMATION ───────────────────────────────────────────────────
    _startPlaceAnim(mesh) {
        if (!this._placeAnims) this._placeAnims = [];
        mesh.scale.set(0.01, 0.01, 0.01);
        this._placeAnims.push({ mesh, t: 0 });
    }

    _tickPlaceAnims(dt) {
        if (!this._placeAnims?.length) return;
        const dur = 0.35;
        this._placeAnims = this._placeAnims.filter(a => {
            a.t += dt;
            const p = Math.min(a.t / dur, 1);
            // Overshoot spring: ease out with slight bounce at ~80%
            const s = p < 0.8
                ? 1.08 * Math.sin((p / 0.8) * Math.PI * 0.5)
                : 1.0 + 0.08 * Math.sin(((p - 0.8) / 0.2) * Math.PI);
            a.mesh.scale.setScalar(Math.max(0.01, s));
            return p < 1;
        });
    }

    // ── CHEST UI ──────────────────────────────────────────────────────────────
    _openChestUI(mesh) {
        this._openChest    = mesh;
        this._chestGrid    = 'chest'; // 'chest' | 'inv'
        this._chestIdx     = 0;
        this._chestCooldown = 0;
        mesh.userData.isOpen = true;
        const lid = mesh.userData._lidPivot;
        if (lid) lid.userData.targetRotX = lid.userData.openRotX;
        this.audio?.playChestOpen?.();
        this._renderChestUI();
        document.getElementById('chest-modal').style.display = 'flex';
        if (document.pointerLockElement) document.exitPointerLock();
    }

    _closeChestUI() {
        if (!this._openChest) return;
        this._openChest.userData.isOpen = false;
        const lid = this._openChest.userData._lidPivot;
        if (lid) lid.userData.targetRotX = 0;
        this.audio?.playChestClose?.();
        this._openChest = null;
        document.getElementById('chest-modal').style.display = 'none';
    }

    _renderChestUI() {
        const chest = this._openChest;
        if (!chest) return;
        const storage = chest.userData.storage; // Array(25) of {def,qty}|null
        const COLS = 5;

        const renderSlots = (elId, items, focusIdx, isFocusedGrid, onClick) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.innerHTML = '';
            items.forEach((item, i) => {
                const s = document.createElement('div');
                const focused = isFocusedGrid && i === focusIdx;
                s.className = 'chest-slot' + (focused ? ' chest-slot-focused' : '');
                if (item) {
                    s.innerHTML = `<span class="item-icon">${item.def.icon}</span><span class="item-name">${item.def.name}</span>${item.qty > 1 ? `<span class="item-qty">${item.qty}</span>` : ''}`;
                }
                s.addEventListener('click', () => onClick(i));
                if (focused) s.scrollIntoView({ block: 'nearest' });
                el.appendChild(s);
            });
        };

        renderSlots('chest-grid', storage, this._chestIdx,
            this._chestGrid === 'chest',
            i => {
                if (!storage[i]) return;
                this.inv.addItem(storage[i].def);
                storage[i].qty--;
                if (storage[i].qty <= 0) storage[i] = null;
                this._renderChestUI();
            }
        );

        // Inv items: slots 1..TOTAL-1 (skip hand=0)
        const invItems = this.inv.slots.slice(1);
        renderSlots('chest-inv-slots', invItems, this._chestIdx,
            this._chestGrid === 'inv',
            i => {
                const invIdx = i + 1;
                const item = this.inv.slots[invIdx];
                if (!item) return;
                let target = storage.findIndex(s => s?.def.id === item.def.id);
                if (target === -1) target = storage.findIndex(s => !s);
                if (target === -1) return;
                if (storage[target]) storage[target].qty++;
                else storage[target] = { def: item.def, qty: 1 };
                this.inv.consumeAt(invIdx);
                this._renderChestUI();
            }
        );
    }

    _tickChestController(c, dt) {
        if (!this._openChest) return;
        this._chestCooldown = Math.max(0, (this._chestCooldown || 0) - dt);
        const COLS = 5;
        const storage  = this._openChest.userData.storage;
        const invItems = this.inv.slots.slice(1); // indices 0..38 in array = inv slots 1..39
        const maxIdx   = this._chestGrid === 'chest' ? storage.length - 1 : invItems.length - 1;

        // D-pad navigation with cooldown
        let moved = false;
        if (this._chestCooldown <= 0) {
            if (c.jDLeft)  { this._chestIdx = Math.max(0, this._chestIdx - 1);    moved = true; }
            if (c.jDRight) { this._chestIdx = Math.min(maxIdx, this._chestIdx + 1); moved = true; }
            if (c.jDUp)    { this._chestIdx = Math.max(0, this._chestIdx - COLS);  moved = true; }
            if (c.jDDown)  { this._chestIdx = Math.min(maxIdx, this._chestIdx + COLS); moved = true; }
            if (moved) { this._chestCooldown = 0.13; this._renderChestUI(); }
        }

        // L1/R1 or △ — switch between chest and inv panels
        if (c.jL1 || c.jR1 || c.jTriangle) {
            this._chestGrid = this._chestGrid === 'chest' ? 'inv' : 'chest';
            this._chestIdx  = 0;
            this._chestCooldown = 0.2;
            this._renderChestUI();
        }

        // ✕ — move focused item to the other grid
        if (c.jCross) {
            if (this._chestGrid === 'chest') {
                // Take from chest → inventory
                const item = storage[this._chestIdx];
                if (item) {
                    this.inv.addItem(item.def);
                    item.qty--;
                    if (item.qty <= 0) storage[this._chestIdx] = null;
                }
            } else {
                // Put from inventory → chest
                const invIdx = this._chestIdx + 1;
                const item   = this.inv.slots[invIdx];
                if (item) {
                    let target = storage.findIndex(s => s?.def.id === item.def.id);
                    if (target === -1) target = storage.findIndex(s => !s);
                    if (target !== -1) {
                        if (storage[target]) storage[target].qty++;
                        else storage[target] = { def: item.def, qty: 1 };
                        this.inv.consumeAt(invIdx);
                    }
                }
            }
            this._chestCooldown = 0.2;
            this._renderChestUI();
        }

        // ⭕ — close
        if (c.jCircle) this._closeChestUI();
    }

    _cancel() {
        if (this._openChest)    { this._closeChestUI(); return; }
        if (this._computerOpen) { this._closeComputer(); return; }
        if (this.pond?.active) {
            if (this.pond.pts.length > 0) { this.pond.cancel(); return; }
            this._setActiveMode('explore'); return;
        }
        if (this.mulchBeds?.active) {
            if (this.mulchBeds.pts.length > 0) { this.mulchBeds.cancel(); return; }
            this._setActiveMode('explore'); return;
        }
        if (this.greenhouse?.active) {
            if (this.greenhouse.pts.length > 0) { this.greenhouse.cancel(); return; }
            this._setActiveMode('explore'); return;
        }
        if (this.planterBeds?.mode) {
            if (this.planterBeds.drawingStarted) { this.planterBeds.cancel(); return; }
            this._setActiveMode('explore'); return;
        }
        if (this.stringLights?.active) { this.stringLights.cancel(); return; }
        if (this.floors?.mode) {
            if (this.floors.drawingStarted) { this.floors.cancelDraw(); return; }
            this._setActiveMode('explore'); return;
        }
        if (this.paths.mode) {
            if (!this.paths.undoPoint()) { this.paths.setMode(false); this._updatePathBtn(false); }
            return;
        }
        this.objs.clearGhost();
        if (this._activeMode !== 'explore') this._setActiveMode('explore');
    }

    _renderGardenHUD(mode) {
        const label = document.getElementById('garden-mode-label');
        const hint  = document.getElementById('garden-hint');
        if (!label || !hint) return;
        const MAP = {
            mulch:       { icon: '🍂', name: 'MULCH BED',   sys: this.mulchBeds  },
            greenhouse:  { icon: '🌿', name: 'GREENHOUSE',  sys: this.greenhouse },
            planter:     { icon: '🌱', name: 'RAISED PLANTER', sys: this.planterBeds },
            lights:      { icon: '💡', name: 'STRING LIGHTS', sys: this.stringLights },
        };
        const m = MAP[mode];
        if (!m) return;
        label.textContent = `${m.icon} ${m.name}`;
        hint.textContent  = m.sys?.hintText?.() ?? '';
    }

    _toggleFloor() { this._setActiveMode(this._activeMode === 'floor' ? 'explore' : 'floor'); }
    _toggleBuild()  { this._setActiveMode(this._activeMode === 'build' ? 'explore' : 'build'); }
    _toggleGun()    { this._setActiveMode(this._activeMode === 'paint' ? 'explore' : 'paint'); }

    _togglePath() {
        if (this._activeMode !== 'build') this._setActiveMode('build');
        const on = !this.paths.mode;
        this.paths.setMode(on);
        this._updatePathBtn(on);
        if (on) this.building.ghost.visible = false;
    }

    _toggleInv() {
        this.inv.toggle();
        this.state = this.inv.open ? S.INV : S.PLAY;
        if (this.inv.open && this.locked) document.exitPointerLock();
    }

    // ── ANGLE GUIDE LINES ─────────────────────────────────────────────────────
    _showAngleGuides(origin) {
        this._hideAngleGuides();
        const LEN = 50;
        const mat = new THREE.LineDashedMaterial({ color: 0x00ff88, dashSize: 0.6, gapSize: 0.35, opacity: 0.55, transparent: true });
        this._angleGuides = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4].map(a => {
            const pts = [
                new THREE.Vector3(origin.x - Math.cos(a)*LEN, 0.08, origin.z - Math.sin(a)*LEN),
                new THREE.Vector3(origin.x + Math.cos(a)*LEN, 0.08, origin.z + Math.sin(a)*LEN),
            ];
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, mat.clone());
            line.computeLineDistances();
            this.scene.add(line);
            return line;
        });
        this._angleGuidesOrigin = origin.clone();
    }

    _hideAngleGuides() {
        if (this._angleGuides) { this._angleGuides.forEach(l => this.scene.remove(l)); this._angleGuides = null; }
        this._angleGuidesOrigin = null;
        this._lastWallAngle = undefined;
    }

    // ── BUILD / FLOOR HUD RENDER ──────────────────────────────────────────────
    _renderBuildHUD() {
        const sm = this.building?.subMode;
        if (!sm) return;
        // Tab highlights
        ['draw','opening','erase'].forEach(t => {
            document.getElementById('bht-' + t)?.classList.toggle('bh-tab-active', t === sm);
        });
        const ctx  = document.getElementById('bh-context');
        const ctrl = document.getElementById('bh-ctrl');
        if (!ctx || !ctrl) return;

        if (sm === 'draw') {
            const hOpts = WALL_HEIGHTS.map((h, i) =>
                `<span class="bh-opt${i === this.building.heightIdx ? ' bh-opt-on' : ''}">${h}'</span>`
            ).join('');
            ctx.innerHTML  = `<span class="bh-label">Wall Height</span>${hOpts}<span class="bh-key">▲▼</span>`;
            ctrl.innerHTML = `<span class="bh-btn">✕/R2</span>Place &ensp;<span class="bh-btn">⭕</span>Undo &ensp;<span class="bh-btn">R3</span>Path Tool &ensp;<span class="bh-btn">L3</span>Gen Roof &ensp;<span class="bh-btn">L2</span>Exit`;

        } else if (sm === 'opening') {
            const types = Object.entries(OPENING_DEFS).map(([k, v]) =>
                `<span class="bh-opt${k === this.building.openingType ? ' bh-opt-on' : ''}">${v.icon} ${v.label.replace(/^[^\s]+\s/,'')}</span>`
            ).join('');
            const sz = OPENING_DEFS[this.building.openingType].sizes[this.building.openingSizeIdx];
            ctx.innerHTML  = `<span class="bh-label">Type</span>${types}<span class="bh-key">▲▼</span>&ensp;<span class="bh-label">Size</span><span class="bh-opt bh-opt-on">${sz.label}</span><span class="bh-key">L1/R1</span>`;
            ctrl.innerHTML = `<span class="bh-btn">✕/R2</span>Place &ensp;<span class="bh-btn">⭕</span>Cancel &ensp;<span class="bh-btn">◀▶</span>Sub-Mode &ensp;<span class="bh-btn">L2</span>Exit`;

        } else { // erase
            ctx.innerHTML  = `<span class="bh-label">Aim at wall segment to highlight, then press ✕ to remove</span>`;
            ctrl.innerHTML = `<span class="bh-btn">✕</span>Delete Wall &ensp;<span class="bh-btn">◀▶</span>Sub-Mode &ensp;<span class="bh-btn">L2</span>Exit`;
        }
    }

    _renderFloorHUD() {
        const el = document.getElementById('fh-types');
        if (!el || !this.floors) return;
        el.innerHTML = '';
        this.floors.types?.forEach((t, i) => {
            const b = document.createElement('button');
            b.className = 'bh-tab' + (i === this.floors.typeIdx ? ' bh-tab-active' : '');
            b.textContent = t.icon + ' ' + t.name;
            b.addEventListener('click', () => { this.floors.setType(i); this._renderFloorHUD(); });
            el.appendChild(b);
        });
    }

    _togglePause() {
        const paused = this.state === S.PAUSE;
        this.state   = paused ? S.PLAY : S.PAUSE;
        document.getElementById('pause-screen').style.display = paused ? 'none' : 'flex';
        if (!paused && this.locked) document.exitPointerLock();
    }

    _updateBuildPanel(on) {
        document.getElementById('build-panel').style.display = on ? 'flex' : 'none';
        document.getElementById('build-mode-btn').classList.toggle('active', on);
        if (!on) { this.paths.setMode(false); this._updatePathBtn(false); }
    }

    _updatePathBtn(on) {
        document.getElementById('path-tool-btn')?.classList.toggle('active', on);
    }

    // ── HUD ───────────────────────────────────────────────────────────────────
    _hud() {
        const mode = document.getElementById('mode-indicator');
        const xhair = document.getElementById('crosshair');
        if (!mode) return;

        // Update build / floor HUDs when in those modes
        if (this._activeMode === 'build')  this._renderBuildHUD();
        if (this._activeMode === 'floor')  this._renderFloorHUD();

        // Angle badge (build draw mode)
        const angEl = document.getElementById('bh-angle');
        if (angEl) {
            const showAngle = this._activeMode === 'build' && this.building?.subMode === 'draw' && this._lastWallAngle !== undefined;
            angEl.style.display = showAngle ? 'block' : 'none';
            if (showAngle) {
                let deg = Math.round(this._lastWallAngle * 180 / Math.PI);
                if (deg < 0) deg += 360;
                angEl.textContent = deg + '°';
            }
        }

        // XY Coordinates
        const coords = document.getElementById('player-coords');
        if (coords && this.cam) {
            coords.textContent = `X ${this.cam.position.x.toFixed(1)}  Z ${this.cam.position.z.toFixed(1)}`;
        }

        if (this.floors?.mode) {
            mode.textContent = this.floors.drawingStarted
                ? `🪵 Floor: ${this.floors.type.name} — E/✕ set end corner`
                : `🪵 Floor: ${this.floors.type.name} — E/✕ set start corner`;
            xhair.style.borderColor = '#' + (this.floors.type.color).toString(16).padStart(6,'0');

        } else if (this.paths.mode) {
            const t = this.paths.type;
            const n = this.paths.points.length;
            mode.textContent = n === 0
                ? `🛤️ ${t.name} — E/✕ place point`
                : `🛤️ ${t.name}: ${n} pts — △/□ finish · ⭕ undo`;
            xhair.style.borderColor = '#ffaa00';

        } else if (this.pond?.active) {
            mode.textContent = this.pond.hintText();
            xhair.style.borderColor = '#00ddff';
            const ph = document.getElementById('pond-hint');
            if (ph) ph.textContent = this.pond.hintText();

        } else if (this.mulchBeds?.active) {
            mode.textContent = this.mulchBeds.hintText();
            xhair.style.borderColor = '#c8660a';
            const gh = document.getElementById('garden-hint');
            if (gh) gh.textContent = this.mulchBeds.hintText();

        } else if (this.greenhouse?.active) {
            mode.textContent = this.greenhouse.hintText();
            xhair.style.borderColor = '#44ffcc';
            const gh = document.getElementById('garden-hint');
            if (gh) gh.textContent = this.greenhouse.hintText();

        } else if (this.planterBeds?.mode) {
            const started = this.planterBeds.drawingStarted;
            mode.textContent = started ? '🌱 Planter: E/✕ set end corner' : '🌱 Planter: E/✕ set start corner';
            xhair.style.borderColor = '#7B3F1A';
            const gh = document.getElementById('garden-hint');
            if (gh) gh.textContent = mode.textContent;

        } else if (this.stringLights?.active) {
            mode.textContent = this.stringLights.hintText();
            xhair.style.borderColor = '#ffcc44';
            const gh = document.getElementById('garden-hint');
            if (gh) gh.textContent = this.stringLights.hintText();

        } else if (this.gun.active) {
            mode.textContent = `🎨 Paint: ${PAINTS[this.gun.sel].name}`;
            xhair.style.borderColor = '#' + PAINTS[this.gun.sel].color.toString(16).padStart(6,'0');

        } else if (this.building.mode) {
            const sm = this.building.subMode;
            if (sm === 'draw') {
                const len = this.building.getPreviewLength();
                if (this.building._drawStart) {
                    const cornerTip = this._snapToCorner ? ' 📌 corner snap' : '';
                    mode.textContent = `✏️ ${this.building.wallHeight}ft wall — ${len.toFixed(1)} ft — E/✕ set end${cornerTip}`;
                    xhair.style.borderColor = this._snapToCorner ? '#00ff44' : '#ffff00';
                } else {
                    const cornerTip = this._snapToCorner ? ' 📌 snapping to corner' : '';
                    mode.textContent = `✏️ Draw ${this.building.wallHeight}ft wall — E/✕ set start point${cornerTip}`;
                    xhair.style.borderColor = this._snapToCorner ? '#00ff44' : '#00ff88';
                }
            } else if (sm === 'opening') {
                const opd = this.building._getOpDef ? this.building._getOpDef() : {};
                const icon = OPENING_DEFS?.[this.building.openingType]?.icon || '🪟';
                mode.textContent = `${icon} ${this.building.openingType} ${opd.label || ''} — aim at wall, E/✕ place`;
                xhair.style.borderColor = '#ffaa00';
            } else {
                if (this.building._delTarget) {
                    mode.textContent = '🗑️ Wall targeted — E / ⭕ / Del to remove';
                    xhair.style.borderColor = '#ff4444';
                } else {
                    mode.textContent = '🗑️ Erase — aim at a wall';
                    xhair.style.borderColor = '#ff8888';
                }
            }

        } else if (this._hoverTarget?.type === 'door' || this._hoverTarget?.type === 'shedDoor') {
            let isOpen = false;
            if (this._hoverTarget.type === 'door') {
                this._hoverTarget.mesh.traverse(c => { if (c.userData.isDoorPivot) isOpen = c.userData.isOpen; });
            } else {
                isOpen = this.shed?._door?.userData.isOpen ?? false;
            }
            mode.textContent = isOpen ? '🚪 E / ✕  ·  Close Door' : '🚪 E / ✕  ·  Open Door';
            xhair.style.borderColor = '#ffaa00';

        } else if (this._hoverTarget?.type === 'chest') {
            const c = this._hoverTarget.mesh;
            mode.textContent = c.userData.isOpen ? '🧰 E / ✕  ·  Close Chest' : '🧰 E / ✕  ·  Open Chest';
            xhair.style.borderColor = '#ffaa00';

        } else if (this._hoverTarget?.type === 'cabinetDoor') {
            const d = this._hoverTarget.mesh;
            mode.textContent = d.userData.isOpen ? '🚪 E / ✕  ·  Close Cabinet' : '🚪 E / ✕  ·  Open Cabinet';
            xhair.style.borderColor = '#ffaa00';

        } else if (this._hoverTarget?.type === 'cabinetDrawer') {
            const d = this._hoverTarget.mesh;
            mode.textContent = d.userData.isOpen ? '🗃️ E / ✕  ·  Close Drawer' : '🗃️ E / ✕  ·  Open Drawer';
            xhair.style.borderColor = '#ffaa00';

        } else if (this._hoverTarget?.type === 'object') {
            mode.textContent = `📦 E / ⭕  ·  Pick Up`;
            xhair.style.borderColor = '#ffaa00';

        } else {
            this.raycaster.setFromCamera({ x:0, y:0 }, this.cam);
            // Check delivery box proximity
            let showDelivery = false;
            if (this.drones?.hasPendingPickup) {
                const allMeshes = [];
                this.scene.traverse(c => { if (c.isMesh) allMeshes.push(c); });
                const hits = this.raycaster.intersectObjects(allMeshes);
                if (hits.length && hits[0].distance < 6 && this.drones.isDeliveryBox(hits[0].object)) {
                    showDelivery = true;
                }
            }
            // Check computer screen
            let showComputer = false;
            if (!showDelivery && this.shed) {
                const screens = [];
                this.shed.group.traverse(c => { if (c.userData.isComputerScreen) screens.push(c); });
                const hits = this.raycaster.intersectObjects(screens);
                if (hits.length && hits[0].distance < 12) showComputer = true;
            }
            if (showDelivery) {
                const items = this.drones.deliveryItems;
                const total = items ? items.reduce((s, x) => s + x.qty, 0) : 1;
                mode.textContent = `📦 E / ✕ — Collect ${total} item${total > 1 ? 's' : ''}`;
                xhair.style.borderColor = '#00ff88';
            } else if (showComputer) {
                mode.textContent = '💻 E / ✕ — Use Computer';
                xhair.style.borderColor = '#00aaff';
            } else {
                const item = this.inv.activeItem();
                mode.textContent = item ? `📦 ${item.def.name}` : '🚶 Explore';
                xhair.style.borderColor = 'rgba(255,255,255,0.9)';
            }
        }

        // Controller status update
        const dot  = document.querySelector('.status-dot');
        const span = document.querySelector('#controller-status span');
        if (dot && span) {
            const on = this.ctrl.connected;
            dot.classList.toggle('connected', on);
            if (!on) span.textContent = 'No Controller';
        }
    }
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    window.G = new Game();

    document.querySelectorAll('.lot-btn').forEach(btn => {
        btn.addEventListener('click', () => G.start(parseFloat(btn.dataset.acres)));
    });

    document.getElementById('build-mode-btn')?.addEventListener('click', () => G._toggleBuild());
    document.getElementById('floor-mode-btn')?.addEventListener('click', () => G._toggleFloor());
    document.getElementById('gun-btn')?.addEventListener('click',        () => G._toggleGun());
    document.getElementById('pond-mode-btn')?.addEventListener('click',  () => G._setActiveMode(G._activeMode === 'pond'       ? 'explore' : 'pond'));
    document.getElementById('planter-mode-btn')?.addEventListener('click',() => G._setActiveMode(G._activeMode === 'planter'    ? 'explore' : 'planter'));
    document.getElementById('mulch-mode-btn')?.addEventListener('click', () => G._setActiveMode(G._activeMode === 'mulch'       ? 'explore' : 'mulch'));
    document.getElementById('greenhouse-mode-btn')?.addEventListener('click', () => G._setActiveMode(G._activeMode === 'greenhouse' ? 'explore' : 'greenhouse'));
    document.getElementById('lights-mode-btn')?.addEventListener('click',     () => G._setActiveMode(G._activeMode === 'lights'       ? 'explore' : 'lights'));

    document.getElementById('resume-btn')?.addEventListener('click',     () => G._togglePause());
    document.getElementById('quit-btn')?.addEventListener('click',        () => location.reload());
    document.getElementById('chest-close-btn')?.addEventListener('click', () => G._closeChestUI());
});
