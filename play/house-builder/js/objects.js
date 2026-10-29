const CATALOG = [
    { id:'sofa',        name:'Sofa',          icon:'🛋️',  cat:'furniture',  w:7,  h:3,  d:3,  color:0x6B7280, snap:'floor' },
    { id:'armchair',    name:'Armchair',       icon:'🪑',  cat:'furniture',  w:3,  h:3.5,d:3,  color:0x8B6914, snap:'floor' },
    { id:'coffee_table',name:'Coffee Table',   icon:'🍵',  cat:'furniture',  w:4,  h:1.5,d:2,  color:0x7B5533, snap:'floor' },
    { id:'bookshelf',   name:'Bookshelf',      icon:'📚',  cat:'furniture',  w:4,  h:7,  d:1.5,color:0x6B4226, snap:'floor' },
    { id:'bed',         name:'Bed',            icon:'🛏️',  cat:'furniture',  w:6,  h:2,  d:8,  color:0xffffff, snap:'floor' },
    { id:'desk',        name:'Desk',           icon:'💼',  cat:'furniture',  w:5,  h:2.5,d:2.5,color:0xDEB887, snap:'floor' },
    { id:'dining_table',name:'Dining Table',   icon:'🍽️',  cat:'furniture',  w:6,  h:2.5,d:4,  color:0x8B6914, snap:'floor' },
    { id:'tv',          name:'TV',             icon:'📺',  cat:'electronics',w:6,  h:3.5,d:0.3, color:0x111111, snap:'floor' },
    { id:'lamp',        name:'Floor Lamp',     icon:'💡',  cat:'decor',      w:1,  h:6,  d:1,  color:0xF5DEB3, snap:'floor' },
    { id:'painting',    name:'Painting',       icon:'🖼️',  cat:'decor',      w:3,  h:2,  d:0.2,color:0xFF6B6B, snap:'wall'  },
    { id:'mirror',      name:'Mirror',         icon:'🪞',  cat:'decor',      w:2,  h:4,  d:0.1,color:0x88ccff, snap:'wall'  },
    { id:'plant_small', name:'Potted Plant',   icon:'🌿',  cat:'nature',     w:1.5,h:4,  d:1.5,color:0x228B22, snap:'floor' },
    { id:'plant_large', name:'Large Plant',    icon:'🌴',  cat:'nature',     w:3,  h:8,  d:3,  color:0x1a6b1a, snap:'floor' },
    { id:'fridge',      name:'Refrigerator',   icon:'🧊',  cat:'kitchen',    w:5,  h:7,  d:2.5,color:0xC8C8C8, snap:'floor' },
    { id:'stove',       name:'Stove',          icon:'🍳',  cat:'appliance',  w:2.5,h:3,  d:2,  color:0x555555, snap:'floor' },
    { id:'coffee_maker',name:'Coffee Maker',   icon:'☕',  cat:'appliance',  w:1,  h:1.5,d:0.8,color:0x222222, snap:'floor' },
    { id:'bathtub',     name:'Bathtub',        icon:'🛁',  cat:'bathroom',   w:3,  h:1.5,d:5.5,color:0xffffff, snap:'floor' },
    { id:'toilet',      name:'Toilet',         icon:'🚽',  cat:'bathroom',   w:2,  h:2.5,d:2.5,color:0xffffff, snap:'floor' },
    { id:'sink',        name:'Kitchen Sink',   icon:'🚰',  cat:'appliance',  w:3,  h:3.5,d:2,  color:0xE0E0E0, snap:'floor' },
    { id:'washing_machine',name:'Washer/Dryer',icon:'🫧',  cat:'appliance',  w:2.5,h:3.5,d:2.5,color:0xF0F0F0, snap:'floor' },
    { id:'dishwasher',  name:'Dishwasher',     icon:'🍽️',  cat:'appliance',  w:2.5,h:3.5,d:2.5,color:0xDDDDDD, snap:'floor' },
    { id:'range_hood',  name:'Range Hood',     icon:'💨',  cat:'appliance',  w:3,  h:2,  d:1.5,color:0x888888, snap:'wall'  },
    { id:'island',      name:'Kitchen Island', icon:'🏝️',  cat:'kitchen',    w:7,  h:3.5,d:3.5,color:0xC8A96E, snap:'floor' },
    { id:'pot_rack',    name:'Pot Rack',       icon:'🍳',  cat:'kitchen',    w:4,  h:1,  d:2,  color:0x555555, snap:'floor' },
    { id:'cab_base_1d', name:'Base Cabinet 1-Door', icon:'🚪', cat:'cabinet', w:3,   h:3.5, d:2,   color:0xC8A96E, snap:'floor' },
    { id:'cab_base_2d', name:'Base Cabinet 2-Door', icon:'🚪', cat:'cabinet', w:4.5, h:3.5, d:2,   color:0xC8A96E, snap:'floor' },
    { id:'cab_base_drw',name:'Drawer Cabinet',      icon:'🗃️', cat:'cabinet', w:3,   h:3.5, d:2,   color:0xC8A96E, snap:'floor' },
    { id:'cab_upper_1d',name:'Wall Cabinet 1-Door', icon:'🗄️', cat:'cabinet', w:3,   h:3.0, d:1.2, color:0xC8A96E, snap:'wall' },
    { id:'cab_upper_2d',name:'Wall Cabinet 2-Door', icon:'🗄️', cat:'cabinet', w:4.5, h:3.0, d:1.2, color:0xC8A96E, snap:'wall' },
    { id:'cab_pantry',  name:'Pantry Cabinet',      icon:'🏛️', cat:'cabinet', w:3,   h:7.5, d:2,   color:0xC8A96E, snap:'floor' },
    { id:'cab_corner',  name:'Corner Cabinet',      icon:'⬛', cat:'cabinet', w:4,   h:3.5, d:4,   color:0xC8A96E, snap:'floor' },
    { id:'chest',       name:'Storage Chest',       icon:'🧰', cat:'furniture',w:4,   h:2.5, d:3,   color:0x8B6914, snap:'floor' },
    { id:'car_red',     name:'Red Car',        icon:'🚗',  cat:'vehicle',    w:7,  h:5,  d:15, color:0xCC2222, snap:'floor' },
    { id:'car_blue',    name:'Blue Car',       icon:'🚙',  cat:'vehicle',    w:7,  h:5,  d:15, color:0x2244CC, snap:'floor' },
    { id:'truck',       name:'Pickup Truck',   icon:'🛻',  cat:'vehicle',    w:7,  h:6,  d:18, color:0x334455, snap:'floor' },
    { id:'tree_oak',    name:'Oak Tree',       icon:'🌳',  cat:'nature',     w:5,  h:14, d:5,  color:0x2d6a2d, snap:'floor' },
    { id:'tree_palm',   name:'Palm Tree',      icon:'🌴',  cat:'nature',     w:3,  h:18, d:3,  color:0x228B22, snap:'floor' },
    { id:'box',         name:'Box',            icon:'📦',  cat:'misc',       w:2,  h:2,  d:2,  color:0xDEB887, snap:'floor' },
];

class ObjectSystem {
    constructor(scene, world) {
        this.scene   = scene;
        this.world   = world;
        this.placed  = [];
        this.ghost   = null;
        this.ghostDef= null;
        this.rotY    = 0;
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 40;
    }

    _build(def) {
        let mesh;
        const M  = (color) => new THREE.MeshLambertMaterial({ color });
        const bx = (w,h,d,mat) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);

        if (def.id === 'tv') {
            mesh = new THREE.Group();
            // Build bottom-up so base sits at y=0
            const tvBase = bx(2, 0.3, 2, M(0x333333));
            tvBase.position.y = 0.15;
            mesh.add(tvBase);
            const tvStand = bx(0.4, 2.5, 0.8, M(0x333333));
            tvStand.position.y = 0.3 + 1.25;
            mesh.add(tvStand);
            const screenY = 0.3 + 2.5 + def.h / 2;
            const frame = bx(def.w, def.h, 0.4, M(0x111111));
            frame.position.y = screenY;
            mesh.add(frame);
            const s = bx(def.w-0.4, def.h-0.4, 0.5, new THREE.MeshLambertMaterial({ color:0x1a1a2e, emissive:0x050510 }));
            s.position.set(0, screenY, 0.2);
            mesh.add(s);

        } else if (def.id.startsWith('car') || def.id === 'truck') {
            mesh = new THREE.Group();
            const body = bx(def.w, def.h*0.55, def.d, M(def.color));
            body.position.y = def.h * 0.27;
            mesh.add(body);
            const cab = bx(def.w*0.9, def.h*0.45, def.d*0.55, M(def.color));
            cab.position.set(0, def.h*0.55 + def.h*0.22, -def.d*0.05);
            mesh.add(cab);
            // windows
            const wm = new THREE.MeshLambertMaterial({ color:0x88ccff, transparent:true, opacity:0.6 });
            const winFront = bx(def.w*0.75, def.h*0.28, 0.1, wm);
            winFront.position.set(0, def.h*0.55+def.h*0.22, -def.d*0.55/2);
            mesh.add(winFront);
            // wheels
            const wGeo = new THREE.CylinderGeometry(def.h*0.2, def.h*0.2, 0.8, 12);
            const wMat = M(0x222222);
            [[-1,1],[-1,-1],[1,1],[1,-1]].forEach(([xs,zs]) => {
                const w = new THREE.Mesh(wGeo, wMat);
                w.rotation.z = Math.PI/2;
                w.position.set(xs*(def.w/2+0.2), def.h*0.2, zs*(def.d*0.34));
                mesh.add(w);
            });

        } else if (def.id.startsWith('tree')) {
            mesh = new THREE.Group();
            const trH = def.h * 0.35;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, trH, 8), M(0x5c3d1e));
            trunk.position.y = trH/2;
            mesh.add(trunk);
            if (def.id === 'tree_palm') {
                const top = new THREE.Mesh(new THREE.ConeGeometry(def.w/2, def.h*0.65, 7), M(def.color));
                top.position.y = trH + def.h*0.65*0.5;
                mesh.add(top);
            } else {
                const f1 = new THREE.Mesh(new THREE.ConeGeometry(def.w/2, def.h*0.5, 8), M(def.color));
                f1.position.y = trH + def.h*0.25;
                mesh.add(f1);
                const f2 = new THREE.Mesh(new THREE.ConeGeometry(def.w*0.38, def.h*0.38, 8), M(0x1a5a1a));
                f2.position.y = trH + def.h*0.48;
                mesh.add(f2);
            }

        } else if (def.id.startsWith('plant')) {
            mesh = new THREE.Group();
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.55, 1.5, 8), M(0x8B4513));
            pot.position.y = 0.75;
            mesh.add(pot);
            const plant = new THREE.Mesh(new THREE.SphereGeometry(def.w/2, 8, 8), M(def.color));
            plant.position.y = 1.5 + def.h*0.35;
            mesh.add(plant);

        } else if (def.id === 'bed') {
            mesh = new THREE.Group();
            const frame = bx(def.w, 1, def.d, M(0x6B4226));
            frame.position.y = 0.5;
            mesh.add(frame);
            const mattress = bx(def.w-0.4, 0.8, def.d-0.6, M(0xfafafa));
            mattress.position.y = 1.4;
            mesh.add(mattress);
            const pillow1 = bx(2.2, 0.5, 1.5, M(0xffffff));
            pillow1.position.set(-1.2, 2, -(def.d/2-1.2));
            mesh.add(pillow1);
            const pillow2 = bx(2.2, 0.5, 1.5, M(0xffffff));
            pillow2.position.set(1.2, 2, -(def.d/2-1.2));
            mesh.add(pillow2);
            const headboard = bx(def.w, 4, 0.4, M(0x5c3318));
            headboard.position.set(0, 2, -(def.d/2));
            mesh.add(headboard);

        } else if (def.id === 'sink') {
            mesh = new THREE.Group();
            const cabinet = bx(def.w, def.h - 0.8, def.d, M(0xd4c9a8));
            cabinet.position.y = (def.h - 0.8) / 2;
            mesh.add(cabinet);
            const counter = bx(def.w, 0.2, def.d, M(0xe8e0d0));
            counter.position.y = def.h - 0.8;
            mesh.add(counter);
            const basin = bx(def.w - 0.5, 0.5, def.d - 0.4, M(0xcccccc));
            basin.position.set(0, def.h - 0.6, 0);
            mesh.add(basin);
            const faucet = bx(0.12, 0.7, 0.12, M(0x999999));
            faucet.position.set(0, def.h - 0.1, -0.5);
            mesh.add(faucet);
            const faucetHead = bx(0.5, 0.1, 0.1, M(0x999999));
            faucetHead.position.set(0, def.h + 0.25, -0.4);
            mesh.add(faucetHead);

        } else if (def.id === 'washing_machine' || def.id === 'dishwasher') {
            mesh = new THREE.Group();
            const body = bx(def.w, def.h, def.d, M(def.color));
            body.position.y = def.h / 2;
            mesh.add(body);
            if (def.id === 'washing_machine') {
                const door = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 16), M(0x88aacc));
                door.rotation.x = Math.PI / 2;
                door.position.set(0, def.h * 0.55, def.d / 2 + 0.01);
                mesh.add(door);
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.77, 0.06, 8, 16), M(0x444444));
                ring.rotation.x = Math.PI / 2;
                ring.position.set(0, def.h * 0.55, def.d / 2 + 0.02);
                mesh.add(ring);
            }
            const panel = bx(def.w - 0.2, 0.4, 0.1, M(0x333333));
            panel.position.set(0, def.h - 0.25, def.d / 2 + 0.02);
            mesh.add(panel);

        } else if (def.id === 'range_hood') {
            mesh = new THREE.Group();
            const hood = bx(def.w, def.h * 0.6, def.d, M(0x888888));
            hood.position.y = def.h * 0.3;
            mesh.add(hood);
            const vent = bx(def.w * 0.4, def.h * 0.4, def.d * 0.5, M(0x666666));
            vent.position.y = def.h * 0.7;
            mesh.add(vent);
            const light = bx(def.w - 0.3, 0.15, def.d - 0.3, M(0xffffee));
            light.position.y = 0.1;
            mesh.add(light);

        } else if (def.id === 'island') {
            mesh = new THREE.Group();
            const cm2 = this._cmats();
            const bH2 = def.h - 0.5;
            this._makeCarcass(mesh, def.w, bH2, def.d);
            const ctr2 = new THREE.Mesh(new THREE.BoxGeometry(def.w+0.22,0.26,def.d+0.22), cm2.counter); ctr2.position.y = bH2+0.13; mesh.add(ctr2);
            // Drawer column on front face
            const isldW = def.w/3-0.12, isldH = 0.52;
            for (let i = 0; i < 3; i++) {
                const drX = -def.w/3 + i*def.w/3 + def.w/6;
                mesh.add(this._makeCabDrawer(isldW, isldH, drX, bH2*0.38, def.d/2, def.d*0.55));
            }
            // Overhang seating edge
            const overhang = new THREE.Mesh(new THREE.BoxGeometry(def.w+0.22, 0.07, 0.5), cm2.counter);
            overhang.position.set(0, bH2+0.26, -(def.d/2+0.15));
            mesh.add(overhang);

        } else if (def.id === 'pot_rack') {
            mesh = new THREE.Group();
            const bar = bx(def.w, 0.1, 0.1, M(0x444444));
            bar.position.y = def.h / 2;
            mesh.add(bar);
            const bar2 = bx(0.1, 0.1, def.d, M(0x444444));
            bar2.position.y = def.h / 2;
            mesh.add(bar2);
            // Hanging pots
            const potColors = [0x884422, 0x666666, 0xCC8800];
            for (let i = 0; i < 5; i++) {
                const hook = bx(0.06, 0.4, 0.06, M(0x444444));
                hook.position.set(-def.w/2 + (i+0.5) * def.w/5, 0, 0);
                mesh.add(hook);
                const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.5, 10), M(potColors[i % 3]));
                pot.position.set(-def.w/2 + (i+0.5) * def.w/5, -0.45, 0);
                mesh.add(pot);
            }

        } else if (def.id === 'cab_base_1d') {
            mesh = new THREE.Group();
            const { w:W, h:H, d:D } = def; const bodyH = H-0.5;
            const cm = this._cmats();
            this._makeCarcass(mesh, W, bodyH, D);
            const top  = new THREE.Mesh(new THREE.BoxGeometry(W+0.16, 0.24, D+0.14), cm.counter); top.position.y = bodyH+0.12; mesh.add(top);
            // countertop front edge highlight
            const edge = new THREE.Mesh(new THREE.BoxGeometry(W+0.16, 0.05, 0.05), this._sm(0x303035, 0.45, 0.08)); edge.position.set(0, bodyH+0.24, D/2+0.07+0.025); mesh.add(edge);
            const kick = new THREE.Mesh(new THREE.BoxGeometry(W-0.15, 0.28, 0.08), cm.kick); kick.position.set(0, 0.14, D/2-0.04); mesh.add(kick);
            const dW = W-0.14, dH = bodyH-0.4;
            mesh.add(this._makeCabDoor(dW, dH, -W/2+0.07, 0.3+dH/2, D/2, 1));

        } else if (def.id === 'cab_base_2d') {
            mesh = new THREE.Group();
            const { w:W, h:H, d:D } = def; const bodyH = H-0.5;
            const cm = this._cmats();
            this._makeCarcass(mesh, W, bodyH, D);
            const top  = new THREE.Mesh(new THREE.BoxGeometry(W+0.16, 0.24, D+0.14), cm.counter); top.position.y = bodyH+0.12; mesh.add(top);
            const edge = new THREE.Mesh(new THREE.BoxGeometry(W+0.16, 0.05, 0.05), this._sm(0x303035, 0.45, 0.08)); edge.position.set(0, bodyH+0.24, D/2+0.07+0.025); mesh.add(edge);
            const kick = new THREE.Mesh(new THREE.BoxGeometry(W-0.15, 0.28, 0.08), cm.kick); kick.position.set(0, 0.14, D/2-0.04); mesh.add(kick);
            const dW = (W-0.2)/2, dH = bodyH-0.4, dY = 0.3+dH/2;
            mesh.add(this._makeCabDoor(dW, dH, -W/2+0.07, dY, D/2,  1));
            mesh.add(this._makeCabDoor(dW, dH,  W/2-0.07, dY, D/2, -1));

        } else if (def.id === 'cab_base_drw') {
            mesh = new THREE.Group();
            const { w:W, h:H, d:D } = def; const bodyH = H-0.5;
            const cm = this._cmats();
            this._makeCarcass(mesh, W, bodyH, D);
            const top  = new THREE.Mesh(new THREE.BoxGeometry(W+0.16, 0.24, D+0.14), cm.counter); top.position.y = bodyH+0.12; mesh.add(top);
            const edge = new THREE.Mesh(new THREE.BoxGeometry(W+0.16, 0.05, 0.05), this._sm(0x303035, 0.45, 0.08)); edge.position.set(0, bodyH+0.24, D/2+0.07+0.025); mesh.add(edge);
            const kick = new THREE.Mesh(new THREE.BoxGeometry(W-0.15, 0.28, 0.08), cm.kick); kick.position.set(0, 0.14, D/2-0.04); mesh.add(kick);
            const avail = bodyH-0.3, gap = 0.06;
            const dH = (avail-gap*2)/3, dW = W-0.12;
            for (let i = 0; i < 3; i++) {
                mesh.add(this._makeCabDrawer(dW, dH-0.05, 0, 0.3+i*(dH+gap)+dH/2, D/2, D*0.65));
            }

        } else if (def.id === 'cab_upper_1d') {
            mesh = new THREE.Group();
            const { w:W, h:H, d:D } = def;
            const cm = this._cmats();
            this._makeCarcass(mesh, W, H, D);
            // Extra interior shelf
            const ush = new THREE.Mesh(new THREE.BoxGeometry(W-0.22, 0.07, D-0.22), cm.inr||this._sm(0xF8F6F0,0.90)); ush.position.set(0, H*0.55, -0.05); mesh.add(ush);
            // Bottom trim strip
            const btrim = new THREE.Mesh(new THREE.BoxGeometry(W+0.06, 0.10, 0.06), this._sm(0xDDD9CF, 0.85)); btrim.position.set(0, 0.05, D/2-0.03); mesh.add(btrim);
            mesh.add(this._makeCabDoor(W-0.14, H-0.2, -W/2+0.07, H/2, D/2, 1));

        } else if (def.id === 'cab_upper_2d') {
            mesh = new THREE.Group();
            const { w:W, h:H, d:D } = def;
            const cm = this._cmats();
            this._makeCarcass(mesh, W, H, D);
            const ush = new THREE.Mesh(new THREE.BoxGeometry(W-0.22, 0.07, D-0.22), cm.inr||this._sm(0xF8F6F0,0.90)); ush.position.set(0, H*0.55, -0.05); mesh.add(ush);
            const btrim = new THREE.Mesh(new THREE.BoxGeometry(W+0.06, 0.10, 0.06), this._sm(0xDDD9CF, 0.85)); btrim.position.set(0, 0.05, D/2-0.03); mesh.add(btrim);
            const dW = (W-0.2)/2, dH = H-0.2;
            mesh.add(this._makeCabDoor(dW, dH, -W/2+0.07, H/2, D/2,  1));
            mesh.add(this._makeCabDoor(dW, dH,  W/2-0.07, H/2, D/2, -1));

        } else if (def.id === 'cab_pantry') {
            mesh = new THREE.Group();
            const { w:W, h:H, d:D } = def;
            const cm = this._cmats();
            this._makeCarcass(mesh, W, H, D);
            const midH = H/2;
            const shMat = new THREE.MeshStandardMaterial({ color: 0xF8F6F0, roughness: 0.90, metalness: 0 });
            [0.22, 0.44, 0.66, 0.88].forEach(r => {
                const s = new THREE.Mesh(new THREE.BoxGeometry(W-0.22, 0.07, D-0.22), shMat);
                s.position.set(0, H*r, -0.05); mesh.add(s);
            });
            const kick = new THREE.Mesh(new THREE.BoxGeometry(W-0.15, 0.28, 0.08), cm.kick); kick.position.set(0, 0.14, D/2-0.04); mesh.add(kick);
            const dW = W-0.14, lH = midH-0.4, uH = H-midH-0.3;
            mesh.add(this._makeCabDoor(dW, lH,  W/2-0.07, 0.3+lH/2,         D/2, -1));
            mesh.add(this._makeCabDoor(dW, uH, -W/2+0.07, midH+0.1+uH/2,    D/2,  1));

        } else if (def.id === 'cab_corner') {
            // L-shaped corner cabinet — W=D=4, height matches other base cabinets (h:3.5)
            mesh = new THREE.Group();
            const { w:W, h:H, d:D } = def; const bodyH = H-0.5;
            const cm = this._cmats();
            // Front leg
            const frontG = new THREE.Group(); frontG.position.z = D/4;
            this._makeCarcass(frontG, W, bodyH, D/2);
            mesh.add(frontG);
            // Side leg
            const sideG = new THREE.Group(); sideG.position.set(W/2-D/4, 0, -D/4);
            this._makeCarcass(sideG, D/2, bodyH, D/2);
            mesh.add(sideG);
            // L-shaped dark quartz countertop
            const ctrMat = cm.counter;
            const topF = new THREE.Mesh(new THREE.BoxGeometry(W+0.14, 0.24, D/2+0.14), ctrMat); topF.position.set(0, bodyH+0.12, D/4); mesh.add(topF);
            const topS = new THREE.Mesh(new THREE.BoxGeometry(D/2+0.14, 0.24, D/2-0.08), ctrMat); topS.position.set(W/2-D/4, bodyH+0.12, -D/4); mesh.add(topS);
            // Kickplates
            const kick1 = new THREE.Mesh(new THREE.BoxGeometry(W-0.1, 0.28, 0.08), cm.kick); kick1.position.set(0, 0.14, D/2-0.04); mesh.add(kick1);
            const kick2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, D/2-0.1), cm.kick); kick2.position.set(W/2-0.04, 0.14, -D/4); mesh.add(kick2);
            // Doors
            const dH = bodyH-0.4, dY = 0.3+dH/2;
            mesh.add(this._makeCabDoor(W/2-0.1, dH, -W/2+0.07, dY, D/2, 1));
            // Side door (shaker style, rotates on Y at side)
            const sd = this._makeCabDoor(D/2-0.1, dH, 0, 0, 0, -1);
            sd.position.set(W/2-0.03, dY, -D/2+0.07);
            sd.userData.openRotY = Math.PI * 0.50;
            // Reorient: this door swings in XZ so we need different rotation axis treatment
            mesh.add(sd);

        } else if (def.id === 'chest') {
            mesh = new THREE.Group();
            const { w:W, h:H, d:D } = def;
            const lidH = H*0.38, bodyH = H-lidH;
            this._makeCarcass(mesh, W, bodyH, D, 0x8B6914);
            // Metal band straps on body
            [-1,0,1].forEach(x => {
                const s = bx(0.12, bodyH+0.04, D+0.04, M(0x555533));
                s.position.set(x*(W/3), bodyH/2, 0); mesh.add(s);
            });
            // Lock clasp
            const clasp = bx(0.35, 0.35, 0.12, M(0x999900));
            clasp.position.set(0, bodyH*0.55, D/2+0.07); mesh.add(clasp);
            // Lid pivot at top-back of body
            const lidPivot = new THREE.Group();
            lidPivot.position.set(0, bodyH, -D/2);
            lidPivot.userData.isChestLid = true;
            lidPivot.userData.targetRotX = 0;
            lidPivot.userData.openRotX   = -Math.PI * 0.8;
            const lidPanel = bx(W-0.04, lidH, D, M(0x9B7533));
            lidPanel.position.set(0, lidH/2, D/2); lidPivot.add(lidPanel);
            [-1,0,1].forEach(x => {
                const ls = bx(0.12, lidH+0.04, D+0.02, M(0x555533));
                ls.position.set(x*(W/3), lidH/2, D/2); lidPivot.add(ls);
            });
            mesh.add(lidPivot);
            mesh.userData.isChest  = true;
            mesh.userData.isOpen   = false;
            mesh.userData.storage  = new Array(25).fill(null);
            mesh.userData._lidPivot = lidPivot;

        } else if (def.id === 'fridge') {
            mesh = new THREE.Group();
            const W = def.w, H = def.h, D = def.d;
            // Polished silver exterior
            // Lowered metalness so ambient light still illuminates it (no envMap in scene)
            const ssMat    = new THREE.MeshStandardMaterial({ color:0xCDD0D4, metalness:0.65, roughness:0.18 });
            const darkMat  = new THREE.MeshStandardMaterial({ color:0x1A1C1E, metalness:0.45, roughness:0.35 });
            const handleMat= new THREE.MeshStandardMaterial({ color:0xC8CACC, metalness:0.70, roughness:0.15 });
            const intMat   = new THREE.MeshStandardMaterial({ color:0xF5F5F5, roughness:0.85, metalness:0.0  });
            const intShMat = new THREE.MeshStandardMaterial({ color:0xE0E0E0, roughness:0.70, metalness:0.06 });
            const mk = (w,h,d,mat) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
            const t  = 0.12; // shell thickness

            // ── HOLLOW SHELL BODY (lets interior show through open doors) ──
            const shellSpecs = [
                // back
                [W,   H,   t,   0,        H/2,    -D/2+t/2],
                // left side
                [t,   H,   D,  -W/2+t/2,  H/2,    0       ],
                // right side
                [t,   H,   D,   W/2-t/2,  H/2,    0       ],
                // top
                [W,   t,   D,   0,         H-t/2,  0       ],
                // bottom
                [W,   t,   D,   0,         t/2,    0       ],
            ];
            shellSpecs.forEach(([w,h,d,x,y,z]) => {
                const p = mk(w,h,d,ssMat); p.position.set(x,y,z); mesh.add(p);
            });

            // ── WHITE INTERIOR (fully visible through open doors) ──
            const iW = W-2*t-0.02, iH = H-2*t-0.02, iD = D-t-0.06;
            // back wall
            const intBack = mk(iW, iH, 0.03, intMat); intBack.position.set(0, H/2, -D/2+t+0.015); mesh.add(intBack);
            // left/right walls
            const intL = mk(0.03, iH, iD, intMat); intL.position.set(-W/2+t+0.015, H/2, -t/2); mesh.add(intL);
            const intR = mk(0.03, iH, iD, intMat); intR.position.set( W/2-t-0.015, H/2, -t/2); mesh.add(intR);
            // ceiling
            const intTop = mk(iW, 0.03, iD, intMat); intTop.position.set(0, H-t-0.015, -t/2); mesh.add(intTop);
            // floor
            const intBot = mk(iW, 0.03, iD, intMat); intBot.position.set(0, t+0.015, -t/2); mesh.add(intBot);
            // 3 shelves
            for (let s = 0; s < 3; s++) {
                const shY = t + (H-2*t) * (0.22 + s*0.22);
                const shelf = mk(iW-0.06, 0.055, iD-0.08, intShMat);
                shelf.position.set(0, shY, -t/2); mesh.add(shelf);
            }

            // Recessed top strip
            const topStrip = mk(W-0.08, 0.20, D-0.08, darkMat); topStrip.position.y = H-0.10; mesh.add(topStrip);
            // Bottom kick plate
            const kick = mk(W-0.04, 0.20, D, darkMat); kick.position.y = 0.10; mesh.add(kick);
            // Center gap divider
            const divider = mk(0.05, H*0.90, 0.05, darkMat); divider.position.set(0, H*0.45+0.05, D/2+0.01); mesh.add(divider);

            // ── LEFT DOOR (hinges on left, opens left ~90°) ──
            const lDoorPivot = new THREE.Group();
            lDoorPivot.position.set(-W/2, 0, 0);
            const lDoor = mk(W/2-0.05, H*0.90-0.08, 0.09, ssMat.clone());
            lDoor.position.set(W/4-0.025, H*0.45+0.05, D/2+0.045);
            lDoorPivot.add(lDoor);
            const lHandleGroup = new THREE.Group();
            lHandleGroup.position.set(W/2-0.26, H*0.45+0.05, D/2+0.10);
            const lHBar = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, H*0.36, 12), handleMat);
            lHandleGroup.add(lHBar);
            for (const yOff of [-H*0.18, H*0.18]) {
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), handleMat);
                cap.position.y = yOff; lHandleGroup.add(cap);
            }
            for (const yOff of [-H*0.13, H*0.13]) {
                const bracket = mk(0.11, 0.055, 0.10, darkMat);
                bracket.position.set(0, yOff, -0.07); lHandleGroup.add(bracket);
            }
            lDoorPivot.add(lHandleGroup);
            lDoorPivot.userData.isCabinetDoor = true;
            lDoorPivot.userData.isOpen        = false;
            lDoorPivot.userData.targetRotY    = 0;
            lDoorPivot.userData.openRotY      = -Math.PI * 0.50; // 90° — won't pass through walls
            mesh.add(lDoorPivot);

            // ── RIGHT DOOR (hinges on right, opens right ~90°) ──
            const rDoorPivot = new THREE.Group();
            rDoorPivot.position.set(W/2, 0, 0);
            const rDoor = mk(W/2-0.05, H*0.90-0.08, 0.09, ssMat.clone());
            rDoor.position.set(-W/4+0.025, H*0.45+0.05, D/2+0.045);
            rDoorPivot.add(rDoor);
            const rHandleGroup = new THREE.Group();
            rHandleGroup.position.set(-W/2+0.26, H*0.45+0.05, D/2+0.10);
            const rHBar = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, H*0.36, 12), handleMat);
            rHandleGroup.add(rHBar);
            for (const yOff of [-H*0.18, H*0.18]) {
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), handleMat);
                cap.position.y = yOff; rHandleGroup.add(cap);
            }
            for (const yOff of [-H*0.13, H*0.13]) {
                const bracket = mk(0.11, 0.055, 0.10, darkMat);
                bracket.position.set(0, yOff, -0.07); rHandleGroup.add(bracket);
            }
            rDoorPivot.add(rHandleGroup);
            rDoorPivot.userData.isCabinetDoor = true;
            rDoorPivot.userData.isOpen        = false;
            rDoorPivot.userData.targetRotY    = 0;
            rDoorPivot.userData.openRotY      = Math.PI * 0.50; // 90°
            mesh.add(rDoorPivot);

            // Logo badge
            const badge = mk(0.55, 0.16, 0.02, darkMat); badge.position.set(0, H*0.08, D/2+0.10); mesh.add(badge);
            mesh.userData.isFridge = true;

        } else {
            mesh = bx(def.w, def.h, def.d, M(def.color));
        }

        mesh.userData.objDef  = def;
        mesh.userData.objType = 'placeable';
        mesh.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        return mesh;
    }

    setGhostDef(def) {
        if (this.ghost) { this.scene.remove(this.ghost); this.ghost = null; }
        if (!def) { this.ghostDef = null; return; }
        this.ghostDef = def;
        this.rotY = 0;
        this.ghost = this._build(def);
        this._setOpacity(this.ghost, 0.5);
        this.ghost.visible = false;
        this.scene.add(this.ghost);
    }

    _setOpacity(obj, o) {
        obj.traverse(c => {
            if (c.isMesh) {
                c.material = c.material.clone();
                c.material.transparent = true;
                c.material.opacity = o;
            }
        });
    }

    updateGhost(pos, valid) {
        if (!this.ghost) return;
        this.ghost.visible = !!pos;
        if (!pos) return;
        this._snapMeshToSurface(this.ghost, pos.x, pos.z, pos.y);
        const col = valid ? 0x00ff88 : 0xff4444;
        this.ghost.traverse(c => { if (c.isMesh) c.material.color.setHex(col); });
    }

    // Returns the surface Y (top of ground or top of a placeable object under the cursor)
    snapY(hit) {
        let surfaceY = hit.point.y;
        let obj = hit.object;
        while (obj) {
            if (obj.userData.objType === 'placeable') {
                surfaceY = new THREE.Box3().setFromObject(obj).max.y;
                break;
            }
            obj = obj.parent;
        }
        return surfaceY;
    }

    // Snap an already-built mesh so its bounding-box bottom sits at surfaceY
    _snapMeshToSurface(mesh, x, z, surfaceY) {
        mesh.position.set(x, 0, z);
        mesh.rotation.y = this.rotY;
        const bottom = new THREE.Box3().setFromObject(mesh).min.y;
        mesh.position.y = surfaceY - bottom;
    }

    place(pos) {
        if (!this.ghostDef) return null;
        const mesh = this._build(this.ghostDef);
        this._snapMeshToSurface(mesh, pos.x, pos.z, pos.y);
        this.scene.add(mesh);
        this.placed.push(mesh);
        return mesh;
    }

    pickUp(mesh) {
        const i = this.placed.indexOf(mesh);
        if (i !== -1) {
            const def = mesh.userData.objDef;
            this.scene.remove(mesh);
            this.placed.splice(i, 1);
            return def;
        }
        return null;
    }

    rotateLeft()  { this.rotY -= Math.PI / 4; }
    rotateRight() { this.rotY += Math.PI / 4; }
    setGhostYaw(yaw) { this.rotY = yaw; }

    clearGhost() {
        if (this.ghost) { this.scene.remove(this.ghost); this.ghost = null; }
        this.ghostDef = null;
    }

    allMeshes() { return this.placed; }

    // ── CABINET HELPERS ──────────────────────────────────────────────────────

    // ── CABINET MATERIAL HELPERS ─────────────────────────────────────────────────
    _sm(col, rough = 0.82, metal = 0) {
        return new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: metal });
    }
    _cmats() {
        // Warm honey-maple / caramel stain kitchen palette (matches Florida modern kitchen)
        return {
            ext:     this._sm(0x9E7848, 0.72),          // maple carcass body
            inr:     this._sm(0xC8A870, 0.78),          // lighter maple interior
            door:    this._sm(0xA88050, 0.68),          // door face — slightly lighter/warmer
            frame:   this._sm(0xB89060, 0.65),          // shaker rail/stile — lightest highlight
            panel:   this._sm(0x8E6C3C, 0.76),          // recessed center panel — slightly deeper
            counter: this._sm(0xF4F0E8, 0.38, 0.04),   // white quartz countertop (like photo)
            kick:    this._sm(0x7A5C30, 0.82),          // dark toe-kick
            handle:  this._sm(0xC8A858, 0.28, 0.60),   // gold-tone bar pull
            hinge:   this._sm(0xB09850, 0.40, 0.55),   // matching gold hinge
        };
    }

    // Build a hollow 5-panel carcass with white painted exterior + bright interior
    _makeCarcass(group, W, H, D, _colHex) {
        const c  = this._cmats();
        const mk = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); return m; };
        const t  = 0.1;
        // 5 exterior shell panels
        [
            [W,   H,   t,   0,          H/2,    -D/2+t/2, c.ext],
            [t,   H,   D,  -W/2+t/2,   H/2,    0,        c.ext],
            [t,   H,   D,   W/2-t/2,   H/2,    0,        c.ext],
            [W,   t,   D,   0,          H-t/2,  0,        c.ext],
            [W,   t,   D,   0,          t/2,    0,        c.ext],
        ].forEach(([w,h,d,x,y,z,mat]) => { const p=mk(w,h,d,mat); p.position.set(x,y,z); group.add(p); });
        // Interior back wall (visible through open doors)
        const ib = mk(W-2*t-0.02, H-2*t-0.02, 0.02, c.inr);
        ib.position.set(0, H/2, -D/2+t+0.01); group.add(ib);
        // Interior mid shelf
        const sh = mk(W-2*t-0.04, t*0.65, D-t-0.06, c.inr);
        sh.position.set(0, H*0.50, -t/2); group.add(sh);
    }

    // Shaker-style door: frame (rail + stile) + recessed panel + bar pull + hinges
    _makeCabDoor(dW, dH, px, py, pz, openDir) {
        const c  = this._cmats();
        const mk = (w,h,d,mat) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
        const p  = new THREE.Group();
        p.position.set(px, py, pz);
        p.userData.isCabinetDoor = true;
        p.userData.isOpen        = false;
        p.userData.targetRotY    = 0;
        p.userData.openRotY      = -openDir * Math.PI * 0.50; // 90° max — won't swing through walls

        const cx = openDir * dW / 2;   // face center x from pivot
        const fZ = 0.035;              // face plate center z (plate is 0.07 thick)
        const topZ = 0.07 + 0.022;    // frame pieces sit proud of face

        // Face plate
        const face = mk(dW, dH, 0.07, c.door);
        face.position.set(cx, 0, fZ); p.add(face);

        // Shaker frame: rails (top/bottom) + stiles (left/right) — proud of face
        const rH = Math.max(0.22, Math.min(dH*0.18, 0.44));  // rail height
        const sW = Math.max(0.20, Math.min(dW*0.16, 0.38));  // stile width
        const iH = dH - rH * 2;                               // inner height between rails

        const tRail = mk(dW, rH, 0.038, c.frame); tRail.position.set(cx,  dH/2 - rH/2, topZ); p.add(tRail);
        const bRail = mk(dW, rH, 0.038, c.frame); bRail.position.set(cx, -dH/2 + rH/2, topZ); p.add(bRail);
        const lStile = mk(sW, iH, 0.038, c.frame); lStile.position.set(cx - dW/2 + sW/2, 0, topZ); p.add(lStile);
        const rStile = mk(sW, iH, 0.038, c.frame); rStile.position.set(cx + dW/2 - sW/2, 0, topZ); p.add(rStile);

        // Recessed center panel
        const panW = dW - sW*2 - 0.05, panH = dH - rH*2 - 0.05;
        if (panW > 0.1 && panH > 0.1) {
            const panel = mk(panW, panH, 0.04, c.panel);
            panel.position.set(cx, 0, 0.044); p.add(panel); // behind frame face
        }

        // Horizontal bar pull at inner edge
        const barLen = Math.min(dW * 0.48, 1.8);
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, barLen, 8), c.handle);
        bar.rotation.z = Math.PI / 2;
        const hx = openDir * (dW - 0.24);
        bar.position.set(hx, 0, topZ + 0.06); p.add(bar);
        // Bracket mounts
        for (const yo of [-barLen*0.32, barLen*0.32]) {
            const brk = mk(0.07, 0.05, 0.08, c.handle);
            brk.position.set(hx, yo, topZ + 0.03); p.add(brk);
        }

        // Hinges on hinge side (2)
        const hx2 = cx - openDir * (dW/2 - 0.08);
        for (const yo of [-dH*0.27, dH*0.27]) {
            const hinge = mk(0.09, 0.22, 0.09, c.hinge);
            hinge.position.set(hx2, yo, topZ); p.add(hinge);
        }
        return p;
    }

    _makeCabDrawer(dW, dH, px, py, pz, slideAmt) {
        const c  = this._cmats();
        const mk = (w,h,d,mat) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
        const g  = new THREE.Group();
        g.position.set(px, py, 0);
        g.userData.isCabinetDrawer = true;
        g.userData.isOpen          = false;
        g.userData.targetPosZ      = 0;
        g.userData.openPosZ        = slideAmt;

        const topZ = pz + 0.035 + 0.022;

        // Drawer face plate
        const face = mk(dW, dH, 0.07, c.door); face.position.z = pz + 0.035; g.add(face);
        // Top & bottom rails
        const rH = Math.max(0.15, dH * 0.20);
        const tR = mk(dW, rH, 0.038, c.frame); tR.position.set(0, dH/2-rH/2, topZ); g.add(tR);
        const bR = mk(dW, rH, 0.038, c.frame); bR.position.set(0, -dH/2+rH/2, topZ); g.add(bR);
        // Center panel
        const panH = dH - rH*2 - 0.04;
        if (panH > 0.05) {
            const pan = mk(dW - 0.08, panH, 0.04, c.panel);
            pan.position.set(0, 0, pz + 0.042); g.add(pan);
        }
        // Horizontal bar pull centered
        const barLen = Math.min(dW * 0.52, 2.0);
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, barLen, 8), c.handle);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, 0, topZ + 0.06); g.add(bar);
        for (const xo of [-barLen*0.32, barLen*0.32]) {
            const brk = mk(0.05, 0.07, 0.08, c.handle);
            brk.position.set(xo, 0, topZ + 0.03); g.add(brk);
        }

        // Drawer box tray (slides out behind faceplate)
        const boxD = slideAmt * 0.88, bH = dH - 0.08, bW = dW - 0.04;
        const t2 = new THREE.MeshStandardMaterial({ color: 0xECE9DF, roughness: 0.88, metalness: 0 });
        const b2 = (w,h,d) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), t2);
        const btm = b2(bW, 0.06, boxD); btm.position.set(0, -bH/2+0.03, pz - boxD/2); g.add(btm);
        const bk  = b2(bW, bH, 0.05);  bk.position.set(0, 0, pz - boxD + 0.025);       g.add(bk);
        const ls  = b2(0.05, bH, boxD); ls.position.set(-bW/2, 0, pz - boxD/2);         g.add(ls);
        const rs  = b2(0.05, bH, boxD); rs.position.set( bW/2, 0, pz - boxD/2);         g.add(rs);
        return g;
    }

    // Animate all cabinet doors and drawers each frame
    tickCabinets() {
        for (const mesh of this.placed) {
            const cat = mesh.userData.objDef?.cat;
            const id  = mesh.userData.objDef?.id;
            if (cat === 'cabinet' || id === 'fridge') {
                mesh.traverse(c => {
                    if (c.userData.isCabinetDoor) {
                        const diff = c.userData.targetRotY - c.rotation.y;
                        if (Math.abs(diff) > 0.001) c.rotation.y += diff * 0.15;
                        else c.rotation.y = c.userData.targetRotY;
                    }
                    if (c.userData.isCabinetDrawer) {
                        const diff = c.userData.targetPosZ - c.position.z;
                        if (Math.abs(diff) > 0.001) c.position.z += diff * 0.15;
                        else c.position.z = c.userData.targetPosZ;
                    }
                });
            }
            if (mesh.userData.isChest) {
                const lid = mesh.userData._lidPivot;
                if (lid) {
                    const diff = lid.userData.targetRotX - lid.rotation.x;
                    if (Math.abs(diff) > 0.001) lid.rotation.x += diff * 0.15;
                    else lid.rotation.x = lid.userData.targetRotX;
                }
            }
        }
    }

    // Snap a cabinet being placed to the edge of an adjacent cabinet
    snapCabinetEdge(pos, def) {
        const THRESH = 1.8; // tighter threshold so it only snaps near the actual edge

        // Returns effective [width-in-X, depth-in-Z] accounting for 90° rotation
        const effDims = (d, yaw) => {
            const r = Math.abs(Math.abs(yaw % Math.PI) - Math.PI / 2) < 0.25;
            return r ? [d.d, d.w] : [d.w, d.d];
        };

        const [myW, myD] = effDims(def, this.rotY);
        let best = null, bestD = Infinity;

        for (const placed of this.placed) {
            const pDef = placed.userData.objDef;
            const isSnapTarget = pDef?.cat === 'cabinet' || pDef?.cat === 'kitchen'
                               || pDef?.id === 'fridge'  || pDef?.cat === 'appliance';
            if (!isSnapTarget) continue;

            const [pW, pD] = effDims(pDef, placed.rotation.y);
            const dx = pos.x - placed.position.x;
            const dz = pos.z - placed.position.z;
            const edgeX = (myW + pW) / 2;
            const edgeZ = (myD + pD) / 2;

            // Side-by-side along X axis — must be close in Z (within own depth)
            if (Math.abs(dz) < pD * 0.55 && Math.abs(Math.abs(dx) - edgeX) < THRESH) {
                const d = Math.abs(Math.abs(dx) - edgeX) + Math.abs(dz);
                if (d < bestD) {
                    bestD = d;
                    best = { x: placed.position.x + Math.sign(dx) * edgeX, z: placed.position.z };
                }
            }
            // Side-by-side along Z axis — must be close in X
            if (Math.abs(dx) < pW * 0.55 && Math.abs(Math.abs(dz) - edgeZ) < THRESH) {
                const d = Math.abs(Math.abs(dz) - edgeZ) + Math.abs(dx);
                if (d < bestD) {
                    bestD = d;
                    best = { x: placed.position.x, z: placed.position.z + Math.sign(dz) * edgeZ };
                }
            }
        }
        return best;
    }

    // Place a catalog item directly at world position (bypasses ghost/inventory)
    placeDirectly(defId, x, z, rotY = 0) {
        const def = CATALOG.find(d => d.id === defId);
        if (!def) return null;
        const prevRotY = this.rotY;
        this.rotY = rotY;
        const mesh = this._build(def);
        this._snapMeshToSurface(mesh, x, z, 0);
        this.scene.add(mesh);
        this.placed.push(mesh);
        this.rotY = prevRotY;
        return mesh;
    }
}
