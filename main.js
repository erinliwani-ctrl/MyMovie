const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let watchlistWindow;
//creating main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile('renderer/index.html');
}

//create watchlist window
function createWatchlistWindow(movie) {
  watchlistWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
});

  watchlistWindow.loadFile('renderer/watchlist.html');
  
  //send movie only if a movie is selected
  watchlistWindow.webContents.on('did-finish-load', () => {
    if(movie){
      watchlistWindow.webContents.send('movie-selected', movie);
    }
  });

  watchlistWindow.on('closed', () => {
    watchlistWindow = null;
  });
}
//accept message from index.js, open the watchlist window
ipcMain.on('open-watchlist-window', (event, movie) => {
  createWatchlistWindow(movie);
});

let watchlist = [];

//start application
app.whenReady().then(createMainWindow);


