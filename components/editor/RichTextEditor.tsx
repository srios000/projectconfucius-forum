"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  /** Stringified Tiptap JSON doc. */
  value: string;
  /** Receives stringified Tiptap JSON (empty string when editor is empty). */
  onChange: (json: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Fires when the user presses Ctrl/Cmd+Enter inside the editor. */
  onSubmit?: () => void;
};

type ToolbarButtonProps = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  isActive?: boolean;
};

function ToolbarButton({ label, Icon, onClick, isActive }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={
        "size-7 rounded inline-flex items-center justify-center transition-colors " +
        (isActive
          ? "bg-primary-mute text-primary"
          : "text-muted-foreground hover:bg-primary-mute hover:text-primary")
      }
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = () => {
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-y border-border bg-muted/30">
      <ToolbarButton
        label="Bold (Ctrl+B)"
        Icon={Bold}
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic (Ctrl+I)"
        Icon={Italic}
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Underline (Ctrl+U)"
        Icon={UnderlineIcon}
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="Strikethrough"
        Icon={Strikethrough}
        isActive={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        label="Inline code"
        Icon={Code}
        isActive={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        label="Link (Ctrl+K)"
        Icon={LinkIcon}
        isActive={editor.isActive("link")}
        onClick={setLink}
      />
      <ToolbarButton
        label="Remove link"
        Icon={Unlink}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />
      <ToolbarButton label="Image" Icon={ImageIcon} onClick={insertImage} />
      <ToolbarButton
        label="Bulleted list"
        Icon={List}
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Numbered list"
        Icon={ListOrdered}
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Quote"
        Icon={Quote}
        isActive={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "What's on your mind?",
  autoFocus = false,
  onSubmit,
}: Props) {
  const initialContent = (() => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed.startsWith("{")) return "";
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object") return parsed as object;
      return "";
    } catch {
      return "";
    }
  })();

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-32 w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:bg-card transition-colors",
      },
      handleKeyDown(_view, event) {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && onSubmitRef.current) {
          event.preventDefault();
          onSubmitRef.current();
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      if (editor.isEmpty) {
        onChange("");
        return;
      }
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor || !autoFocus) return;
    editor.commands.focus("end");
  }, [editor, autoFocus]);

  return (
    <div className="flex flex-col">
      <Toolbar editor={editor} />
      <div className="px-3.5 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
