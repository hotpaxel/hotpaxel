use regex::Regex;
use wasm_bindgen::prelude::*;
use lazy_static::lazy_static;

pub mod ir;
pub mod traits;

#[cfg(not(target_arch = "wasm32"))]
pub mod client;

lazy_static! {
    static ref LOGIC_REGEX: Regex = Regex::new(r"%%\s*(\{\{[\s\S]*?\}\}|\{%\s*[\s\S]*?%\})").unwrap();
    static ref PRE_REGEX: Regex = Regex::new(r#"(?i)<pre\b[^>]*?data-hot-tex=['"]true['"][^>]*?>([\s\S]*?)</pre>"#).unwrap();
    static ref SPAN_REGEX: Regex = Regex::new(r#"(?i)<span\b[^>]*?class=['"][^'"]*?hot-protect[^'"]*?['"][^>]*?>([\s\S]*?)</span>"#).unwrap();
    static ref ATTR_REGEX: Regex = Regex::new(r#"(?i)data-raw=["']([\s\S]*?)["']"#).unwrap();
    static ref FONT_FAMILY_OPEN: Regex = Regex::new(r#"(?i)<span\b[^>]*?style="[^"]*?font-family:\s*([^;"]+)[^"]*?"[^>]*?>"#).unwrap();
    static ref FONT_SIZE_OPEN: Regex = Regex::new(r#"(?i)<span\b[^>]*?style="[^"]*?font-size:\s*(\d+(?:\.\d+)?)(pt|px)?[^"]*?"[^>]*?>"#).unwrap();
    static ref SPAN_STYLE_OPEN: Regex = Regex::new(r#"(?i)<span\b[^>]*?style="[^"]*?"[^>]*?>"#).unwrap();
    static ref SPAN_CLOSE: Regex = Regex::new(r"(?i)</span>").unwrap();
    static ref H1_OPEN: Regex = Regex::new(r#"(?i)<h1\b[^>]*?>"#).unwrap();
    static ref H1_CLOSE: Regex = Regex::new(r"(?i)</h1>").unwrap();
    static ref H2_OPEN: Regex = Regex::new(r#"(?i)<h2\b[^>]*?>"#).unwrap();
    static ref H2_CLOSE: Regex = Regex::new(r"(?i)</h2>").unwrap();
    static ref H3_OPEN: Regex = Regex::new(r#"(?i)<h3\b[^>]*?>"#).unwrap();
    static ref H3_CLOSE: Regex = Regex::new(r"(?i)</h3>").unwrap();
    static ref UL_OPEN: Regex = Regex::new(r#"(?i)<ul\b[^>]*?>"#).unwrap();
    static ref UL_CLOSE: Regex = Regex::new(r"(?i)</ul>").unwrap();
    static ref OL_OPEN: Regex = Regex::new(r#"(?i)<ol\b[^>]*?>"#).unwrap();
    static ref OL_CLOSE: Regex = Regex::new(r"(?i)</ol>").unwrap();
    static ref LI_OPEN: Regex = Regex::new(r#"(?i)<li\b[^>]*?>"#).unwrap();
    static ref LI_CLOSE: Regex = Regex::new(r"(?i)</li>").unwrap();
    static ref STRONG_REGEX: Regex = Regex::new(r"(?i)<(strong|b)\b[^>]*?>").unwrap();
    static ref STRONG_END_REGEX: Regex = Regex::new(r"(?i)</(strong|b)>").unwrap();
    static ref EM_REGEX: Regex = Regex::new(r"(?i)<(em|i)\b[^>]*?>").unwrap();
    static ref EM_END_REGEX: Regex = Regex::new(r"(?i)</(em|i)>").unwrap();
    static ref EMPTY_P: Regex = Regex::new(r#"(?i)<p\b[^>]*?>(\s|&nbsp;|<br\s*/?>)*</p>"#).unwrap();
    static ref BR_REGEX: Regex = Regex::new(r#"(?i)<br\b[^>]*?/?>"#).unwrap();
    static ref P_END_REGEX: Regex = Regex::new(r#"(?i)</p>"#).unwrap();
    static ref DIV_END_REGEX: Regex = Regex::new(r#"(?i)</div>"#).unwrap();
    static ref BLOCK_START_REGEX: Regex = Regex::new(r#"(?i)<(p|div)\b[^>]*?>"#).unwrap();
    static ref TAG_REGEX: Regex = Regex::new(r"(?i)<[^>]+>").unwrap();
    static ref MULTI_NEWLINE: Regex = Regex::new(r"\n{3,}").unwrap();
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
        let caps = match PRE_REGEX.captures(html) {
            Some(c) => c,
            None => return String::new(),
        };
        let body_match = match caps.get(1) {
            Some(m) => m,
            None => return String::new(),
        };
        let body_str = body_match.as_str();

        // 1. Recover protected tokens
        let mut body = SPAN_REGEX
            .replace_all(body_str, |caps: &regex::Captures| {
                let span_tag = caps.get(0).unwrap().as_str();
                if let Some(attr_caps) = ATTR_REGEX.captures(span_tag) {
                    html_escape::decode_html_entities(attr_caps.get(1).unwrap().as_str())
                        .to_string()
                } else {
                    String::new()
                }
            })
            .to_string();

        // 2. Inline styles
        body = FONT_FAMILY_OPEN.replace_all(&body, |caps: &regex::Captures| {
            let family = caps.get(1).unwrap().as_str().trim();
            format!(r"{{\fontspec{{{family}}} ")
        }).to_string();

        body = FONT_SIZE_OPEN.replace_all(&body, |caps: &regex::Captures| {
            let size = caps.get(1).unwrap().as_str();
            let size_f: f64 = size.parse().unwrap_or(12.0);
            let baseline = format!("{:.1}", size_f * 1.2);
            format!(r"{{\fontsize{{{size}pt}}{{{baseline}pt}}\selectfont ")
        }).to_string();

        let remaining_style_spans = SPAN_STYLE_OPEN.find_iter(&body).count();
        if remaining_style_spans > 0 {
            body = SPAN_STYLE_OPEN.replace_all(&body, "").to_string();
        }
        
        body = SPAN_CLOSE.replace_all(&body, "}").to_string();

        // 4. Headings
        body = H1_OPEN.replace_all(&body, r"\section*{").to_string();
        body = H1_CLOSE.replace_all(&body, "}\n\n").to_string();

        body = H2_OPEN.replace_all(&body, r"\subsection*{").to_string();
        body = H2_CLOSE.replace_all(&body, "}\n\n").to_string();

        body = H3_OPEN.replace_all(&body, r"\subsubsection*{").to_string();
        body = H3_CLOSE.replace_all(&body, "}\n\n").to_string();

        // 5. Lists
        body = UL_OPEN.replace_all(&body, "\\begin{itemize}\n").to_string();
        body = UL_CLOSE.replace_all(&body, "\\end{itemize}\n\n").to_string();

        body = OL_OPEN.replace_all(&body, "\\begin{enumerate}\n").to_string();
        body = OL_CLOSE.replace_all(&body, "\\end{enumerate}\n\n").to_string();

        body = LI_OPEN.replace_all(&body, r"\item ").to_string();
        body = LI_CLOSE.replace_all(&body, "\n").to_string();

        // 6. Bold & Italic
        body = STRONG_REGEX.replace_all(&body, "\\textbf{").to_string();
        body = STRONG_END_REGEX.replace_all(&body, "}").to_string();

        body = EM_REGEX.replace_all(&body, "\\textit{").to_string();
        body = EM_END_REGEX.replace_all(&body, "}").to_string();

        // 8. Line breaks
        body = EMPTY_P.replace_all(&body, "\\par\\vspace{1em}\\par\n").to_string();
        body = BR_REGEX.replace_all(&body, "\\\\ ").to_string();
        
        body = P_END_REGEX.replace_all(&body, "\n\n").to_string();
        body = DIV_END_REGEX.replace_all(&body, "\n").to_string();
        body = BLOCK_START_REGEX.replace_all(&body, "").to_string();

        // 9. Strip HTML
        body = TAG_REGEX.replace_all(&body, "").to_string();

        // 10. Clean up
        let result = html_escape::decode_html_entities(&body).to_string();
        let result = MULTI_NEWLINE.replace_all(&result, "\n\n").to_string();
        
        result.trim().to_string()
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
