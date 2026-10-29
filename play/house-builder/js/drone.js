// Shop uses CATALOG directly — no separate list needed

class DroneSystem {
    constructor(scene) {
        this.scene   = scene;
        this._queue  = [];   // pending deliveries — each entry is {items:[{id,qty},...]}
        this._active = null;
        this._deliveryBox   = null;
        this._deliveryItems = null; // [{id,qty},...] in current box
    }

    // Order a full cart — items is [{id, qty}, ...]
    orderCart(items) {
        if (!items || items.length === 0) return;
        this._queue.push({ items });
        const total = items.reduce((s, x) => s + x.qty, 0);
        this._showNotification(`\u{1F681} Drone en route with ${total} item${total > 1 ? 's' : ''}!`);
    }

    get hasPendingPickup() { return !!this._deliveryBox; }
    get deliveryItems()    { return this._deliveryItems; }

    pickUpDelivery() {
        if (!this._deliveryBox) return null;
        const items = this._deliveryItems;
        this.scene.remove(this._deliveryBox);
        this._deliveryBox   = null;
        this._deliveryItems = null;
        this._blinkRef      = null;
        return items; // [{id,qty},...]
    }

    isDeliveryBox(mesh) {
        let obj = mesh;
        while (obj) { if (obj === this._deliveryBox) return true; obj = obj.parent; }
        return false;
    }

    // ── TICK ──────────────────────────────────────────────────────────────────
    tick(dt, dropTarget) {
        // Spin rotors using cached refs — no traverse needed
        if (this._active?.rotors) {
            for (const r of this._active.rotors) r.rotation.y += dt * 18;
        }

        // Blink delivery box using cached ref
        if (this._blinkRef) {
            this._blinkT = (this._blinkT || 0) + dt;
            this._blinkRef.material.opacity = 0.5 + 0.5 * Math.sin(this._blinkT * 6);
        }

        // Pulse nav lights using cached refs
        if (this._active?.navLights) {
            const bt = (this._blinkT || 0);
            for (let i = 0; i < this._active.navLights.length; i++) {
                this._active.navLights[i].material.opacity = 0.35 + 0.65 * Math.abs(Math.sin(bt * 2.5 + i));
            }
        }

        if (!this._active) {
            if (this._queue.length > 0 && !this._deliveryBox) {
                this._startDelivery(this._queue.shift(), dropTarget);
            }
            return;
        }

        this._tickDelivery(dt);
    }

    // Proximity-based drone sound — call every frame from main.js
    tickSound(camPos, audio) {
        if (!audio?._initialized) return;
        if (this._active) {
            if (!this._soundRunning) { audio.startDroneLoop(); this._soundRunning = true; }
            const dist = camPos.distanceTo(this._active.drone.position);
            audio.setDroneVolume((1 - Math.min(dist, 90) / 90) ** 2);
            // Vary throttle by flight state for realistic RPM changes
            const state = this._active.state;
            const throttle = state === 'approach' ? 0.85
                           : state === 'hover'    ? 0.55
                           : state === 'descend'  ? 0.40
                           : state === 'lower'    ? 0.45
                           : state === 'land'     ? 0.42
                           : state === 'ascend'   ? 0.80
                           : state === 'depart'   ? 0.90
                           : 0.5;
            audio.setDroneThrottle(throttle);
        } else if (this._soundRunning) {
            audio.stopDroneLoop();
            this._soundRunning = false;
        }
    }

    // ── DELIVERY STATE MACHINE ─────────────────────────────────────────────────
    _startDelivery(delivery, dropTarget) {
        const drone = this._buildDrone();
        const tx = dropTarget.x, tz = dropTarget.z;
        const spawnX = tx + 200, spawnZ = tz - 30;
        drone.position.set(spawnX, 80, spawnZ);
        this.scene.add(drone);

        const rotors = [], navLights = [];
        drone.traverse(c => {
            if (c.userData.isRotor)  rotors.push(c);
            if (c.userData.navLight) navLights.push(c);
        });

        // Landing pad ring on the ground
        const padGeo = new THREE.RingGeometry(4, 5, 32);
        const padMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(tx, 0.05, tz);
        this.scene.add(pad);

        const startPos  = new THREE.Vector3(spawnX, 80, spawnZ);
        const hoverHigh = new THREE.Vector3(tx, 20, tz);
        const hoverLow  = new THREE.Vector3(tx, 12, tz); // hover height while lowering pkg
        const lookDir   = hoverHigh.clone().sub(startPos).normalize();

        // Winch cable — thin cylinder, scaled vertically as package lowers
        const cableMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
        const cable    = new THREE.Mesh(cableGeo, cableMat);
        cable.visible  = false;
        drone.add(cable);

        this._active = {
            delivery, drone, rotors, navLights, lookDir, pad, cable,
            state: 'approach', t: 0,
            startPos, hoverHigh, hoverLow,
            departPos: new THREE.Vector3(spawnX + 50, 90, spawnZ - 50),
            _pkg: null, _pkgGroundY: 0,
        };
    }

    _tickDelivery(dt) {
        const a = this._active;
        a.t += dt;

        // Pulse landing pad
        if (a.pad) {
            a.pad.material.opacity = 0.3 + 0.25 * Math.sin(a.t * 4);
            a.pad.rotation.z += dt * 0.4;
        }

        if (a.state === 'approach') {
            const dur = 7;
            const prog = Math.min(a.t / dur, 1);
            // Bank slightly on approach
            a.drone.position.lerpVectors(a.startPos, a.hoverHigh, _easeInOut(prog));
            a.drone.rotation.z = Math.sin(prog * Math.PI) * 0.18; // banking roll
            _lookAlongVelocity(a.drone, a.lookDir);
            if (prog >= 1) { a.drone.rotation.z = 0; a.state = 'hover'; a.t = 0; }

        } else if (a.state === 'hover') {
            // Slight hover bob while settling, then descend
            a.drone.position.y = a.hoverHigh.y + Math.sin(a.t * 3) * 0.3;
            if (a.t >= 1.5) {
                a.state = 'descend'; a.t = 0;
                // Pre-build package and attach to drone
                const pkg = this._buildPackage(a.delivery.items);
                // Compute how high above ground package will sit
                pkg.position.set(0, 0, 0);
                const tmpBox = new THREE.Box3().setFromObject(pkg);
                a._pkgGroundY = (tmpBox.max.y - tmpBox.min.y) / 2;
                // Start package attached at drone underside
                pkg.position.set(0, -4, 0);
                a.drone.add(pkg);
                a._pkg = pkg;
                // Show winch cable
                a.cable.visible = true;
                a.cable.position.set(0, -2, 0);
                a.cable.scale.y = 0.1;
            }

        } else if (a.state === 'descend') {
            // Drone descends to hoverLow while package stays clamped at drone-4
            const dur = 2.5;
            const prog = Math.min(a.t / dur, 1);
            a.drone.position.lerpVectors(a.hoverHigh, a.hoverLow, _easeInOut(prog));
            // Hover bob
            a.drone.position.y += Math.sin(a.t * 4) * 0.15;
            if (prog >= 1) { a.state = 'lower'; a.t = 0; }

        } else if (a.state === 'lower') {
            // Cable lowers package to releaseHeight (a few units above ground), then drops
            const dur = 3.0;
            const prog = Math.min(a.t / dur, 1);
            const refDroneY    = a.hoverLow.y;
            const releaseRelY  = (a._pkgGroundY + 3.5) - refDroneY; // stop cable 3.5u above ground
            const startRelY    = -4;
            const relY = startRelY + (releaseRelY - startRelY) * _easeInOut(prog);
            a._pkg.position.y = relY;
            // Cable stretches from anchor point to package top
            const cableLen = Math.abs(relY) - 0.5;
            if (cableLen > 0.1) {
                a.cable.scale.y = cableLen;
                a.cable.position.y = relY / 2 - 0.25;
            }
            // Slight drone bob while lowering
            a.drone.position.y = a.hoverLow.y + Math.sin(a.t * 2.5) * 0.2;
            if (prog >= 1) { a.state = 'land'; a.t = 0; this._landPackage(a); }

        } else if (a.state === 'land') {
            // Package is on ground; wait briefly then ascend
            a.drone.position.y = a.hoverLow.y + Math.sin(a.t * 2) * 0.15;
            // Retract cable quickly
            if (a.cable.scale.y > 0.05) {
                a.cable.scale.y = Math.max(0.05, a.cable.scale.y - dt * 4);
                a.cable.position.y = -a.cable.scale.y / 2;
            } else {
                a.cable.visible = false;
            }
            if (a.t >= 1.8) { a.state = 'ascend'; a.t = 0; }

        } else if (a.state === 'ascend') {
            const dur = 4;
            const prog = Math.min(a.t / dur, 1);
            a.drone.position.lerpVectors(a.hoverLow, a.hoverHigh, _easeInOut(prog));
            // Tilt forward slightly on ascent
            a.drone.rotation.x = -Math.sin(prog * Math.PI) * 0.15;
            if (prog >= 1) { a.drone.rotation.x = 0; a.state = 'depart'; a.t = 0; }

        } else if (a.state === 'depart') {
            const dur = 5;
            const prog = Math.min(a.t / dur, 1);
            a.drone.position.lerpVectors(a.hoverHigh, a.departPos, _easeInOut(prog));
            a.drone.rotation.z = -prog * 0.2; // bank away
            if (prog >= 1) {
                if (a.pad) { this.scene.remove(a.pad); a.pad = null; }
                this.scene.remove(a.drone);
                this._active = null;
            }
        }
    }

    _landPackage(a) {
        if (!a._pkg) return;

        // ── Critical: snapshot world position BEFORE removing from drone ──
        const worldPos = new THREE.Vector3();
        a._pkg.getWorldPosition(worldPos);
        a.drone.remove(a._pkg);
        a._pkg.position.copy(worldPos);
        this.scene.add(a._pkg);

        // ── Physics drop: fall from release height to ground with bounce ──
        const groundY  = a._pkgGroundY;
        let vy = 0;             // velocity (downward positive)
        const gravity  = 28;    // units/s²
        const bounceCo = 0.38;  // energy retained per bounce
        let bounces    = 0;
        let settled    = false;
        let lastTime   = null;

        const stepDrop = (ts) => {
            if (settled) return;
            const dt  = lastTime === null ? 0.016 : Math.min((ts - lastTime) / 1000, 0.05);
            lastTime  = ts;

            vy += gravity * dt;
            a._pkg.position.y -= vy * dt;

            if (a._pkg.position.y <= groundY) {
                a._pkg.position.y = groundY;
                vy = -vy * bounceCo;
                bounces++;
                // Spawn impact puff on first landing
                if (bounces === 1) this._spawnPuff(a._pkg.position);
                // Settle when bounce velocity is negligible
                if (Math.abs(vy) < 0.8) { a._pkg.position.y = groundY; settled = true; return; }
            }

            requestAnimationFrame(stepDrop);
        };
        requestAnimationFrame(stepDrop);

        this._deliveryBox   = a._pkg;
        this._deliveryItems = a.delivery.items;
        this._blinkRef      = a._pkg.getObjectByName('blink_light');
        this._showNotification('\u{1F4E6} Package delivered! Walk to the box and press E / ⦿ to collect.');
    }

    _spawnPuff(pos) {
        const puffGeo = new THREE.RingGeometry(0.6, 2.8, 24);
        const puffMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
        const puff = new THREE.Mesh(puffGeo, puffMat);
        puff.rotation.x = -Math.PI / 2;
        puff.position.set(pos.x, 0.12, pos.z);
        this.scene.add(puff);
        let t = 0;
        const anim = () => {
            t += 0.025;
            puff.scale.setScalar(1 + t * 5);
            puffMat.opacity = Math.max(0, 0.65 - t * 1.6);
            if (puffMat.opacity > 0) requestAnimationFrame(anim);
            else this.scene.remove(puff);
        };
        anim();
    }

    // ── DRONE MODEL ───────────────────────────────────────────────────────────
    _buildDrone() {
        const g  = new THREE.Group();
        const lm = col => new THREE.MeshLambertMaterial({ color: col });
        const bm = col => new THREE.MeshBasicMaterial({ color: col });
        const bx = (w,h,d,mat) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
        const cy = (rt,rb,h,seg,mat) => new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), mat);

        // === BODY — sleek hexagonal-ish shell ===
        const body = bx(2.2, 0.5, 2.0, lm(0x1a1a2e)); body.position.y = 0; g.add(body);
        // Top dome
        const dome = cy(0.7, 0.9, 0.28, 8, lm(0x16213e)); dome.position.y = 0.38; g.add(dome);
        // Bottom cargo bay
        const belly = bx(1.4, 0.22, 1.2, lm(0x0f3460)); belly.position.y = -0.36; g.add(belly);
        // Logo stripe
        const stripe = bx(2.25, 0.06, 0.35, lm(0x00d4ff)); stripe.position.y = 0.1; g.add(stripe);
        // Camera lens on front
        const lens = cy(0.12, 0.12, 0.1, 8, lm(0x111111)); lens.rotation.x = Math.PI/2; lens.position.set(0, -0.1, 1.05); g.add(lens);
        const lensGlass = cy(0.09, 0.09, 0.08, 8, new THREE.MeshBasicMaterial({color:0x4488ff,transparent:true,opacity:0.8}));
        lensGlass.rotation.x = Math.PI/2; lensGlass.position.set(0, -0.1, 1.1); g.add(lensGlass);

        // === ARMS — 6 arms for hexacopter look ===
        const armAngles = [0, 60, 120, 180, 240, 300].map(d => d * Math.PI / 180);
        const armLen = 2.4;
        const navLightColors = [0xff3333, 0x33ff33, 0x3333ff, 0xff3333, 0x33ff33, 0xffffff];

        armAngles.forEach((angle, idx) => {
            const ax = Math.sin(angle) * armLen;
            const az = Math.cos(angle) * armLen;
            // Tapered arm
            const arm = cy(0.06, 0.1, armLen, 6, lm(0x2a2a3e));
            arm.rotation.z = Math.PI / 2;
            arm.rotation.y = -angle;
            arm.position.set(ax/2, 0, az/2);
            g.add(arm);

            // Motor housing
            const motor = cy(0.28, 0.28, 0.3, 10, lm(0x111111));
            motor.position.set(ax, 0.18, az);
            g.add(motor);

            // Prop guard ring
            const guardGeo = new THREE.TorusGeometry(0.62, 0.04, 6, 20);
            const guard = new THREE.Mesh(guardGeo, lm(0x333333));
            guard.position.set(ax, 0.3, az);
            g.add(guard);

            // Rotor group (3 blades)
            const rotorGroup = new THREE.Group();
            rotorGroup.position.set(ax, 0.38, az);
            rotorGroup.userData.isRotor = true;
            for (let b = 0; b < 3; b++) {
                const blade = bx(1.0, 0.035, 0.14, lm(0x3a3a4a));
                blade.position.x = 0;
                blade.rotation.y = (b / 3) * Math.PI * 2;
                // Each blade is offset along its own axis
                const bOff = new THREE.Group();
                bOff.rotation.y = (b / 3) * Math.PI * 2;
                const bMesh = bx(0.9, 0.035, 0.12, lm(idx % 2 === 0 ? 0x444455 : 0x3a3a3a));
                bMesh.position.x = 0.45;
                bOff.add(bMesh); rotorGroup.add(bOff);
            }
            g.add(rotorGroup);

            // Navigation light on arm tip
            const navLight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6),
                new THREE.MeshBasicMaterial({ color: navLightColors[idx], transparent: true, opacity: 0.9 }));
            navLight.position.set(ax * 1.04, 0.1, az * 1.04);
            navLight.userData.navLight = true;
            navLight.userData.baseColor = navLightColors[idx];
            g.add(navLight);
        });

        // === BOTTOM LED — blinking red ===
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.95 }));
        led.name = 'blink_light';
        led.position.set(0, -0.5, 0);
        g.add(led);

        // === POINT LIGHT — illuminates ground below ===
        const pl = new THREE.PointLight(0x00d4ff, 1.2, 18);
        pl.position.set(0, -0.5, 0);
        g.add(pl);

        return g;
    }

    _buildPackage(items) {
        const g  = new THREE.Group();
        const lm = col => new THREE.MeshLambertMaterial({ color: col });
        const S  = 6; // 5x scale (was 1.2 → now 6)

        // Brown box
        const box = new THREE.Mesh(new THREE.BoxGeometry(S, S, S), lm(0xA0784A));
        box.castShadow = true;
        g.add(box);

        // Tape stripes
        const tape1 = new THREE.Mesh(new THREE.BoxGeometry(S+0.05, S*0.18, S+0.05), lm(0xF0E080));
        g.add(tape1);
        const tape2 = new THREE.Mesh(new THREE.BoxGeometry(S*0.18, S+0.05, S+0.05), lm(0xF0E080));
        g.add(tape2);

        // White label
        const label = new THREE.Mesh(new THREE.BoxGeometry(S*0.55, S*0.35, 0.1), lm(0xF8F8F8));
        label.position.set(0, S*0.15, S/2+0.05);
        g.add(label);

        // Blinking status light
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true })
        );
        light.name = 'blink_light';
        light.position.set(S*0.32, S*0.48, S/2+0.05);
        g.add(light);

        g.userData.isDeliveryPkg = true;
        g.userData.deliveryItems = items;
        return g;
    }

    _showNotification(msg) {
        let el = document.getElementById('drone-notification');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._hideTimer);
        el._hideTimer = setTimeout(() => el.classList.remove('show'), 5000);
    }

    // Build shop UI — returns controller interface object
    static buildShopUI(onPlaceOrder) {
        const catalog  = document.getElementById('shop-catalog');
        const cartList = document.getElementById('shop-cart-list');
        const cartTotal= document.getElementById('shop-cart-total');
        const orderBtn = document.getElementById('shop-order-btn');
        if (!catalog) return null;

        const cart = new Map(); // id → {def, qty}
        let focusIdx   = 0;    // index into flatItems
        let cartFocus  = false;
        let cartIdx    = 0;

        // Build flat ordered list of catalog items (skip separators)
        const flatItems = [];
        const catLabels = {
            furniture:'🛋️ Furniture', cabinet:'🗄️ Cabinets',
            appliance:'🔌 Appliances', outdoor:'🌳 Outdoor', misc:'📦 Misc'
        };
        const cats = {};
        CATALOG.forEach(def => { const c = def.cat||'misc'; if(!cats[c]) cats[c]=[]; cats[c].push(def); });

        // Build catalog grid
        catalog.innerHTML = '';
        Object.entries(cats).forEach(([cat, items]) => {
            const hdr = document.createElement('div');
            hdr.className = 'shop-cat-header';
            hdr.textContent = catLabels[cat] || cat;
            catalog.appendChild(hdr);

            const grid = document.createElement('div');
            grid.className = 'shop-grid';
            items.forEach(def => {
                const tile = document.createElement('div');
                tile.className = 'shop-tile';
                tile.dataset.id = def.id;
                tile.innerHTML = `<span class="shop-tile-icon">${def.icon}</span><span class="shop-tile-name">${def.name}</span>`;
                tile.addEventListener('click', () => addItem(def));
                grid.appendChild(tile);
                flatItems.push({ def, tile });
            });
            catalog.appendChild(grid);
        });

        const addItem = (def) => {
            if (cart.has(def.id)) cart.get(def.id).qty++;
            else cart.set(def.id, { def, qty: 1 });
            renderCart();
            // Brief flash on tile
            const entry = flatItems.find(e => e.def.id === def.id);
            if (entry) {
                entry.tile.classList.add('shop-tile-added');
                clearTimeout(entry._addTimer);
                entry._addTimer = setTimeout(() => entry.tile.classList.remove('shop-tile-added'), 300);
            }
        };

        const renderCart = () => {
            cartList.innerHTML = '';
            const cartArr = [...cart.values()];
            let total = 0;
            cartArr.forEach(({ def, qty }, i) => {
                total += qty;
                const row = document.createElement('div');
                row.className = 'cart-item' + (cartFocus && i === cartIdx ? ' cart-focused' : '');
                row.innerHTML = `
                    <span class="cart-icon">${def.icon}</span>
                    <span class="cart-name">${def.name}</span>
                    <div class="cart-qty-ctrl">
                        <button class="cart-minus" data-id="${def.id}">−</button>
                        <span class="cart-qty">${qty}</span>
                        <button class="cart-plus" data-id="${def.id}">+</button>
                    </div>`;
                row.querySelector('.cart-minus').addEventListener('click', () => { removeOne(def.id); });
                row.querySelector('.cart-plus').addEventListener('click', () => { addItem(def); });
                cartList.appendChild(row);
            });
            cartTotal.textContent = total > 0 ? `${total} item${total>1?'s':''} in cart` : 'Cart is empty';
            orderBtn.disabled = total === 0;
        };

        const removeOne = (id) => {
            const e = cart.get(id);
            if (!e) return;
            e.qty--;
            if (e.qty <= 0) cart.delete(id);
            renderCart();
        };

        orderBtn.addEventListener('click', () => {
            if (cart.size === 0) return;
            const items = []; cart.forEach(({def,qty}) => items.push({id:def.id,qty}));
            onPlaceOrder(items); cart.clear(); renderCart();
            orderBtn.textContent = '✓ Order Placed!';
            orderBtn.style.background = 'rgba(0,255,136,0.25)';
            setTimeout(() => { orderBtn.textContent = 'Place Order'; orderBtn.style.background = ''; }, 3000);
        });

        const setFocus = (idx) => {
            focusIdx = Math.max(0, Math.min(flatItems.length-1, idx));
            flatItems.forEach((e,i) => e.tile.classList.toggle('shop-tile-focused', !cartFocus && i === focusIdx));
        };

        renderCart();
        setFocus(0);

        // Controller interface
        const COLS = 4;
        return {
            // Catalog navigation (dx = left/right, dy = up/down row)
            navCatalog(dx, dy) {
                setFocus(focusIdx + dx + dy * COLS);
                // Auto-scroll the catalog panel so focused item is visible
                const tile = flatItems[focusIdx]?.tile;
                if (tile) tile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            },
            addFocused() {
                const e = flatItems[focusIdx];
                if (e) addItem(e.def);
            },
            navCart(dy) {
                const arr = [...cart.values()];
                cartIdx = Math.max(0, Math.min(arr.length-1, cartIdx + dy));
                renderCart();
            },
            removeCartFocused() {
                const arr = [...cart.values()];
                if (arr[cartIdx]) { removeOne(arr[cartIdx].def.id); cartIdx = Math.max(0, Math.min(cart.size-1, cartIdx)); }
            },
            addCartFocused() {
                const arr = [...cart.values()];
                if (arr[cartIdx]) addItem(arr[cartIdx].def);
            },
            focusCatalog() { cartFocus = false; flatItems.forEach((e,i) => e.tile.classList.toggle('shop-tile-focused', i===focusIdx)); renderCart(); },
            focusCart()    { cartFocus = true;  flatItems.forEach(e => e.tile.classList.remove('shop-tile-focused')); renderCart(); },
            isCartFocus()  { return cartFocus; },
            placeOrder()   { if (!orderBtn.disabled) orderBtn.click(); },
            reset()        { cartFocus = false; focusIdx = 0; cartIdx = 0; setFocus(0); renderCart(); }
        };
    }
}

// ── EASING HELPERS ─────────────────────────────────────────────────────────────
function _easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function _lookAlongVelocity(obj, dir) {
    if (dir.length() < 0.01) return;
    dir.normalize();
    obj.rotation.y = Math.atan2(dir.x, dir.z);
    obj.rotation.x = -Math.asin(Math.max(-1, Math.min(1, dir.y)));
}
