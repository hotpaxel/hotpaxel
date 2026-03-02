use hot_core::ir::HotNode;
use hot_core::traits::Parser;
use pulldown_cmark::{Parser as MarkParser, Event, Tag, TagEnd};

pub struct MarkdownParser;

impl Parser for MarkdownParser {
    fn parse(&self, input: &str) -> Vec<HotNode> {
        let parser = MarkParser::new(input);
        let mut stack: Vec<Vec<HotNode>> = vec![Vec::new()];
        let mut list_stack: Vec<(bool, Vec<Vec<HotNode>>)> = Vec::new();

        for event in parser {
            match event {
                Event::Start(tag) => {
                    match tag {
                        Tag::List(ordered) => {
                            list_stack.push((ordered.is_some(), Vec::new()));
                        }
                        Tag::Item => {
                            stack.push(Vec::new());
                        }
                        Tag::Paragraph | Tag::Heading { .. } | Tag::Strong | Tag::Emphasis | Tag::Link { .. } => {
                            stack.push(Vec::new());
                        }
                        Tag::Image { dest_url, title, .. } => {
                            let alt = if title.is_empty() { None } else { Some(title.to_string()) };
                            stack.last_mut().unwrap().push(HotNode::Image { 
                                path: dest_url.to_string(), 
                                options: alt 
                            });
                        }
                        _ => {
                            stack.push(Vec::new());
                        }
                    }
                }
                Event::End(tag_end) => {
                    match tag_end {
                        TagEnd::List(_) => {
                            if let Some((ordered, items)) = list_stack.pop() {
                                stack.last_mut().unwrap().push(HotNode::List { ordered, items });
                            }
                        }
                        TagEnd::Item => {
                            let item_nodes = stack.pop().unwrap();
                            if let Some(list) = list_stack.last_mut() {
                                list.1.push(item_nodes);
                            }
                        }
                        TagEnd::Paragraph => {
                            let children = stack.pop().unwrap();
                            // In IR, we don't have a Paragraph node, so we use Styled with default or just flatten?
                            // Let's use Styled with default for now as a container.
                            stack.last_mut().unwrap().push(HotNode::Styled { 
                                style: Default::default(), 
                                children 
                            });
                        }
                        TagEnd::Heading(level) => {
                            let children = stack.pop().unwrap();
                            stack.last_mut().unwrap().push(HotNode::Heading { 
                                level: level as u8, 
                                children 
                            });
                        }
                        TagEnd::Strong => {
                            let children = stack.pop().unwrap();
                            stack.last_mut().unwrap().push(HotNode::Bold(children));
                        }
                        TagEnd::Emphasis => {
                            let children = stack.pop().unwrap();
                            stack.last_mut().unwrap().push(HotNode::Italic(children));
                        }
                        _ => {
                            let _ = stack.pop();
                        }
                    }
                }
                Event::Text(t) => {
                    stack.last_mut().unwrap().push(HotNode::Text(t.to_string()));
                }
                Event::SoftBreak | Event::HardBreak => {
                    stack.last_mut().unwrap().push(HotNode::Text("\n".to_string()));
                }
                _ => {}
            }
        }
        stack.pop().unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hot_core::ir::HotNode;

    #[test]
    fn test_parse_simple_markdown() {
        let parser = MarkdownParser;
        let md = "# Title\n\nText with **bold** and *italic*.";
        let nodes = parser.parse(md);
        
        assert!(!nodes.is_empty());
    }

    #[test]
    fn test_parse_markdown_list() {
        let parser = MarkdownParser;
        let md = "- Item 1\n- Item 2";
        let nodes = parser.parse(md);
        
        // Find the List node
        let list_node = nodes.iter().find(|n| matches!(n, HotNode::List { .. }));
        assert!(list_node.is_some());
        if let Some(HotNode::List { ordered, items }) = list_node {
            assert_eq!(*ordered, false);
            assert_eq!(items.len(), 2);
        }
    }
}
