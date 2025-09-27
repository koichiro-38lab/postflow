"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
    AlertDialog as ConfirmDialog,
    AlertDialogAction as ConfirmDialogAction,
    AlertDialogCancel as ConfirmDialogCancel,
    AlertDialogContent as ConfirmDialogContent,
    AlertDialogDescription as ConfirmDialogDescription,
    AlertDialogFooter as ConfirmDialogFooter,
    AlertDialogHeader as ConfirmDialogHeader,
    AlertDialogTitle as ConfirmDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { SucceededMediaItem } from "@/features/admin/media/types";
import { formatBytes, formatDateTime } from "@/lib/media-utils";
import { cn } from "@/lib/utils";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Copy, Download, Loader2, Trash2 } from "lucide-react";

interface MediaDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClose: () => void;
    detailMedia: SucceededMediaItem | null;
    detailLoading: boolean;
    detailError: string | null;
    detailPublicUrl: string | null;
    previewAspectRatio: string;
    downloadLoading: boolean;
    deleteLoading: boolean;
    deleteConfirmOpen: boolean;
    onRetry: () => void;
    onCopyUrl: () => Promise<void>;
    onDownload: () => Promise<void>;
    onRequestDelete: () => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => Promise<void>;
}

export function MediaDetailDialog({
    open,
    onOpenChange,
    onClose,
    detailMedia,
    detailLoading,
    detailError,
    detailPublicUrl,
    previewAspectRatio,
    downloadLoading,
    deleteLoading,
    deleteConfirmOpen,
    onRetry,
    onCopyUrl,
    onDownload,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
}: MediaDetailDialogProps) {
    // フッターに表示する操作ボタン群を状況に応じて切り替え
    const footer = (() => {
        if (detailError) {
            return (
                <DialogFooter className="flex justify-end gap-2">
                    <Button type="button" onClick={onRetry}>
                        再試行
                    </Button>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        閉じる
                    </Button>
                </DialogFooter>
            );
        }

        if (!detailMedia) {
            return null;
        }

        return (
            <DialogFooter className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                    ID: {detailMedia.id}
                </span>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onCopyUrl}
                        disabled={!detailPublicUrl}
                    >
                        <Copy className="h-4 w-4" /> URLコピー
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onDownload}
                        disabled={downloadLoading}
                    >
                        {downloadLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        ダウンロード
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={onRequestDelete}
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        削除
                    </Button>
                </div>
            </DialogFooter>
        );
    })();

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[92vh] w-full max-w-4xl flex-col space-y-6">
                    <DialogHeader>
                        <DialogTitle></DialogTitle>
                        <DialogDescription></DialogDescription>
                    </DialogHeader>
                    <div
                        className="flex-1 space-y-6 overflow-y-auto pr-1"
                        style={{ scrollbarGutter: "stable both-edges" }}
                    >
                        {detailError ? (
                            <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-5 text-sm">
                                <p className="font-medium text-destructive">
                                    メディア詳細の取得に失敗しました
                                </p>
                                <p className="break-words text-destructive/90">
                                    {detailError}
                                </p>
                            </div>
                        ) : detailMedia ? (
                            <div className="grid gap-6 md:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
                                <div className="space-y-3">
                                    <div
                                        className={cn(
                                            "relative mx-auto w-full max-w-[520px] overflow-hidden rounded-lg border bg-muted md:min-h-[320px] md:max-w-[560px]",
                                            detailLoading ? "opacity-80" : ""
                                        )}
                                        style={{
                                            aspectRatio: previewAspectRatio,
                                            maxHeight: "65vh",
                                        }}
                                    >
                                        {detailPublicUrl ? (
                                            <Image
                                                src={detailPublicUrl}
                                                alt={
                                                    detailMedia.altText ||
                                                    detailMedia.filename
                                                }
                                                fill
                                                sizes="(min-width: 1024px) 520px, 100vw"
                                                className="object-contain"
                                                priority
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-muted" />
                                        )}
                                        {detailLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <dl className="grid gap-3">
                                        <DetailRow
                                            label="ファイル名"
                                            value={detailMedia.filename}
                                            valueClassName="break-words font-medium"
                                        />
                                        <DetailRow
                                            label="MIMEタイプ"
                                            value={detailMedia.mime}
                                        />
                                        <DetailRow
                                            label="サイズ"
                                            value={formatBytes(
                                                detailMedia.bytes
                                            )}
                                        />
                                        <DetailRow
                                            label="画像サイズ"
                                            value={
                                                detailMedia.width &&
                                                detailMedia.height
                                                    ? `${detailMedia.width}×${detailMedia.height}`
                                                    : "-"
                                            }
                                        />
                                        <DetailRow
                                            label="ストレージキー"
                                            value={detailMedia.storageKey}
                                            valueClassName="break-all"
                                        />
                                        <DetailRow
                                            label="作成日時"
                                            value={formatDateTime(
                                                detailMedia.createdAt
                                            )}
                                        />
                                        <DetailRow
                                            label="作成者"
                                            value={`${detailMedia.createdBy.email}（${detailMedia.createdBy.role}）`}
                                            valueClassName="break-words"
                                        />
                                    </dl>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    {footer}
                </DialogContent>
            </Dialog>
            {/* 削除確認用の AlertDialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        onCancelDelete();
                    }
                }}
            >
                <ConfirmDialogContent>
                    <ConfirmDialogHeader>
                        <ConfirmDialogTitle>
                            メディアを削除しますか？
                        </ConfirmDialogTitle>
                        <ConfirmDialogDescription>
                            {detailMedia
                                ? `"${detailMedia.filename}" を削除すると元に戻せません。`
                                : "この操作は取り消せません。"}
                        </ConfirmDialogDescription>
                    </ConfirmDialogHeader>
                    <ConfirmDialogFooter>
                        <ConfirmDialogCancel disabled={deleteLoading}>
                            キャンセル
                        </ConfirmDialogCancel>
                        <ConfirmDialogAction
                            onClick={onConfirmDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            削除する
                        </ConfirmDialogAction>
                    </ConfirmDialogFooter>
                </ConfirmDialogContent>
            </ConfirmDialog>
        </>
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
