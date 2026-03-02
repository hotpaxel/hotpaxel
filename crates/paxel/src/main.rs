mod handlers;
mod models;

use crate::handlers::{compiler, fonts};
use axum::{
    body::Body,
    http::{Request, Response, StatusCode},
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use serde_json::json;
use std::net::SocketAddr;
use std::path::PathBuf;
use tower_http::services::ServeDir;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Port to listen on
    #[arg(short, long, env = "PORT", default_value = "8888")]
    port: u16,

    /// Directory to serve static files from
    #[arg(short, long, env = "STATIC_DIR", default_value = "./public")]
    static_dir: String,

    /// Disable UI serving
    #[arg(long, env = "DISABLE_UI", default_value_t = false)]
    disable_ui: bool,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let args = Args::parse();

    let mut app = Router::new()
        // API Routes
        .route("/compile", post(compiler::compile_tex))
        .route("/fonts", get(fonts::get_fonts))
        .route("/fonts/download/:file_name", get(fonts::download_font))
        // Health & Version
        .route("/health", get(|| async { "ok" }))
        .route("/version", get(|| async {
            Json(json!({
                "version": env!("CARGO_PKG_VERSION"),
                "name": env!("CARGO_PKG_NAME")
            }))
        }));

    // UI Serving
    if !args.disable_ui {
        let static_path = PathBuf::from(&args.static_dir);
        if static_path.exists() {
            tracing::info!("Serving static files from: {:?}", static_path);
            
            // SPA Fallback: serve index.html for any unknown route
            let index_path = static_path.join("index.html");
            let serve_dir = ServeDir::new(&static_path)
                .fallback(tower_http::services::ServeFile::new(index_path));
            
            app = app.fallback_service(serve_dir);
        } else {
            tracing::warn!("Static directory {:?} not found, UI serving disabled.", static_path);
        }
    }

    let app = app.layer(tower_http::trace::TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], args.port));
    tracing::info!("HOTPAXEL server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
