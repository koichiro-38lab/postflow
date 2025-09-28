"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MediaUploader } from "@/components/MediaUploader";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { SucceededMediaItem } from "@/features/admin/media/types";
import { useMediaLibrary } from "@/features/admin/media/use-media-library";
import { useMediaUploader } from "@/features/admin/media/use-media-uploader";
import { useToast } from "@/hooks/use-toast";
import { buildMediaUrl } from "@/lib/media-url";
import { formatBytes, formatDateTime } from "@/lib/media-utils";
import { cn } from "@/lib/utils";

import { CornerDownLeft } from "lucide-react";

import { MediaListSection } from "./MediaListSection";

export interface MediaPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (item: SucceededMediaItem) => void;
}

export function MediaPickerDialog({
    open,
    onOpenChange,
    onSelect,
}: MediaPickerDialogProps) {
    const { toast } = useToast();

    const {
        items,
        setItems,
        viewMode,
        setViewMode,
        showInitialLoading,
        showLoadMoreSpinner,
        listError,
        setListError,
        listContainerRef,
        setHasMore,
        refresh,
    } = useMediaLibrary();

    const { handleFilesAccepted, handleRetry } = useMediaUploader({
        setItems,
        setListError,
        setHasMore,
        toast,
    });

    const [selectedId, setSelectedId] = useState<number | null>(null);

    const selectedItem = useMemo(() => {
        return (
            items.find(
                (item): item is SucceededMediaItem =>
                    item.status === "succeeded" && item.id === selectedId
            ) ?? null
        );
    }, [items, selectedId]);

    const previewUrl = useMemo(() => {
        if (!selectedItem) return null;
        return selectedItem.publicUrl ?? buildMediaUrl(selectedItem.storageKey);
    }, [selectedItem]);

    useEffect(() => {
        if (open) {
            refresh();
        } else {
            setSelectedId(null);
        }
    }, [open, refresh]);

    useEffect(() => {
        if (!open) return;
        const succeededItems = items.filter(
            (item): item is SucceededMediaItem => item.status === "succeeded"
        );
        if (succeededItems.length === 0) {
            if (selectedId !== null) {
                setSelectedId(null);
            }
            return;
        }
        const exists = succeededItems.some((item) => item.id === selectedId);
        if (!exists) {
            setSelectedId(succeededItems[0].id);
        }
    }, [items, open, selectedId]);

    const handleSelectItem = useCallback((item: SucceededMediaItem) => {
        setSelectedId(item.id);
    }, []);

    const handleConfirm = useCallback(() => {
        if (!selectedItem) return;
        onSelect(selectedItem);
        onOpenChange(false);
    }, [onOpenChange, onSelect, selectedItem]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] w-full max-w-5xl flex-col">
                <DialogHeader className="mb-4">
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <div className="flex-1">
                    <div className="flex h-full flex-col">
                        <div
                            className="flex-1 overflow-y-auto overflow-x-hidden pr-1"
                            style={{ scrollbarGutter: "stable both-edges" }}
                        >
                            <div className="grid w-full grid-cols-1 gap-6 pb-28 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:pb-0">
                                <div className="space-y-4">
                                    <MediaUploader
                                        onFilesAccepted={handleFilesAccepted}
                                        className="w-full"
                                    />
                                    <MediaListSection
                                        items={items}
                                        viewMode={viewMode}
                                        onChangeViewMode={setViewMode}
                                        listError={listError}
                                        showInitialLoading={showInitialLoading}
                                        showLoadMoreSpinner={
                                            showLoadMoreSpinner
                                        }
                                        listContainerRef={listContainerRef}
                                        buildMediaUrl={buildMediaUrl}
                                        handleRetry={handleRetry}
                                        onSelectItem={handleSelectItem}
                                        selectionMode
                                        selectedItemId={selectedId}
                                    />
                                </div>
                                <div className="hidden space-y-4 md:block">
                                    <div className="space-y-3 rounded-lg border p-4 text-sm">
                                        {selectedItem ? (
                                            <>
                                                <div
                                                    className="relative w-full overflow-hidden bg-background"
                                                    style={{
                                                        aspectRatio: "4 / 3",
                                                    }}
                                                >
                                                    {previewUrl ? (
                                                        <Image
                                                            src={previewUrl}
                                                            alt={
                                                                selectedItem.altText ||
                                                                selectedItem.filename
                                                            }
                                                            fill
                                                            sizes="(min-width: 1024px) 320px, 100vw"
                                                            className="object-contain"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex h-full w-full items-center justify-center text-muted-foreground">
                                                            プレビューが利用できません
                                                        </div>
                                                    )}
                                                </div>
                                                <dl className="space-y-2">
                                                    <DetailRow
                                                        label="ファイル名"
                                                        value={
                                                            selectedItem.filename
                                                        }
                                                    />
                                                    <DetailRow
                                                        label="MIMEタイプ"
                                                        value={
                                                            selectedItem.mime
                                                        }
                                                    />
                                                    <DetailRow
                                                        label="サイズ"
                                                        value={formatBytes(
                                                            selectedItem.bytes
                                                        )}
                                                    />
                                                    <DetailRow
                                                        label="画像サイズ"
                                                        value={
                                                            selectedItem.width &&
                                                            selectedItem.height
                                                                ? `${selectedItem.width} x ${selectedItem.height}`
                                                                : "不明"
                                                        }
                                                    />
                                                    {selectedItem.altText && (
                                                        <DetailRow
                                                            label="代替テキスト"
                                                            value={
                                                                selectedItem.altText
                                                            }
                                                        />
                                                    )}
                                                    <DetailRow
                                                        label="登録日時"
                                                        value={formatDateTime(
                                                            selectedItem.createdAt
                                                        )}
                                                    />
                                                    {selectedItem.createdBy && (
                                                        <DetailRow
                                                            label="登録者"
                                                            value={`${selectedItem.createdBy.email}`}
                                                        />
                                                    )}
                                                </dl>
                                            </>
                                        ) : (
                                            <p className="text-muted-foreground">
                                                画像を選択するとここにプレビューと詳細が表示されます。
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* モバイル用スティッキーフッター */}
                <div className="md:hidden fixed bottom-[10px] left-4 right-4 z-10 border rounded-md bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                    {selectedItem ? (
                        <div className="flex items-center gap-3">
                            {/* サムネイル表示 */}
                            <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                                {previewUrl ? (
                                    <Image
                                        src={previewUrl}
                                        alt={
                                            selectedItem.altText ||
                                            selectedItem.filename
                                        }
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                        プレビューなし
                                    </div>
                                )}
                            </div>
                            {/* ファイル情報 */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {selectedItem.filename}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedItem.mime} ・{" "}
                                    {selectedItem.bytes != null
                                        ? formatBytes(selectedItem.bytes)
                                        : ""}
                                </p>
                            </div>
                            {/* 挿入ボタン */}
                            <Button
                                type="button"
                                size="default"
                                onClick={handleConfirm}
                            >
                                <CornerDownLeft className="h-4 w-4" />
                                挿入
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <p className="flex-1 text-sm text-muted-foreground">
                                画像を選択してください
                            </p>
                            <Button type="button" size="sm" disabled>
                                <CornerDownLeft className="h-4 w-4" />
                                挿入
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter className="hidden md:flex flex-wrap justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!selectedItem}
                    >
                        <CornerDownLeft className="h-4 w-4" />
                        挿入
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DetailRow({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string | number | null | undefined;
    valueClassName?: string;
}) {
    return (
        <div className="space-y-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </dt>
            <dd className={cn("text-sm", valueClassName)}>{value ?? "-"}</dd>
        </div>
    );
}
