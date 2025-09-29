import { Editor } from "@tiptap/react";
import {
    ContextMenuItem,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { SquarePlus, SquareMinus, LayoutDashboard } from "lucide-react";

interface TipTapTableContextMenuProps {
    editor: Editor | null;
}

export function TipTapTableContextMenu({
    editor,
}: TipTapTableContextMenuProps) {
    return (
        <>
            <ContextMenuItem
                onClick={() => {
                    editor?.chain().focus().addRowBefore().run();
                }}
            >
                <SquarePlus className="h-4 w-4 rotate-90 mr-2" />
                行を上に追加
            </ContextMenuItem>
            <ContextMenuItem
                onClick={() => {
                    editor?.chain().focus().addRowAfter().run();
                }}
            >
                <SquarePlus className="h-4 w-4 mr-2" />
                行を下に追加
            </ContextMenuItem>
            <ContextMenuItem
                onClick={() => {
                    editor?.chain().focus().addColumnBefore().run();
                }}
            >
                <SquarePlus className="h-4 w-4 -rotate-90 mr-2" />
                列を左に追加
            </ContextMenuItem>
            <ContextMenuItem
                onClick={() => {
                    editor?.chain().focus().addColumnAfter().run();
                }}
            >
                <SquarePlus className="h-4 w-4 mr-2" />
                列を右に追加
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
                onClick={() => {
                    editor?.chain().focus().deleteRow().run();
                }}
            >
                <SquareMinus className="h-4 w-4 mr-2" />
                行を削除
            </ContextMenuItem>
            <ContextMenuItem
                onClick={() => {
                    editor?.chain().focus().deleteColumn().run();
                }}
            >
                <SquareMinus className="h-4 w-4 rotate-90 mr-2" />
                列を削除
            </ContextMenuItem>
            <ContextMenuItem
                onClick={() => {
                    editor?.chain().focus().deleteTable().run();
                }}
                className="text-destructive"
            >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                テーブルを削除
            </ContextMenuItem>
        </>
    );
}
