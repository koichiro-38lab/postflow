import { Editor } from "@tiptap/react";
import {
    ContextMenuItem,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
    Edit,
    LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Trash2,
    Replace,
} from "lucide-react";
import { cn } from "@/lib/utils";

const IMAGE_SIZES = ["sm", "md", "lg"] as const;
type ImageSize = (typeof IMAGE_SIZES)[number];

const IMAGE_SIZE_LABELS: Record<ImageSize, string> = {
    sm: "小",
    md: "中",
    lg: "大",
};

interface TipTapImageContextMenuProps {
    editor: Editor | null;
    onEditAlt: () => void;
    onEditLink: () => void;
    onReplace: () => void;
}

export function TipTapImageContextMenu({
    editor,
    onEditAlt,
    onEditLink,
    onReplace,
}: TipTapImageContextMenuProps) {
    if (!editor) return null;

    // 画像のリンク情報を取得
    const imageAttrs = editor.getAttributes("mediaImage");
    const hasLink = imageAttrs?.link && imageAttrs.link.href;

    return (
        <>
            <ContextMenuItem onClick={onEditAlt}>
                <Edit className="h-4 w-4 mr-2" />
                代替テキストを編集
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onEditLink}>
                <LinkIcon className="h-4 w-4 mr-2" />
                {hasLink ? "リンクを編集" : "リンクを設定"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onReplace}>
                <Replace className="h-4 w-4 mr-2" />
                画像を置換
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
                onClick={() => {
                    editor
                        ?.chain()
                        .focus()
                        .updateAttributes("mediaImage", {
                            align: "left",
                        })
                        .run();
                }}
                className={cn(
                    "transition-colors",
                    editor.isActive("mediaImage", { align: "left" })
                        ? "bg-primary/10 text-primary"
                        : ""
                )}
            >
                <AlignLeft className="h-4 w-4 mr-2" />
                左寄せ
            </ContextMenuItem>
            <ContextMenuItem
                onClick={() => {
                    editor
                        ?.chain()
                        .focus()
                        .updateAttributes("mediaImage", {
                            align: "center",
                        })
                        .run();
                }}
                className={cn(
                    "transition-colors",
                    editor.isActive("mediaImage", { align: "center" })
                        ? "bg-primary/10 text-primary"
                        : ""
                )}
            >
                <AlignCenter className="h-4 w-4 mr-2" />
                中央寄せ
            </ContextMenuItem>
            <ContextMenuItem
                onClick={() => {
                    editor
                        ?.chain()
                        .focus()
                        .updateAttributes("mediaImage", {
                            align: "right",
                        })
                        .run();
                }}
                className={cn(
                    "transition-colors",
                    editor.isActive("mediaImage", { align: "right" })
                        ? "bg-primary/10 text-primary"
                        : ""
                )}
            >
                <AlignRight className="h-4 w-4 mr-2" />
                右寄せ
            </ContextMenuItem>
            <ContextMenuSeparator />
            {IMAGE_SIZES.map((size) => (
                <ContextMenuItem
                    key={size}
                    onClick={() => {
                        editor
                            ?.chain()
                            .focus()
                            .updateAttributes("mediaImage", {
                                size,
                            })
                            .run();
                    }}
                    className={cn(
                        "transition-colors",
                        editor.isActive("mediaImage", { size })
                            ? "bg-primary/10 text-primary"
                            : ""
                    )}
                >
                    {IMAGE_SIZE_LABELS[size]}
                </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
            <ContextMenuItem
                onClick={() => {
                    editor?.chain().focus().deleteSelection().run();
                }}
                className="text-destructive"
            >
                <Trash2 className="h-4 w-4 mr-2" />
                画像を削除
            </ContextMenuItem>
        </>
    );
}
