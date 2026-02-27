import { TrayIcon } from "@tauri-apps/api/tray";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Image } from "@tauri-apps/api/image";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";
import trayIconUrl from "./assets/tray-icon.png";

export async function initTray() {
  const window = getCurrentWebviewWindow();

  const response = await fetch(trayIconUrl);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const icon = await Image.fromBytes(bytes);

  const menu = await Menu.new({
    items: [
      await MenuItem.new({
        text: "Open LocalLink",
        action: async () => {
          await window.show();
          await window.setFocus();
        },
      }),
      await MenuItem.new({
        text: "Quit",
        action: async () => {
          await invoke("quit");
        },
      }),
    ],
  });

  const _tray = await TrayIcon.new({
    icon,
    tooltip: "LocalLink",
    menu,
    menuOnLeftClick: false,
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
