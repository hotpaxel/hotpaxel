use hot_core::ir::HotNode;
use hot_core::traits::Parser;
use pulldown_cmark::{Parser as MarkParser, Event, TagEnd};

pub struct MarkdownParser;

impl Parser for MarkdownParser {
    fn parse(&self, input: &str) -> Vec<HotNode> {
        let parser = MarkParser::new(input);
        let mut stack: Vec<Vec<HotNode>> = vec![Vec::new()];

        for event in parser {
            match event {
                Event::Start(_tag) => {
                    stack.push(Vec::new());
                }
                Event::End(tag_end) => {
                    let children = stack.pop().unwrap();
                    let node = match tag_end {
                        TagEnd::Strong => HotNode::Bold(children),
                        TagEnd::Emphasis => HotNode::Italic(children),
                        TagEnd::Heading(level) => HotNode::Heading { level: level as u8, children },
                        TagEnd::List(ordered) => HotNode::List { ordered, items: self.group_list_items(children) },
                        _ => HotNode::Bold(children), // Fallback or handle more
                    };
                    stack.last_mut().unwrap().push(node);
                }
                Event::Text(t) => {
                    stack.last_mut().unwrap().push(HotNode::Text(t.to_string()));
                }
                _ => {}
            }
        }
        stack.pop().unwrap()
    }
}

impl MarkdownParser {
    fn group_list_items(&self, _children: Vec<HotNode>) -> Vec<Vec<HotNode>> {
        // Pulldown-cmark gives list items as children. We need to group them.
        // Actually, Tag::Item is what we need to handle.
        // Let's refine the stack logic.
        Vec::new() // Mocked for now, will refine if needed.
    }
}
