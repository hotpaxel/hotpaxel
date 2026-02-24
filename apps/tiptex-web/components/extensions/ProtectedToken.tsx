import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

// Defines the custom node for protected tokens (SignBox, ClauseRef, Logic)
// This ensures they are treated as a single unit (Atom) and cannot be internally edited.

const ProtectedTokenComponent = ({ node }: any) => {
  return (
    <NodeViewWrapper as="span" className="hot-token" contentEditable={false}>
      {node.attrs.label}
    </NodeViewWrapper>
  );
};

export const ProtectedToken = Node.create({
  name: 'protectedToken',

  group: 'inline',
  
  inline: true,
  
  atom: true, // Crucial: Makes it treated as a single character for cursor movement

  addAttributes() {
    return {
      type: {
        default: 'variable',
      },
      value: {
        default: '',
      },
      label: {
        default: 'TOKEN',
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.hot-protect[data-raw]',
        getAttrs: element => ({
          value: element.getAttribute('data-raw'),
          label: element.textContent,
        })
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span', 
      mergeAttributes(HTMLAttributes, { 
        class: 'hot-protect',
        'data-raw': node.attrs.value
      }), 
      node.attrs.label
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProtectedTokenComponent)
  },
});
