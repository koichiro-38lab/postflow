import { Editor } from "@tiptap/react";
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
    Heading4,
    Image as ImageIcon,
    Link as LinkIcon,
    Table as TableIcon,
    Undo,
    Redo,
} from "lucide-react";

interface TipTapToolbarProps {
    editor: Editor;
    onImageClick: () => void;
    onLinkClick: () => void;
    onTableClick: () => void;
}

export function TipTapToolbar({
    editor,
    onImageClick,
    onLinkClick,
    onTableClick,
}: TipTapToolbarProps) {
    return (
        <div className="border-b bg-muted/10">
            <div
                role="toolbar"
                aria-label="テキスト編集ツールバー"
                className="flex flex-nowrap gap-1 overflow-x-auto px-3 py-2 sm:flex-wrap sm:overflow-visible"
                style={{
                    scrollbarGutter: "stable both-edges",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                {/* テキスト装飾 */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    aria-label="太字"
                    aria-pressed={editor.isActive("bold")}
                    data-state={editor.isActive("bold") ? "on" : "off"}
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="斜体"
                    aria-pressed={editor.isActive("italic")}
                    data-state={editor.isActive("italic") ? "on" : "off"}
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Italic className="h-4 w-4" />
                </Button>

                <div
                    role="separator"
                    aria-orientation="vertical"
                    className="mx-1 h-6 w-px bg-border"
                />

                {/* 見出し */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    aria-label="見出し1"
                    aria-pressed={editor.isActive("heading", { level: 1 })}
                    data-state={
                        editor.isActive("heading", { level: 1 }) ? "on" : "off"
                    }
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    aria-label="見出し2"
                    aria-pressed={editor.isActive("heading", { level: 2 })}
                    data-state={
                        editor.isActive("heading", { level: 2 }) ? "on" : "off"
                    }
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    aria-label="見出し3"
                    aria-pressed={editor.isActive("heading", { level: 3 })}
                    data-state={
                        editor.isActive("heading", { level: 3 }) ? "on" : "off"
                    }
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Heading3 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 4 }).run()
                    }
                    aria-label="見出し4"
                    aria-pressed={editor.isActive("heading", { level: 4 })}
                    data-state={
                        editor.isActive("heading", { level: 4 }) ? "on" : "off"
                    }
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Heading4 className="h-4 w-4" />
                </Button>

                <div
                    role="separator"
                    aria-orientation="vertical"
                    className="mx-1 h-6 w-px bg-border"
                />

                {/* リスト */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    aria-label="箇条書きリスト"
                    aria-pressed={editor.isActive("bulletList")}
                    data-state={editor.isActive("bulletList") ? "on" : "off"}
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
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
                    aria-label="番号付きリスト"
                    aria-pressed={editor.isActive("orderedList")}
                    data-state={editor.isActive("orderedList") ? "on" : "off"}
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
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
                    aria-label="引用"
                    aria-pressed={editor.isActive("blockquote")}
                    data-state={editor.isActive("blockquote") ? "on" : "off"}
                    className="h-8 w-8 text-muted-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Quote className="h-4 w-4" />
                </Button>

                <div
                    role="separator"
                    aria-orientation="vertical"
                    className="mx-1 h-6 w-px bg-border"
                />

                {/* メディア・リンク・テーブル */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onImageClick}
                    aria-label="画像を挿入"
                    className="h-8 w-8 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onLinkClick}
                    aria-label="リンクを追加"
                    className="h-8 w-8 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onTableClick}
                    aria-label="テーブルを挿入"
                    className="h-8 w-8 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <TableIcon className="h-4 w-4" />
                </Button>

                <div
                    role="separator"
                    aria-orientation="vertical"
                    className="mx-1 h-6 w-px bg-border"
                />

                {/* 元に戻す・やり直す */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    aria-label="元に戻す"
                    className="h-8 w-8 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    aria-label="やり直す"
                    className="h-8 w-8 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
