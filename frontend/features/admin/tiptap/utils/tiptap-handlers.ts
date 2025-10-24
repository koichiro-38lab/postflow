import type { Editor } from "@tiptap/react";
import type { SucceededMediaItem } from "@/features/admin/media/types";

// メディア選択時の処理
export function handleMediaSelect(
    item: SucceededMediaItem,
    editor: Editor | null,
    isReplaceMode: boolean,
    setIsReplaceMode: (value: boolean) => void,
    setMediaPickerOpen: (value: boolean) => void
) {
    // storageKeyを相対パスとしてそのまま保存 (renderHTML時にbuildMediaUrlで変換される)
    const storageKey = item.storageKey;

    if (isReplaceMode) {
        // 置換モードの場合、既存の画像を更新
        if (editor) {
            editor
                .chain()
                .focus()
                .updateAttributes("mediaImage", {
                    src: storageKey,
                    alt: item.altText || "",
                })
                .run();
        }
        setIsReplaceMode(false);
    } else {
        // 新規挿入の場合
        if (editor && storageKey) {
            // MediaImage拡張のinsertContentを使用 (相対パスで保存)
            editor
                .chain()
                .focus()
                .insertContent({
                    type: "mediaImage",
                    attrs: {
                        src: storageKey,
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
}

// リンク追加時の処理
export function handleAddLink(
    editor: Editor | null,
    setters: {
        setLinkUrl: (value: string) => void;
        setLinkText: (value: string) => void;
        setLinkTarget: (value: boolean) => void;
        setLinkNofollow: (value: boolean) => void;
        setIsImageLinkMode: (value: boolean) => void;
        setLinkEditOpen: (value: boolean) => void;
    }
) {
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
        setters.setLinkUrl(linkAttrs.href || "");
        setters.setLinkText(selectedText);
        setters.setLinkTarget(linkAttrs.target === "_blank");
        setters.setLinkNofollow(linkAttrs.rel === "nofollow");
    } else if (isImageActive) {
        // 画像へのリンク設定
        const imageAttrs = editor.getAttributes("mediaImage");
        const existingLink = imageAttrs.link;
        if (existingLink && existingLink.href) {
            // 画像にリンクが既にある場合
            setters.setLinkUrl(existingLink.href);
            setters.setLinkText("");
            setters.setLinkTarget(existingLink.target === "_blank");
            setters.setLinkNofollow(existingLink.rel === "nofollow");
        } else {
            // 新規リンク設定
            setters.setLinkUrl("");
            setters.setLinkText("");
            setters.setLinkTarget(false);
            setters.setLinkNofollow(false);
        }
    } else {
        // 新規リンクの挿入
        setters.setLinkText(selectedText);
        setters.setLinkUrl("");
        setters.setLinkTarget(false);
        setters.setLinkNofollow(false);
    }

    setters.setIsImageLinkMode(isImageActive);
    setters.setLinkEditOpen(true);
}

// テーブル追加時の処理
export function handleAddTable(editor: Editor | null) {
    if (!editor) return;
    editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
}
