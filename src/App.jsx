import { useState, useEffect, useCallback } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

function App() {
  const [localInfo, setLocalInfo] = useState({ ip: null, active_ports: [] });
  const [error, setError] = useState(null);

  const fetchLocalInfo = useCallback(async () => {
    if (!isTauri() || !window.__TAURI_INTERNALS__) return;
    try {
      const info = await invoke("get_local_info");
      setLocalInfo(info);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    let intervalId;
    let retryId;
    const startPolling = () => {
      if (!window.__TAURI_INTERNALS__) {
        retryId = setTimeout(startPolling, 100);
        return;
      }
      fetchLocalInfo();
      intervalId = setInterval(fetchLocalInfo, 3000);
    };
    startPolling();
    return () => {
      if (retryId) clearTimeout(retryId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchLocalInfo]);

  const copyToClipboard = async (url) => {
    if (!isTauri()) return;
    try {
      await writeText(url);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const { ip, active_ports } = localInfo;

  const inTauri = typeof window !== "undefined" && isTauri();

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 p-4 font-sans">
      <h1 className="text-xl font-semibold mb-4 text-zinc-200">LocalLink</h1>

      {!inTauri && (
        <p className="text-amber-400 text-sm mb-4">
          Run with <code className="bg-zinc-800 px-1 rounded">npm run tauri dev</code> to use LocalLink.
        </p>
      )}

      {error && (
        <p className="text-amber-400 text-sm mb-4">Error: {error}</p>
      )}

      {inTauri && !ip && !error && (
        <p className="text-zinc-500 text-sm mb-4">Detecting network...</p>
      )}

      {ip && active_ports.length === 0 && (
        <p className="text-zinc-500 text-sm mb-4">
          No dev servers detected on common ports (3000, 5173, 8000, 8080).
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
                    onClick={() => copyToClipboard(url)}
                    className="text-xs px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded transition-colors"
                  >
                    Copy URL
                  </button>
                </div>
                <p className="font-mono text-xs text-zinc-400 mb-3 break-all">
                  {url}
                </p>
                <div className="flex justify-center p-3 bg-white rounded-lg">
                  <QRCodeSVG
                    value={url}
                    size={140}
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
