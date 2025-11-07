"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef } from "react";

import { toast } from "sonner";
import {
    registerMedia,
    requestMediaUpload,
    uploadMediaObject,
    type MediaPresignRequest,
} from "@/lib/api/admin/media";
import {
    generateUploadId,
    getOptionalImageDimensions,
} from "@/lib/media-utils";

import type {
    FailedMediaItem,
    MediaListItem,
    UploadingMediaItem,
} from "../types";
import { UPLOAD_PHASE_LABEL } from "../types";

interface UseMediaUploaderOptions {
    setItems: Dispatch<SetStateAction<MediaListItem[]>>;
    setListError: Dispatch<SetStateAction<string | null>>;
    setHasMore: Dispatch<SetStateAction<boolean>>;
    requestUpload?: typeof requestMediaUpload;
    uploadObject?: typeof uploadMediaObject;
    register?: typeof registerMedia;
    adjustTotalCount?: (delta: number) => void;
}

interface UploadHandlers {
    handleFilesAccepted: (files: File[]) => void;
    handleRetry: (item: FailedMediaItem) => void;
}

export function useMediaUploader({
    setItems,
    setListError,
    setHasMore,
    requestUpload = requestMediaUpload,
    uploadObject = uploadMediaObject,
    register = registerMedia,
    adjustTotalCount,
}: UseMediaUploaderOptions): UploadHandlers {
    // アップロードごとの進捗更新間隔を調整するためのタイムスタンプを保持
    const lastProgressRef = useRef<Record<string, number>>({});

    // 一時的なアイテム（アップロード中/失敗）を安全に更新するユーティリティ
    const updateTransientItem = useCallback(
        (
            id: string,
            updater: (
                item: UploadingMediaItem | FailedMediaItem
            ) => UploadingMediaItem | FailedMediaItem
        ) => {
            setItems((prev) =>
                prev.map((item) => {
                    if (item.id !== id) return item;
                    if (item.status === "succeeded") return item;
                    return updater(item);
                })
            );
        },
        [setItems]
    );

    // Presign → アップロード → 登録までの一連フローを実行
    const startUploadFlow = useCallback(
        async (entry: UploadingMediaItem) => {
            const { id, file } = entry;
            try {
                updateTransientItem(id, (item) => ({
                    ...item,
                    status: "uploading",
                    phase: "presigning",
                    progress: Math.max(item.progress, 5),
                    error: undefined,
                }));

                const presignPayload: MediaPresignRequest = {
                    filename: entry.filename,
                    mime: entry.mime,
                    bytes: entry.bytes,
                    width: entry.width ?? undefined,
                    height: entry.height ?? undefined,
                };

                const presign = await requestUpload(presignPayload);

                updateTransientItem(id, (item) => ({
                    ...item,
                    storageKey: presign.storageKey,
                    phase: "uploading",
                    progress: Math.max(item.progress, 10),
                }));
                lastProgressRef.current[id] = Date.now();

                await uploadObject(file, presign, {
                    onProgress: ({ loaded, total }) => {
                        if (!total || total === 0) {
                            updateTransientItem(id, (item) => ({
                                ...item,
                                progress: Math.max(item.progress, 40),
                            }));
                            return;
                        }
                        const ratio = loaded / total;
                        const progress = Math.min(
                            90,
                            Math.max(15, ratio * 100)
                        );
                        const now = Date.now();
                        const last = lastProgressRef.current[id] ?? 0;
                        if (progress < 100 && now - last < 150) {
                            return;
                        }
                        lastProgressRef.current[id] = now;
                        updateTransientItem(id, (item) => ({
                            ...item,
                            progress,
                        }));
                    },
                });

                updateTransientItem(id, (item) => ({
                    ...item,
                    phase: "registering",
                    progress: 95,
                }));

                const registered = await register({
                    filename: entry.filename,
                    storageKey: presign.storageKey,
                    mime: entry.mime,
                    bytes: entry.bytes,
                    width: entry.width ?? null,
                    height: entry.height ?? null,
                    altText: null,
                });

                setItems((prev) =>
                    prev.map((item) =>
                        item.id === id
                            ? {
                                  ...registered,
                                  status: "succeeded" as const,
                              }
                            : item
                    )
                );
                adjustTotalCount?.(1);
                delete lastProgressRef.current[id];
                setListError(null);
                setHasMore(true);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "アップロード処理で予期せぬエラーが発生しました";
                updateTransientItem(id, (item) => ({
                    ...item,
                    status: "failed",
                    error: message,
                    progress: 100,
                }));
                toast.error("アップロードに失敗しました", {
                    description: message,
                });
            }
        },
        [
            adjustTotalCount,
            register,
            requestUpload,
            setHasMore,
            setItems,
            setListError,
            updateTransientItem,
            uploadObject,
        ]
    );

    // アップロード失敗したアイテムを再度キューに戻す
    const handleRetry = useCallback(
        (item: FailedMediaItem) => {
            const nextEntry: UploadingMediaItem = {
                id: item.id,
                status: "uploading",
                file: item.file,
                filename: item.filename,
                mime: item.mime,
                bytes: item.bytes,
                width: item.width,
                height: item.height,
                progress: 5,
                phase: "presigning",
                storageKey: undefined,
            };
            setItems((prev) =>
                prev.map((current) =>
                    current.id === item.id ? nextEntry : current
                )
            );
            delete lastProgressRef.current[item.id];
            void startUploadFlow(nextEntry);
        },
        [setItems, startUploadFlow]
    );

    // ドロップ・選択されたファイルを個別にアップロードフローへ投入
    const handleFilesAccepted = useCallback(
        (files: File[]) => {
            files.forEach(async (file) => {
                const id = generateUploadId();
                const { width, height } = await getOptionalImageDimensions(
                    file
                );
                const entry: UploadingMediaItem = {
                    id,
                    status: "uploading",
                    file,
                    filename: file.name,
                    mime: file.type || "application/octet-stream",
                    bytes: file.size,
                    width,
                    height,
                    progress: 5,
                    phase: "presigning",
                };
                setItems((prev) => [entry, ...prev]);
                await startUploadFlow(entry);
            });
        },
        [setItems, startUploadFlow]
    );

    return {
        handleFilesAccepted,
        handleRetry,
    };
}

export { UPLOAD_PHASE_LABEL };
