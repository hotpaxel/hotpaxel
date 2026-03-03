use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use clap::{Parser, Subcommand};
use hot::client::PaxelClient;
use std::fs;
use std::path::{Path, PathBuf};
use std::process;

use hot::config::Config;

#[derive(Parser)]
#[command(name = "hot")]
#[command(version, about = "HOTPAXEL Client CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// PAXEL server host (CLI > Env > Config > Default)
    #[arg(long, env = "PAXEL_HOST")]
    host: Option<String>,
}

#[derive(Subcommand)]
enum ConfigAction {
    /// Set a default host
    DefaultHost { url: String },
}

#[derive(Subcommand)]
enum Commands {
    /// Configure settings
    Config {
        #[command(subcommand)]
        action: ConfigAction,
    },
    /// Compile TeX to PDF (requires PAXEL server)
    Compile {
        /// Input .tex (or .html) file
        input: PathBuf,
        /// Output .pdf file
        output: Option<PathBuf>,
        /// Number of xelatex passes
        #[arg(long, default_value = "2")]
        passes: u8,
        /// Input format (auto, html, tex)
        #[arg(long, default_value = "auto")]
        from: String,
    },
    /// Convert document format (local conversion)
    Convert {
        /// Input file
        input: PathBuf,
        /// Output file
        #[arg(short, long)]
        output: Option<PathBuf>,
        /// Input format (auto, html)
        #[arg(long, default_value = "auto")]
        from: String,
    },
    /// List available fonts on the server
    Fonts,
    /// Download a font from the server
    FontDownload {
        /// Font filename on server
        name: String,
        /// Output path
        output: Option<PathBuf>,
    },
}

use hot_core::traits::{Parser as _, Renderer as _};

fn main() {
    let cli = Cli::parse();
    let mut config = Config::new();
    let host = cli
        .host
        .or(config.default_host.clone())
        .unwrap_or_else(|| "http://localhost:8888".to_string());
    let client = PaxelClient::new(host);

    match cli.command {
        Commands::Config { action } => match action {
            ConfigAction::DefaultHost { url } => {
                config.default_host = Some(url.clone());
                config.save().expect("Failed to save config");
                println!("✔  Default host set to: {}", url);
            }
        },
        Commands::Compile {
            input,
            output,
            passes,
            from,
        } => {
            let mut tex = if from == "tex"
                || (from == "auto" && input.extension().is_some_and(|e| e == "tex"))
            {
                fs::read_to_string(&input).expect("Failed to read input file")
            } else {
                // Convert to TeX first using plugins
                self::convert_to_tex(&input, &from)
            };

            // If it doesn't look like a full document, wrap it
            if !tex.contains("\\documentclass") {
                tex = format!(
                    "\\documentclass{{article}}\n\\usepackage{{kotex}}\n\\usepackage{{fontspec}}\n\\usepackage{{enumitem}}\n\\usepackage{{graphicx}}\n\\usepackage{{ulem}}\n\\begin{{document}}\n{}\n\\end{{document}}",
                    tex
                );
            }

            println!("ℹ  Compiling {}...", input.display());
            match client.compile(tex, Some(passes), input.parent()) {
                Ok(response) => {
                    let out_path = output.unwrap_or_else(|| input.with_extension("pdf"));
                    let pdf_bytes = BASE64.decode(response.pdf).expect("Failed to decode PDF");
                    fs::write(&out_path, pdf_bytes).expect("Failed to write PDF");
                    println!(
                        "✔  Successfully compiled → {} (compile: {}ms, total: {}ms)",
                        out_path.display(),
                        response.compile_time_ms,
                        response.total_time_ms
                    );
                }
                Err(e) => {
                    eprintln!("✗  Compilation failed: {}", e);
                    process::exit(1);
                }
            }
        }
        Commands::Convert {
            input,
            output,
            from,
        } => {
            let tex = self::convert_to_tex(&input, &from);

            if let Some(out_path) = output {
                fs::write(&out_path, &tex).expect("Failed to write output file");
                println!("✔  Converted → {}", out_path.display());
            } else {
                println!("{}", tex);
            }
        }
        // ... Fonts and FontDownload remain the same
        Commands::Fonts => match client.list_fonts() {
            Ok(fonts) => {
                println!("{:<20} {:<30} Filename", "Family", "Styles");
                println!("{:-<70}", "");
                for font in fonts {
                    println!(
                        "{:<20} {:<30} {}",
                        font.family,
                        font.styles.join(", "),
                        font.file_name
                    );
                }
            }
            Err(e) => {
                eprintln!("✗  Failed to list fonts: {}", e);
                process::exit(1);
            }
        },
        Commands::FontDownload { name, output } => {
            println!("ℹ  Downloading {}...", name);
            match client.download_font(&name) {
                Ok(bytes) => {
                    let out_path = output.unwrap_or_else(|| PathBuf::from(&name));
                    fs::write(&out_path, bytes).expect("Failed to write font file");
                    println!("✔  Downloaded → {}", out_path.display());
                }
                Err(e) => {
                    eprintln!("✗  Download failed: {}", e);
                    process::exit(1);
                }
            }
        }
    }
}

fn convert_to_tex(input: &Path, from: &str) -> String {
    let content = fs::read_to_string(input).expect("Failed to read input file");
    let ext = input.extension().and_then(|e| e.to_str()).unwrap_or("");

    let format = if from == "auto" {
        if ext == "md" || ext == "markdown" {
            "markdown"
        } else {
            "html"
        }
    } else {
        from
    };

    let nodes = match format {
        "markdown" => {
            let parser = hot_markdown::MarkdownParser;
            parser.parse(&content)
        }
        _ => {
            let parser = hot_html::HtmlParser;
            parser.parse(&content)
        }
    };

    let renderer = hot_tex::TexRenderer;
    renderer.render(&nodes)
}
