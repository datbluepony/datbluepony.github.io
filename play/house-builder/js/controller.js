class GameController {
    constructor() {
        this.gamepad = null;
        this.prevButtons = [];
        this.currButtons = [];
        this.deadzone = 0.18;
        this.connected = false;

        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
            this.connected = true;
            console.log('PS5 Controller connected:', e.gamepad.id);
            document.querySelector('.status-dot')?.classList.add('connected');
            document.querySelector('#controller-status span:last-child').textContent = 'PS5 Controller';
        });

        window.addEventListener('gamepaddisconnected', () => {
            this.connected = false;
            document.querySelector('.status-dot')?.classList.remove('connected');
            document.querySelector('#controller-status span:last-child').textContent = 'No Controller';
        });
    }

    update() {
        const pads = navigator.getGamepads();
        for (let p of pads) {
            if (p && p.connected) { this.gamepad = p; break; }
        }

        if (!this.gamepad) { this.prevButtons = []; this.currButtons = []; return; }

        this.prevButtons = [...this.currButtons];
        this.currButtons = Array.from(this.gamepad.buttons).map(b =>
            typeof b === 'object' ? (b.pressed || b.value > 0.5) : b > 0.5
        );
    }

    axis(i) {
        if (!this.gamepad || !this.gamepad.axes[i]) return 0;
        const v = this.gamepad.axes[i];
        return Math.abs(v) > this.deadzone ? v : 0;
    }

    held(i)      { return this.currButtons[i] === true; }
    just(i)      { return this.currButtons[i] === true && this.prevButtons[i] !== true; }
    released(i)  { return this.currButtons[i] !== true && this.prevButtons[i] === true; }

    // Sticks
    get lx()  { return this.axis(0); }
    get ly()  { return this.axis(1); }
    get rx()  { return this.axis(2); }
    get ry()  { return this.axis(3); }

    // Buttons — DS4Windows XInput mapping
    get cross()     { return this.held(0); }
    get circle()    { return this.held(1); }
    get square()    { return this.held(2); }
    get triangle()  { return this.held(3); }
    get L1()        { return this.held(4); }
    get R1()        { return this.held(5); }
    get L2()        { return this.held(6) || Math.abs(this.axis(4)) > 0.5; }
    get R2()        { return this.held(7) || Math.abs(this.axis(5)) > 0.5; }
    get options()   { return this.held(9); }
    get L3()        { return this.held(10); }
    get R3()        { return this.held(11); }
    get dUp()       { return this.held(12); }
    get dDown()     { return this.held(13); }
    get dLeft()     { return this.held(14); }
    get dRight()    { return this.held(15); }

    // Just-pressed versions
    get jCross()    { return this.just(0); }
    get jCircle()   { return this.just(1); }
    get jSquare()   { return this.just(2); }
    get jTriangle() { return this.just(3); }
    get jL1()       { return this.just(4); }
    get jR1()       { return this.just(5); }
    get jL2()       { return this.just(6); }
    get jR2()       { return this.just(7); }
    get jOptions()  { return this.just(9); }
    get jL3()       { return this.just(10); }
    get jR3()       { return this.just(11); }
    get jDUp()      { return this.just(12); }
    get jDDown()    { return this.just(13); }
    get jDLeft()    { return this.just(14); }
    get jDRight()   { return this.just(15); }
}
