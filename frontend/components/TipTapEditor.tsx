"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useState, useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { Button } from "@/components/ui/button";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Link as LinkIcon,
    Table as TableIcon,
    Undo,
    Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TipTapEditorProps {
    content: string;
    onChange: (content: string) => void;
    className?: string;
}

export function TipTapEditor({
    content,
    onChange,
    className,
}: TipTapEditorProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: true,
                allowBase64: false,
                HTMLAttributes: {
                    class: "max-w-full h-auto rounded-lg",
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-600 hover:text-blue-800 underline",
                },
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: content
            ? typeof content === "string" && content.startsWith("{")
                ? JSON.parse(content)
                : content
            : "",
        onUpdate: ({ editor }) => {
            onChange(JSON.stringify(editor.getJSON()));
        },
        immediatelyRender: false, // SSR対策
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 border rounded-md",
            },
        },
    });

    // クライアントサイドでのみレンダリング
    if (!isMounted) {
        return (
            <div
                className={cn("border rounded-md min-h-[300px] p-4", className)}
            >
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    const addImage = () => {
        if (!editor) return;
        const url = window.prompt("画像のURLを入力してください:");
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const addLink = () => {
        if (!editor) return;
        const url = window.prompt("リンクのURLを入力してください:");
        if (url) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
        }
    };

    const addTable = () => {
        if (!editor) return;
        editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
    };

    return (
        <div className={cn("border rounded-md", className)}>
            {/* ツールバー */}
            {editor && (
                <div className="border-b p-2 flex flex-wrap gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        className={cn(editor.isActive("bold") && "bg-muted")}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        className={cn(editor.isActive("italic") && "bg-muted")}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                        }
                        className={cn(
                            editor.isActive("heading", { level: 1 }) &&
                                "bg-muted"
                        )}
                    >
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                        className={cn(
                            editor.isActive("heading", { level: 2 }) &&
                                "bg-muted"
                        )}
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 3 })
                                .run()
                        }
                        className={cn(
                            editor.isActive("heading", { level: 3 }) &&
                                "bg-muted"
                        )}
                    >
                        <Heading3 className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                        className={cn(
                            editor.isActive("bulletList") && "bg-muted"
                        )}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                        className={cn(
                            editor.isActive("orderedList") && "bg-muted"
                        )}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                        className={cn(
                            editor.isActive("blockquote") && "bg-muted"
                        )}
                    >
                        <Quote className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addImage}
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addLink}
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addTable}
                    >
                        <TableIcon className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* エディタ本体 */}
            <EditorContent editor={editor} />
        </div>
    );
}
