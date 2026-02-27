# 🌐 LocalLink (Cross-Platform)

Zero-config local development sharing for macOS, Windows, and Linux.

## Why it exists

Dev servers (React, Vite, Next.js) often default to `localhost`, making them invisible to your phone. LocalLink finds your machine's IP, identifies active dev ports, and generates a QR code so you can test on mobile instantly.

## 🚀 How to use

1. Run LocalLink (it lives in your System Tray/Menu Bar).
2. Start your React/Vite project with `--host`.
3. Click the LocalLink icon, scan the QR, and start testing.

## 🛠 Under the Hood

- **Rust Backend:** Scans TCP table to find active listeners.
- **Bi-directional IPC:** Sends live port updates to the React frontend.
- **Native Tray:** Uses OS-native system tray APIs for 0-click access.
