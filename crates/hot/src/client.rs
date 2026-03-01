use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::collections::HashSet;
use regex::Regex;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

#[cfg(not(target_arch = "wasm32"))]
pub struct PaxelClient {
    host: String,
    client: reqwest::blocking::Client,
}

#[cfg(not(target_arch = "wasm32"))]
#[derive(Debug, Serialize)]
pub struct CompileRequest {
    pub tex: String,
    pub assets: Vec<Asset>,
    pub passes: Option<u8>,
}

#[cfg(not(target_arch = "wasm32"))]
#[derive(Debug, Serialize)]
pub struct Asset {
    pub name: String,
    pub content: String,
}

#[cfg(not(target_arch = "wasm32"))]
#[derive(Debug, Deserialize)]
pub struct FontInfo {
    pub family: String,
    pub styles: Vec<String>,
    #[serde(rename = "fileName")]
    pub file_name: String,
}

#[cfg(not(target_arch = "wasm32"))]
impl PaxelClient {
    pub fn new(host: String) -> Self {
        Self {
            host,
            client: reqwest::blocking::Client::new(),
        }
    }

    pub fn compile(&self, tex: String, passes: Option<u8>) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let assets = self.extract_assets(&tex)?;
        let request = CompileRequest { tex, assets, passes };

        let resp = self.client.post(format!("{}/compile", self.host))
            .json(&request)
            .send()?;

        if resp.status().is_success() {
            Ok(resp.bytes()?.to_vec())
        } else {
            let err_json: serde_json::Value = resp.json()?;
            let msg = err_json["message"].as_str().unwrap_or("Unknown error");
            let output = err_json["output"].as_str().unwrap_or("");
            Err(format!("Compilation failed: {}\n{}", msg, output).into())
        }
    }

    pub fn list_fonts(&self) -> Result<Vec<FontInfo>, Box<dyn std::error::Error>> {
        let resp = self.client.get(format!("{}/fonts", self.host)).send()?;
        let fonts = resp.json()?;
        Ok(fonts)
    }

    pub fn download_font(&self, name: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let resp = self.client.get(format!("{}/fonts/download/{}", self.host, name)).send()?;
        if resp.status().is_success() {
            Ok(resp.bytes()?.to_vec())
        } else {
            Err(format!("Font download failed: {}", resp.status()).into())
        }
    }

    fn extract_assets(&self, tex: &str) -> Result<Vec<Asset>, Box<dyn std::error::Error>> {
        let re = Regex::new(r"\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}")?;
        let mut asset_names = HashSet::new();
        for cap in re.captures_iter(tex) {
            asset_names.insert(cap[1].to_string());
        }

        let mut assets = Vec::new();
        for name in asset_names {
            let path = Path::new(&name);
            if path.exists() {
                let bytes = fs::read(path)?;
                assets.push(Asset {
                    name,
                    content: BASE64.encode(bytes),
                });
            } else {
                eprintln!("Warning: Asset not found: {}", name);
            }
        }
        Ok(assets)
    }
}
