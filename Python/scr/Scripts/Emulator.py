import random, pygame, keyboard
import numpy as np
from Scripts.Display import Screen

Font = [
0xF0, 0x90, 0x90, 0x90, 0xF0, # 0
0x20, 0x60, 0x20, 0x20, 0x70, # 1
0xF0, 0x10, 0xF0, 0x80, 0xF0, # 2
0xF0, 0x10, 0xF0, 0x10, 0xF0, # 3
0x90, 0x90, 0xF0, 0x10, 0x10, # 4
0xF0, 0x80, 0xF0, 0x10, 0xF0, # 5
0xF0, 0x80, 0xF0, 0x90, 0xF0, # 6
0xF0, 0x10, 0x20, 0x40, 0x40, # 7
0xF0, 0x90, 0xF0, 0x90, 0xF0, # 8
0xF0, 0x90, 0xF0, 0x10, 0xF0, # 9
0xF0, 0x90, 0xF0, 0x90, 0x90, # A
0xE0, 0x90, 0xE0, 0x90, 0xE0, # B
0xF0, 0x80, 0x80, 0x80, 0xF0, # C
0xE0, 0x90, 0x90, 0x90, 0xE0, # D
0xF0, 0x80, 0xF0, 0x80, 0xF0, # E
0xF0, 0x80, 0xF0, 0x80, 0x80 # F
]

Keybinds = [
    pygame.K_x, pygame.K_1, pygame.K_2, pygame.K_3,
    pygame.K_q, pygame.K_w, pygame.K_e, pygame.K_a,
    pygame.K_s, pygame.K_d, pygame.K_z, pygame.K_c,
    pygame.K_4, pygame.K_r, pygame.K_f, pygame.K_v,
]

class Emu(object):
    def __init__(self, path):
        self.PC = 0x200
        self.I = 0
        self.Stack = []
        self.V = []
        for i in range(0xF + 1):
            self.V.append(0)

        pygame.mixer.pre_init(frequency=48000, size=32)
        pygame.mixer.init(frequency=48000, size=32)

        sound = pygame.mixer.Sound(np.sin(3000 * np.arange(48000) / 48000).astype(np.float32))
        pygame.mixer.Sound.set_volume(sound, 0.1)

        self.buzzer = sound
        
        self.Screen = Screen()

        self.Keybinds = Keybinds

        self.MemorySize = 4096
        self.Memory = []
        self.initMem(path)

        self.DelayTimer = 0
        self.SoundTimer = 0

    def initMem(self, path):
        for i in range(self.MemorySize):
            self.Memory.append(00)

        for i in range(len(Font)):
            self.Memory[i] = Font[i]

        with open(path, 'rb') as f:
            ROM = f.read()
            for i in range(len(ROM)):
                self.Memory[i + self.PC] = ROM[i]

    def fetch(self):
        try:
            opcode = (self.Memory[self.PC] << 8) | self.Memory[self.PC + 1]
            self.PC += 2
            return opcode
        except Exception as error:
            print(error)
    
    def execute(self, opcode):
        try:    
            op1 = (opcode & 0xF000) >> 12
            X = (opcode & 0x0F00) >> 8
            Y = (opcode & 0x00F0) >> 4
            nnn = (opcode & 0x0FFF)
            nn = (opcode & 0x00FF)
            n = (opcode & 0x000F)

            match op1:
                case 0x0:
                    match nn:
                        case 0xE0:
                            self.Screen.clearScreen()
                        case 0xEE:
                            self.PC = self.Stack.pop()
                case 0x1:
                    self.PC = nnn
                case 0x2:
                    self.Stack.append(self.PC)
                    self.PC = nnn
                case 0x3:
                    if self.V[X] == nn:
                        self.PC += 2
                case 0x4:
                    if self.V[X] != nn:
                        self.PC += 2
                case 0x5:
                    if self.V[X] == self.V[Y]:
                        self.PC += 2
                case 0x6:
                    self.V[X] = nn
                case 0x7:
                    self.V[X] = (self.V[X] + nn) % 256
                case 0x8:
                    match n:
                        case 0x0:
                            self.V[X] = self.V[Y]
                        case 0x1:
                            self.V[X] |= self.V[Y]
                            self.V[0xF] = 0
                        case 0x2:
                            self.V[X] &= self.V[Y]
                            self.V[0xF] = 0
                        case 0x3:
                            self.V[X] ^= self.V[Y]
                            self.V[0xF] = 0
                        case 0x4:
                            if (self.V[X] + self.V[Y]) > 255:
                                tmp = 1
                            else:
                                tmp = 0
                            self.V[X] = (self.V[X] + self.V[Y]) % 256
                            self.V[0xF] = tmp
                        case 0x5:
                            if self.V[X] >= self.V[Y]:
                                tmp = 1
                            else:
                                tmp = 0
                            self.V[X] = (self.V[X] - self.V[Y]) % 256
                            self.V[0xF] = tmp
                        case 0x6:
                            self.V[X] = self.V[Y]
                            tmp = self.V[X] & 0x1
                            self.V[X] = (self.V[X] >> 1) % 256
                            self.V[0xF] = tmp
                        case 0x7:
                            if self.V[Y] >= self.V[X]:
                                tmp = 1
                            else:
                                tmp = 0
                            self.V[X] = (self.V[Y] - self.V[X]) % 256
                            self.V[0xF] = tmp
                        case 0xE:
                            self.V[X] = self.V[Y]
                            tmp = self.V[X] >> 7
                            self.V[X] = (self.V[X] << 1) % 256
                            self.V[0xF] = tmp
                case 0x9:
                    if self.V[X] != self.V[Y]:
                        self.PC += 2
                case 0xA:
                    self.I = nnn
                case 0xB:
                    self.PC = nnn + self.V[0x0]
                case 0xC:
                    self.V[X] = random.randrange(0, 0xFF) & nn
                case 0xD:
                    x = self.V[X] % 64
                    y = self.V[Y] % 32
                    self.V[0xF] = 0
                    for row in range(n):
                        if y + row != 32:
                            data = self.Memory[self.I + row]
                            for col in range(8):
                                if x + col != 64:
                                    if (data >> (7 - col)) & 1 == 1:
                                        finalX = (x + col) % 64
                                        finalY = (y + row) % 32
                                        if self.Screen.getPix(finalX, finalY) == 1:
                                            self.V[0xF] = 1
                                        self.Screen.turnOnPix(finalX, finalY)
                case 0xE:
                    match nn:
                        case 0x9E:
                            if pygame.key.get_pressed()[self.Keybinds[self.V[X] % 16]]:
                                self.PC += 2
                        case 0xA1:
                            if not pygame.key.get_pressed()[self.Keybinds[self.V[X] % 16]]:
                                self.PC += 2
                case 0xF:
                    match nn:
                        case 0x07:
                            self.V[X] = self.DelayTimer
                        case 0x15:
                            self.DelayTimer = self.V[X]
                        case 0x18:
                            self.SoundTimer = self.V[X]
                        case 0x1E:
                            self.I += self.V[X]
                        case 0x0A:
                            keys = pygame.key.get_pressed()
                            self.PC -= 2
                            for i, key in enumerate(Keybinds, start=1):
                                if keys[key]:
                                    self.PC += 2
                                    self.V[X] = i-1
                        case 0x29:
                            self.I = (self.V[X] & 0xF) * 5
                        case 0x33:
                            VX = self.V[X]
                            for i in range(len(str(VX))):
                                self.Memory[(i + self.I) % self.MemorySize] = int(str(VX)[i])
                        case 0x55:
                            for i in range(X + 1):
                                self.Memory[(self.I + i) % self.MemorySize] = self.V[i]
                            self.I += 1
                        case 0x65:
                            for i in range(X + 1):
                                self.V[i] = self.Memory[(self.I + i) % self.MemorySize]
                            self.I += 1
                case _:
                    print(f'Unknown Opcode: {opcode}')
        except Exception as error:
            print(hex(opcode))
            print(error)

    def decrementTimers(self):
        if self.DelayTimer > 0:
            self.DelayTimer -= 1
        if self.SoundTimer > 0:
            if pygame.mixer.Sound.get_num_channels(self.buzzer) < 1:
                self.buzzer.play(-1)
            self.SoundTimer -= 1
        else:
            pygame.mixer.Sound.stop(self.buzzer)
    
    def executeCycle(self):
        self.execute(self.fetch())
        self.Screen.renderScreen()

    def main_loop(self):
        pygame.init()
        main = pygame.time.Clock()
        Running = True
        while Running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    Running = False

            main.tick(60)
            for i in range(10):
                self.executeCycle()
            self.decrementTimers()

            # keyboard.wait("space")

        pygame.quit()