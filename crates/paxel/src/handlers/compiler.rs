use crate::models::{CompileRequest, ErrorResponse};
use axum::{extract::Json, response::IntoResponse, response::Response};
use http::{header, StatusCode};
use std::process::Command;
use tempfile::tempdir;
use tokio::fs;
use uuid::Uuid;

pub async fn compile_tex(Json(payload): Json<CompileRequest>) -> impl IntoResponse {
    let id = Uuid::new_v4().to_string();
    let dir = match tempdir() {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: format!("Failed to create temp dir: {e}"),
                    output: None,
                }),
            )
                .into_response()
        }
    };

    let tex_path = dir.path().join("document.tex");
    let pdf_path = dir.path().join("document.pdf");

    if let Err(e) = fs::write(&tex_path, payload.tex).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: format!("Failed to write TeX file: {e}"),
                output: None,
            }),
        )
            .into_response();
    }

    // Run xelatex
    let output = match Command::new("xelatex")
        .arg("-interaction=nonstopmode")
        .arg("-halt-on-error")
        .arg(format!("-output-directory={}", dir.path().display()))
        .arg(&tex_path)
        .output()
    {
        Ok(o) => o,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: format!("Failed to execute xelatex: {e}"),
                    output: None,
                }),
            )
                .into_response()
        }
    };

    if !output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let combined_output = format!("{stdout}\n{stderr}");

        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "LaTeX compilation failed".to_string(),
                output: Some(combined_output),
            }),
        )
            .into_response();
    }

    if !pdf_path.exists() {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "PDF was not generated".to_string(),
                output: None,
            }),
        )
            .into_response();
    }

    match fs::read(&pdf_path).await {
        Ok(bytes) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/pdf")
            .header(
                header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{id}.pdf\""),
            )
            .body(axum::body::Body::from(bytes))
            .unwrap()
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: format!("Failed to read PDF: {e}"),
                output: None,
            }),
        )
            .into_response(),
    }
}
