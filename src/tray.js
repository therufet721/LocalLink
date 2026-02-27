import { TrayIcon } from "@tauri-apps/api/tray";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { defaultWindowIcon } from "@tauri-apps/api/app";

export async function initTray() {
  const window = getCurrentWebviewWindow();

  const tray = await TrayIcon.new({
    icon: await defaultWindowIcon(),
    tooltip: "LocalLink",
    showMenuOnLeftClick: false,
    action: async (event) => {
      if (event.type === "Click" && event.button === "Left") {
        const isVisible = await window.isVisible();
        if (isVisible) {
          await window.hide();
        } else {
          await window.show();
          await window.setFocus();
        }
      }
    },
  });
}
