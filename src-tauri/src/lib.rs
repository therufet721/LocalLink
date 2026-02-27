use serde::{Deserialize, Serialize};
use tokio::net::TcpStream;

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalInfo {
    pub ip: Option<String>,
    pub active_ports: Vec<u16>,
}

const COMMON_PORTS: [u16; 5] = [1420, 3000, 5173, 8000, 8080];

async fn is_port_listening(port: u16) -> bool {
    let addr = format!("127.0.0.1:{}", port);
    match tokio::time::timeout(
        std::time::Duration::from_millis(200),
        TcpStream::connect(&addr),
    )
    .await
    {
        Ok(Ok(_)) => true,
        _ => false,
    }
}

#[tauri::command]
async fn get_local_info() -> Result<LocalInfo, String> {
    let ip = local_ip_address::local_ip().map(|ip| ip.to_string()).ok();

    let mut active_ports = Vec::new();
    for port in COMMON_PORTS {
        if is_port_listening(port).await {
            active_ports.push(port);
        }
    }

    Ok(LocalInfo { ip, active_ports })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|_app| {
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_local_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
