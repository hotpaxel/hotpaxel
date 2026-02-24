use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CompileRequest {
    pub tex: String,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub message: String,
    pub output: Option<String>,
}

#[derive(Serialize)]
pub struct FontInfo {
    pub family: String,
    pub styles: Vec<String>,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<String>,
}
