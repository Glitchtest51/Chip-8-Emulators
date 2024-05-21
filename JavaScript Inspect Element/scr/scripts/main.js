// Variables
// \/\/\/

// Main
const gameWidth = 64;
const gameHeight = 32;
const introAttributeNames = 'clickchip'.split('');
const gameAttributeNames = 'playchip'.split('');
let mode = 'intro';

let firstElement;
const divs = [];
var map = [];

// Keybinds and Keys
var keys = [];
const Keybinds = [
    88, 49, 50, 51,
    81, 87, 69, 65,
    83, 68, 90, 67,
    52, 82, 70, 86 
];

// Emulator

// Font
const Font = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80 // F
];

// Various Vars
var PC = 0x200;
var I = 0;
var Stack = [];
var V = new Array(0xF + 1).fill(0);

// Memory
let MemorySize = 4096;
var Memory = new Array(MemorySize).fill(0);

// Timers
var DelayTimer = 0;
var SoundTimer = 0;

// Sound
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const sampleRate = 48000;
const buffer = audioCtx.createBuffer(1, sampleRate, sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) {
    data[i] = Math.sin(2 * Math.PI * 3000 * i / sampleRate);
}

let currentSource = null;

// ROM
let ROM = [0xA2,0x54,0xF0,0x65,0x62,0x01,0x83,0x00,0x64,0x0B,0x6A,0x1C,0x6B,0x0C,0xA2,0x54,0xF2,0x1E,0xF1,0x65,0xA2,0x67,0xDA,0xB7,0xF0,0x18,0xF0,0x15,0x22,0x2C,0xDA,0xB7,0xF1,0x15,0x22,0x2C,0x72,0x02,0x52,0x30,0x12,0x0E,0x12,0x00,0xE4,0xA1,0x12,0x38,0xF0,0x07,0x30,0x00,0x12,0x2C,0x00,0xEE,0x60,0x00,0x61,0x3C,0x62,0x0B,0x00,0xE0,0xA2,0x67,0xDA,0xB7,0xF1,0x18,0xE2,0xA1,0x12,0x44,0xDA,0xB7,0xF0,0x18,0xE2,0x9E,0x12,0x4C,0x12,0x40,0x13,0x0A,0x05,0x0A,0x05,0x0A,0x14,0x1E,0x05,0x1E,0x05,0x1E,0x14,0x0A,0x05,0x0A,0x05,0x0A,0x3C,0x19,0x2A,0xC8,0x8B,0xC8,0x2A,0x19,]

// /\/\/\

// ---init/startup---
// \/\/\/

// Waits x milliseconds
function wait(milliseconds) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, milliseconds);
    });
}

// Renders Intro
function renderIntro() {
    let i = Math.floor(Math.sin(Date.now()/700) * (divs.length/2) + (divs.length/2));

    divs.forEach((div, y) => {
        if (y == i) {
            div.setAttribute(introAttributeNames[y % introAttributeNames.length], ' . OKAY now CLICK the SNAKE! . ');
        }
        else {
            div.setAttribute(introAttributeNames[y % introAttributeNames.length], ' . . . . . . . . . . . . . . . ');
        }
    });
}

// Starts game
async function startGame() {
    // Set mode to setup
    mode = 'setup';

    // Remove old divs
    do {
        let div = divs.pop();
        await wait(50);
        div.parentElement.removeChild(div);
    }
    while (divs.length > 1);
    divs[0].removeAttribute(introAttributeNames[0]);

    // Make new divs
    while (divs.length < gameHeight) {
        await wait(50);
        div = document.createElement('div');
        document.body.insertBefore(div, firstElement);
        divs.push(div);
    }

    // Set mode to game
    mode = 'game';

    // Init map
    clearscreen()

    // Init V and Mem
    initemu()
}

// /\/\/\

// ---Screen---
// \/\/\/

// Clears map
function clearscreen() {
    for (let i = 0; i < (gameWidth * gameHeight); i ++) {
        map[i] = 0;
    }
}

// Sets pixel to on or off
function turnOnPix(X, Y) {
    let index = Y * gameWidth + X;
    map[index % (gameWidth * gameHeight)] ^= 1;
}

// Gets pixel
function getPix(X, Y) {
    let index = Y * gameWidth + X;
    return map[index % (gameWidth * gameHeight)];
}

// Renders map
function renderScreen() {
    divs.forEach((div, y) => {
        let line = '';

        for (let x = 0; x < gameWidth; x ++) {
            const tile = getPix(x, y);

            if (tile == 0) {
                line += '⬛';
            }
            else if (tile == 1) {
                line += '⬜';
            }
        }

        div.setAttribute(gameAttributeNames[y % gameAttributeNames.length], line);
        y -= 1;
    });
}

// /\/\/\

// ---Emulator---
// \/\/\/

// init
function initemu() {
    for (let i = 0; i < Font.length; i++) {
        Memory[i] = Font[i];
    }

    for (let i = 0; i < ROM.length; i++) {
        Memory[512 + i] = ROM[i];
    }
}

function fetch() {
    try {
        const opcode = (Memory[PC] << 8) | Memory[PC + 1];
        PC += 2;
        return opcode;
    } catch (error) {
        console.error(error);
    }
}

function execute(opcode) {
    try {
        let op1 = (opcode & 0xF000) >> 12;
        let X = (opcode & 0x0F00) >> 8;
        let Y = (opcode & 0x00F0) >> 4;
        let nnn = (opcode & 0x0FFF);
        let nn = (opcode & 0x00FF);
        let n = (opcode & 0x000F);
        let tmp;

        switch (op1) {
            case 0x0:
                switch (nn) {
                    case 0xE0:
                        clearscreen();
                        break;
                    case 0xEE:
                        PC = Stack.pop();
                        break;
                }
                break;
            case 0x1:
                PC = nnn;
                break;
            case 0x2:
                Stack.push(PC);
                PC = nnn;
                break;
            case 0x3:
                if (V[X] == nn) {
                    PC += 2;
                }
                break;
            case 0x4:
                if (V[X] != nn) {
                    PC += 2;
                }
                break;
            case 0x5:
                if (V[X] == V[Y]) {
                    PC += 2;
                }
                break;
            case 0x6:
                V[X] = nn;
                break;
            case 0x7:
                V[X] = (V[X] + nn) % 256;
                break;
            case 0x8:
                switch (n) {
                    case 0x0:
                        V[X] = V[Y];
                        break;
                    case 0x1:
                        V[X] |= V[Y];
                        V[0xF] = 0;
                        break;
                    case 0x2:
                        V[X] &= V[Y];
                        V[0xF] = 0;
                        break;
                    case 0x3:
                        V[X] ^= V[Y];
                        V[0xF] = 0;
                        break;
                    case 0x4:
                        if ((V[X] + V[Y]) > 255) {
                            tmp = 1;
                        }
                        else {
                            tmp = 0;
                        }
                        V[X] = (V[X] + V[Y]) % 256;
                        V[0xF] = tmp;
                        break;
                    case 0x5:
                        if (V[X] >= V[Y]) {
                            tmp = 1;
                        }
                        else {
                            tmp = 0;
                        }
                        V[X] = (V[X] - V[Y]) % 256;
                        V[0xF] = tmp;
                        break;
                    case 0x6:
                        V[X] = V[Y];
                        tmp = V[X] & 0x1;
                        V[X] = (V[X] >> 1) % 256;
                        V[0xF] = tmp;
                        break;
                    case 0x7:
                        if (V[Y] >= V[X]) {
                            tmp = 1;
                        }
                        else {
                            tmp = 0
                        }
                        V[X] = (V[Y] - V[X]) % 256;
                        V[0xF] = tmp;
                        break;
                    case 0xE:
                        V[X] = V[Y];
                        tmp = V[X] >> 7;
                        V[X] = (V[X] << 1) % 256;
                        V[0xF] = tmp;
                        break;
                }
                break;
            case 0x9:
                if (V[X] != V[Y]) {
                    PC += 2;
                }
                break;
            case 0xA:
                I = nnn;
                break;
            case 0xB:
                PC = nnn + V[0x0];
                break;
            case 0xC:
                V[X] = Math.floor(Math.random() * 0xFF) & nn;
                break;
            case 0xD:
                let x = V[X] % 64;
                let y = V[Y] % 32;
                V[0xF] = 0;
                for (let row = 0; row < n; row++) {
                    if (y + row !== 32) {
                        let data = Memory[I + row];
                        for (let col = 0; col < 8; col++) {
                            if (x + col !== 64) {
                                if ((data >> (7 - col)) & 1 === 1) {
                                    let finalX = (x + col) % 64;
                                    let finalY = (y + row) % 32;
                                    if (getPix(finalX, finalY) === 1) {
                                        V[0xF] = 1;
                                    }
                                    turnOnPix(finalX, finalY);
                                }
                            }
                        }
                    }
                }
                break;
            case 0xE:
                switch (nn) {
                    case 0x9E:
                        if (keys.includes(Keybinds[V[X]])) {
                            PC += 2;
                        }
                        break;
                    case 0xA1:
                        if (!keys.includes(Keybinds[V[X]])) {
                            PC += 2;
                        }
                        break;
                }
            break;
            case 0xF:
                switch (nn) {
                    case 0x07:
                        V[X] = DelayTimer;
                        break;
                    case 0x15:
                        DelayTimer = V[X];
                        break;
                    case 0x18:
                        SoundTimer = V[X];
                        break;
                    case 0x1E:
                        I += V[X];
                        break;
                    case 0x0A:
                        PC -= 2;
                        Keybinds.forEach((key, index) => {
                            if (keys[key]) {
                                PC += 2
                                V[X] = index
                            }
                        });
                        break;
                    case 0x29:
                        I = (V[X] & 0xF) * 5
                        break;
                    case 0x33:
                        VX = V[X]
                        for (let i = 0; i < VX.toString().length; i++) {
                            Memory[(i + I) % MemorySize] = int(str(VX)[i]);
                        }
                        break;
                    case 0x55:
                        for (let i = 0; i < X + 1; i++) {
                            Memory[(I + i) % MemorySize] = V[i];
                        }
                        I += 1;
                        break;
                    case 0x65:
                        for (let i = 0; i < X + 1; i++) {
                            V[i] = Memory[(I + i) % MemorySize];
                        }
                        I += 1;
                        break;
                }
                break;
            default:
                console.log('Unknown Opcode: ' + opcode.toString(16));
        }
    } catch (error) {
        console.error(opcode.toString(16));
        console.error(error);
    }
}

function playSound() {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.1;
    source.connect(gainNode).connect(audioCtx.destination);
    source.start();
    return source;
}

function decrementTimers() {
    if (DelayTimer > 0) {
        DelayTimer -= 1
    }
    if (SoundTimer > 0) {
        if (!currentSource) {
            currentSource = playSound();
        }
        SoundTimer -= 1;
    } else {
        if (currentSource) {
            currentSource.stop();
            currentSource = null;
        }
    }
}

function executeCycle() {
    execute(fetch())
    renderScreen()
}

function keydown(event) {
    const key = event.which;
    if (!keys.includes(key)) {
        keys.push(key);
    }
}

function keyup(event) {
    const key = event.which;
    const index = keys.indexOf(key);
    if (index > -1) {
        keys.splice(index, 1);
    }
}

function loop() {
    setTimeout(loop, 1000/60);

    if (mode == 'intro') {
        renderIntro();
    }
    else if (mode == 'game') {
        for (let i = 0; i < 20; i ++) {
            executeCycle();
        }
    }

    decrementTimers();
}

// /\/\/\

// Start
window.addEventListener('load', () => {
    // Sets firstElement
    firstElement = document.body.firstChild;

    for (let i = 0; i < 10; i ++) {
        const div = document.createElement('div');
        document.body.insertBefore(div, firstElement);
        divs.push(div);
    }

    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    const snakeElement = divs[0];
    window.addEventListener('blur', () => {
        document.getElementsByTagName('style')[0].innerHTML += 'div:first-of-type {cursor: pointer;}';
        snakeElement.addEventListener('click', startGame);
    });

    loop();
});