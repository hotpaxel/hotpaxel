mod handlers;
mod models;
mod proto;

use crate::handlers::{compiler, fonts, grpc_compiler, grpc_font, grpc_system};
use crate::proto::hotpaxel::v1::compiler_service_server::CompilerServiceServer;
use crate::proto::hotpaxel::v1::font_service_server::FontServiceServer;
use crate::proto::hotpaxel::v1::system_service_server::SystemServiceServer;
use axum::{
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use serde_json::json;
use std::net::SocketAddr;
use std::path::PathBuf;
use tower_http::services::ServeDir;
use http_body_util::BodyExt;

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

    // gRPC Services
    let grpc_compiler = CompilerServiceServer::new(grpc_compiler::MyCompiler {});
    let grpc_font = FontServiceServer::new(
        grpc_font::MyFontService {
            static_dir: args.static_dir.clone(),
        }
    );
    let grpc_system = SystemServiceServer::new(grpc_system::MySystemService {});

    // For gRPC-Web support with Axum 0.7, we need to bridge the body types.
    // Axum 0.7 uses axum::body::Body, while tonic-web expects its own BoxBody.
    macro_rules! bridge_grpc {
        ($svc:expr) => {
            tower::ServiceBuilder::new()
                .map_request(|req: http::Request<axum::body::Body>| {
                    req.map(|body| {
                        body.map_err(|e| tonic::Status::internal(e.to_string()))
                            .boxed_unsync()
                    })
                })
                .service(tonic_web::enable($svc))
        };
    }

    let app = app
        .nest_service("/hotpaxel.v1.CompilerService", bridge_grpc!(grpc_compiler))
        .nest_service("/hotpaxel.v1.FontService", bridge_grpc!(grpc_font))
        .nest_service("/hotpaxel.v1.SystemService", bridge_grpc!(grpc_system));

    let addr = SocketAddr::from(([0, 0, 0, 0], args.port));
    tracing::info!("HOTPAXEL server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
