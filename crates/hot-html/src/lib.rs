use hot_core::ir::{HotNode, HotStyle, Align, Decoration};
use hot_core::traits::Parser as HotParser;
use scraper::{Html, Node};
use ego_tree::NodeRef;
use regex::Regex;

pub struct HtmlParser;

impl HotParser for HtmlParser {
    fn parse(&self, input: &str) -> Vec<HotNode> {
        let fragment = Html::parse_fragment(input);
        fragment.tree.root().children()
            .filter_map(|node| self.parse_node(node))
            .collect()
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
                    "span" | "p" | "div" => {
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

        let re_family = Regex::new(r"font-family:\s*([^;]+)").unwrap();
        let re_size = Regex::new(r"font-size:\s*(\d+(?:\.\d+)?)(pt|px)?").unwrap();
        let re_align = Regex::new(r"text-align:\s*(left|center|right|justify)").unwrap();
        let re_deco = Regex::new(r"text-decoration:\s*(underline|line-through)").unwrap();

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
