import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";

type CheckedState = boolean | "indeterminate";

interface TipTapLinkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    text: string;
    target: boolean;
    nofollow: boolean;
    isImageMode: boolean;
    onSave: (data: {
        url: string;
        text: string;
        target: boolean;
        nofollow: boolean;
    }) => void;
    onDelete?: () => void;
}

export function TipTapLinkDialog({
    open,
    onOpenChange,
    url: initialUrl,
    text: initialText,
    target: initialTarget,
    nofollow: initialNofollow,
    isImageMode,
    onSave,
    onDelete,
}: TipTapLinkDialogProps) {
    const [url, setUrl] = useState(initialUrl);
    const [text, setText] = useState(initialText);
    const [target, setTarget] = useState(initialTarget);
    const [nofollow, setNofollow] = useState(initialNofollow);

    // プロップスが変更されたら内部状態を更新
    useEffect(() => {
        setUrl(initialUrl);
        setText(initialText);
        setTarget(initialTarget);
        setNofollow(initialNofollow);
    }, [initialUrl, initialText, initialTarget, initialNofollow]);

    const handleSave = () => {
        onSave({ url, text, target, nofollow });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isImageMode ? "画像リンクを設定" : "リンクを設定"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="url-input" className="block mb-3">
                            URL
                        </Label>
                        <Input
                            id="url-input"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>
                    {!isImageMode && (
                        <div>
                            <Label htmlFor="text-input">リンクテキスト</Label>
                            <Input
                                id="text-input"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="リンクテキスト"
                            />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="target-checkbox"
                            checked={target}
                            onCheckedChange={(checked: CheckedState) =>
                                setTarget(checked === true)
                            }
                        />
                        <Label htmlFor="target-checkbox">
                            新しいタブで開く
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="nofollow-checkbox"
                            checked={nofollow}
                            onCheckedChange={(checked: CheckedState) =>
                                setNofollow(checked === true)
                            }
                        />
                        <Label htmlFor="nofollow-checkbox">
                            検索エンジンにフォローさせない
                            (rel=&quot;nofollow&quot;)
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <div className="flex justify-between w-full">
                        <div>
                            {isImageMode && url && onDelete && (
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        onDelete();
                                        onOpenChange(false);
                                    }}
                                >
                                    削除
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                キャンセル
                            </Button>
                            <Button onClick={handleSave}>保存</Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
