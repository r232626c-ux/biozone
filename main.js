const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL("http://192.168.1.114:5173");
}

app.whenReady().then(() => {
  backendProcess = exec(
    "python backend/init_db.py && uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"
  );

  exec("cd frontend && npm start");

  createWindow();
});

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});
