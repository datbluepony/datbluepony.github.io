// ── PROCEDURAL AUDIO MANAGER ─────────────────────────────────────────────────
// All sounds generated via Web Audio API — no external files required.
// Minecraft-style ambient soundtrack + game SFX.

class AudioManager {
    constructor() {
        this.ctx         = null;
        this.masterGain  = null;
        this.musicGain   = null;
        this.sfxGain     = null;
        this.reverb      = null;
        this._dryBus     = null;
        this._wetBus     = null;
        this._initialized = false;

        // Step timer
        this._stepTimer   = 0;
        this._stepInterval = 0.42; // seconds between footsteps while moving
        this._isMoving    = false;

        // Music sequencer
        this._nextGroupAt = 0;   // audio ctx time for next note group
        this._lastNoteFreq = 0;

        // Pentatonic scale, 3 octaves (C3–A5)
        this._scale = [
            130.81, 146.83, 164.81, 196.00, 220.00,
            261.63, 293.66, 329.63, 392.00, 440.00,
            523.25, 587.33, 659.25, 784.00, 880.00,
        ];

        // C minor pentatonic (C2–C6 range)
        this._scaleMinor = [
            130.81, 155.56, 185.00, 220.00, 261.63,
            311.13, 370.00, 440.00, 523.25,
        ];

        // Ambient bird sequencer
        this._nextAmbientAt = 0;
    }

    // ── INIT ─────────────────────────────────────────────────────────────────

    _init() {
        if (this._initialized) return;
        this._initialized = true;

        this.ctx        = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.65;
        this.masterGain.connect(this.ctx.destination);

        // Music bus (quieter)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.55;
        this.musicGain.connect(this.masterGain);

        // SFX bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1.0;
        this.sfxGain.connect(this.masterGain);

        // Reverb (long hall — 3 s)
        this.reverb    = this._makeReverb(3.0, 0.3);
        this._wetBus   = this.ctx.createGain();
        this._wetBus.gain.value = 0.35;
        this.reverb.connect(this._wetBus);
        this._wetBus.connect(this.musicGain);

        // Schedule first note group at T+2 (give scene time to load)
        this._nextGroupAt = this.ctx.currentTime + 2;

        // First ambient bird call: 5–15 s after init
        this._nextAmbientAt = this.ctx.currentTime + 5 + Math.random() * 10;
    }

    _ensureInit() {
        if (!this._initialized) this._init();
    }

    // ── REVERB ───────────────────────────────────────────────────────────────

    _makeReverb(duration, decay) {
        const sr  = this.ctx.sampleRate;
        const len = Math.floor(sr * duration);
        const buf = this.ctx.createBuffer(2, len, sr);
        for (let c = 0; c < 2; c++) {
            const d = buf.getChannelData(c);
            for (let i = 0; i < len; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
            }
        }
        const node   = this.ctx.createConvolver();
        node.buffer  = buf;
        return node;
    }

    // ── MUSIC ────────────────────────────────────────────────────────────────

    _playNote(freq, when, dur, vol = 0.22, addReverb = true) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const env  = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.value = freq;
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2.005; // slight upper octave for shimmer

        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.value = 0.18;
        osc2.connect(osc2Gain);
        osc2Gain.connect(env);
        osc1.connect(env);

        // Piano-like ADSR: fast attack, long soft decay, near-zero sustain
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(vol, when + 0.012);
        env.gain.exponentialRampToValueAtTime(vol * 0.25, when + 0.15);
        env.gain.exponentialRampToValueAtTime(vol * 0.08, when + dur * 0.6);
        env.gain.exponentialRampToValueAtTime(0.0001, when + dur);

        env.connect(this.musicGain);
        if (addReverb) env.connect(this.reverb);

        osc1.start(when); osc1.stop(when + dur + 0.05);
        osc2.start(when); osc2.stop(when + dur + 0.05);
    }

    _playBassDrone(freq, when, dur) {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq / 2; // one octave down

        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(0.1, when + 0.06);
        env.gain.exponentialRampToValueAtTime(0.04, when + 0.5);
        env.gain.exponentialRampToValueAtTime(0.0001, when + dur);

        osc.connect(env);
        env.connect(this.musicGain);
        env.connect(this.reverb);
        osc.start(when); osc.stop(when + dur + 0.1);
    }

    // Play a 3-note chord held with heavy reverb (Minecraft moment)
    _playMinecraftMoment(at, scale) {
        // Root, minor third (or major third), fifth — built from a random root in scale
        const rootIdx = Math.floor(Math.random() * (scale.length - 4));
        const root    = scale[rootIdx];
        // Find approximate thirds/fifth via frequency ratios
        const third   = root * 1.189; // ~minor third
        const fifth   = root * 1.498; // ~perfect fifth
        const dur     = 3.0 + Math.random() * 1.0;
        const vol     = 0.08;

        // Heavy reverb send
        const heavyReverb = this._makeReverb(4.0, 0.15);
        heavyReverb.connect(this._wetBus);

        [root, third, fifth].forEach(freq => {
            const osc = this.ctx.createOscillator();
            const env = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            env.gain.setValueAtTime(0, at);
            env.gain.linearRampToValueAtTime(vol, at + 0.02);
            env.gain.exponentialRampToValueAtTime(vol * 0.6, at + 0.3);
            env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
            osc.connect(env);
            env.connect(this.musicGain);
            env.connect(heavyReverb);
            osc.start(at); osc.stop(at + dur + 0.1);
        });
    }

    _scheduleNoteGroup() {
        const now  = this.ctx.currentTime;
        const at   = this._nextGroupAt;

        // Randomly choose between major pentatonic and C minor pentatonic
        const scale = Math.random() < 0.5 ? this._scale : this._scaleMinor;

        // 30% chance: Minecraft moment (3-note chord, heavy reverb)
        if (Math.random() < 0.30) {
            this._playMinecraftMoment(at, scale);
            const gap = 4.0 + Math.random() * 5.0;
            this._nextGroupAt = at + 3.5 + gap;
            return;
        }

        // Pick 2–4 notes from scale (prefer stepwise motion from last note)
        const count = 2 + Math.floor(Math.random() * 3);
        let   t     = at;
        let   prev  = scale.indexOf(this._lastNoteFreq);
        if (prev < 0) prev = Math.floor(scale.length * 0.4); // default to mid region

        for (let i = 0; i < count; i++) {
            // Weight toward notes near prev (±3 steps)
            const lo  = Math.max(0, prev - 3);
            const hi  = Math.min(scale.length - 1, prev + 3);
            let   idx = lo + Math.floor(Math.random() * (hi - lo + 1));
            if (Math.random() < 0.15) idx = Math.floor(Math.random() * scale.length); // occasional jump

            const freq = scale[idx];
            const dur  = 1.5 + Math.random() * 2.5;
            const vol  = 0.14 + Math.random() * 0.12;
            this._playNote(freq, t, dur, vol);

            // Occasionally add a supporting bass note
            if (Math.random() < 0.3) {
                this._playBassDrone(freq, t, dur * 1.2);
            }

            prev = idx;
            t   += 0.28 + Math.random() * 0.45;
        }

        this._lastNoteFreq = scale[prev] || 261.63;

        // Gap until next group: 3–9 seconds of silence (Minecraft feel)
        const gap = 3.0 + Math.random() * 6.0;
        this._nextGroupAt = t + gap;
    }

    // ── AMBIENT BIRDS / NATURE ────────────────────────────────────────────────

    _scheduleAmbient() {
        const now = this.ctx.currentTime;
        const at  = now + 0.05; // slight lookahead buffer

        // Pick one of 3 bird call types
        const type = Math.floor(Math.random() * 3);

        if (type === 0) {
            // Quick ascending trill: 3–4 fast tones at 2000–4000 Hz, each 0.06 s
            const count   = 3 + Math.floor(Math.random() * 2);
            const baseHz  = 2000 + Math.random() * 1000;
            const stepHz  = 200 + Math.random() * 300;
            for (let i = 0; i < count; i++) {
                const freq = baseHz + stepHz * i;
                const t    = at + i * 0.065;
                const osc  = this.ctx.createOscillator();
                const env  = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                env.gain.setValueAtTime(0, t);
                env.gain.linearRampToValueAtTime(0.10, t + 0.008);
                env.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
                osc.connect(env); env.connect(this.sfxGain);
                osc.start(t); osc.stop(t + 0.07);
            }

        } else if (type === 1) {
            // Single flute whistle: sine sliding 1200→1800 Hz over 0.3 s
            const osc = this.ctx.createOscillator();
            const env = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, at);
            osc.frequency.linearRampToValueAtTime(1800, at + 0.3);
            env.gain.setValueAtTime(0, at);
            env.gain.linearRampToValueAtTime(0.09, at + 0.04);
            env.gain.setValueAtTime(0.09, at + 0.22);
            env.gain.exponentialRampToValueAtTime(0.0001, at + 0.30);
            osc.connect(env); env.connect(this.sfxGain);
            osc.start(at); osc.stop(at + 0.35);

        } else {
            // Two-note call: 2 tones at ratio ~1.33, each 0.15 s
            const f1 = 1400 + Math.random() * 600;
            const f2 = f1 * 1.33;
            [f1, f2].forEach((freq, i) => {
                const t   = at + i * 0.17;
                const osc = this.ctx.createOscillator();
                const env = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                env.gain.setValueAtTime(0, t);
                env.gain.linearRampToValueAtTime(0.10, t + 0.01);
                env.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
                osc.connect(env); env.connect(this.sfxGain);
                osc.start(t); osc.stop(t + 0.18);
            });
        }

        // Schedule next call: 8–25 seconds from now
        this._nextAmbientAt = now + 8 + Math.random() * 17;
    }

    // ── TICK (call every frame, dt in seconds) ────────────────────────────────

    tick(dt, isMoving) {
        if (!this._initialized) return;

        const now = this.ctx.currentTime;

        // Music sequencer
        if (now >= this._nextGroupAt - 0.1) {
            this._scheduleNoteGroup();
        }

        // Ambient bird/nature sounds
        if (now >= this._nextAmbientAt) {
            this._scheduleAmbient();
        }

        // Footsteps
        this._isMoving = isMoving;
        if (isMoving) {
            this._stepTimer += dt;
            if (this._stepTimer >= this._stepInterval) {
                this._stepTimer = 0;
                this.playStep('grass');
            }
        } else {
            this._stepTimer = 0;
        }
    }

    // ── SOUND EFFECTS ─────────────────────────────────────────────────────────

    _noise(dur, lpFreq, hpFreq, vol, when) {
        const sr   = this.ctx.sampleRate;
        const len  = Math.floor(sr * dur);
        const buf  = this.ctx.createBuffer(1, len, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.8);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        let node = src;
        if (lpFreq) {
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = lpFreq;
            src.connect(lp); node = lp;
        }
        if (hpFreq) {
            const hp = this.ctx.createBiquadFilter();
            hp.type = 'highpass'; hp.frequency.value = hpFreq;
            node.connect(hp); node = hp;
        }

        const gain = this.ctx.createGain();
        gain.gain.value = vol;
        node.connect(gain);
        gain.connect(this.sfxGain);

        src.start(when); src.stop(when + dur + 0.05);
        return gain;
    }

    _tone(freq, type, dur, vol, attack, when) {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(vol, when + attack);
        env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(when); osc.stop(when + dur + 0.05);
    }

    // ── FOOTSTEPS ───────────────────────────────────────────────────────────
    playStep(surface) {
        this._ensureInit();
        const now = this.ctx.currentTime;
        switch (surface) {
            case 'concrete':
            case 'brick':
                // Harder click
                this._noise(0.06, 2200, 800, 0.18, now);
                this._tone(120, 'sine', 0.05, 0.08, 0.002, now);
                break;
            case 'gravel':
                // Crunchy scatter
                this._noise(0.12, 3000, 500, 0.22, now);
                this._noise(0.08, 5000, 2000, 0.10, now + 0.02);
                break;
            case 'dirt':
                // Soft thump
                this._noise(0.09, 900, 100, 0.20, now);
                this._tone(90, 'sine', 0.06, 0.07, 0.003, now);
                break;
            case 'stone':
                // Light stone tap
                this._noise(0.07, 2800, 600, 0.16, now);
                this._tone(180, 'sine', 0.06, 0.06, 0.002, now);
                break;
            default: // grass
                // Soft swish
                this._noise(0.10, 800, 200, 0.14, now);
                this._noise(0.06, 4000, 1500, 0.06, now + 0.01);
                break;
        }
    }

    // ── PLACE (generic object placed — lighter wooden thud) ──────────────────
    playObjectPlace() {
        this._ensureInit();
        const now = this.ctx.currentTime;
        // Short wooden thud / block place
        this._noise(0.08, 600, 80, 0.35, now);
        this._tone(160, 'sine', 0.12, 0.18, 0.003, now);
        this._tone(240, 'sine', 0.08, 0.08, 0.003, now + 0.01);
    }

    // Alias — kept for backwards compatibility
    playPlace() { this.playObjectPlace(); }

    // ── WALL PLACE (heavy 2x4 hammer thud) ───────────────────────────────────
    playWallPlace() {
        this._ensureInit();
        const now = this.ctx.currentTime;

        // Deep bass body: 80–150 Hz noise burst — mass of the wood
        const sr  = this.ctx.sampleRate;
        const len = Math.floor(sr * 0.18);
        const buf = this.ctx.createBuffer(1, len, sr);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 150;
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 80;
        const bassGain = this.ctx.createGain();
        bassGain.gain.value = 0.55;
        src.connect(lp); lp.connect(hp); hp.connect(bassGain);
        bassGain.connect(this.sfxGain);
        src.start(now); src.stop(now + 0.22);

        // 120 Hz thud tone — fundamental resonance of the stud
        this._tone(120, 'sine', 0.22, 0.30, 0.002, now);

        // Mid-range crack transient — fibres splitting
        this._noise(0.05, 2800, 600, 0.28, now);

        // Long reverb tail — room body
        const revSrc = this.ctx.createBufferSource();
        revSrc.buffer = buf;
        const revLp = this.ctx.createBiquadFilter();
        revLp.type = 'lowpass'; revLp.frequency.value = 300;
        const revGain = this.ctx.createGain();
        revGain.gain.value = 0.25;
        revSrc.connect(revLp); revLp.connect(revGain);
        revGain.connect(this.reverb);
        revSrc.start(now); revSrc.stop(now + 0.22);
    }

    // ── FLOOR PLACE (tile/flooring slap) ─────────────────────────────────────
    playFloorPlace() {
        this._ensureInit();
        const now = this.ctx.currentTime;

        // Sharp mid click — tile hitting surface (600–1200 Hz)
        this._noise(0.04, 1200, 600, 0.40, now);

        // Brief wood/tile resonance body
        this._tone(800, 'sine', 0.10, 0.12, 0.001, now);
        this._tone(600, 'sine', 0.14, 0.08, 0.002, now + 0.005);

        // Short sub thump — mass of tile landing
        this._noise(0.06, 300, 60, 0.22, now);
    }

    // ── CHEST OPEN (heavy lid creaking open) ──────────────────────────────────
    playChestOpen() {
        this._ensureInit();
        const now = this.ctx.currentTime;
        const dur = 0.8;

        // Bandpass swept noise: straining wood fibres 200→600 Hz over dur
        const sr  = this.ctx.sampleRate;
        const len = Math.floor(sr * dur);
        const buf = this.ctx.createBuffer(1, len, sr);
        const d   = buf.getChannelData(0);
        // Bell-shaped envelope — strain builds then eases at top
        for (let i = 0; i < len; i++) {
            const t = i / len;
            d[i] = (Math.random() * 2 - 1) * (0.3 + Math.sin(t * Math.PI) * 0.7);
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        // Bandpass that sweeps up as lid opens wider
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 5;
        bp.frequency.setValueAtTime(200, now);
        bp.frequency.linearRampToValueAtTime(600, now + dur * 0.85);

        // Second harmonic creak layer
        const bp2 = this.ctx.createBiquadFilter();
        bp2.type = 'bandpass';
        bp2.Q.value = 8;
        bp2.frequency.setValueAtTime(400, now);
        bp2.frequency.linearRampToValueAtTime(1100, now + dur * 0.85);

        const g1 = this.ctx.createGain(); g1.gain.value = 0.32;
        const g2 = this.ctx.createGain(); g2.gain.value = 0.14;

        src.connect(bp);  bp.connect(g1);  g1.connect(this.sfxGain);
        src.connect(bp2); bp2.connect(g2); g2.connect(this.sfxGain);

        src.start(now); src.stop(now + dur + 0.05);

        // Soft thud at end — lid hitting the back stop
        const thudAt = now + dur * 0.92;
        this._noise(0.07, 400, 80, 0.22, thudAt);
        this._tone(100, 'sine', 0.10, 0.10, 0.002, thudAt);
    }

    // ── CHEST CLOSE (lid slamming shut) ──────────────────────────────────────
    playChestClose() {
        this._ensureInit();
        const now = this.ctx.currentTime;

        // Short creak as lid starts falling
        const sr   = this.ctx.sampleRate;
        const len  = Math.floor(sr * 0.18);
        const buf  = this.ctx.createBuffer(1, len, sr);
        const d    = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
            const t = i / len;
            d[i] = (Math.random() * 2 - 1) * (1 - t);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.Q.value = 5;
        bp.frequency.setValueAtTime(500, now);
        bp.frequency.linearRampToValueAtTime(250, now + 0.18);
        const cg = this.ctx.createGain(); cg.gain.value = 0.18;
        src.connect(bp); bp.connect(cg); cg.connect(this.sfxGain);
        src.start(now); src.stop(now + 0.22);

        // HEAVY wooden slam — low noise burst 200–400 Hz
        const slamAt = now + 0.16;
        const sLen   = Math.floor(sr * 0.14);
        const sBuf   = this.ctx.createBuffer(1, sLen, sr);
        const sd     = sBuf.getChannelData(0);
        for (let i = 0; i < sLen; i++) {
            sd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sLen, 2.5);
        }
        const sSrc = this.ctx.createBufferSource();
        sSrc.buffer = sBuf;
        const slp = this.ctx.createBiquadFilter();
        slp.type = 'lowpass'; slp.frequency.value = 400;
        const shp = this.ctx.createBiquadFilter();
        shp.type = 'highpass'; shp.frequency.value = 200;
        const sg = this.ctx.createGain(); sg.gain.value = 0.50;
        sSrc.connect(slp); slp.connect(shp); shp.connect(sg);
        sg.connect(this.sfxGain);
        // Also feed reverb for body
        const sgRev = this.ctx.createGain(); sgRev.gain.value = 0.20;
        shp.connect(sgRev); sgRev.connect(this.reverb);
        sSrc.start(slamAt); sSrc.stop(slamAt + 0.18);

        // Sub body thud tone
        this._tone(90, 'sine', 0.18, 0.25, 0.002, slamAt);

        // Latch click at the very end
        this._noise(0.035, 3500, 1000, 0.22, slamAt + 0.08);
    }

    // ── MODE SWITCH (quick UI swoosh) ─────────────────────────────────────────
    playModeSwitch() {
        this._ensureInit();
        const now = this.ctx.currentTime;

        // Rising sine tone 200→500 Hz over 0.12 s
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.12);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.22, now + 0.015);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(env); env.connect(this.sfxGain);
        osc.start(now); osc.stop(now + 0.18);

        // Soft noise hit — air swoosh texture
        this._noise(0.08, 4000, 800, 0.12, now + 0.02);
    }

    // ── PICK UP (object picked up) ───────────────────────────────────────────
    playPickup() {
        this._ensureInit();
        const now = this.ctx.currentTime;

        // Small pop at start — very short high-freq noise burst
        this._noise(0.02, 4000, 2500, 0.18, now);

        // Short ascending two-tone chime (starts just after the pop)
        this._tone(523.25, 'sine', 0.18, 0.22, 0.005, now + 0.015);
        this._tone(783.99, 'sine', 0.14, 0.18, 0.005, now + 0.105);
    }

    // ── DOOR (open / close) — woody creak, no electronic tone ───────────────
    playDoor(opening) {
        this._ensureInit();
        const now = this.ctx.currentTime;
        if (opening) {
            // Hinge creak: band-pass filtered noise that slides up in pitch
            // (simulates wood fibres straining as door swings)
            const sr   = this.ctx.sampleRate;
            const dur  = 0.55;
            const len  = Math.floor(sr * dur);
            const buf  = this.ctx.createBuffer(1, len, sr);
            const data = buf.getChannelData(0);
            // Shaped noise — louder in middle of swing
            for (let i = 0; i < len; i++) {
                const t    = i / len;
                const env  = Math.sin(t * Math.PI); // bell shape
                data[i]    = (Math.random() * 2 - 1) * env;
            }
            const src = this.ctx.createBufferSource();
            src.buffer = buf;

            // Band-pass that sweeps from ~300 Hz → ~800 Hz (door swinging)
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 4;
            bp.frequency.setValueAtTime(300, now);
            bp.frequency.linearRampToValueAtTime(800, now + dur * 0.6);
            bp.frequency.linearRampToValueAtTime(500, now + dur);

            // Second harmonic creak layer
            const bp2 = this.ctx.createBiquadFilter();
            bp2.type = 'bandpass';
            bp2.Q.value = 6;
            bp2.frequency.setValueAtTime(600, now);
            bp2.frequency.linearRampToValueAtTime(1400, now + dur);

            const gain1 = this.ctx.createGain(); gain1.gain.value = 0.30;
            const gain2 = this.ctx.createGain(); gain2.gain.value = 0.12;
            src.connect(bp);  bp.connect(gain1);  gain1.connect(this.sfxGain);
            src.connect(bp2); bp2.connect(gain2); gain2.connect(this.sfxGain);

            // Light latch click at the start
            this._noise(0.04, 3000, 800, 0.22, now);

            src.start(now + 0.03);
            src.stop(now + dur + 0.05);
        } else {
            // Close: short creak then solid wooden thud
            this._noise(0.18, 900, 200, 0.18, now);

            // Thud — low-freq noise burst (wood hitting frame)
            const sr   = this.ctx.sampleRate;
            const len  = Math.floor(sr * 0.14);
            const buf  = this.ctx.createBuffer(1, len, sr);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/len, 2);
            }
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 380;
            const g  = this.ctx.createGain(); g.gain.value = 0.45;
            src.connect(lp); lp.connect(g); g.connect(this.sfxGain);
            src.start(now + 0.16);
            src.stop(now + 0.32);

            // Latch click at the end
            this._noise(0.035, 3500, 1000, 0.20, now + 0.28);
        }
    }

    // ── PAINT GUN SPRAY ──────────────────────────────────────────────────────
    playPaintSpray() {
        this._ensureInit();
        const now = this.ctx.currentTime;
        // Short hiss
        this._noise(0.14, 8000, 1200, 0.18, now);
        this._tone(3800, 'sine', 0.10, 0.04, 0.01, now);
    }

    // ── PATH POINT PLACED ────────────────────────────────────────────────────
    playPathPoint() {
        this._ensureInit();
        const now = this.ctx.currentTime;
        // Soft click
        this._noise(0.04, 2000, 400, 0.18, now);
        this._tone(660, 'sine', 0.08, 0.10, 0.003, now);
    }

    // ── PATH FINISHED ────────────────────────────────────────────────────────
    playPathFinish() {
        this._ensureInit();
        const now = this.ctx.currentTime;
        // Small ascending flourish
        [392, 523, 659].forEach((f, i) => {
            this._tone(f, 'sine', 0.18, 0.14, 0.005, now + i * 0.08);
        });
    }

    // ── RAY GUN SOUNDS ───────────────────────────────────────────────────────

    // Called when the paint gun is equipped
    playGunEquip() {
        this._ensureInit();
        const now = this.ctx.currentTime;
        // Sci-fi power-up: rising pitch sweep + harmonic shimmer
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const env  = this.ctx.createGain();
        osc1.type  = 'sawtooth';
        osc2.type  = 'sine';
        osc1.frequency.setValueAtTime(120, now);
        osc1.frequency.exponentialRampToValueAtTime(680, now + 0.38);
        osc2.frequency.setValueAtTime(240, now);
        osc2.frequency.exponentialRampToValueAtTime(1360, now + 0.38);
        const g2 = this.ctx.createGain(); g2.gain.value = 0.3;
        osc2.connect(g2); g2.connect(env);
        osc1.connect(env);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.28, now + 0.06);
        env.gain.setValueAtTime(0.28, now + 0.28);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.50);
        env.connect(this.sfxGain);
        env.connect(this.reverb);
        osc1.start(now); osc1.stop(now + 0.55);
        osc2.start(now); osc2.stop(now + 0.55);

        // Noise burst overlay
        this._noise(0.25, 4000, 800, 0.12, now);
    }

    // Called on each ray gun shot
    playGunFire() {
        this._ensureInit();
        const now = this.ctx.currentTime;

        // Core zap: downward freq sweep (energy discharge)
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
        env.gain.setValueAtTime(0.42, now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
        osc.connect(env); env.connect(this.sfxGain);
        osc.start(now); osc.stop(now + 0.35);

        // Sub thump
        this._tone(80, 'sine', 0.18, 0.28, 0.004, now);

        // High-freq crackle
        this._noise(0.20, 9000, 3000, 0.20, now);
        this._noise(0.12, 2000, 400,  0.16, now + 0.02);

        // Reverb send for space
        const osc2 = this.ctx.createOscillator();
        const env2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(900, now);
        osc2.frequency.exponentialRampToValueAtTime(220, now + 0.3);
        env2.gain.setValueAtTime(0.15, now);
        env2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc2.connect(env2); env2.connect(this.reverb);
        osc2.start(now); osc2.stop(now + 0.4);
    }

    // Called when reload animation finishes (gun is ready again)
    playGunReload() {
        this._ensureInit();
        const now = this.ctx.currentTime;
        // Mechanical click + energy charge-up hum
        this._noise(0.06, 3000, 600, 0.30, now);
        this._tone(220, 'sine', 0.12, 0.12, 0.005, now);

        // Rising energy hum
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);
        env.gain.setValueAtTime(0, now + 0.06);
        env.gain.linearRampToValueAtTime(0.18, now + 0.15);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        osc.connect(env); env.connect(this.sfxGain);
        osc.start(now + 0.06); osc.stop(now + 0.5);
    }

    // ── DRONE HUM (continuous, proximity-based) ───────────────────────────────
    startDroneLoop() {
        if (!this._initialized || this._droneGain) return;
        const ctx = this.ctx;

        // Master gain for volume control
        this._droneGain = ctx.createGain();
        this._droneGain.gain.value = 0;
        this._droneGain.connect(this.sfxGain);

        // Throttle state: 0=idle, 1=full. Default hover.
        this._droneThrottle = 0.55;
        this._droneOscs = [];

        // === 4 motor oscillators — sawtooth for that prop-chop character ===
        // Motor base RPM range: idle≈8000 RPM, full≈28000 RPM
        // Audible freq = RPM/60 * num_poles/2 ≈ RPM/60 * 7 (typical 14-pole motor)
        // At hover (0.55 throttle): ~110-130 Hz motor fundamental
        // Each motor is slightly detuned (as in real quads — not all identical)
        const motorOffsets = [-3, 0, 4, 7]; // Hz detune per motor
        this._motorOscs = motorOffsets.map(offset => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 120 + offset;

            // Blade pass: 4 blades × motor freq (strong harmonic)
            const blade = ctx.createOscillator();
            blade.type = 'sawtooth';
            blade.frequency.value = (120 + offset) * 4;

            const bladeGain = ctx.createGain();
            bladeGain.gain.value = 0.18;

            // Bandpass centered on blade freq for that prop chop tone
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 500;
            bp.Q.value = 1.4;

            const motorGain = ctx.createGain();
            motorGain.gain.value = 0.12;

            osc.connect(bp);
            bp.connect(motorGain);
            motorGain.connect(this._droneGain);

            blade.connect(bladeGain);
            bladeGain.connect(this._droneGain);

            osc.start(); blade.start();
            this._droneOscs.push(blade);
            return { osc, blade, bp, offset };
        });

        this._motorOscs.forEach(m => this._droneOscs.push(m.osc));

        // Air noise — broadband propeller turbulence
        const bufLen = ctx.sampleRate * 1.5;
        const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) nd[i] = Math.random() * 2 - 1;
        this._droneNoiseSrc = ctx.createBufferSource();
        this._droneNoiseSrc.buffer = noiseBuf;
        this._droneNoiseSrc.loop = true;

        const nhp = ctx.createBiquadFilter();
        nhp.type = 'highpass'; nhp.frequency.value = 800;
        const nlp = ctx.createBiquadFilter();
        nlp.type = 'lowpass'; nlp.frequency.value = 3500;
        const ng = ctx.createGain(); ng.gain.value = 0.07;
        this._droneNoiseSrc.connect(nhp); nhp.connect(nlp); nlp.connect(ng);
        ng.connect(this._droneGain);
        this._droneNoiseSrc.start();
        this._droneNoiseGain = ng;

        // Apply current throttle immediately
        this._applyDroneThrottle(this._droneThrottle, true);
    }

    // Set throttle 0-1 and ramp motor frequencies to match
    setDroneThrottle(throttle, instant = false) {
        if (!this._motorOscs) return;
        this._droneThrottle = throttle;
        this._applyDroneThrottle(throttle, instant);
    }

    _applyDroneThrottle(t, instant = false) {
        if (!this._motorOscs) return;
        const ctx = this.ctx;
        const tau = instant ? 0.001 : 0.6;
        // Motor freq: 80 Hz at idle → 260 Hz at full throttle
        const baseFreq = 80 + t * 180;
        this._motorOscs.forEach(({ osc, blade, bp, offset }) => {
            const mf = baseFreq + offset;
            const bf = mf * 4;
            osc.frequency.setTargetAtTime(mf, ctx.currentTime, tau);
            blade.frequency.setTargetAtTime(bf, ctx.currentTime, tau);
            bp.frequency.setTargetAtTime(mf * 4.2, ctx.currentTime, tau);
        });
        // Noise rises with throttle
        if (this._droneNoiseGain) {
            this._droneNoiseGain.gain.setTargetAtTime(0.04 + t * 0.1, ctx.currentTime, tau);
        }
    }

    setDroneVolume(vol) {
        if (!this._droneGain) return;
        this._droneGain.gain.setTargetAtTime(
            Math.max(0, Math.min(0.5, vol)), this.ctx.currentTime, 0.12
        );
    }

    stopDroneLoop() {
        if (!this._droneGain) return;
        const oscs = this._droneOscs;
        const noise = this._droneNoiseSrc;
        const gain  = this._droneGain;
        this._droneOscs    = null;
        this._droneGain    = null;
        this._motorOscs    = null;
        this._droneNoiseSrc = null;
        gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
        setTimeout(() => {
            oscs?.forEach(o => { try { o.stop(); } catch(e) {} });
            try { noise?.stop(); } catch(e) {}
            try { gain.disconnect(); } catch(e) {}
        }, 2500);
    }

    // ── VOLUME HELPERS ────────────────────────────────────────────────────────
    setMasterVol(v)  { if (this.masterGain) this.masterGain.gain.value = v; }
    setMusicVol(v)   { if (this.musicGain)  this.musicGain.gain.value = v;  }
    setSfxVol(v)     { if (this.sfxGain)    this.sfxGain.gain.value = v;    }

    // Must be called after a user gesture (browser autoplay policy)
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
}
