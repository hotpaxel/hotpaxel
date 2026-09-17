use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone, Copy, Default, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum OverwriteStrategy {
    Always,
    Never,
    #[default]
    Ask,
}

impl std::fmt::Display for OverwriteStrategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            OverwriteStrategy::Always => "always",
            OverwriteStrategy::Never => "never",
            OverwriteStrategy::Ask => "ask",
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Config {
    #[serde(rename = "defaultHost")]
    pub default_host: Option<String>,
    #[serde(default)]
    pub overwrite: OverwriteStrategy,
}

impl Config {
    pub fn new() -> Self {
        Self::load().unwrap_or_default()
    }

    pub fn get_path() -> PathBuf {
        let home = std::env::var("HOME").expect("HOME environment variable not set");
        PathBuf::from(home).join(".hotpaxel").join("hot.json")
    }

    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let path = Self::get_path();
        if !path.exists() {
            return Ok(Self::default());
        }
        let content = fs::read_to_string(path)?;
        let config = serde_json::from_str(&content)?;
        Ok(config)
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let path = Self::get_path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = serde_json::to_string_pretty(self)?;
        fs::write(path, content)?;
        Ok(())
    }
}
