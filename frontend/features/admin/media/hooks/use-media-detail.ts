"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";
import {
    deleteMedia as deleteMediaRequest,
    fetchMediaDetail,
    fetchMediaDownloadUrl,
} from "@/lib/api/admin/media";
import { buildMediaUrl } from "@/lib/media-url";
import { copyTextToClipboard } from "@/lib/media-utils";

import type { MediaListItem, SucceededMediaItem } from "../types";

interface UseMediaDetailOptions {
    setItems: Dispatch<SetStateAction<MediaListItem[]>>;
    fetchDetail?: typeof fetchMediaDetail;
    fetchDownloadUrl?: typeof fetchMediaDownloadUrl;
    deleteMedia?: typeof deleteMediaRequest;
}

interface UseMediaDetailResult {
    detailOpen: boolean;
    detailMedia: SucceededMediaItem | null;
    detailLoading: boolean;
    detailError: string | null;
    detailPublicUrl: string | null;
    previewAspectRatio: string;
    downloadLoading: boolean;
    deleteLoading: boolean;
    deleteConfirmOpen: boolean;
    openDetail: (item: SucceededMediaItem) => void;
    closeDetail: () => void;
    retryDetail: () => void;
    copyPublicUrl: () => Promise<void>;
    downloadDetail: () => Promise<void>;
    requestDeleteDetail: () => void;
    cancelDeleteDetail: () => void;
    confirmDeleteDetail: () => Promise<void>;
}

export function useMediaDetail({
    setItems,
    fetchDetail = fetchMediaDetail,
    fetchDownloadUrl = fetchMediaDownloadUrl,
    deleteMedia = deleteMediaRequest,
}: UseMediaDetailOptions): UseMediaDetailResult {
    const [detailMediaId, setDetailMediaId] = useState<number | null>(null);
    const [detailMedia, setDetailMedia] = useState<SucceededMediaItem | null>(
        null
    );
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailRequestToken, setDetailRequestToken] = useState(0);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const detailOpen = detailMediaId !== null;

    // API が返した公開 URL が無ければストレージキーから生成する
    const detailPublicUrl = useMemo(() => {
        if (!detailMedia) return null;
        return detailMedia.publicUrl ?? buildMediaUrl(detailMedia.storageKey);
    }, [detailMedia]);

    // 詳細プレビューで利用する縦横比をメディア情報から算出し、値が無ければ既定比にフォールバック
    const previewAspectRatio = useMemo(() => {
        if (
            detailMedia &&
            typeof detailMedia.width === "number" &&
            detailMedia.width > 0 &&
            typeof detailMedia.height === "number" &&
            detailMedia.height > 0
        ) {
            return `${detailMedia.width} / ${detailMedia.height}`;
        }
        return "4 / 3";
    }, [detailMedia]);

    useEffect(() => {
        if (detailMediaId === null) return;
        let active = true;
        setDetailLoading(true);
        setDetailError(null);

        (async () => {
            try {
                const data = await fetchDetail(detailMediaId);
                if (!active) return;
                setDetailMedia({
                    ...data,
                    status: "succeeded",
                });
                setItems((prev) =>
                    prev.map((item) =>
                        item.status === "succeeded" && item.id === data.id
                            ? {
                                  ...data,
                                  status: "succeeded" as const,
                              }
                            : item
                    )
                );
            } catch (error) {
                if (!active) return;
                const message =
                    error instanceof Error
                        ? error.message
                        : "メディア詳細の取得に失敗しました";
                setDetailError(message);
            } finally {
                if (!active) return;
                setDetailLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [detailMediaId, detailRequestToken, fetchDetail, setItems]);

    // 選択されたメディアを詳細表示対象としてセット
    const openDetail = useCallback((item: SucceededMediaItem) => {
        setDetailMedia(item);
        setDetailMediaId(item.id);
        setDetailError(null);
    }, []);

    // 詳細モーダルを閉じる際に関連する状態を初期化
    const closeDetail = useCallback(() => {
        setDetailMediaId(null);
        setDetailMedia(null);
        setDetailError(null);
        setDownloadLoading(false);
        setDeleteLoading(false);
    }, []);

    // 詳細取得を再試行するためのトリガー
    const retryDetail = useCallback(() => {
        if (detailMediaId === null) return;
        setDetailRequestToken((prev) => prev + 1);
    }, [detailMediaId]);

    // 公開 URL をクリップボードへコピーし、結果に応じてトーストを表示
    const copyPublicUrl = useCallback(async () => {
        if (!detailMedia) {
            return;
        }
        const url = detailPublicUrl;
        if (!url) {
            toast.error("URLをコピーできません", {
                description: "公開URLが設定されていません",
            });
            return;
        }
        try {
            const copied = await copyTextToClipboard(url);
            if (!copied) {
                throw new Error("クリップボードへコピーできませんでした");
            }
            toast.success("URLをコピーしました", {
                description: url,
            });
        } catch (error) {
            toast.error("URLのコピーに失敗しました", {
                description:
                    error instanceof Error
                        ? error.message
                        : "クリップボードの操作に失敗しました",
            });
        }
    }, [detailMedia, detailPublicUrl]);

    // ダウンロード用の一時 URL を取得してブラウザで開く
    const downloadDetail = useCallback(async () => {
        if (!detailMedia) {
            return;
        }
        setDownloadLoading(true);
        try {
            const { downloadUrl } = await fetchDownloadUrl(detailMedia.id);
            if (typeof window !== "undefined") {
                window.open(downloadUrl, "_blank", "noopener,noreferrer");
            }
        } catch (error) {
            toast.error("ダウンロードURLの取得に失敗しました", {
                description:
                    error instanceof Error
                        ? error.message
                        : "ダウンロード処理で予期せぬ問題が発生しました",
            });
        } finally {
            setDownloadLoading(false);
        }
    }, [detailMedia, fetchDownloadUrl]);

    // 削除確認ダイアログを開く
    const requestDeleteDetail = useCallback(() => {
        if (!detailMedia) {
            return;
        }
        setDeleteConfirmOpen(true);
    }, [detailMedia]);

    // 削除確認をキャンセルしたときにダイアログを閉じる
    const cancelDeleteDetail = useCallback(() => {
        setDeleteConfirmOpen(false);
    }, []);

    // 削除 API を呼び出してリストから取り除く
    const confirmDeleteDetail = useCallback(async () => {
        if (!detailMedia) {
            return;
        }
        setDeleteLoading(true);
        try {
            await deleteMedia(detailMedia.id);
            setItems((prev) =>
                prev.filter(
                    (item) =>
                        !(
                            item.status === "succeeded" &&
                            item.id === detailMedia.id
                        )
                )
            );
            toast.success("メディアを削除しました", {
                description: detailMedia.filename,
            });
            closeDetail();
        } catch (error) {
            toast.error("メディアの削除に失敗しました", {
                description:
                    error instanceof Error
                        ? error.message
                        : "削除処理で予期せぬ問題が発生しました",
            });
        } finally {
            setDeleteLoading(false);
            setDeleteConfirmOpen(false);
        }
    }, [closeDetail, deleteMedia, detailMedia, setItems]);

    // モーダルを閉じたときに削除確認ダイアログもリセット
    useEffect(() => {
        if (!detailOpen) {
            setDeleteConfirmOpen(false);
        }
    }, [detailOpen]);

    return {
        detailOpen,
        detailMedia,
        detailLoading,
        detailError,
        detailPublicUrl,
        previewAspectRatio,
        downloadLoading,
        deleteLoading,
        deleteConfirmOpen,
        openDetail,
        closeDetail,
        retryDetail,
        copyPublicUrl,
        downloadDetail,
        requestDeleteDetail,
        cancelDeleteDetail,
        confirmDeleteDetail,
    };
}
