"""
Run and open BIOZONE backend programmatically.
Usage: python run_app.py
This starts the FastAPI app via uvicorn and opens the default browser.
"""
import threading
import time
import webbrowser
import uvicorn

HOST = "0.0.0.0"  # Listen on all network interfaces
PORT = 8000
URL = "http://127.0.0.1:8000"  # But open browser on localhost


def open_browser():
    # Wait briefly to give server time to start
    time.sleep(1)
    try:
        webbrowser.open(URL)
    except Exception:
        pass


if __name__ == "__main__":
    # Start browser thread
    t = threading.Thread(target=open_browser, daemon=True)
    t.start()

    # Run uvicorn programmatically
    uvicorn.run("app.main:app", host=HOST, port=PORT, log_level="info")
