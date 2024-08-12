using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Input;
using Microsoft.Xna.Framework.Input;
using System.Runtime.InteropServices;
using Microsoft.Xna.Framework.Audio;

namespace Emulator
{
    public class Emu
    {
        [DllImport("user32.dll")]
        private static extern short GetAsyncKeyState(Keys key);

        byte[] Font = [
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

        List<Keys> Keybinds = new List<Keys>
        {
            Keys.X, Keys.D1, Keys.D2, Keys.D3,
            Keys.Q, Keys.W, Keys.E, Keys.A,
            Keys.S, Keys.D, Keys.Z, Keys.C,
            Keys.D4, Keys.R, Keys.F, Keys.V
        };

        int PC = 0x200;
        int I = 0;
        Stack Stack = new Stack();
        int[] V = new int[0xF + 1];

        public Display.Display Screen;

        int MemorySize = 4096;
        int[] Memory;
        public string rompath;

        int DelayTimer = 0;
        int SoundTimer = 0;

        public List<Keys> GetPressedKeys() {
            List<Keys> pressedKeys = new List<Keys>();

            foreach (Keys key in Enum.GetValues(typeof(Keys))) {
                if (GetAsyncKeyState(key) < 0) {
                    pressedKeys.Add(key);
                }
            }

            return pressedKeys;
        }

        internal void initMem()
        {
            this.Memory = new int[this.MemorySize];

            for (int i = 0; i < this.Font.Length; i++) 
            {
                this.Memory[i]=this.Font[i];
            }

            using (FileStream fs = new FileStream(this.rompath, FileMode.Open, FileAccess.Read))
            {
                byte[] rom = new byte[fs.Length];
                fs.Read(rom, 0, rom.Length);

                for (int i = 0; i < rom.Length; i++)
                {
                    this.Memory[i + this.PC]=rom[i];
                }
            }
        }

        internal int fetch() {
            try {
                int opcode = (this.Memory[this.PC] << 8) | this.Memory[this.PC + 1];
                PC += 2;
                return opcode;
            }   
            catch (Exception e)
            {
                System.Diagnostics.Debug.WriteLine(e.Message);
                return 1;
            }
        }

        internal void execute(int opcode) {
            try {
                int op1 = (opcode & 0xF000) >> 12;
                int X = (opcode & 0x0F00) >> 8;
                int Y = (opcode & 0x00F0) >> 4;
                int nnn = (opcode & 0x0FFF);
                int nn = (opcode & 0x00FF);
                int n = (opcode & 0x000F);

                int tmp;

                switch (op1) {
                    case 0x0:
                        switch (nn) {
                            case 0xE0:
                                this.Screen.ClearScreen();
                                break;
                            case 0xEE:
                                this.PC = (int)this.Stack.Pop();
                                break;
                        }
                        break;
                    case 0x1:
                        this.PC = nnn;
                        break;
                    case 0x2:
                        this.Stack.Push(this.PC);
                        this.PC = nnn;
                        break;
                    case 0x3:
                        if (this.V[X] == nn) {
                            this.PC += 2;
                        }
                        break;
                    case 0x4:
                        if (this.V[X] != nn) {
                            this.PC += 2;
                        }
                        break;
                    case 0x5:
                        if (this.V[X] == this.V[Y]) {
                            this.PC += 2;
                        }
                        break;
                    case 0x6:
                        this.V[X] = nn;
                        break;
                    case 0x7:
                        this.V[X] = (this.V[X] + nn) % 256;
                        break;
                    case 0x8:
                        switch (n) {
                            case 0x0:
                                this.V[X] = this.V[Y];
                                break;
                            case 0x1:
                                this.V[X] |= this.V[Y];
                                this.V[0xF] = 0;
                                break;
                            case 0x2:
                                this.V[X] &= this.V[Y];
                                this.V[0xF] = 0;
                                break;
                            case 0x3:
                                this.V[X] ^= this.V[Y];
                                this.V[0xF] = 0;
                                break;
                            case 0x4:
                                tmp = 0;
                                if ((this.V[X] + this.V[Y]) > 255) {
                                    tmp = 1;
                                }
                                this.V[X] = (this.V[X] + this.V[Y]) % 256;
                                this.V[0xF] = tmp;
                                break;
                            case 0x5:
                                tmp = 0;
                                if (this.V[X] >= this.V[Y]) {
                                    tmp = 1;
                                }
                                this.V[X] = (this.V[X] - this.V[Y]) % 256;
                                this.V[0xF] = tmp;
                                break;
                            case 0x6:
                                this.V[X] = this.V[Y];
                                tmp = this.V[X] & 0x1;
                                this.V[X] = (this.V[X] >> 1) % 256;
                                this.V[0xF] = tmp;
                                break;
                            case 0x7:
                                tmp = 0;
                                if (this.V[Y] >= this.V[X]) {
                                    tmp = 1;
                                }
                                this.V[X] = (this.V[Y] - this.V[X]) % 256;
                                this.V[0xF] = tmp;
                                break;
                            case 0xE:
                                this.V[X] = this.V[Y];
                                tmp = this.V[X] >> 7;
                                this.V[X] = (this.V[X] << 1) % 256;
                                this.V[0xF] = tmp;
                                break;
                        }
                        break;
                    case 0x9:
                        if (this.V[X] != this.V[Y]) {
                            this.PC += 2;
                        }
                        break;
                    case 0xA:
                        this.I = nnn;
                        break;
                    case 0xB:
                        this.PC = nnn + this.V[0x0];
                        break;
                    case 0xC:
                        Random random = new Random();
                        this.V[X] = random.Next(0, 0xFF) & nn;
                        break;
                    case 0xD:
                        int x = this.V[X] % 64;
                        int y = this.V[Y] % 32;
                        this.V[0xF] = 0;
                        for (int row = 0; row < n; row++) {
                            if (y + row != 32) {
                                int data = this.Memory[(this.I + row) % this.MemorySize];
                                for (int col = 0; col < 8; col++) {
                                    if (x + col != 64) {
                                        if (((data >> (7 - col)) & 1) == 1) {
                                            int finalX = (x + col) % 64;
                                            int finalY = (y + row) % 32;
                                            if (this.Screen.GetPix(finalX, finalY) == 1) {
                                                this.V[0xF] = 1;
                                            }
                                            this.Screen.TurnOnPix(finalX, finalY);
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case 0xE:
                        switch (nn) {
                            case 0x9E:
                                if (GetPressedKeys().IndexOf(Keybinds.ElementAt(V[X] % 16)) != -1) {
                                    this.PC += 2;
                                }
                                break;
                            case 0xA1:
                                if (GetPressedKeys().IndexOf(Keybinds.ElementAt(V[X] % 16)) == -1) {
                                    this.PC += 2;
                                }
                                break;
                        }
                        break;
                    case 0xF:
                        switch (nn) {
                            case 0x07:
                                this.V[X] = this.DelayTimer;
                                break;
                            case 0x15:
                                this.DelayTimer = this.V[X];
                                break;
                            case 0x18:
                                this.SoundTimer = this.V[X];
                                break;
                            case 0x1E:
                                this.I += this.V[X];
                                break;
                            case 0x0A:
                                List<Keys> keys = GetPressedKeys();
                                this.PC -= 2;
                                for (int i = 0; i < Keybinds.Count; i++) {
                                    Keys key = Keybinds[i];
                                    if (GetPressedKeys().IndexOf(key) == 1) {
                                        this.PC += 2;
                                        this.V[X] = i - 1;
                                    }
                                }
                                break;
                            case 0x29:
                                this.I = (this.V[X] & 0xF) * 5;
                                break;
                            case 0x33:
                                string VX = this.V[X].ToString();
                                for (int i = 0; i < VX.Length; i++) {
                                    this.Memory[(i + this.I) % this.MemorySize] = Convert.ToInt16(VX[i]);
                                }
                                break;
                            case 0x55:
                                for (int i = 0; i < X + 1; i++) {
                                    this.Memory[(this.I + i) % this.MemorySize] = this.V[i];
                                }
                                this.I += 1;
                                break;
                            case 0x65:
                                for (int i = 0; i < X + 1; i++) {
                                    this.V[i] = this.Memory[(this.I + i) % this.MemorySize];
                                }
                                this.I += 1;
                                break;
                        }
                        break;
                    default:
                        System.Diagnostics.Debug.WriteLine($"Unknown Opcode: {opcode}");
                        break;
                }
            } catch (Exception e) {
                System.Diagnostics.Debug.WriteLine(opcode);
                System.Diagnostics.Debug.WriteLine(e.Message);
            }
        }

        internal void decrementTimers() {
            SoundEffectInstance buzzerInstance = Screen.buzzerInstance;
            if (this.DelayTimer > 0) {
                this.DelayTimer -= 1;
            }
            if (SoundTimer > 0) {
                if (buzzerInstance.State == SoundState.Stopped) {
                    buzzerInstance.IsLooped = true;
                    buzzerInstance.Play();
                }
                SoundTimer -= 1;
            } else if (buzzerInstance?.State == SoundState.Playing) {
                buzzerInstance.Stop();
            }
        }

        internal void executeCycle() {
            this.execute(this.fetch());
        }
    }
}