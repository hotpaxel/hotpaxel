use hot_core::ir::{Align, Decoration, HotNode};
use hot_core::traits::Renderer;

pub struct TexRenderer;

impl Renderer for TexRenderer {
    fn render(&self, nodes: &[HotNode]) -> String {
        nodes
            .iter()
            .map(|n| self.render_node(n))
            .collect::<Vec<_>>()
            .join("")
    }
}

impl TexRenderer {
    fn render_node(&self, node: &HotNode) -> String {
        match node {
            HotNode::Text(t) => self.escape_tex(t),
            HotNode::Bold(children) => format!("\\textbf{{{}}}", self.render(children)),
            HotNode::Italic(children) => format!("\\textit{{{}}}", self.render(children)),
            HotNode::Heading { level, children } => {
                let cmd = match level {
                    1 => "section",
                    2 => "subsection",
                    3 => "subsubsection",
                    _ => "paragraph",
                };
                format!("\\{}*{{{}}}\n\n", cmd, self.render(children))
            }
            HotNode::List { ordered, items } => {
                let env = if *ordered { "enumerate" } else { "itemize" };
                let mut out = format!("\\begin{{{}}}\n", env);
                for item in items {
                    out.push_str(&format!("  \\item {}\n", self.render(item)));
                }
                out.push_str(&format!("\\end{{{}}}\n\n", env));
                out
            }
            HotNode::Image { path, options } => {
                let opt = options.as_deref().unwrap_or("width=\\textwidth");
                format!("\\includegraphics[{}]{{{}}}", opt, path)
            }
            HotNode::Styled { style, children } => {
                let mut out = self.render(children);

                if let Some(family) = &style.font_family {
                    out = format!("{{\\fontspec{{{}}} {}}}", family, out);
                }
                if let Some(size) = style.font_size {
                    let baseline = size * 1.2;
                    out = format!(
                        "{{\\fontsize{{{}pt}}{{{:.1}pt}}\\selectfont {}}}",
                        size, baseline, out
                    );
                }
                if let Some(align) = style.text_align {
                    let env = match align {
                        Align::Center => "center",
                        Align::Right => "flushright",
                        _ => "flushleft",
                    };
                    out = format!("\\begin{{{}}}\n{}\n\\end{{{}}}", env, out, env);
                }
                if let Some(deco) = style.text_decoration {
                    match deco {
                        Decoration::Underline => out = format!("\\underline{{{}}}", out),
                        Decoration::LineThrough => out = format!("\\sout{{{}}}", out), // Requires ulem package
                    }
                }
                out
            }
            HotNode::Raw(t) => t.clone(),
        }
    }

    fn escape_tex(&self, value: &str) -> String {
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
    use hot_core::ir::{Align, HotStyle};

    #[test]
    fn test_render_simple() {
        let renderer = TexRenderer;
        let nodes = vec![
            HotNode::Heading {
                level: 1,
                children: vec![HotNode::Text("Title".to_string())],
            },
            HotNode::Text("Hello ".to_string()),
            HotNode::Bold(vec![HotNode::Text("World".to_string())]),
        ];
        let out = renderer.render(&nodes);
        assert!(out.contains("\\section*{Title}"));
        assert!(out.contains("\\textbf{World}"));
    }

    #[test]
    fn test_render_styled() {
        let renderer = TexRenderer;
        let nodes = vec![HotNode::Styled {
            style: HotStyle {
                font_family: Some("Arial".to_string()),
                font_size: Some(14.0),
                text_align: Some(Align::Center),
                ..Default::default()
            },
            children: vec![HotNode::Text("Styled".to_string())],
        }];
        let out = renderer.render(&nodes);
        assert!(out.contains("\\fontspec{Arial}"));
        assert!(out.contains("\\fontsize{14pt}"));
        assert!(out.contains("\\begin{center}"));
    }

    #[test]
    fn test_escape() {
        let renderer = TexRenderer;
        let nodes = vec![HotNode::Text("Special characters: % $ & _ { }".to_string())];
        let out = renderer.render(&nodes);
        assert!(out.contains("\\% \\$ \\& \\_ \\{ \\}"));
    }
}
