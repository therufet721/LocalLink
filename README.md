# 🌐 LocalLink (Cross-Platform)

Zero-config local development sharing for macOS, Windows, and Linux.

## Why it exists

Dev servers (React, Vite, Next.js) often default to `localhost`, making them invisible to your phone. LocalLink finds your machine's IP, identifies active dev ports, and generates a QR code so you can test on mobile instantly.

## Prerequisites

- **Node.js** (v18 or later) and npm
- **Rust** — install from [rustup.rs](https://rustup.rs)
- **Platform setup** for Tauri:
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Windows:** [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually pre-installed)
  - **Linux:** `webkit2gtk`, `libappindicator`, etc. — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Install & Run

```bash
# Clone the repo (or download and extract)
cd LocalLink

# Install dependencies
npm install

# Run in development mode (opens the app + system tray)
npm run tauri dev
```

The app window opens and a LocalLink icon appears in your system tray (menu bar on macOS). Click it to show/hide the window.

## Build for production

```bash
npm run tauri build
```

Outputs are in `src-tauri/target/release/bundle/` (installer or `.app` depending on your OS).

## 🚀 How to use

1. Run LocalLink (it lives in your System Tray/Menu Bar).
2. Start your React/Vite project with `--host`.
3. Click the LocalLink icon, scan the QR, and start testing.

## 🛠 Under the Hood

- **Rust Backend:** Scans TCP table to find active listeners.
- **Polling IPC:** Frontend polls the backend every 3 seconds for port updates.
- **Native Tray:** Uses OS-native system tray APIs for 0-click access.
