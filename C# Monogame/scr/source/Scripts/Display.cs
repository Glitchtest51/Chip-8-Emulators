using Emulator;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using System;

namespace Display {
    public class Display : Game {
        readonly GraphicsDeviceManager _graphics;
        SpriteBatch _spriteBatch;
        Texture2D pixel;

        private readonly int ScreenX = 64;
        private readonly int ScreenY = 32;
        private readonly int Size = 10;

        int[] screenArray;
        readonly Emu _emu;

        public SoundEffect buzzer;
        public SoundEffectInstance buzzerInstance;

        public Display(string filepath) {
            _graphics = new GraphicsDeviceManager(this);
            Content.RootDirectory = "Content";
            IsMouseVisible = true;
            _graphics.PreferredBackBufferWidth = ScreenX * Size;
            _graphics.PreferredBackBufferHeight = ScreenY * Size;

            _emu = new Emu {
                rompath = filepath
            };
        }

        protected override void Initialize() {
            screenArray = new int[ScreenX * ScreenY];
            _emu.Screen = this;
            _emu.initMem();
            base.Initialize();
        }

        protected override void LoadContent() {
            _spriteBatch = new SpriteBatch(GraphicsDevice);

            buzzer = Content.Load<SoundEffect>("buzzer");
            buzzerInstance = buzzer.CreateInstance();

            pixel = new Texture2D(GraphicsDevice, 1, 1);
            pixel.SetData(new[] { Color.White });
        }
        protected override void UnloadContent() {
            base.UnloadContent();
            _spriteBatch.Dispose();
            pixel.Dispose();
        }

        protected override void Update(GameTime gameTime) {
            if (Keyboard.GetState().IsKeyDown(Keys.Escape))
                Exit();

            for (int i = 0; i < 10; i++) {
                _emu.executeCycle();
            }
            _emu.decrementTimers();

            base.Update(gameTime);
        }

        protected override void Draw(GameTime gameTime) {
            Color OFF = Color.Black;
            Color ON = Color.White;

            GraphicsDevice.Clear(OFF);
            _spriteBatch.Begin();

            for (int y = 0; y < this.ScreenY; y++) {
                for (int x = 0; x < this.ScreenX; x++) {
                    int index = y * this.ScreenX + x;
                    if (this.screenArray[index] == 1) {
                        _spriteBatch.Draw(pixel, new Rectangle(x * Size, y * Size, Size, Size), ON);
                    }
                }
            }
            _spriteBatch.End();

            base.Draw(gameTime);
        }
        public void ClearScreen() {
            this.screenArray = new int[this.ScreenX * this.ScreenY];
        }

        public void TurnOnPix(int X, int Y) {
            int index = Y * this.ScreenX + X;
            this.screenArray[index % (this.ScreenX * this.ScreenY)] ^= 1;
        }

        public int GetPix(int X, int Y) {
            int index = Y * this.ScreenX + X;
            return screenArray[index % (this.ScreenX * this.ScreenY)];
        }
    }
}
