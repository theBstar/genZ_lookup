const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const keytar = require("keytar");
const { ChatOpenAI } = require("@langchain/openai");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const SERVICE_NAME = "genZ-lookup";
const ACCOUNT_NAME = "app-settings-has-key-and-prompt";

const isDevelopment = process.env.NODE_ENV === "development";
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nativeWindowOpen: true,
    },
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self' 'unsafe-inline' data:;",
            "script-src 'self' 'unsafe-eval' *;",
            "connect-src 'self' https: http:;",
          ].join(" "),
        },
      });
    }
  );

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (isDevelopment) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  globalShortcut.register("CommandOrControl+G", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    execFile(
      "osascript",
      [path.join(__dirname, "get-highlighted-text.applescript")],
      (error, selectedText, stderr) => {
        if (mainWindow) {
          if (mainWindow.webContents.isLoading()) {
            mainWindow.webContents.once("did-finish-load", () => {
              mainWindow.webContents.send("selected-text", selectedText);
              mainWindow.show();
            });
          } else {
            mainWindow.webContents.send("selected-text", selectedText);
            mainWindow.show();
          }
        }
      }
    );
  });

  ipcMain.handle("save-settings", async (_event, settingsJsonStr) => {
    try {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, settingsJsonStr);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle("get-settings", async () => {
    const settingsJsonStr = await keytar.getPassword(
      SERVICE_NAME,
      ACCOUNT_NAME
    );
    return settingsJsonStr;
  });

  ipcMain.handle("get-llm-response", async (_event, selectedText) => {
    try {
      const settingsJsonStr = await keytar.getPassword(
        SERVICE_NAME,
        ACCOUNT_NAME
      );
      const settings = JSON.parse(settingsJsonStr);
      const llm = new ChatOpenAI({
        model: "gpt-3.5-turbo",
        temperature: 0,
        streaming: false,
        apiKey: settings.apiKey,
      });

      const prompt = `${settings.basePrompt} 
      User aks: ${selectedText}`;

      const result = await llm.invoke(prompt);
      return result.content;
    } catch (e) {
      return "Error fetching response. Please try again later.";
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  app.dock.hide();
  // app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
