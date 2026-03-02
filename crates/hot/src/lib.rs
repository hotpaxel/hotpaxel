use regex::Regex;
use wasm_bindgen::prelude::*;
use lazy_static::lazy_static;

pub use hot_core::ir;
pub use hot_core::traits;

#[cfg(not(target_arch = "wasm32"))]
pub mod client;

lazy_static! {
    static ref LOGIC_REGEX: Regex = Regex::new(r"%%\s*(\{\{[\s\S]*?\}\}|\{%\s*[\s\S]*?%\})").unwrap();
}

#[wasm_bindgen]
pub struct HotConverter {}

#[wasm_bindgen]
impl HotConverter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<HotConverter, JsValue> {
        Ok(HotConverter {})
    }

    pub fn tex_to_hot_html(&self, tex: &str) -> String {
        let mut html = String::new();
        let mut last_end = 0;

        for mat in LOGIC_REGEX.find_iter(tex) {
            html.push_str(&html_escape::encode_safe(&tex[last_end..mat.start()]));
            let token = mat.as_str();
            let escaped_token = html_escape::encode_safe(token);
            let attr_token = html_escape::encode_double_quoted_attribute(token);

            html.push_str(&format!(
                "<span class=\"hot-protect\" data-raw=\"{attr_token}\">{escaped_token}</span>"
            ));
            last_end = mat.end();
        }

        html.push_str(&html_escape::encode_safe(&tex[last_end..]));
        format!("<pre data-hot-tex=\"true\">{html}</pre>")
    }

    pub fn extract_hot_tex(&self, html: &str) -> String {
        // Use new plugin-based architecture for conversion
        use hot_core::traits::{Parser as _, Renderer as _};
        
        let parser = hot_html::HtmlParser;
        let renderer = hot_tex::TexRenderer;
        
        // If the HTML is wrapped in the editor's <pre> tag, we might want to strip it or just parse the whole thing.
        // The HtmlParser handles fragments correctly.
        let nodes = parser.parse(html);
        renderer.render(&nodes).trim().to_string()
    }

    pub fn escape_latex(&self, value: &str) -> String {
        let sentinel = "__HOT_BACKSLASH__";
        value
            .replace("\\", sentinel)
            .replace("{", "\\{")
            .replace("}", "\\}")
            .replace("%", "\\%")
            .replace("$", "\\$")
            .replace("#", "\\#")
            .replace("&", "\\&")
            .replace("_", "\\_")
            .replace("^", "\\^{}")
            .replace("~", "\\~{}")
            .replace("<", "\\textless{}")
            .replace(">", "\\textgreater{}")
            .replace(sentinel, "\\textbackslash{}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_bold_italic() {
        let hot = HotConverter::new().unwrap();
        let html = r#"<pre data-hot-tex="true">Hello <strong>Bold</strong> and <em>Italic</em></pre>"#;
        assert_eq!(hot.extract_hot_tex(html), r#"Hello \textbf{Bold} and \textit{Italic}"#);
    }

    #[test]
    fn test_headings() {
        let hot = HotConverter::new().unwrap();
        let html = r#"<pre data-hot-tex="true"><h1>Title</h1><h2>Subtitle</h2></pre>"#;
        let result = hot.extract_hot_tex(html);
        assert!(result.contains(r"\section*{Title}"));
        assert!(result.contains(r"\subsection*{Subtitle}"));
    }

    #[test]
    fn test_bullet_list() {
        let hot = HotConverter::new().unwrap();
        let html = r#"<pre data-hot-tex="true"><ul><li>Item A</li><li>Item B</li></ul></pre>"#;
        let result = hot.extract_hot_tex(html);
        assert!(result.contains(r"\begin{itemize}"));
        assert!(result.contains(r"\item Item A"));
        assert!(result.contains(r"\item Item B"));
        assert!(result.contains(r"\end{itemize}"));
    }

    #[test]
    fn test_ordered_list() {
        let hot = HotConverter::new().unwrap();
        let html = r#"<pre data-hot-tex="true"><ol><li>First</li><li>Second</li></ol></pre>"#;
        let result = hot.extract_hot_tex(html);
        assert!(result.contains(r"\begin{enumerate}"));
        assert!(result.contains(r"\item First"));
        assert!(result.contains(r"\end{enumerate}"));
    }

    #[test]
    fn test_empty_paragraphs_vspace() {
        let hot = HotConverter::new().unwrap();
        // Test various empty paragraph patterns from Tiptap
        let html1 = r#"<pre data-hot-tex="true"><p>L1</p><p></p><p>L2</p></pre>"#;
        let html2 = r#"<pre data-hot-tex="true"><p>L1</p><p><br></p><p>L2</p></pre>"#;
        let html3 = r#"<pre data-hot-tex="true"><p>L1</p><p>&nbsp;</p><p>L2</p></pre>"#;
        
        assert!(hot.extract_hot_tex(html1).contains(r"\par\vspace{1em}\par"));
        assert!(hot.extract_hot_tex(html2).contains(r"\par\vspace{1em}\par"));
        assert!(hot.extract_hot_tex(html3).contains(r"\par\vspace{1em}\par"));
    }

    #[test]
    fn test_inline_font_family() {
        let hot = HotConverter::new().unwrap();
        let html = r#"<pre data-hot-tex="true"><span style="font-family: NanumGothic">Hello</span></pre>"#;
        let result = hot.extract_hot_tex(html);
        assert!(result.contains(r"\fontspec{NanumGothic}"));
    }

    #[test]
    fn test_inline_font_size() {
        let hot = HotConverter::new().unwrap();
        let html = r#"<pre data-hot-tex="true"><span style="font-size: 24pt">Big text</span></pre>"#;
        let result = hot.extract_hot_tex(html);
        assert!(result.contains(r"\fontsize{24pt}"));
    }

    #[test]
    fn test_protected_token_recovery() {
        let hot = HotConverter::new().unwrap();
        let html = r#"<pre data-hot-tex="true">Var: <span class="hot-protect" data-raw="{{ user_name }}">Token</span></pre>"#;
        assert_eq!(hot.extract_hot_tex(html), "Var: {{ user_name }}");
    }

    #[test]
    fn test_mixed_formatting_and_tokens() {
        let hot = HotConverter::new().unwrap();
        let html_mixed = r#"<pre data-hot-tex="true"><strong><span class="hot-protect" data-raw="{{ party }}">P</span></strong></pre>"#;
        assert_eq!(hot.extract_hot_tex(html_mixed), r#"\textbf{{{ party }}}"#);
    }
}
