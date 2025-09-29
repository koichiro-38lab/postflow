import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TipTapAltTextDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    altText: string;
    onSave: (altText: string) => void;
}

export function TipTapAltTextDialog({
    open,
    onOpenChange,
    altText: initialAltText,
    onSave,
}: TipTapAltTextDialogProps) {
    const [altText, setAltText] = useState(initialAltText);

    // プロップスが変更されたら内部状態を更新
    useState(() => {
        setAltText(initialAltText);
    });

    const handleSave = () => {
        onSave(altText);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>代替テキストを編集</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="alt-input" className="block mb-3">
                            代替テキスト
                        </Label>
                        <Input
                            id="alt-input"
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            placeholder="画像の説明を入力してください"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        キャンセル
                    </Button>
                    <Button className="mb-2" onClick={handleSave}>
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
