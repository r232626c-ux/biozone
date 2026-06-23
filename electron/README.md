Packaging BIOZONE as an Electron app

Prerequisites
- Node.js + npm
- Python 3.11+ and required Python packages (uvicorn, fastapi, dependencies from backend/requirements.txt)
- PyInstaller (for producing backend executable)

High-level steps
1. Build frontend
   - cd frontend
   - npm run build
   - This produces `frontend/dist`

2. Create bundled backend executable (Windows)
   - cd backend
   - python -m pip install pyinstaller
   - pyinstaller --onefile --add-data "../frontend/dist;frontend/dist" run_app.py
   - After build, copy `dist/run_app.exe` to `electron/../backend/run_app.exe` (the electron builder config expects `backend/run_app.exe` beside the backend folder)

3. Package Electron app
   - cd electron
   - npm install
   - npm run dist
   - Output will be in `electron/dist` or configured installer

Development run (without packaging)
- You can run Electron during development and it will spawn the backend using Python if no `run_app.exe` is found:

```powershell
cd electron
npm install
npm start
```

Notes
- The Electron `main.js` prefers a bundled `run_app.exe` (dev or packaged location) and otherwise falls back to launching Python (requires Python in PATH).
- The `electron/package.json` includes `extraResources` so when packaged with `electron-builder` the `backend/run_app.exe` will be copied into the application resources.
- If you plan to distribute, use `pyinstaller` to produce `run_app.exe` and then `npm run dist` in the `electron` folder.

Troubleshooting
- If the app fails to start, check `uvicorn` log printed to console or logs in the backend.
- Make sure required backend environment variables (DB connection string) are available; you can bake default settings into the packaged backend or use environment/config files placed alongside the exe.

