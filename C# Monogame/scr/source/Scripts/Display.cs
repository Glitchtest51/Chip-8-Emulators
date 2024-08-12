using Emulator;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;

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

            for (int y = 0; y < ScreenY; y++) {
                for (int x = 0; x < ScreenX; x++) {
                    int index = y * ScreenX + x;
                    if (screenArray[index] == 1) {
                        _spriteBatch.Draw(pixel, new Rectangle(x * Size, y * Size, Size, Size), ON);
                    }
                }
            }
            _spriteBatch.End();

            base.Draw(gameTime);
        }
        public void ClearScreen() {
            screenArray = new int[ScreenX * ScreenY];
        }

        public void TurnOnPix(int X, int Y) {
            int index = Y * ScreenX + X;
            screenArray[index % (ScreenX * ScreenY)] ^= 1;
        }

        public int GetPix(int X, int Y) {
            int index = Y * ScreenX + X;
            return screenArray[index % (ScreenX * ScreenY)];
        }
    }
}
