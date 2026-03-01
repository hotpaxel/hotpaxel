use crate::ir::HotNode;

pub trait Parser {
    fn parse(&self, input: &str) -> Vec<HotNode>;
}

pub trait Renderer {
    fn render(&self, nodes: &[HotNode]) -> String;
}
