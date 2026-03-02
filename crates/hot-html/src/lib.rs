use hot_core::ir::{HotNode, HotStyle, Align, Decoration};
use hot_core::traits::Parser as HotParser;
use scraper::{Html, Node};
use ego_tree::NodeRef;
use regex::Regex;

pub struct HtmlParser;

impl HotParser for HtmlParser {
    fn parse(&self, input: &str) -> Vec<HotNode> {
        let fragment = Html::parse_fragment(input);
        let mut nodes = Vec::new();
        
        let root = fragment.tree.root();
        
        // Scraper might wrap results in html/body. We want to skip them if they are implicit.
        let mut current_nodes = root.children().collect::<Vec<_>>();
        
        // If there's only one child and it's <html>, dive in.
        if current_nodes.len() == 1 {
            if let Some(e) = current_nodes[0].value().as_element() {
                if e.name() == "html" || e.name() == "body" {
                    current_nodes = current_nodes[0].children().collect();
                }
            }
        }
        
        // Again for body if we were in html
        if current_nodes.len() == 1 {
            if let Some(e) = current_nodes[0].value().as_element() {
                if e.name() == "body" {
                    current_nodes = current_nodes[0].children().collect();
                }
            }
        }

        for node in current_nodes {
            if let Some(hot_node) = self.parse_node(node) {
                // Ignore top-level empty text nodes
                if let HotNode::Text(t) = &hot_node {
                    if t.trim().is_empty() { continue; }
                }
                nodes.push(hot_node);
            }
        }
        nodes
    }
}

impl HtmlParser {
    fn parse_node(&self, node: NodeRef<Node>) -> Option<HotNode> {
        match node.value() {
            Node::Text(t) => Some(HotNode::Text(t.to_string())),
            Node::Element(e) => {
                let name = e.name().to_lowercase();
                let children = node.children()
                    .filter_map(|c| self.parse_node(c))
                    .collect::<Vec<_>>();

                match name.as_str() {
                    "strong" | "b" => Some(HotNode::Bold(children)),
                    "em" | "i" => Some(HotNode::Italic(children)),
                    "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
                        let level = name[1..].parse().unwrap_or(1);
                        Some(HotNode::Heading { level, children })
                    }
                    "ul" => Some(HotNode::List { ordered: false, items: self.parse_list_items(node) }),
                    "ol" => Some(HotNode::List { ordered: true, items: self.parse_list_items(node) }),
                    "img" => {
                        let path = e.attr("src").unwrap_or("").to_string();
                        let alt = e.attr("alt").map(|s| s.to_string());
                        Some(HotNode::Image { path, options: alt })
                    }
                    "br" => Some(HotNode::Raw("\\\\".to_string())),
                    "span" | "p" | "div" => {
                        // Special case: hot-protect (used for tokens/protected content)
                        if e.attr("class").map_or(false, |c| c.contains("hot-protect")) {
                            if let Some(raw) = e.attr("data-raw") {
                                return Some(HotNode::Raw(raw.to_string()));
                            }
                        }

                        // Special case: empty paragraph (br or whitespace only)
                        if name == "p" && self.is_effectively_empty(&children) {
                            return Some(HotNode::Raw("\\par\\vspace{1em}\\par".to_string()));
                        }

                        let style = self.parse_style(e.attr("style").unwrap_or(""));
                        if let Some(s) = style {
                            Some(HotNode::Styled { style: s, children })
                        } else {
                            Some(HotNode::Styled { style: HotStyle::default(), children })
                        }
                    }
                    _ => Some(HotNode::Styled { style: HotStyle::default(), children }),
                }
            }
            _ => None,
        }
    }

    fn is_effectively_empty(&self, nodes: &[HotNode]) -> bool {
        if nodes.is_empty() { return true; }
        nodes.iter().all(|n| match n {
            HotNode::Text(t) => t.trim().is_empty() || t == "\u{a0}",
            HotNode::Raw(r) => r == "\\\\", // Treat standalone <br> as empty for p-wrapping
            HotNode::Styled { children, .. } => self.is_effectively_empty(children),
            _ => false,
        })
    }

    fn parse_list_items(&self, node: NodeRef<Node>) -> Vec<Vec<HotNode>> {
        node.children()
            .filter(|c| {
                if let Some(e) = c.value().as_element() {
                    e.name() == "li"
                } else {
                    false
                }
            })
            .map(|li| {
                li.children()
                    .filter_map(|c| self.parse_node(c))
                    .collect()
            })
            .collect()
    }

    fn parse_style(&self, style_str: &str) -> Option<HotStyle> {
        if style_str.is_empty() { return None; }
        
        let mut style = HotStyle::default();
        let mut found = false;

        let re_family = Regex::new(r"(?i)font-family:\s*([^;]+)").unwrap();
        let re_size = Regex::new(r"(?i)font-size:\s*(\d+(?:\.\d+)?)(pt|px)?").unwrap();
        let re_align = Regex::new(r"(?i)text-align:\s*(left|center|right|justify)").unwrap();
        let re_deco = Regex::new(r"(?i)text-decoration:\s*(underline|line-through)").unwrap();

        if let Some(caps) = re_family.captures(style_str) {
            style.font_family = Some(caps[1].trim().to_string());
            found = true;
        }
        if let Some(caps) = re_size.captures(style_str) {
            style.font_size = Some(caps[1].parse().unwrap_or(12.0));
            found = true;
        }
        if let Some(caps) = re_align.captures(style_str) {
            style.text_align = match &caps[1] {
                "center" => Some(Align::Center),
                "right" => Some(Align::Right),
                "justify" => Some(Align::Justify),
                _ => Some(Align::Left),
            };
            found = true;
        }
        if let Some(caps) = re_deco.captures(style_str) {
            style.text_decoration = match &caps[1] {
                "underline" => Some(Decoration::Underline),
                "line-through" => Some(Decoration::LineThrough),
                _ => None,
            };
            found = true;
        }

        if found { Some(style) } else { None }
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_html() {
        let parser = HtmlParser;
        let html = "<h1>Title</h1><p>Text with <strong>bold</strong> and <em>italic</em>.</p>";
        let nodes = parser.parse(html);
        println!("Nodes: {:?}", nodes);
        
        // scraper might wrap fragments or have empty text nodes
        let filtered_nodes: Vec<_> = nodes.into_iter().filter(|n| !matches!(n, HotNode::Text(t) if t.trim().is_empty())).collect();
        assert!(filtered_nodes.len() >= 2);
    }

    #[test]
    fn test_parse_styled_span() {
        let parser = HtmlParser;
        let html = r#"<span style="font-family: Arial; font-size: 14pt; text-align: center;">Centered Text</span>"#;
        let nodes = parser.parse(html);
        
        assert_eq!(nodes.len(), 1);
        if let HotNode::Styled { style, .. } = &nodes[0] {
            assert_eq!(style.font_family.as_deref(), Some("Arial"));
            assert_eq!(style.font_size, Some(14.0));
            assert_eq!(style.text_align, Some(Align::Center));
        } else {
            panic!("Expected Styled node");
        }
    }

    #[test]
    fn test_parse_list() {
        let parser = HtmlParser;
        let html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
        let nodes = parser.parse(html);
        
        assert_eq!(nodes.len(), 1);
        if let HotNode::List { ordered, items } = &nodes[0] {
            assert_eq!(*ordered, false);
            assert_eq!(items.len(), 2);
        } else {
            panic!("Expected List node");
        }
    }
}
