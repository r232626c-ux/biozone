const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const http = require("http");

let backendProcess;

// Determine backend executable paths (development and packaged)
const exeDevPath = path.join(__dirname, "..", "backend", "run_app.exe");
const exeProdPath = path.join(process.resourcesPath || __dirname, "backend", "run_app.exe");

// Prefer bundled exe if available, otherwise fall back to Python
function getBackendLauncher() {
  if (fs.existsSync(exeDevPath)) return { type: "exe", path: exeDevPath };
  if (fs.existsSync(exeProdPath)) return { type: "exe", path: exeProdPath };
  return { type: "python", path: null };
}

// Wait until backend responds
function waitForBackend(url = "http://192.168.1.114:8000", timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http
        .get(url, () => resolve())
        .on("error", () => {
          if (Date.now() - start > timeoutMs) return reject(new Error("Backend timeout"));
          setTimeout(check, 500);
        });
    };
    check();
  });
}

// Create the Electron window and load the SPA served by backend
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    },
  });

  // Load the backend URL which serves the SPA
  win.loadURL("http://127.0.0.1:8000");
}

// Start backend: either the packaged exe or a Python-based launcher
async function startBackend() {
  const launcher = getBackendLauncher();

  if (launcher.type === "exe") {
    // Start bundled exe (no console)
    backendProcess = spawn(launcher.path, [], {
      cwd: path.join(__dirname, "..", "backend"),
      windowsHide: true,
      detached: false,
    });
  } else {
    // Fallback: try to run using python (must be on PATH)
    const PYTHON = process.env.PYTHON || "python";
    backendProcess = spawn(PYTHON, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], {
      cwd: path.join(__dirname, "..", "backend"),
      windowsHide: true,
      detached: false,
    });
  }

  backendProcess.stdout.on("data", (data) => {
    console.log(`BACKEND: ${data}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`BACKEND ERROR: ${data}`);
  });

  try {
    await waitForBackend();
    console.log("Backend is ready, opening window...");
    createWindow();
  } catch (err) {
    console.error("Failed to start backend:", err);
    app.quit();
  }
}

// App events
app.whenReady().then(startBackend);

app.on("window-all-closed", () => {
  try {
    if (backendProcess) {
      backendProcess.kill();
    }
  } catch (e) {
    // ignore
  }
  if (process.platform !== "darwin") app.quit();
});