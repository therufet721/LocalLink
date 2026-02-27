use serde::{Deserialize, Serialize};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tokio::net::TcpStream;

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalInfo {
    pub ip: Option<String>,
    pub active_ports: Vec<u16>,
}

// Common dev server ports: Vite, React/Node, Angular, Astro, Python, generic HTTP, Jupyter, misc
// 1420 excluded — that's LocalLink's own dev server port
// 5000 excluded — macOS AirPlay Receiver occupies it and produces false positives
const COMMON_PORTS: [u16; 10] = [3000, 3001, 4200, 4321, 5173, 8000, 8080, 8888, 9000, 9090];

async fn is_port_listening(port: u16) -> bool {
    // Try both IPv4 and IPv6 localhost concurrently — Node.js 18+ binds to ::1 by default
    tokio::time::timeout(
        std::time::Duration::from_millis(200),
        async {
            let (v4, v6) = tokio::join!(
                TcpStream::connect(format!("127.0.0.1:{}", port)),
                TcpStream::connect(format!("[::1]:{}", port)),
            );
            v4.is_ok() || v6.is_ok()
        },
    )
    .await
    .unwrap_or(false)
}

#[tauri::command]
async fn get_local_info(extra_ports: Vec<u16>) -> Result<LocalInfo, String> {
    // IPv4 only; IPv6 support can be added if needed
    let ip = local_ip_address::local_ip().map(|ip| ip.to_string()).ok();

    // Merge default ports with user-provided ports, deduplicating
    let mut ports_to_check: Vec<u16> = COMMON_PORTS.to_vec();
    for port in extra_ports {
        if !ports_to_check.contains(&port) {
            ports_to_check.push(port);
        }
    }

    // Scan all ports concurrently
    let mut set = tokio::task::JoinSet::new();
    for port in ports_to_check {
        set.spawn(async move { (port, is_port_listening(port).await) });
    }

    let mut active_ports = Vec::new();
    while let Some(Ok((port, listening))) = set.join_next().await {
        if listening {
            active_ports.push(port);
        }
    }
    active_ports.sort();

    Ok(LocalInfo { ip, active_ports })
}

#[tauri::command]
fn quit(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let open_item =
                MenuItem::with_id(app, "open", "Open LocalLink", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_item, &quit_item])?;

            let icon = Image::from_bytes(include_bytes!("../icons/tray-icon.png"))
                .expect("Failed to load tray icon");

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("LocalLink")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_local_info, quit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
