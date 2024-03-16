import pygame

ScreenX = 64
ScreenY = 32
Size = 10

class Screen(object):
    def __init__(self):
        self.height = ScreenY
        self.width = ScreenX
        self.size = Size
        pygame.init()
        self.screen = pygame.display.set_mode((ScreenX * Size, ScreenY * Size))
        pygame.display.set_caption("Chip-8")
        self.screenArray = [0] * (self.height * self.width)

    def clearScreen(self):
        self.screenArray = [0] * (self.height * self.width)
    
    def turnOnPix(self, X, Y):
        index = Y * self.width + X
        self.screenArray[index % (self.width * self.height)] ^= 1

    def getPix(self, X, Y):
        index = Y * self.width + X
        return self.screenArray[index % (self.width * self.height)]

    def renderScreen(self):
        size = self.size
        OFF = (0, 0, 0)
        ON = (255, 255, 255)
        self.screen.fill(OFF)
        for y in range(self.height):
            for x in range(self.width):
                index = y * self.width + x
                if self.screenArray[index] == 1:
                    pygame.draw.rect(self.screen, ON, (x * size, y * size, size, size))
        pygame.display.flip()
