// ── MODE WHEEL (GTA-style radial selector) ────────────────────────────────────
// Hold L2 → radial fan appears. Left stick / mouse aims → release L2 selects.
class ModeWheel {
    constructor(game) {
        this.game    = game;
        this.open    = false;
        this._sel    = null;
        this._el     = null;
        this._items  = null;
        this._build();
    }

    // All modes the wheel can show
    _modes() {
        return [
            { id: 'explore',     icon: '🚶', label: 'Explore'    },
            { id: 'build',       icon: '🏗️',  label: 'Build'      },
            { id: 'floor',       icon: '🪵',  label: 'Floor'      },
            { id: 'paint',       icon: '🎨', label: 'Paint'      },
            { id: 'pond',        icon: '💧', label: 'Pond'       },
            { id: 'planter',     icon: '🌱', label: 'Planter'    },
            { id: 'mulch',       icon: '🍂', label: 'Mulch Bed'  },
            { id: 'greenhouse',  icon: '🌿', label: 'Greenhouse' },
            { id: 'lights',      icon: '💡', label: 'Lights'     },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'mode-wheel';
        el.style.cssText = `
            display:none; position:fixed; inset:0; z-index:9000;
            pointer-events:none; background:rgba(0,0,0,0.42);
        `;

        const wheel = document.createElement('div');
        wheel.style.cssText = `
            position:absolute; left:50%; top:50%;
            transform:translate(-50%,-50%);
            width:420px; height:420px;
        `;
        el.appendChild(wheel);

        // Center dot + label
        const center = document.createElement('div');
        center.style.cssText = `
            position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
            width:80px; height:80px; border-radius:50%;
            background:rgba(20,20,20,0.90); border:2px solid rgba(255,255,255,0.25);
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            font-family:system-ui,sans-serif; text-align:center; gap:2px;
        `;
        const centerIcon  = document.createElement('div');
        centerIcon.id = 'mw-center-icon';
        centerIcon.style.cssText = 'font-size:20px; line-height:1;';
        const centerLabel = document.createElement('div');
        centerLabel.id = 'mw-center-label';
        centerLabel.style.cssText = 'font-size:10px; color:#bbb; text-transform:uppercase; letter-spacing:0.05em;';
        center.appendChild(centerIcon);
        center.appendChild(centerLabel);
        wheel.appendChild(center);

        // Slice items
        const modes = this._modes();
        const N     = modes.length;
        const R     = 150; // orbit radius
        this._items = [];

        for (let i = 0; i < N; i++) {
            const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * R + 210 - 44; // 44 = half item width
            const y = Math.sin(angle) * R + 210 - 44;

            const item = document.createElement('div');
            item.className = 'mw-item';
            item.dataset.id = modes[i].id;
            item.style.cssText = `
                position:absolute; left:${x}px; top:${y}px;
                width:88px; height:88px; border-radius:50%;
                background:rgba(16,16,20,0.82);
                border:2px solid rgba(255,255,255,0.18);
                display:flex; flex-direction:column;
                align-items:center; justify-content:center; gap:3px;
                font-family:system-ui,sans-serif; cursor:pointer;
                transition:transform 0.07s, background 0.07s, border-color 0.07s;
                user-select:none;
            `;
            item.innerHTML = `
                <span style="font-size:24px; line-height:1;">${modes[i].icon}</span>
                <span style="font-size:10px; color:#ccc; text-transform:uppercase;
                             letter-spacing:0.04em; text-align:center;">${modes[i].label}</span>
            `;

            // Store angle for joystick aim comparison
            item.dataset.angle = angle.toString();
            wheel.appendChild(item);
            this._items.push(item);
        }

        // Thin spoke lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '420');
        svg.setAttribute('height', '420');
        svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
        for (let i = 0; i < N; i++) {
            const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
            const cx = 210, cy = 210;
            const x1 = cx + Math.cos(angle) * 42, y1 = cy + Math.sin(angle) * 42;
            const x2 = cx + Math.cos(angle) * (R - 44), y2 = cy + Math.sin(angle) * (R - 44);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1); line.setAttribute('y1', y1);
            line.setAttribute('x2', x2); line.setAttribute('y2', y2);
            line.setAttribute('stroke', 'rgba(255,255,255,0.08)');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }
        wheel.insertBefore(svg, center);

        document.body.appendChild(el);
        this._el = el;
        this._wheel = wheel;
        this._centerIcon  = centerIcon;
        this._centerLabel = centerLabel;
    }

    show(currentMode) {
        if (this.open) return;
        this.open = true;
        this._sel = currentMode;
        this._el.style.display = 'block';
        this._highlight(currentMode);
        // Exit pointer lock so mouse can aim
        if (document.pointerLockElement) document.exitPointerLock();
    }

    hide() {
        if (!this.open) return;
        this.open = false;
        this._el.style.display = 'none';
        if (this._sel) {
            this.game._setActiveMode(this._sel);
        }
        // Reacquire pointer lock
        setTimeout(() => {
            if (this.game.state === 'play') {
                this.game.renderer.domElement.requestPointerLock();
            }
        }, 80);
    }

    // Aim with joystick axes (lx, ly) — or call with (0,0) to keep current
    aimJoystick(lx, ly) {
        if (!this.open) return;
        const DEADZONE = 0.3;
        if (Math.hypot(lx, ly) < DEADZONE) return; // inside dead-zone — don't change
        const angle = Math.atan2(ly, lx);
        this._aimAngle(angle);
    }

    // Aim with mouse offset from screen centre
    aimMouse(screenX, screenY) {
        if (!this.open) return;
        const dx = screenX - window.innerWidth / 2;
        const dy = screenY - window.innerHeight / 2;
        if (Math.hypot(dx, dy) < 30) return;
        this._aimAngle(Math.atan2(dy, dx));
    }

    _aimAngle(angle) {
        const modes = this._modes();
        let best = 0, bestDist = Infinity;
        for (let i = 0; i < modes.length; i++) {
            const a = (i / modes.length) * Math.PI * 2 - Math.PI / 2;
            let diff = Math.abs(angle - a);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < bestDist) { bestDist = diff; best = i; }
        }
        this._highlight(modes[best].id);
    }

    _highlight(id) {
        this._sel = id;
        const modes = this._modes();
        const m     = modes.find(x => x.id === id);
        this._items.forEach(el => {
            const active = el.dataset.id === id;
            el.style.background     = active ? 'rgba(0,180,120,0.88)' : 'rgba(16,16,20,0.82)';
            el.style.borderColor    = active ? 'rgba(0,255,160,0.9)'  : 'rgba(255,255,255,0.18)';
            el.style.transform      = active ? 'scale(1.18)'          : 'scale(1)';
        });
        if (m) {
            this._centerIcon.textContent  = m.icon;
            this._centerLabel.textContent = m.label;
        }
    }
}
