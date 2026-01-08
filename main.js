const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;

  mainWindow = new BrowserWindow({
    width: 40,
    height: 100,
    x: 0,
    y: Math.floor(screenHeight * (2 / 3)) - 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    movable: false,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  });
}

ipcMain.on('resize-window', (event, width, height) => {
  if (mainWindow) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { height: screenHeight } = primaryDisplay.bounds;
    const centerY = Math.floor(screenHeight * (2 / 3));

    // Calculate new Y to keep the window centered around the 2/3 mark
    const newY = Math.floor(centerY - height / 2);

    mainWindow.setBounds({
      width: width,
      height: height,
      x: 0,
      y: newY
    });
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
