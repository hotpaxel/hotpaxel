use crate::models::{CompileRequest, ErrorResponse};
use axum::{extract::Json, response::IntoResponse};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use http::StatusCode;
use std::path::Path;
use tempfile::tempdir;
use tokio::fs;
use tokio::process::Command;
use uuid::Uuid;

pub async fn compile_tex(Json(payload): Json<CompileRequest>) -> impl IntoResponse {
    match execute_compilation(payload).await {
        Ok(pdf_bytes) => (
            StatusCode::OK,
            [("Content-Type", "application/pdf")],
            pdf_bytes,
        )
            .into_response(),
        Err(err) => (err.status, Json(err.error)).into_response(),
    }
}

pub struct CompilationError {
    pub status: StatusCode,
    pub error: ErrorResponse,
}

pub async fn execute_compilation(payload: CompileRequest) -> Result<Vec<u8>, CompilationError> {
    let _id = Uuid::new_v4().to_string();
    let dir = match tempdir() {
        Ok(d) => d,
        Err(e) => {
            return Err(CompilationError {
                status: StatusCode::INTERNAL_SERVER_ERROR,
                error: ErrorResponse {
                    message: format!("Failed to create temp dir: {e}"),
                    output: None,
                },
            });
        }
    };

    let tex_path = dir.path().join("document.tex");
    let _pdf_path = dir.path().join("document.pdf");

    if let Err(e) = fs::write(&tex_path, payload.tex).await {
        return Err(CompilationError {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            error: ErrorResponse {
                message: format!("Failed to write TeX file: {e}"),
                output: None,
            },
        });
    }

    // Write assets
    for asset in &payload.assets {
        // Sanitize: only use the final filename component to prevent path traversal
        let safe_name = Path::new(&asset.name)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");
        if safe_name.is_empty() {
            return Err(CompilationError {
                status: StatusCode::BAD_REQUEST,
                error: ErrorResponse {
                    message: format!("Invalid asset filename: {}", asset.name),
                    output: None,
                },
            });
        }

        let asset_bytes = match BASE64.decode(&asset.content) {
            Ok(b) => b,
            Err(e) => {
                return Err(CompilationError {
                    status: StatusCode::BAD_REQUEST,
                    error: ErrorResponse {
                        message: format!("Failed to decode asset '{}': {e}", safe_name),
                        output: None,
                    },
                });
            }
        };

        if let Err(e) = fs::write(dir.path().join(safe_name), asset_bytes).await {
            return Err(CompilationError {
                status: StatusCode::INTERNAL_SERVER_ERROR,
                error: ErrorResponse {
                    message: format!("Failed to write asset '{}': {e}", safe_name),
                    output: None,
                },
            });
        }
    }

    // Run xelatex asynchronously
    let passes = payload.passes.unwrap_or(2);
    let mut last_output = None;

    for _ in 0..passes {
        let output = match Command::new("xelatex")
            .current_dir(dir.path())
            .arg("-interaction=nonstopmode")
            .arg("-halt-on-error")
            .arg("-output-directory=.")
            .arg("document.tex")
            .output()
            .await
        {
            Ok(o) => o,
            Err(e) => {
                return Err(CompilationError {
                    status: StatusCode::INTERNAL_SERVER_ERROR,
                    error: ErrorResponse {
                        message: format!("Failed to execute xelatex: {e}"),
                        output: None,
                    },
                });
            }
        };

        last_output = Some(output);
        if let Some(ref o) = last_output {
            if !o.status.success() {
                break;
            }
        }
    }

    let output = last_output.ok_or_else(|| CompilationError {
        status: StatusCode::INTERNAL_SERVER_ERROR,
        error: ErrorResponse {
            message: "No output from xelatex".to_string(),
            output: None,
        },
    })?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined_output = format!("--- STDOUT ---\n{stdout}\n--- STDERR ---\n{stderr}");

    if !output.status.success() {
        return Err(CompilationError {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            error: ErrorResponse {
                message: "Compilation failed".to_string(),
                output: Some(combined_output),
            },
        });
    }

    match fs::read(dir.path().join("document.pdf")).await {
        Ok(b) => Ok(b),
        Err(e) => Err(CompilationError {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            error: ErrorResponse {
                message: format!("Failed to read generated PDF: {e}"),
                output: Some(combined_output),
            },
        }),
    }
}
