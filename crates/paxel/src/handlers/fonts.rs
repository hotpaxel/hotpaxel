use crate::models::{ErrorResponse, FontInfo};
use axum::{
    extract::{Json, Path},
    response::IntoResponse,
};
use http::{header, StatusCode};
use std::collections::{HashMap, HashSet};
use std::process::Command;
use std::sync::OnceLock;
use tokio::fs;

struct FontCache {
    list: Vec<FontInfo>,
    paths: HashMap<String, String>,
}

static FONT_CACHE: OnceLock<FontCache> = OnceLock::new();

fn init_fonts() -> &'static FontCache {
    FONT_CACHE.get_or_init(|| {
        let output = match Command::new("fc-list").output() {
            Ok(o) => o,
            Err(e) => {
                tracing::error!("Failed to execute fc-list: {}", e);
                return FontCache {
                    list: vec![],
                    paths: HashMap::new(),
                };
            }
        };

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut list = Vec::new();
        let mut paths = HashMap::new();
        let mut seen_families = HashSet::new();

        let debug_fonts = std::env::var("PAXEL_DEBUG_FONTS")
            .map(|v| v == "1")
            .unwrap_or(false);

        for line in stdout.lines() {
            if line.trim().is_empty() {
                continue;
            }

            let parts: Vec<&str> = line.split(':').collect();
            if parts.len() >= 2 {
                let file_path = parts[0].trim().to_string();
                let lower_path = file_path.to_lowercase();

                // Filter out non-TTF/OTF/TTC fonts (e.g., PFB, Type1) to prevent clutter and rendering issues
                if !(lower_path.ends_with(".ttf")
                    || lower_path.ends_with(".otf")
                    || lower_path.ends_with(".ttc"))
                {
                    continue;
                }

                let file_name = std::path::Path::new(&file_path)
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or(&file_path)
                    .to_string();

                let family_raw = parts[1].trim();

                // Clean the family name: some have commas, we take the first recognizable name
                let family = family_raw
                    .split(',')
                    .next()
                    .unwrap_or(family_raw)
                    .trim()
                    .to_string();

                // Filter out math/system fallback fonts which are not suited for standard WYSIWYG
                if family.to_lowercase().contains("math")
                    || family.starts_with('.')
                    || family.to_lowercase().contains("dingbats")
                {
                    continue;
                }

                if !seen_families.contains(&family) {
                    let mut styles = Vec::new();
                    if parts.len() >= 3 {
                        let style_part = parts[2].trim();
                        if let Some(stripped) = style_part.strip_prefix("style=") {
                            styles = stripped.split(',').map(|s| s.trim().to_string()).collect();
                        }
                    }

                    list.push(FontInfo {
                        family: family.clone(),
                        styles,
                        file_name: file_name.clone(),
                        raw: if debug_fonts {
                            Some(line.to_string())
                        } else {
                            None
                        },
                    });
                    seen_families.insert(family);
                }

                paths.insert(file_name, file_path);
            }
        }

        list.sort_by(|a, b| a.family.to_lowercase().cmp(&b.family.to_lowercase()));

        FontCache { list, paths }
    })
}

pub async fn get_fonts() -> impl IntoResponse {
    let cache = init_fonts();
    (StatusCode::OK, Json(cache.list.clone())).into_response()
}

pub async fn download_font(Path(file_name): Path<String>) -> impl IntoResponse {
    let cache = init_fonts();

    if let Some(file_path) = cache.paths.get(&file_name) {
        if let Ok(bytes) = fs::read(file_path).await {
            let ext = std::path::Path::new(&file_name)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("");

            let content_type = match ext.to_lowercase().as_str() {
                "ttf" => "font/ttf",
                "otf" => "font/otf",
                "ttc" => "font/collection",
                _ => "application/octet-stream",
            };

            return axum::response::Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, content_type)
                .header(header::CACHE_CONTROL, "public, max-age=31536000") // 1 year cache for static fonts
                .body(axum::body::Body::from(bytes))
                .unwrap()
                .into_response();
        }
    }

    (
        StatusCode::NOT_FOUND,
        Json(ErrorResponse {
            message: "Font not found or could not be read".to_string(),
            output: None,
        }),
    )
        .into_response()
}
