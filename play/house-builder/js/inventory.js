const HAND_SLOT = 4; // center of 8-slot hotbar — always empty "hand"

class Inventory {
    constructor() {
        this.HOTBAR       = 8;
        this.TOTAL        = 40;
        this.slots        = new Array(this.TOTAL).fill(null);
        this.active       = HAND_SLOT; // start with hand selected
        this.open         = false;
        this.dragSrc      = null;
        this.focusedSlot  = 0;       // currently highlighted slot in modal (controller nav)
        this._lastEmptied = -1;      // hotbar slot last ejected — target for placeInHotbar()

        // Pre-fill with empty hotbar — items come from shop deliveries
        // Slot 4 stays null (hand)
        // Slot 4 stays null (hand)

        this._buildHotbar();
        this._buildModal();
        this.render();
    }

    _buildHotbar() {
        this.hotbarEl = document.getElementById('hotbar');
        for (let i = 0; i < this.HOTBAR; i++) {
            const s = document.createElement('div');
            s.className = 'hotbar-slot' + (i === HAND_SLOT ? ' hand-slot' : '');
            s.dataset.i = i;
            s.addEventListener('click', () => { this.active = i; this.render(); });
            this.hotbarEl.appendChild(s);
        }
    }

    _buildModal() {
        this.modal  = document.getElementById('inventory-modal');
        this.gridEl = document.getElementById('inventory-grid');

        for (let i = 0; i < this.TOTAL; i++) {
            const s = document.createElement('div');
            s.className = 'inv-slot';
            s.dataset.i = i;

            s.addEventListener('mousedown', (e) => {
                if (i === HAND_SLOT) return; // can't drag out of hand slot
                if (this.slots[i]) { this.dragSrc = i; e.preventDefault(); }
            });
            s.addEventListener('mouseup', () => {
                if (this.dragSrc !== null && this.dragSrc !== i && i !== HAND_SLOT) {
                    const tmp             = this.slots[i];
                    this.slots[i]         = this.slots[this.dragSrc];
                    this.slots[this.dragSrc] = tmp;
                    this.dragSrc          = null;
                    this.render();
                }
            });

            this.gridEl.appendChild(s);
        }

        document.getElementById('close-inventory').addEventListener('click', () => this.toggle());
    }

    render() {
        const slotHTML = (item, isHand) => {
            if (isHand) return '<span class="item-icon">✋</span><span class="item-name">Hand</span>';
            if (!item) return '';
            const qty = item.qty > 1 ? `<span class="item-qty">${item.qty}</span>` : '';
            return `<span class="item-icon">${item.def.icon}</span><span class="item-name">${item.def.name}</span>${qty}`;
        };

        // Hotbar
        this.hotbarEl.querySelectorAll('.hotbar-slot').forEach((el, i) => {
            el.innerHTML = slotHTML(this.slots[i], i === HAND_SLOT);
            el.classList.toggle('active', i === this.active);
        });

        // Modal grid
        this.gridEl.querySelectorAll('.inv-slot').forEach((el, i) => {
            el.innerHTML = slotHTML(this.slots[i], i === HAND_SLOT);
            el.classList.toggle('hand-slot', i === HAND_SLOT);
            el.classList.toggle('hotbar-item', i < this.HOTBAR);
            el.classList.toggle('focused', this.open && i === this.focusedSlot);
        });
    }

    toggle() {
        this.open = !this.open;
        this.modal.style.display = this.open ? 'flex' : 'none';
        if (this.open) {
            // Default focus to first non-hand hotbar slot that has an item, else slot 0
            const start = this.active !== HAND_SLOT ? this.active : 0;
            this.focusedSlot = start;
            this.render();
        }
    }

    prevSlot() {
        this.active = (this.active - 1 + this.HOTBAR) % this.HOTBAR;
        this.render();
    }
    nextSlot() {
        this.active = (this.active + 1) % this.HOTBAR;
        this.render();
    }

    // ── CONTROLLER INVENTORY MANAGEMENT ──────────────────────────────────────

    // Move focus by dx (±1 col) or dy (±1 row = ±8 slots)
    navFocus(dx, dy) {
        let next = this.focusedSlot + dx + dy * 8;
        next = Math.max(0, Math.min(this.TOTAL - 1, next));
        if (next === HAND_SLOT) next += dx || (dy > 0 ? 1 : -1); // skip hand slot
        next = Math.max(0, Math.min(this.TOTAL - 1, next));
        this.focusedSlot = next;
        this.render();
    }

    // Cross pressed in inventory:
    //   focused hotbar slot → eject item to inventory
    //   focused inventory slot → pull item to hotbar
    crossFocused() {
        const i = this.focusedSlot;
        if (i === HAND_SLOT || !this.slots[i]) return;

        if (i < this.HOTBAR) {
            // ── EJECT from hotbar → first empty inventory slot ──
            for (let t = this.HOTBAR; t < this.TOTAL; t++) {
                if (!this.slots[t]) {
                    this.slots[t]  = this.slots[i];
                    this.slots[i]  = null;
                    this._lastEmptied = i;
                    if (this.active === i) this.active = HAND_SLOT;
                    this.render();
                    return;
                }
            }
        } else {
            // ── PULL from inventory → empty hotbar slot ──
            // Prefer the last-emptied slot if it's still free
            let target = -1;
            if (this._lastEmptied >= 0 && this._lastEmptied !== HAND_SLOT && !this.slots[this._lastEmptied]) {
                target = this._lastEmptied;
            } else {
                for (let t = 0; t < this.HOTBAR; t++) {
                    if (t !== HAND_SLOT && !this.slots[t]) { target = t; break; }
                }
            }
            if (target < 0) return; // hotbar full
            this.slots[target]    = this.slots[i];
            this.slots[i]         = null;
            this._lastEmptied     = -1;
            this.render();
        }
    }

    // Returns null when hand slot is active so nothing is placed/shown
    activeItem() {
        if (this.active === HAND_SLOT) return null;
        return this.slots[this.active] || null;
    }

    addItem(def) {
        // Stack onto existing slot with same def
        for (let i = 0; i < this.TOTAL; i++) {
            if (i === HAND_SLOT) continue;
            if (this.slots[i]?.def.id === def.id) {
                this.slots[i].qty++;
                this.render();
                return true;
            }
        }
        // Otherwise find empty slot
        for (let i = 0; i < this.TOTAL; i++) {
            if (i === HAND_SLOT) continue;
            if (!this.slots[i]) { this.slots[i] = { def, qty: 1 }; this.render(); return true; }
        }
        return false;
    }

    // Decrease qty of active slot by 1; remove slot if depleted
    consumeActive() {
        const i = this.active;
        if (i === HAND_SLOT || !this.slots[i]) return;
        this.slots[i].qty--;
        if (this.slots[i].qty <= 0) {
            this.slots[i] = null;
            this.active = HAND_SLOT;
        }
        this.render();
    }

    // Decrease qty at a specific slot index
    consumeAt(i) {
        if (i === HAND_SLOT || !this.slots[i]) return;
        this.slots[i].qty--;
        if (this.slots[i].qty <= 0) {
            this.slots[i] = null;
            if (this.active === i) this.active = HAND_SLOT;
        }
        this.render();
    }
}
