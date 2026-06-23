BIOZONE - Create a single Windows executable (optional)

This guide shows how to package the backend into a single .exe using PyInstaller so users can run BIOZONE without a terminal.

1. Install PyInstaller in your environment:

```powershell
python -m pip install pyinstaller
```

2. Build the executable from `run_app.py`:

```powershell
cd backend
pyinstaller --onefile --add-data "../frontend/dist;frontend/dist" run_app.py
```

Notes:
- The `--add-data` path uses a semicolon separator on Windows.
- Adjust paths as necessary; ensure the `frontend/dist` directory exists (run `npm run build` in frontend).
- The produced exe will be in `dist\run_app.exe`.

3. Create a Desktop shortcut pointing to `dist\run_app.exe` for a single-click launcher.

Limitations:
- Large binary size. Test on target machine.
- If you need to include additional assets, add them via `--add-data`.

