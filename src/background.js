import path from "path";
import url from "url";
import { app, Menu, BrowserWindow } from "electron";
const {autoUpdater} = require("electron-updater");
import env from "env";

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

app.on("ready", () => {
  autoUpdater.checkForUpdatesAndNotify();
  const mainWindow = new BrowserWindow({width: 1000, height: 700, resizable: false, show: false})

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "intro.html"),
      protocol: "file:",
      slashes: true
    })
  );
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if(env.name == 'development') mainWindow.openDevTools();
});

app.on("window-all-closed", () => {
  app.quit();
});
