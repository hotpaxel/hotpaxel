import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ProtectedToken } from './extensions/ProtectedToken';
import Toolbar from './Toolbar';
import { hotSdk } from '../services/hotSdk';
import { SdkStatus } from '../types';

interface EditorProps {
  initialContent: string;
  onUpdateStatus: (status: SdkStatus) => void;
}

const EditorComponent: React.FC<EditorProps> = ({ initialContent }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
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

  return (
    <div className="flex flex-col h-full bg-white relative">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto bg-slate-50 cursor-text" onClick={() => editor?.chain().focus().run()}>
        <EditorContent editor={editor} className="min-h-full" />
      </div>
      
      {/* Overlay to show Failure State clearly inside the editor context */}
      {/* We use a subscriber in App.tsx to pass the failure state, 
          but visual feedback is handled via CSS classes or this overlay */}
    </div>
  );
};

export default EditorComponent;
