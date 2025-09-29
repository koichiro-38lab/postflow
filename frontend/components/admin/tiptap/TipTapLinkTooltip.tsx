import { Button } from "@/components/ui/button";

interface TipTapLinkTooltipProps {
    visible: boolean;
    href: string;
    x: number;
    y: number;
    type: "text" | "image";
    onEdit: () => void;
    onRemove: () => void;
    onOpenLink: (href: string) => void;
}

export function TipTapLinkTooltip({
    visible,
    href,
    x,
    y,
    onEdit,
    onRemove,
    onOpenLink,
}: TipTapLinkTooltipProps) {
    if (!visible) return null;

    return (
        <div
            className="absolute z-50 bg-popover text-popover-foreground border rounded-md px-3 py-2 shadow-md text-sm flex items-center gap-2 pointer-events-auto"
            style={{
                left: x,
                top: y,
            }}
        >
            <button
                className="hover:underline cursor-pointer text-left max-w-xs truncate"
                onClick={() => onOpenLink(href)}
            >
                {href}
            </button>
            <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="h-6 px-2 text-xs"
            >
                編集
            </Button>
            <Button
                size="sm"
                variant="destructive"
                onClick={onRemove}
                className="h-6 px-2 text-xs"
            >
                削除
            </Button>
        </div>
    );
}