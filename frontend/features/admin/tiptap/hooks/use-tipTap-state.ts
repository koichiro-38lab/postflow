import { useState } from "react";

type SelectionJSON = ReturnType<import("@tiptap/pm/state").Selection["toJSON"]>;

interface ContextMenuState {
    type: "table" | "image";
    x: number;
    y: number;
    selection: SelectionJSON;
}

export function useTipTapState() {
    // メディアピッカー関連
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [isReplaceMode, setIsReplaceMode] = useState(false);

    // コンテキストメニュー関連
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
        null
    );

    // Altテキスト編集関連
    const [altEditOpen, setAltEditOpen] = useState(false);
    const [currentAlt, setCurrentAlt] = useState("");

    // リンク編集関連
    const [linkEditOpen, setLinkEditOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [linkTarget, setLinkTarget] = useState(false);
    const [linkNofollow, setLinkNofollow] = useState(false);
    const [isImageLinkMode, setIsImageLinkMode] = useState(false);

    // リンクツールチップ関連
    const [linkTooltip, setLinkTooltip] = useState<{
        visible: boolean;
        href: string;
        x: number;
        y: number;
        type: "text" | "image";
    } | null>(null);

    return {
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
    };
}
