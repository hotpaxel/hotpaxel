use regex::Regex;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct HotConverter {
    logic_regex: Regex,
}

#[wasm_bindgen]
impl HotConverter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<HotConverter, JsValue> {
        let logic_regex = Regex::new(r"%%\s*(\{\{[\s\S]*?\}\}|\{%\s*[\s\S]*?%\})")
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(HotConverter { logic_regex })
    }

    pub fn tex_to_hot_html(&self, tex: &str) -> String {
        let mut html = String::new();
        let mut last_end = 0;

        for mat in self.logic_regex.find_iter(tex) {
            html.push_str(&html_escape::encode_safe(&tex[last_end..mat.start()]));
            let token = mat.as_str();
            let escaped_token = html_escape::encode_safe(token);
            let attr_token = html_escape::encode_double_quoted_attribute(token);

            html.push_str(&format!(
                "<span class=\"hot-protect\" data-raw=\"{}\">{}</span>",
                attr_token, escaped_token
            ));
            last_end = mat.end();
        }

        html.push_str(&html_escape::encode_safe(&tex[last_end..]));
        format!("<pre data-hot-tex=\"true\">{}</pre>", html)
    }

    pub fn extract_hot_tex(&self, html: &str) -> String {
        let pre_regex =
            match Regex::new(r#"(?i)<pre\b[^>]*?data-hot-tex=['"]true['"][^>]*?>([\s\S]*?)</pre>"#)
            {
                Ok(r) => r,
                Err(_) => return String::new(),
            };
        let span_regex = match Regex::new(
            r#"(?i)<span\b[^>]*?class=['"][^'"]*?hot-protect[^'"]*?['"][^>]*?>([\s\S]*?)</span>"#,
        ) {
            Ok(r) => r,
            Err(_) => return String::new(),
        };
        let attr_regex = match Regex::new(r#"(?i)data-raw=["']([\s\S]*?)["']"#) {
            Ok(r) => r,
            Err(_) => return String::new(),
        };
        let tag_regex = match Regex::new(r"(?i)<[^>]+>") {
            Ok(r) => r,
            Err(_) => return String::new(),
        };

        let caps = match pre_regex.captures(html) {
            Some(c) => c,
            None => return String::new(),
        };
        let body_match = match caps.get(1) {
            Some(m) => m,
            None => return String::new(),
        };
        let mut body = body_match.as_str().to_string();

        // 1. Recover protected tokens
        body = span_regex
            .replace_all(&body, |caps: &regex::Captures| {
                let span_tag = caps.get(0).unwrap().as_str();
                if let Some(attr_caps) = attr_regex.captures(span_tag) {
                    html_escape::decode_html_entities(attr_caps.get(1).unwrap().as_str())
                        .to_string()
                } else {
                    String::new()
                }
            })
            .to_string();

        // 2. Strip other HTML tags
        body = tag_regex.replace_all(&body, "").to_string();

        // 3. Final unescape
        html_escape::decode_html_entities(&body).to_string()
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
