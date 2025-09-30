"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TipTapTableContextMenu } from "@/components/admin/tiptap/TipTapTableContextMenu";
import { TipTapImageContextMenu } from "@/components/admin/tiptap/TipTapImageContextMenu";
import { TipTapLinkTooltip } from "@/components/admin/tiptap/TipTapLinkTooltip";

type SelectionJSON = ReturnType<import("@tiptap/pm/state").Selection["toJSON"]>;

interface ContextMenuState {
    type: "table" | "image";
    x: number;
    y: number;
    selection: SelectionJSON;
}

interface TipTapContextMenuProps {
    editor: Editor | null;
    contextMenu: ContextMenuState | null;
    setContextMenu: (value: ContextMenuState | null) => void;
    setAltEditOpen: (value: boolean) => void;
    setCurrentAlt: (value: string) => void;
    setLinkUrl: (value: string) => void;
    setLinkText: (value: string) => void;
    setLinkTarget: (value: boolean) => void;
    setLinkNofollow: (value: boolean) => void;
    setIsImageLinkMode: (value: boolean) => void;
    setLinkEditOpen: (value: boolean) => void;
    setIsReplaceMode: (value: boolean) => void;
    setMediaPickerOpen: (value: boolean) => void;
    linkTooltip: {
        visible: boolean;
        href: string;
        x: number;
        y: number;
        type: "text" | "image";
    } | null;
    setLinkTooltip: (
        value: {
            visible: boolean;
            href: string;
            x: number;
            y: number;
            type: "text" | "image";
        } | null
    ) => void;
    children: React.ReactNode;
}

export function TipTapContextMenu({
    editor,
    contextMenu,
    setContextMenu,
    setAltEditOpen,
    setCurrentAlt,
    setLinkUrl,
    setLinkText,
    setLinkTarget,
    setLinkNofollow,
    setIsImageLinkMode,
    setLinkEditOpen,
    setIsReplaceMode,
    setMediaPickerOpen,
    linkTooltip,
    setLinkTooltip,
    children,
}: TipTapContextMenuProps) {
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
    }, [contextMenu, setContextMenu]);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    className="relative"
                    onContextMenu={(event) => {
                        if (!editor) return;
                        const target = event.target as HTMLElement | null;
                        if (!target) {
                            setContextMenu(null);
                            return;
                        }

                        const figure = target.closest("figure.tiptap-figure");
                        if (figure) {
                            // 画像の選択状態を設定
                            const pos = editor.view.posAtDOM(figure, 0);
                            if (typeof pos === "number") {
                                const selection = NodeSelection.create(
                                    editor.state.doc,
                                    pos
                                );
                                editor.view.dispatch(
                                    editor.state.tr.setSelection(selection)
                                );
                                editor.view.focus();
                            }
                            setContextMenu({
                                type: "image",
                                x: event.clientX,
                                y: event.clientY,
                                selection: editor.state.selection.toJSON(),
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
                                    editor.state.doc.resolve(position.pos)
                                );
                                editor.view.dispatch(
                                    editor.state.tr.setSelection(selection)
                                );
                                editor.view.focus();
                            }
                            setContextMenu({
                                type: "table",
                                x: event.clientX,
                                y: event.clientY,
                                selection: editor.state.selection.toJSON(),
                            });
                            return;
                        }

                        setContextMenu(null);
                    }}
                >
                    {children}
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
                                        editor?.getAttributes("mediaImage");
                                    const existingLink = imageAttrs?.link;
                                    setLinkUrl(existingLink?.href || "");
                                    setLinkText("");
                                    setLinkTarget(
                                        existingLink?.target === "_blank"
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
                                        editor.state.selection instanceof
                                            NodeSelection &&
                                        editor.state.selection.node.type
                                            .name === "mediaImage" &&
                                        editor.state.selection.node.attrs.link
                                            ?.href;

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
                                            .updateAttributes("mediaImage", {
                                                link: null,
                                            })
                                            .run();
                                    }
                                }
                                setLinkTooltip(null);
                            }}
                            onOpenLink={(href) => window.open(href, "_blank")}
                        />
                    )}
                </div>
            </ContextMenuTrigger>
            {contextMenu && (
                <ContextMenuContent>
                    {contextMenu.type === "table" ? (
                        <TipTapTableContextMenu editor={editor} />
                    ) : contextMenu.type === "image" ? (
                        <TipTapImageContextMenu
                            editor={editor}
                            onEditAlt={() => {
                                const currentAltValue =
                                    editor?.getAttributes("mediaImage").alt ||
                                    "";
                                setCurrentAlt(currentAltValue);
                                setAltEditOpen(true);
                            }}
                            onEditLink={() => {
                                const imageAttrs =
                                    editor?.getAttributes("mediaImage");
                                const hasLink =
                                    imageAttrs?.link && imageAttrs.link.href;

                                if (hasLink) {
                                    const existingLink = imageAttrs.link;
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
    );
}
