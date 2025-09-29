"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Fragment, useState, useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";
import type { SucceededMediaItem } from "@/features/admin/media/types";
import { buildMediaUrl } from "@/lib/media-url";

import MediaImage from "@/lib/tiptap/extensions/media-image";
import { NodeSelection, Selection, TextSelection } from "@tiptap/pm/state";

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TipTapTableContextMenu } from "@/components/admin/tiptap/TipTapTableContextMenu";
import { TipTapImageContextMenu } from "@/components/admin/tiptap/TipTapImageContextMenu";
import { TipTapToolbar } from "@/components/admin/tiptap/TipTapToolbar";
import { TipTapLinkDialog } from "@/components/admin/tiptap/TipTapLinkDialog";
import { TipTapAltTextDialog } from "@/components/admin/tiptap/TipTapAltTextDialog";
import { TipTapLinkTooltip } from "@/components/admin/tiptap/TipTapLinkTooltip";

interface TipTapEditorProps {
    content: string;
    onChange: (content: string) => void;
    className?: string;
}

type SelectionJSON = ReturnType<Selection["toJSON"]>;

interface ContextMenuState {
    type: "table" | "image";
    x: number;
    y: number;
    selection: SelectionJSON;
}

export function TipTapEditor({
    content,
    onChange,
    className,
}: TipTapEditorProps) {
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    // 置換モードのフラグ
    const [isReplaceMode, setIsReplaceMode] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
        null
    );
    const [altEditOpen, setAltEditOpen] = useState(false);
    const [currentAlt, setCurrentAlt] = useState("");
    const [linkEditOpen, setLinkEditOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [linkTarget, setLinkTarget] = useState(false);
    const [linkNofollow, setLinkNofollow] = useState(false);
    const [isImageLinkMode, setIsImageLinkMode] = useState(false);
    const [linkTooltip, setLinkTooltip] = useState<{
        visible: boolean;
        href: string;
        x: number;
        y: number;
        type: "text" | "image";
    } | null>(null);

    const editor = useEditor({
        extensions: [
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

            // テキストリンクツールチップの処理（画像リンクは表示しない）
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

                // テキストリンクの場合のみクリックを無効化
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

                // 画像リンクの場合は通常のクリック処理を行う（選択状態にする）
                return false;
            },
            handleKeyDown: (view, event) => {
                // Ctrl+K または Cmd+K でリンク作成
                if ((event.ctrlKey || event.metaKey) && event.key === "k") {
                    event.preventDefault();
                    addLink();
                    return true;
                }
                return false;
            },
        },
    });

    const addLink = () => {
        if (!editor) return;

        const isLinkActive = editor.isActive("link");
        const isImageActive = editor.isActive("mediaImage");
        const selectedText = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
        );

        if (isLinkActive) {
            // 既存リンクの編集
            const linkAttrs = editor.getAttributes("link");
            setLinkUrl(linkAttrs.href || "");
            setLinkText(selectedText);
            setLinkTarget(linkAttrs.target === "_blank");
            setLinkNofollow(linkAttrs.rel === "nofollow");
        } else if (isImageActive) {
            // 画像へのリンク設定
            const imageAttrs = editor.getAttributes("mediaImage");
            const existingLink = imageAttrs.link;
            if (existingLink && existingLink.href) {
                // 画像にリンクが既にある場合
                setLinkUrl(existingLink.href);
                setLinkText("");
                setLinkTarget(existingLink.target === "_blank");
                setLinkNofollow(existingLink.rel === "nofollow");
            } else {
                // 新規リンク設定
                setLinkUrl("");
                setLinkText("");
                setLinkTarget(false);
                setLinkNofollow(false);
            }
        } else {
            // 新規リンクの挿入
            setLinkText(selectedText);
            setLinkUrl("");
            setLinkTarget(false);
            setLinkNofollow(false);
        }

        setIsImageLinkMode(isImageActive);
        setLinkEditOpen(true);
    };

    const addTable = () => {
        if (!editor) return;
        editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
    };

    // メディア選択時のハンドラ
    const handleMediaSelect = (item: SucceededMediaItem) => {
        // メディアURLを構築
        const mediaUrl = buildMediaUrl(item.storageKey);

        if (isReplaceMode) {
            // 置換モードの場合、既存の画像を更新
            if (editor) {
                editor
                    .chain()
                    .focus()
                    .updateAttributes("mediaImage", {
                        src: mediaUrl,
                        alt: item.altText || "",
                    })
                    .run();
            }
            setIsReplaceMode(false);
        } else {
            // 新規挿入の場合
            if (editor && mediaUrl) {
                // MediaImage拡張のinsertContentを使用
                editor
                    .chain()
                    .focus()
                    .insertContent({
                        type: "mediaImage",
                        attrs: {
                            src: mediaUrl,
                            alt: item.altText || "",
                            align: "center",
                            size: "lg",
                            link: null,
                            caption: null,
                        },
                    })
                    .run();
            }
        }
        setMediaPickerOpen(false);
    };

    useEffect(() => {
        if (!contextMenu) return;
        const close = () => setContextMenu(null);
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setContextMenu(null);
        };
        window.addEventListener("click", close);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("keydown", onKey);
        };
    }, [contextMenu]);

    return (
        <>
            <div className={cn("border rounded-md", className)}>
                {editor && (
                    <div className="sticky top-0 z-50 bg-background">
                        <TipTapToolbar
                            editor={editor}
                            onImageClick={() => setMediaPickerOpen(true)}
                            onLinkClick={addLink}
                            onTableClick={addTable}
                        />
                    </div>
                )}

                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        <div
                            className="relative"
                            onContextMenu={(event) => {
                                if (!editor) return;
                                const target =
                                    event.target as HTMLElement | null;
                                if (!target) {
                                    setContextMenu(null);
                                    return;
                                }

                                const figure = target.closest(
                                    "figure.tiptap-figure"
                                );
                                if (figure) {
                                    // 画像の選択状態を設定
                                    const pos = editor.view.posAtDOM(figure, 0);
                                    if (typeof pos === "number") {
                                        const selection = NodeSelection.create(
                                            editor.state.doc,
                                            pos
                                        );
                                        editor.view.dispatch(
                                            editor.state.tr.setSelection(
                                                selection
                                            )
                                        );
                                        editor.view.focus();
                                    }
                                    setContextMenu({
                                        type: "image",
                                        x: event.clientX,
                                        y: event.clientY,
                                        selection:
                                            editor.state.selection.toJSON(),
                                    });
                                    return;
                                }

                                const cell = target.closest("td, th");
                                if (cell) {
                                    // テーブルセルの位置にフォーカス
                                    const position = editor.view.posAtCoords({
                                        left: event.clientX,
                                        top: event.clientY,
                                    });
                                    if (position) {
                                        const selection = TextSelection.near(
                                            editor.state.doc.resolve(
                                                position.pos
                                            )
                                        );
                                        editor.view.dispatch(
                                            editor.state.tr.setSelection(
                                                selection
                                            )
                                        );
                                        editor.view.focus();
                                    }
                                    setContextMenu({
                                        type: "table",
                                        x: event.clientX,
                                        y: event.clientY,
                                        selection:
                                            editor.state.selection.toJSON(),
                                    });
                                    return;
                                }

                                setContextMenu(null);
                            }}
                        >
                            <EditorContent
                                editor={editor}
                                className="tiptap-editor"
                            />
                            {linkTooltip && linkTooltip.visible && (
                                <TipTapLinkTooltip
                                    visible={true}
                                    x={linkTooltip.x}
                                    y={linkTooltip.y}
                                    href={linkTooltip.href}
                                    type={linkTooltip.type}
                                    onEdit={() => {
                                        // 編集モードに入る
                                        if (linkTooltip.type === "text") {
                                            const selectedText =
                                                editor?.state.doc.textBetween(
                                                    editor.state.selection.from,
                                                    editor.state.selection.to
                                                );
                                            const linkAttrs =
                                                editor?.getAttributes("link");
                                            setLinkUrl(linkAttrs?.href || "");
                                            setLinkText(selectedText || "");
                                            setLinkTarget(
                                                linkAttrs?.target === "_blank"
                                            );
                                            setLinkNofollow(
                                                linkAttrs?.rel === "nofollow"
                                            );
                                            setIsImageLinkMode(false);
                                        } else {
                                            const imageAttrs =
                                                editor?.getAttributes(
                                                    "mediaImage"
                                                );
                                            const existingLink =
                                                imageAttrs?.link;
                                            setLinkUrl(
                                                existingLink?.href || ""
                                            );
                                            setLinkText("");
                                            setLinkTarget(
                                                existingLink?.target ===
                                                    "_blank"
                                            );
                                            setLinkNofollow(
                                                existingLink?.rel === "nofollow"
                                            );
                                            setIsImageLinkMode(true);
                                        }
                                        setLinkEditOpen(true);
                                        setLinkTooltip(null);
                                    }}
                                    onRemove={() => {
                                        if (editor) {
                                            const isLinkActive =
                                                editor.isActive("link");
                                            const isImageLink =
                                                editor.state
                                                    .selection instanceof
                                                    NodeSelection &&
                                                editor.state.selection.node.type
                                                    .name === "mediaImage" &&
                                                editor.state.selection.node
                                                    .attrs.link?.href;

                                            if (isLinkActive) {
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .extendMarkRange("link")
                                                    .unsetLink()
                                                    .run();
                                            } else if (isImageLink) {
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .updateAttributes(
                                                        "mediaImage",
                                                        {
                                                            link: null,
                                                        }
                                                    )
                                                    .run();
                                            }
                                        }
                                        setLinkTooltip(null);
                                    }}
                                    onOpenLink={(href) =>
                                        window.open(href, "_blank")
                                    }
                                />
                            )}
                        </div>
                    </ContextMenuTrigger>
                    {/* contextMenu が null でない場合のみ描画 */}
                    {contextMenu && (
                        <ContextMenuContent>
                            {contextMenu.type === "table" ? (
                                <TipTapTableContextMenu editor={editor} />
                            ) : contextMenu.type === "image" ? (
                                <TipTapImageContextMenu
                                    editor={editor}
                                    onEditAlt={() => {
                                        const currentAltValue =
                                            editor?.getAttributes("mediaImage")
                                                .alt || "";
                                        setCurrentAlt(currentAltValue);
                                        setAltEditOpen(true);
                                    }}
                                    onEditLink={() => {
                                        const imageAttrs =
                                            editor?.getAttributes("mediaImage");
                                        const hasLink =
                                            imageAttrs?.link &&
                                            imageAttrs.link.href;

                                        if (hasLink) {
                                            const existingLink =
                                                imageAttrs.link;
                                            setLinkUrl(existingLink.href);
                                            setLinkTarget(
                                                existingLink.target === "_blank"
                                            );
                                            setLinkNofollow(
                                                existingLink.rel === "nofollow"
                                            );
                                        } else {
                                            setLinkUrl("");
                                            setLinkTarget(false);
                                            setLinkNofollow(false);
                                        }
                                        setLinkText("");
                                        setIsImageLinkMode(true);
                                        setLinkEditOpen(true);
                                    }}
                                    onReplace={() => {
                                        // 置換モードでメディアピッカーを開く
                                        setIsReplaceMode(true);
                                        setMediaPickerOpen(true);
                                    }}
                                />
                            ) : null}
                        </ContextMenuContent>
                    )}
                </ContextMenu>
            </div>
            <MediaPickerDialog
                open={mediaPickerOpen}
                onOpenChange={setMediaPickerOpen}
                onSelect={handleMediaSelect}
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
