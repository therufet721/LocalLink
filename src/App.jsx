import { useState, useEffect, useCallback } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { QRCodeSVG } from "qrcode.react";
import { validatePort } from "./utils/portValidation.js";
import "./App.css";

function App() {
  const [localInfo, setLocalInfo] = useState({ ip: null, active_ports: [] });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPort, setCopiedPort] = useState(null);
  const [copyError, setCopyError] = useState(null);
  const [customPorts, setCustomPorts] = useState(() => {
    try {
      const saved = localStorage.getItem("locallink-custom-ports");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [portInput, setPortInput] = useState("");
  const [portInputError, setPortInputError] = useState(null);
  const [trayError, setTrayError] = useState(null);

  useEffect(() => {
    if (!isTauri()) return;
    const handler = (e) =>
      setTrayError(e.detail || "Tray failed to initialize");
    window.addEventListener("locallink-tray-error", handler);
    return () => window.removeEventListener("locallink-tray-error", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("locallink-custom-ports", JSON.stringify(customPorts));
  }, [customPorts]);

  const fetchLocalInfo = useCallback(async () => {
    if (!isTauri()) return;
    setIsLoading(true);
    try {
      const info = await invoke("get_local_info", { extraPorts: customPorts });
      setLocalInfo(info);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, [customPorts]);

  useEffect(() => {
    if (!isTauri()) return;
    let intervalId;
    let retryId;
    const MAX_RETRIES = 30;
    const INITIAL_DELAY_MS = 100;
    const MAX_DELAY_MS = 5000;

    const startPolling = async (retryCount = 0) => {
      setIsLoading(true);
      try {
        const info = await invoke("get_local_info", {
          extraPorts: customPorts,
        });
        setLocalInfo(info);
        setError(null);
        setIsLoading(false);
        intervalId = setInterval(fetchLocalInfo, 3000);
      } catch {
        if (retryCount >= MAX_RETRIES) {
          setError("Could not connect to backend. Please restart LocalLink.");
          setIsLoading(false);
          return;
        }
        const delay = Math.min(
          INITIAL_DELAY_MS * Math.pow(2, retryCount),
          MAX_DELAY_MS
        );
        retryId = setTimeout(() => startPolling(retryCount + 1), delay);
      }
    };
    startPolling();
    return () => {
      if (retryId) clearTimeout(retryId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchLocalInfo, customPorts]);

  const copyToClipboard = async (url, port) => {
    if (!isTauri()) return;
    setCopyError(null);
    try {
      await writeText(url);
      setCopiedPort(port);
      setTimeout(() => setCopiedPort(null), 2000);
    } catch {
      setCopyError("Failed to copy to clipboard");
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  const addCustomPort = () => {
    const error = validatePort(portInput, customPorts);
    if (error) {
      setPortInputError(error);
      return;
    }
    const num = parseInt(portInput, 10);
    setCustomPorts((prev) => [...prev, num]);
    setPortInput("");
    setPortInputError(null);
  };

  const removeCustomPort = (port) => {
    setCustomPorts((prev) => prev.filter((p) => p !== port));
  };

  const handlePortKeyDown = (e) => {
    if (e.key === "Enter") addCustomPort();
  };

  const { ip, active_ports } = localInfo;
  const inTauri = typeof window !== "undefined" && isTauri();

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 p-4 font-sans">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img
            src="/Logo.png"
            alt=""
            className="h-8 w-8 object-contain rounded-lg"
            aria-hidden
          />
          <h1 className="text-xl font-semibold text-zinc-200">LocalLink</h1>
        </div>
        {inTauri && (
          <button
            type="button"
            onClick={() => fetchLocalInfo()}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            {isLoading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>

      {!inTauri && (
        <p className="text-amber-400 text-sm mb-4">
          Run with{" "}
          <code className="bg-zinc-800 px-1 rounded">npm run tauri dev</code> to
          use LocalLink.
        </p>
      )}

      {trayError && (
        <p className="text-amber-400 text-sm mb-4" role="alert">
          System tray unavailable: {trayError}. You can still use the app.
        </p>
      )}

      {/* Custom port input */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="65535"
            value={portInput}
            onChange={(e) => {
              setPortInput(e.target.value);
              setPortInputError(null);
            }}
            onKeyDown={handlePortKeyDown}
            placeholder="Add port…"
            aria-label="Add custom port (1–65535)"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm font-mono placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={addCustomPort}
            className="text-sm px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
          >
            Add
          </button>
        </div>
        {portInputError && (
          <p className="text-amber-400 text-xs mt-1">{portInputError}</p>
        )}
        {customPorts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {customPorts.map((port) => (
              <span
                key={port}
                className="flex items-center gap-1 bg-zinc-700 text-zinc-300 text-xs font-mono px-2 py-0.5 rounded"
              >
                {port}
                <button
                  type="button"
                  onClick={() => removeCustomPort(port)}
                  aria-label={`Remove port ${port}`}
                  className="text-zinc-400 hover:text-zinc-100 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-amber-400 text-sm mb-4">Error: {error}</p>}

      {copyError && <p className="text-amber-400 text-sm mb-4">{copyError}</p>}

      {inTauri && !ip && !error && (
        <p className="text-zinc-500 text-sm mb-4">
          {isLoading ? "Detecting network…" : "Detecting network…"}
        </p>
      )}

      {ip && active_ports.length === 0 && (
        <p className="text-zinc-500 text-sm mb-4">
          No dev servers detected on common ports (3000, 4200, 4321, 5173, 8000,
          8080, …).
          <br />
          <span className="text-amber-400/90 text-xs mt-2 block">
            Tip: Start your app with --host to enable mobile access.
          </span>
        </p>
      )}

      <div className="space-y-4">
        {ip &&
          active_ports.map((port) => {
            const url = `http://${ip}:${port}`;
            return (
              <div
                key={port}
                className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-zinc-300">
                    Port {port}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(url, port)}
                    className="text-xs px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded transition-colors"
                  >
                    {copiedPort === port ? "Copied!" : "Copy URL"}
                  </button>
                </div>
                <p className="font-mono text-xs text-zinc-400 mb-3 break-all">
                  {url}
                </p>
                <div className="flex justify-center p-3 bg-white rounded-lg">
                  <QRCodeSVG
                    value={url}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </main>
  );
}

export default App;
