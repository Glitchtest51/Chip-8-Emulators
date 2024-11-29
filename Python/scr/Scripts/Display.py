import pygame

class Screen:
    def __init__(self, width=64, height=32, size=10):
        pygame.init()
        self.width, self.height, self.size = width, height, size
        self.screen = pygame.display.set_mode((width * size, height * size))
        pygame.display.set_caption("Chip-8")
        self.screenArray = [0] * (height * width)

    def clearScreen(self):
        self.screenArray = [0] * (self.height * self.width)
    
    def turnOnPix(self, x, y):
        self.screenArray[(y * self.width + x) % len(self.screenArray)] ^= 1

    def getPix(self, x, y):
        return self.screenArray[(y * self.width + x) % len(self.screenArray)]

    def renderScreen(self):
        OFF = (0, 0, 0)
        ON = (255, 255, 255)
        self.screen.fill(OFF)
        for i, pixel in enumerate(self.screenArray):
            if pixel:
                x, y = i % self.width, i // self.width
                pygame.draw.rect(self.screen, ON, (x * self.size, y * self.size, self.size, self.size))
        pygame.display.flip()
