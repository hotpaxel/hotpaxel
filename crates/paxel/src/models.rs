use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct Asset {
    /// Filename for the asset (e.g. "logo.png")
    pub name: String,
    /// Base64-encoded file content
    pub content: String,
}

#[derive(Deserialize)]
pub struct CompileRequest {
    pub tex: String,
    /// Optional assets (images, etc.) to place alongside the .tex file
    #[serde(default)]
    pub assets: Vec<Asset>,
    /// Number of xelatex passes (default is 2)
    #[serde(default)]
    pub passes: Option<u8>,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub message: String,
    pub output: Option<String>,
}

#[derive(Serialize)]
pub struct CompileResponse {
    pub pdf: String, // Base64 encoded
    #[serde(rename = "compileTimeMs")]
    pub compile_time_ms: u64,
    #[serde(rename = "totalTimeMs")]
    pub total_time_ms: u64,
}

#[derive(Serialize, Clone)]
pub struct FontInfo {
    pub family: String,
    pub styles: Vec<String>,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<String>,
}
