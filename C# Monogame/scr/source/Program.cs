using System;

internal class Program {
    private static void Main(string[] args) {
        //Console.Write("File Path:");
        //string filepath = Console.ReadLine();

        var game = new Display.Display(@"D:\My-Stuff\Documents\Code projects\EmuDev\CHIP-8\ROMs\7-beep.ch8");
        game.Run();
    }
}