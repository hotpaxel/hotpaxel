use crate::models::{ErrorResponse, FontInfo};
use axum::{extract::Json, response::IntoResponse};
use http::StatusCode;
use std::process::Command;

pub async fn get_fonts() -> impl IntoResponse {
    let output = match Command::new("fc-list").output() {
        Ok(o) => o,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: format!("Failed to execute fc-list: {}", e),
                    output: None,
                }),
            )
                .into_response()
        }
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut fonts = Vec::new();

    let debug_fonts = std::env::var("PAXEL_DEBUG_FONTS")
        .map(|v| v == "1")
        .unwrap_or(false);

    for line in stdout.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split(':').collect();
        if parts.len() >= 2 {
            let file_path = parts[0].trim();
            let file_name = std::path::Path::new(file_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(file_path)
                .to_string();
            let family_raw = parts[1].trim();

            let mut styles = Vec::new();
            let family = family_raw.to_string();

            if parts.len() >= 3 {
                let style_part = parts[2].trim();
                if style_part.starts_with("style=") {
                    styles = style_part["style=".len()..]
                        .split(',')
                        .map(|s| s.trim().to_string())
                        .collect();
                }
            }

            fonts.push(FontInfo {
                family,
                styles,
                file_name,
                raw: if debug_fonts {
                    Some(line.to_string())
                } else {
                    None
                },
            });
        }
    }

    (StatusCode::OK, Json(fonts)).into_response()
}
