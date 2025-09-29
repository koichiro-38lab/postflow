import { Button } from "@/components/ui/button";
import { Link as LinkIcon } from "lucide-react";

interface TipTapImageFloatingIconProps {
    visible: boolean;
    x: number;
    y: number;
    onLinkClick: () => void;
}

export function TipTapImageFloatingIcon({
    visible,
    x,
    y,
    onLinkClick,
}: TipTapImageFloatingIconProps) {
    if (!visible) return null;

    return (
        <div
            className="absolute z-50"
            style={{
                left: x,
                top: y,
            }}
        >
            <Button
                size="sm"
                variant="outline"
                onClick={onLinkClick}
                className="h-8 w-8 p-0 bg-background shadow-md border"
            >
                <LinkIcon className="h-4 w-4" />
            </Button>
        </div>
    );
}
