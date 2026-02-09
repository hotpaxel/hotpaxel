import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Code, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered,
  Box,
  Braces,
  Stamp,
  FileSignature
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const insertToken = (type: string, value: string, label: string) => {
    editor.chain().focus().insertContent({
      type: 'protectedToken',
      attrs: { type, value, label }
    }).run();
  };

  const ButtonClass = (isActive: boolean) => 
    `p-2 rounded hover:bg-slate-200 transition-colors ${isActive ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`;

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 bg-white p-2 sticky top-0 z-10 shadow-sm">
      
      {/* Basic Formatting Group */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={ButtonClass(editor.isActive('bold'))}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={ButtonClass(editor.isActive('italic'))}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={ButtonClass(editor.isActive('heading', { level: 1 }))}
          title="H1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={ButtonClass(editor.isActive('heading', { level: 2 }))}
          title="H2"
        >
          <Heading2 size={18} />
        </button>
         <div className="w-px h-6 bg-slate-300 mx-1"></div>
         
         <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={ButtonClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={ButtonClass(editor.isActive('orderedList'))}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      {/* HOT PAXEL Specific Controls (Protected Tokens) */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">HOT Tokens</span>
        
        <button
          onClick={() => insertToken('variable', '{{ var }}', '{{ Variable }}')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded border border-brand-100 transition-colors"
        >
          <Braces size={14} /> Variable
        </button>

        <button
          onClick={() => insertToken('logic', '{% if %}', '{% Logic %}')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-100 transition-colors"
        >
          <Code size={14} /> Logic
        </button>

        <button
          onClick={() => insertToken('signbox', '\\SignBox', '\\SignBox')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-100 transition-colors"
        >
          <FileSignature size={14} /> SignBox
        </button>

        <button
          onClick={() => insertToken('party', '\\Party', '\\Party')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded border border-orange-100 transition-colors"
        >
          <Stamp size={14} /> Party
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
