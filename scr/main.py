from Scripts.Emulator import Emu

file = input('File Path:')

emu = Emu(file)

emu.main_loop()
