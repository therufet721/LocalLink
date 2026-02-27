import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initTray } from "./tray.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
  initTray();
}
