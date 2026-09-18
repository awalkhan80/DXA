// Electron Entry Point for Desert Xtreme POS
// Supports Windows NSIS installer and embedded SQLite storage in %APPDATA%/desert-xtreme-pos/database.db

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Determine AppData directory for SQLite database storage
const userDataPath = app.getPath('userData'); // e.g. %APPDATA%/desert-xtreme-pos
const dbDir = path.join(userDataPath);
const dbFilePath = path.join(dbDir, 'database.db');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create database directory:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Desert Xtreme POS',
    backgroundColor: '#FFF8F0',
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/preload.cjs')
    },
    icon: path.join(__dirname, 'public/favicon.ico')
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && process.env.DEV_URL) {
    mainWindow.loadURL(process.env.DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler for DB path lookup and native backup
ipcMain.handle('get-db-path', () => {
  return dbFilePath;
});
