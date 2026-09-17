import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from './extensions/FontSize';
import { ProtectedToken } from './extensions/ProtectedToken';
import Toolbar from './Toolbar';
import { hotSdk } from '../services/hotSdk';
import { SdkStatus, FontInfo } from '../types';

interface EditorProps {
  initialContent: string;
  onUpdateStatus: (status: SdkStatus) => void;
  fonts: FontInfo[];
  selectedFont: string;
  onFontChange: (font: string) => void;
  selectedFontSize: string;
  onFontSizeChange: (size: string) => void;
  onAddAsset: (name: string, content: string) => void;
}

const EditorComponent: React.FC<EditorProps> = ({ 
  initialContent, 
  fonts, 
  selectedFont, 
  onFontChange,
  selectedFontSize,
  onFontSizeChange,
  onAddAsset
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: true,
      }),
      TextStyle,
      FontFamily,
      FontSize,
      ProtectedToken
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none h-full',
      },
    },
    onUpdate: ({ editor }) => {
      // ⚠️ CRITICAL: Passing state to HOT SDK
      // We do NOT manage state here. We delegate to the SDK.
      hotSdk.updateHtml(editor.getHTML());
    },
  });

  // Effect to clean up editor on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Sync editor content when initialContent changes (e.g. from newDocument)
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <Toolbar 
        editor={editor} 
        fonts={fonts}
        selectedFont={selectedFont}
        onFontChange={onFontChange}
        selectedFontSize={selectedFontSize}
        onFontSizeChange={onFontSizeChange}
        onAddAsset={onAddAsset}
      />
      <div 
        className="flex-1 overflow-y-auto bg-slate-50 cursor-text editor-wrapper" 
        onClick={() => editor?.chain().focus().run()}
        style={{ 
            '--hot-font-family': `'${selectedFont}', sans-serif`,
            '--hot-font-size': selectedFontSize 
        } as React.CSSProperties}
      >
        <EditorContent editor={editor} className="min-h-full" />
      </div>
      
      {/* Overlay to show Failure State clearly inside the editor context */}
      {/* We use a subscriber in App.tsx to pass the failure state, 
          but visual feedback is handled via CSS classes or this overlay */}
    </div>
  );
};

export default EditorComponent;
