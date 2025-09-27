import type { MediaResponse } from "@/lib/media-api";

export type UploadPhase = "presigning" | "uploading" | "registering";

export type MediaItemStatus = "uploading" | "failed" | "succeeded";

export interface UploadingMediaItem {
    status: Extract<MediaItemStatus, "uploading">;
    id: string;
    file: File;
    filename: string;
    mime: string;
    bytes: number;
    width: number | null;
    height: number | null;
    progress: number;
    phase: UploadPhase;
    storageKey?: string;
    error?: string;
}

export interface FailedMediaItem
    extends Omit<UploadingMediaItem, "status" | "error" | "phase"> {
    status: Extract<MediaItemStatus, "failed">;
    phase: UploadPhase;
    error: string;
}

export type SucceededMediaItem = MediaResponse & {
    status: Extract<MediaItemStatus, "succeeded">;
};

export type MediaListItem =
    | UploadingMediaItem
    | FailedMediaItem
    | SucceededMediaItem;

export type ViewMode = "list" | "grid";

export const UPLOAD_PHASE_LABEL: Record<UploadPhase, string> = {
    presigning: "アップロード準備中",
    uploading: "アップロード中",
    registering: "登録中",
};

export type TransientItemUpdater = (
    id: string,
    updater: (
        item: UploadingMediaItem | FailedMediaItem
    ) => UploadingMediaItem | FailedMediaItem
) => void;
