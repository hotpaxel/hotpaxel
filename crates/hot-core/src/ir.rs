use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum HotNode {
    Text(String),
    Bold(Vec<HotNode>),
    Italic(Vec<HotNode>),
    Heading {
        level: u8,
        children: Vec<HotNode>,
    },
    List {
        ordered: bool,
        items: Vec<Vec<HotNode>>,
    },
    Image {
        path: String,
        options: Option<String>,
    },
    Styled {
        style: HotStyle,
        children: Vec<HotNode>,
    },
    /// Protected tokens (e.g. {{ var }}, {% logic %})
    Raw(String),
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct HotStyle {
    pub font_family: Option<String>,
    pub font_size: Option<f64>,
    pub color: Option<String>,
    pub text_align: Option<Align>,
    pub text_decoration: Option<Decoration>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Align {
    Left,
    Center,
    Right,
    Justify,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Decoration {
    Underline,
    LineThrough,
}
