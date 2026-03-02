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

    pub fn compile(&self, mut tex: String, passes: Option<u8>) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let assets = self.extract_assets(&mut tex)?;
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

    fn extract_assets(&self, tex: &mut String) -> Result<Vec<Asset>, Box<dyn std::error::Error>> {
        let re = Regex::new(r"\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}")?;
        let mut remote_mappings = Vec::new();
        let mut assets = Vec::new();
        let mut processed_names = HashSet::new();

        for cap in re.captures_iter(tex) {
            let original_name = cap[1].to_string();
            if processed_names.contains(&original_name) {
                continue;
            }

            if original_name.starts_with("http://") || original_name.starts_with("https://") {
                // Remote asset: download and give it a safe name
                match self.client.get(&original_name).send() {
                    Ok(resp) if resp.status().is_success() => {
                        let bytes = resp.bytes()?.to_vec();
                        // Use a hash or simple unique name to avoid path issues
                        let ext = original_name.split('.').last().unwrap_or("bin");
                        let safe_name = format!("remote_{}.{}", processed_names.len(), ext);
                        
                        assets.push(Asset {
                            name: safe_name.clone(),
                            content: BASE64.encode(bytes),
                        });
                        remote_mappings.push((original_name.clone(), safe_name));
                    }
                    _ => {
                        eprintln!("Warning: Failed to download remote asset: {}", original_name);
                    }
                }
            } else {
                // Local asset
                let path = Path::new(&original_name);
                if path.exists() {
                    let bytes = fs::read(path)?;
                    assets.push(Asset {
                        name: original_name.clone(),
                        content: BASE64.encode(bytes),
                    });
                } else {
                    eprintln!("Warning: Local asset not found: {}", original_name);
                }
            }
            processed_names.insert(original_name);
        }

        // Replace remote URLs in TeX with safe names
        for (url, safe_name) in remote_mappings {
            *tex = tex.replace(&url, &safe_name);
        }

        Ok(assets)
    }
}
