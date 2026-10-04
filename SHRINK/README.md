# Chip-8 Emulator

This is a Chip-8 emulator made with Javascript and HTML, for [Hack-Club SHRINK](https://shrink.hackclub.com/). This is made to be built less than 3072 bytes.
Original repo: [Glitchtest51/Hack-Club](https://github.com/Glitchtest51/Hack-Club/tree/main/SHRINK/Chip-8)

Test it out on [My Website](https://glitchtest51.github.io/Chip-8-Emulators/SHRINK/dist)

## Controls

This project is loaded with a demo ROM from [Timendus' Chip-8 test suite](https://github.com/Timendus/chip8-test-suite), specifically the Beep test, to show off both the Canvas API and the Web Audio API, feel free to test out more ROMs from [Timendus' Chip-8 test suite](https://github.com/Timendus/chip8-test-suite), or the [CHIP-8 Archive](https://johnearnest.github.io/chip8Archive/).

To start a ROM, click the canvas. 

The emulator uses this keyboard layout for the CHIP-8 keypad:

```text
CHIP-8:
1 2 3 C
4 5 6 D
7 8 9 E
A 0 B F

Keyboard:
1 2 3 4
Q W E R
A S D F
Z X C V
```

## How it works
This was based off my previous Chip-8 emulators, with various edits to lower the file size, you can find the original code [here](https://github.com/Glitchtest51/Chip-8-Emulators/blob/main/JavaScript%20Inspect%20Element/scr/scripts/main.js).

For more information, feel free to read [Tobias V. I. Langhoff](https://github.com/tobiasvl)'s [Guide to making a CHIP-8 emulator](https://tobiasvl.github.io/blog/write-a-chip-8-emulator/), which is what I used when originally writing this emulator.

## building
```
npm install
node build.mjs
```