"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useMemo, useCallback } from "react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";
import type { SucceededMediaItem } from "@/features/admin/media/types";

import MediaImage from "@/lib/tiptap/extensions/media-image";

import { TipTapToolbar } from "@/components/admin/tiptap/TipTapToolbar";
import { TipTapLinkDialog } from "@/components/admin/tiptap/TipTapLinkDialog";
import { TipTapAltTextDialog } from "@/components/admin/tiptap/TipTapAltTextDialog";
import { TipTapContextMenu } from "@/components/admin/tiptap/TipTapContextMenu";
import { useTipTapState } from "@/features/admin/tiptap/hooks/use-tipTap-state";
import {
    handleMediaSelect,
    handleAddLink,
    handleAddTable,
} from "@/features/admin/tiptap/utils/tiptap-handlers";

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
    // 状態管理をカスタムフックに委譲
    const {
        mediaPickerOpen,
        setMediaPickerOpen,
        isReplaceMode,
        setIsReplaceMode,
        contextMenu,
        setContextMenu,
        altEditOpen,
        setAltEditOpen,
        currentAlt,
        setCurrentAlt,
        linkEditOpen,
        setLinkEditOpen,
        linkUrl,
        setLinkUrl,
        linkText,
        setLinkText,
        linkTarget,
        setLinkTarget,
        linkNofollow,
        setLinkNofollow,
        isImageLinkMode,
        setIsImageLinkMode,
        linkTooltip,
        setLinkTooltip,
    } = useTipTapState();

    // エディタ設定をメモ化
    const extensions = useMemo(
        () => [
            StarterKit,
            MediaImage.configure({
                allowBase64: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-600 hover:text-blue-800 underline",
                },
            }),
            Table.configure({
                resizable: false,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        []
    );

    const editor = useEditor({
        extensions,
        content: content
            ? typeof content === "string" && content.startsWith("{")
                ? JSON.parse(content)
                : content
            : "",
        onUpdate: ({ editor }) => {
            onChange(JSON.stringify(editor.getJSON()));
        },
        onSelectionUpdate: ({ editor }) => {
            const isLinkActive = editor.isActive("link");

            if (isLinkActive) {
                const linkAttrs = editor.getAttributes("link");
                const { from } = editor.state.selection;
                const coords = editor.view.coordsAtPos(from);
                const editorRect = editor.view.dom.getBoundingClientRect();

                setLinkTooltip({
                    visible: true,
                    href: linkAttrs.href || "",
                    x: coords.left - editorRect.left,
                    y: coords.top - editorRect.top - 40,
                    type: "text",
                });
            } else {
                setLinkTooltip(null);
            }
        },
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "prose prose-base sm:prose-lg lg:prose-xl xl:prose-2xl max-w-none font-sans leading-relaxed text-foreground min-h-[320px] px-5 py-6 outline-none",
            },
            handleClick: (view, pos, event) => {
                const { state } = view;
                const { schema } = state;
                const link = schema.marks.link;

                if (link && event.target) {
                    const mark =
                        state.storedMarks?.find((m) => m.type === link) ||
                        state.doc
                            .nodeAt(pos)
                            ?.marks?.find((m) => m.type === link);

                    if (mark) {
                        event.preventDefault();
                        return true;
                    }
                }
                return false;
            },
            handleKeyDown: (view, event) => {
                // Ctrl+K または Cmd+K でリンク作成
                if ((event.ctrlKey || event.metaKey) && event.key === "k") {
                    event.preventDefault();
                    handleAddLink(editor, {
                        setLinkUrl,
                        setLinkText,
                        setLinkTarget,
                        setLinkNofollow,
                        setIsImageLinkMode,
                        setLinkEditOpen,
                    });
                    return true;
                }
                return false;
            },
        },
    });

    // メディア選択時の処理
    const onMediaSelect = useCallback(
        (item: SucceededMediaItem) => {
            handleMediaSelect(
                item,
                editor,
                isReplaceMode,
                setIsReplaceMode,
                setMediaPickerOpen
            );
        },
        [editor, isReplaceMode, setIsReplaceMode, setMediaPickerOpen]
    ); // テーブル追加時の処理
    const onAddTable = useCallback(() => {
        handleAddTable(editor);
    }, [editor]);

    // リンク追加時の処理
    const onAddLink = useCallback(() => {
        handleAddLink(editor, {
            setLinkUrl,
            setLinkText,
            setLinkTarget,
            setLinkNofollow,
            setIsImageLinkMode,
            setLinkEditOpen,
        });
    }, [
        editor,
        setLinkUrl,
        setLinkText,
        setLinkTarget,
        setLinkNofollow,
        setIsImageLinkMode,
        setLinkEditOpen,
    ]);
    return (
        <>
            <div className={cn("border rounded-md", className)}>
                {editor && (
                    <div
                        className="sticky z-10 bg-background/60 backdrop-blur-md shadow-lg border-l border-r"
                        style={{ top: 72 }}
                    >
                        <TipTapToolbar
                            editor={editor}
                            onImageClick={() => setMediaPickerOpen(true)}
                            onLinkClick={onAddLink}
                            onTableClick={onAddTable}
                        />
                    </div>
                )}

                <TipTapContextMenu
                    editor={editor}
                    contextMenu={contextMenu}
                    setContextMenu={setContextMenu}
                    setAltEditOpen={setAltEditOpen}
                    setCurrentAlt={setCurrentAlt}
                    setLinkUrl={setLinkUrl}
                    setLinkText={setLinkText}
                    setLinkTarget={setLinkTarget}
                    setLinkNofollow={setLinkNofollow}
                    setIsImageLinkMode={setIsImageLinkMode}
                    setLinkEditOpen={setLinkEditOpen}
                    setIsReplaceMode={setIsReplaceMode}
                    setMediaPickerOpen={setMediaPickerOpen}
                    linkTooltip={linkTooltip}
                    setLinkTooltip={setLinkTooltip}
                >
                    <EditorContent editor={editor} className="tiptap-editor" />
                </TipTapContextMenu>
            </div>
            <MediaPickerDialog
                open={mediaPickerOpen}
                onOpenChange={setMediaPickerOpen}
                onSelect={onMediaSelect}
            />
            <TipTapAltTextDialog
                open={altEditOpen}
                onOpenChange={setAltEditOpen}
                altText={currentAlt}
                onSave={(altText) => {
                    if (editor) {
                        editor
                            .chain()
                            .focus()
                            .updateAttributes("mediaImage", {
                                alt: altText,
                            })
                            .run();
                    }
                    setAltEditOpen(false);
                }}
            />
            <TipTapLinkDialog
                open={linkEditOpen}
                onOpenChange={setLinkEditOpen}
                url={linkUrl}
                text={linkText}
                target={linkTarget}
                nofollow={linkNofollow}
                isImageMode={isImageLinkMode}
                onSave={(data) => {
                    if (editor && data.url) {
                        const linkAttrs: {
                            href: string;
                            target: string;
                            rel?: string;
                        } = {
                            href: data.url,
                            target: data.target ? "_blank" : "_self",
                        };
                        if (data.nofollow) linkAttrs.rel = "nofollow";

                        const isLinkActive = editor.isActive("link");
                        const isImageActive = editor.isActive("mediaImage");

                        if (isLinkActive) {
                            // 既存リンクの更新
                            editor
                                .chain()
                                .focus()
                                .extendMarkRange("link")
                                .updateAttributes("link", linkAttrs)
                                .run();
                        } else if (isImageActive) {
                            // 画像にリンクを設定
                            editor
                                .chain()
                                .focus()
                                .updateAttributes("mediaImage", {
                                    link: linkAttrs,
                                })
                                .run();
                        } else if (data.text) {
                            // 新規リンクの挿入（テキスト選択時）
                            editor
                                .chain()
                                .focus()
                                .insertContent({
                                    type: "text",
                                    text: data.text,
                                    marks: [
                                        {
                                            type: "link",
                                            attrs: linkAttrs,
                                        },
                                    ],
                                })
                                .run();
                        } else {
                            // 新規リンクの挿入（テキスト未選択時）
                            editor
                                .chain()
                                .focus()
                                .extendMarkRange("link")
                                .setLink(linkAttrs)
                                .run();
                        }
                    }
                    setLinkEditOpen(false);
                }}
                onDelete={() => {
                    if (editor) {
                        // 画像のリンクを削除
                        editor
                            .chain()
                            .focus()
                            .updateAttributes("mediaImage", {
                                link: null,
                            })
                            .run();
                    }
                }}
            />
        </>
    );
}
