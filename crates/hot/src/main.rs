use clap::{Parser, Subcommand};
use hot::client::PaxelClient;
use hot::HotConverter;
use std::fs;
use std::path::PathBuf;
use std::process;

#[derive(Parser)]
#[command(name = "hot")]
#[command(version, about = "HOTPAXEL Client CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// PAXEL server host
    #[arg(long, env = "PAXEL_HOST", default_value = "http://localhost:8888")]
    host: String,
}

#[derive(Subcommand)]
enum Commands {
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

fn main() {
    let cli = Cli::parse();
    let client = PaxelClient::new(cli.host);

    match cli.command {
        Commands::Compile { input, output, passes, from } => {
            let tex = if from == "tex" || (from == "auto" && input.extension().map_or(false, |e| e == "tex")) {
                fs::read_to_string(&input).expect("Failed to read input file")
            } else {
                // Convert to TeX first
                let html = fs::read_to_string(&input).expect("Failed to read input file");
                let converter = HotConverter::new().unwrap();
                // If it's already wrapped in <pre data-hot-tex="true">, extract it
                if html.contains("data-hot-tex=\"true\"") {
                    converter.extract_hot_tex(&html)
                } else {
                    converter.extract_hot_tex(&format!("<pre data-hot-tex=\"true\">{}</pre>", html))
                }
            };

            println!("ℹ  Compiling {}...", input.display());
            match client.compile(tex, Some(passes)) {
                Ok(pdf_bytes) => {
                    let out_path = output.unwrap_or_else(|| input.with_extension("pdf"));
                    fs::write(&out_path, pdf_bytes).expect("Failed to write PDF");
                    println!("✔  Successfully compiled → {}", out_path.display());
                }
                Err(e) => {
                    eprintln!("✗  Compilation failed: {}", e);
                    process::exit(1);
                }
            }
        }
        Commands::Convert { input, output, from: _ } => {
            let content = fs::read_to_string(&input).expect("Failed to read input file");
            let converter = HotConverter::new().unwrap();
            let tex = if content.contains("data-hot-tex=\"true\"") {
                converter.extract_hot_tex(&content)
            } else {
                converter.extract_hot_tex(&format!("<pre data-hot-tex=\"true\">{}</pre>", content))
            };

            if let Some(out_path) = output {
                fs::write(&out_path, tex).expect("Failed to write output file");
                println!("✔  Converted → {}", out_path.display());
            } else {
                println!("{}", tex);
            }
        }
        Commands::Fonts => {
            match client.list_fonts() {
                Ok(fonts) => {
                    println!("{:<20} {:<30} {}", "Family", "Styles", "Filename");
                    println!("{:-<70}", "");
                    for font in fonts {
                        println!("{:<20} {:<30} {}", font.family, font.styles.join(", "), font.file_name);
                    }
                }
                Err(e) => {
                    eprintln!("✗  Failed to list fonts: {}", e);
                    process::exit(1);
                }
            }
        }
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
