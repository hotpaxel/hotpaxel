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
import { FontInfo } from '../types';

interface ToolbarProps {
  editor: Editor | null;
  fonts: FontInfo[];
  selectedFont: string;
  onFontChange: (font: string) => void;
  selectedFontSize: string;
  onFontSizeChange: (size: string) => void;
}

const fontSizes = ['10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt'];

const Toolbar: React.FC<ToolbarProps> = ({ 
  editor, 
  fonts, 
  selectedFont, 
  onFontChange,
  selectedFontSize,
  onFontSizeChange
}) => {
  if (!editor) {
    return null;
  }

  const insertToken = (type: string, value: string, label: string) => {
    editor.chain().focus().insertContent({
      type: 'protectedToken',
      attrs: { type, value, label }
    }).run();
  };

  const handleFontChange = (fontFamily: string) => {
    onFontChange(fontFamily);
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  const handleFontSizeChange = (size: string) => {
    onFontSizeChange(size);
    editor.chain().focus().setFontSize(size).run();
  };

  const ButtonClass = (isActive: boolean) => 
    `p-2 rounded hover:bg-slate-200 transition-colors ${isActive ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`;

  const SelectClass = "text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 bg-white p-2 sticky top-0 z-10 shadow-sm">
      
      {/* 1. Inline Text Style Group & Basic Formatting */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        
        {/* Font & Size Selectors - Now apply to SELECTED TEXT only */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
           <select 
             className={SelectClass}
             value={selectedFont}
             onChange={(e) => handleFontChange(e.target.value)}
             title="Font Family"
           >
             {fonts.map(f => (
               <option key={f.family} value={f.family}>{f.family}</option>
             ))}
           </select>

           <select 
             className={SelectClass}
             value={selectedFontSize}
             onChange={(e) => handleFontSizeChange(e.target.value)}
             title="Font Size"
           >
             {fontSizes.map(size => (
               <option key={size} value={size}>{size}</option>
             ))}
           </select>
        </div>

        <div className="flex items-center gap-1 pl-1">
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
      </div>

      {/* 2. HOT PAXEL Specific Controls (Protected Tokens) */}
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
