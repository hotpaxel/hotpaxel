mod handlers;
mod models;
mod proto;

use crate::handlers::{compiler, fonts, grpc_compiler, grpc_font, grpc_system};
use crate::proto::hotpaxel::v1::compiler_service_server::CompilerServiceServer;
use crate::proto::hotpaxel::v1::font_service_server::FontServiceServer;
use crate::proto::hotpaxel::v1::system_service_server::SystemServiceServer;
use axum::{
    response::{IntoResponse, Redirect},
    routing::{any, get, post},
    Json, Router,
};
use clap::Parser;
use http_body_util::BodyExt;
use serde_json::json;
use std::net::SocketAddr;
use std::path::PathBuf;
use tower::util::service_fn;
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

    /// Directory to serve documentation from
    #[arg(long, env = "DOCS_DIR", default_value = "./docs")]
    docs_dir: String,

    /// Disable API documentation serving
    #[arg(long, env = "DISABLE_DOCS", default_value_t = false)]
    disable_docs: bool,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let args = Args::parse();

    let static_path = PathBuf::from(&args.static_dir);
    let not_found_path = static_path.join("404.html");

    let mut app = Router::new()
        // API Routes (Nested under /api for better structure and isolation)
        .nest(
            "/api",
            Router::new()
                .route("/compile", post(compiler::compile_tex))
                .route("/fonts", get(fonts::get_fonts))
                .route("/fonts/:file_name", get(fonts::download_font))
                .route("/health", get(|| async { "ok" }))
                .route(
                    "/version",
                    get(|| async {
                        Json(json!({
                            "version": env!("CARGO_PKG_VERSION"),
                            "name": env!("CARGO_PKG_NAME")
                        }))
                    }),
                )
                .fallback(any(|| async { (http::StatusCode::NOT_FOUND, "API Endpoint Not Found") })),
        );

    // API Documentation Serving
    if !args.disable_docs {
        let docs_path = PathBuf::from(&args.docs_dir);
        if docs_path.exists() {
            tracing::info!("Serving API documentation from: {:?}", docs_path);
            let serve_docs = ServeDir::new(&docs_path);
            
            // Primary route /docs/
            app = app.nest_service("/docs/", serve_docs);

            // Aliases and Redirects
            app = app.route("/docs", get(|| async { Redirect::permanent("/docs/") }));
            app = app.route("/doc", get(|| async { Redirect::permanent("/docs/") }));
            app = app.route("/doc/", get(|| async { Redirect::permanent("/docs/") }));
        } else {
            tracing::warn!(
                "Documentation directory {:?} not found, /docs serving disabled.",
                docs_path
            );
        }
    }

    // UI Serving (Must be combined with fallback logic to avoid overwriting)
    if !args.disable_ui && static_path.exists() {
        tracing::info!("Serving static files from: {:?}", static_path);
        let serve_dir = ServeDir::new(&static_path);
        
        // Final Fallback: First try static files, then our custom 404 page
        app = app.fallback_service(
            serve_dir.fallback(service_fn(move |req: http::Request<axum::body::Body>| {
                let not_found_path = not_found_path.clone();
                async move {
                    match tokio::fs::read(not_found_path).await {
                        Ok(bytes) => Ok(axum::response::Response::builder()
                            .status(http::StatusCode::NOT_FOUND)
                            .header(http::header::CONTENT_TYPE, "text/html")
                            .body(axum::body::Body::from(bytes))
                            .unwrap()),
                        Err(_) => Ok((http::StatusCode::NOT_FOUND, "404 Not Found").into_response()),
                    }
                }
            }))
        );
    } else {
        // No UI, just simple 404
        app = app.fallback(any(|| async { (http::StatusCode::NOT_FOUND, "404 Not Found") }));
    }

    // gRPC Services
    let grpc_compiler = CompilerServiceServer::new(grpc_compiler::MyCompiler {});
    let grpc_font = FontServiceServer::new(grpc_font::MyFontService {
        static_dir: args.static_dir.clone(),
    });
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
