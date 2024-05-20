const gameWidth = 64;
const gameHeight = 32;
const introAttributeNames = 'clickchip'.split('');
const gameAttributeNames = 'playchip'.split('');

let firstElement;
const divs = [];
let mode = 'intro';
var map = [];

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

var PC = 0x200;
var I = 0;
var Stack = [];
var V = new Array(0xF + 1).fill(0);

let MemorySize = 4096;
var Memory = new Array(MemorySize).fill(0);

var DelayTimer = 0;
var SoundTimer = 0;

let ROM = [0x00,0xE0,0xA2,0x2A,0x60,0x0C,0x61,0x08,0xD0,0x1F,0x70,0x09,0xA2,0x39,0xD0,0x1F,0xA2,0x48,0x70,0x08,0xD0,0x1F,0x70,0x04,0xA2,0x57,0xD0,0x1F,0x70,0x08,0xA2,0x66,0xD0,0x1F,0x70,0x08,0xA2,0x75,0xD0,0x1F,0x12,0x28,0xFF,0x00,0xFF,0x00,0x3C,0x00,0x3C,0x00,0x3C,0x00,0x3C,0x00,0xFF,0x00,0xFF,0xFF,0x00,0xFF,0x00,0x38,0x00,0x3F,0x00,0x3F,0x00,0x38,0x00,0xFF,0x00,0xFF,0x80,0x00,0xE0,0x00,0xE0,0x00,0x80,0x00,0x80,0x00,0xE0,0x00,0xE0,0x00,0x80,0xF8,0x00,0xFC,0x00,0x3E,0x00,0x3F,0x00,0x3B,0x00,0x39,0x00,0xF8,0x00,0xF8,0x03,0x00,0x07,0x00,0x0F,0x00,0xBF,0x00,0xFB,0x00,0xF3,0x00,0xE3,0x00,0x43,0xE5,0x05,0xE2,0x00,0x85,0x07,0x81,0x01,0x80,0x02,0x80,0x02,0xE6,0x02,0xE7,];

// ---dunno yet---
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
            // case 0xE:
            //     switch (nn) {
            //         case 0x9E:
            //             if pygame.key.get_pressed()[Keybinds[V[X]]]:
            //                 PC += 2;
            //             break;
            //         case 0xA1:
            //             if not pygame.key.get_pressed()[Keybinds[V[X]]]:
            //                 PC += 2;
            //             break;
            //     }
            // break;
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
                    // case 0x0A:
                    //     keys = pygame.key.get_pressed()
                    //     PC -= 2;
                    //     for i, key in enumerate(Keybinds, start=1):
                    //         if keys[key]:
                    //             PC += 2
                    //             V[X] = i-1
                    //     break;
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

function decrementTimers() {
    if (DelayTimer > 0) {
        DelayTimer -= 1
    }
    if (SoundTimer > 0) {
        // start sound
        SoundTimer -= 1
    }
    // else {
        // stop sound
    // }
}

function executeCycle() {
    execute(fetch())
    renderScreen()
}

// /\/\/\

function loop() {
    setTimeout(loop, 1000/30);

    if (mode == 'intro') {
        renderIntro();
    }
    else if (mode == 'game') {
        executeCycle();
    }
}

function keydown(event) {
    let newDirection;
    const key = event.which;

    if (key == 39) { // right
        newDirection = 0;
    }
    else if (key == 40) { // down
        newDirection = 1;
    }
    else if (key == 37) { // left
        newDirection = 2;
    }
    else if (key == 38) { // up
        newDirection = 3;
    }
}

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

    const snakeElement = divs[0];
    window.addEventListener('blur', () => {
        document.getElementsByTagName('style')[0].innerHTML += 'div:first-of-type {cursor: pointer;}';
        snakeElement.addEventListener('click', startGame);
    });

    loop();
});