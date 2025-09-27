import api, { isApiError } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const DEFAULT_PRESIGN_ERROR_MESSAGE =
    "メディアのアップロードURL取得に失敗しました";
const DEFAULT_REGISTER_ERROR_MESSAGE = "メディアの登録に失敗しました";
const DEFAULT_UPLOAD_ERROR_MESSAGE = "メディアのアップロードに失敗しました";

export { API_BASE_URL };

export type UserRole = "ADMIN" | "EDITOR" | "AUTHOR";

export interface MediaCreatedBy {
    id: number;
    email: string;
    role: UserRole;
}

export interface MediaResponse {
    id: number;
    filename: string;
    storageKey: string;
    mime: string;
    bytes: number;
    width: number | null;
    height: number | null;
    altText: string | null;
    publicUrl: string | null;
    createdAt: string;
    createdBy: MediaCreatedBy;
}

export interface MediaPresignRequest {
    filename: string;
    mime: string;
    bytes: number;
    width?: number;
    height?: number;
}

export interface MediaPresignResult {
    uploadUrl: string;
    storageKey: string;
    expiresAt: string;
    headers: Record<string, string>;
}

export interface MediaCreateRequest {
    filename: string;
    storageKey: string;
    mime: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    altText?: string | null;
}

export interface MediaDownloadInfo {
    downloadUrl: string;
    expiresAt: string;
}

export interface MediaListParams {
    page?: number;
    size?: number;
    sort?: string;
    mime?: string;
    q?: string;
}

export interface MediaListResponse {
    content: MediaResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface UploadMediaOptions {
    signal?: AbortSignal;
    onProgress?: (payload: { loaded: number; total?: number }) => void;
}

const buildListParams = (
    params: MediaListParams
): Record<string, string | number> => {
    const result: Record<string, string | number> = {};
    if (typeof params.page === "number") result.page = params.page;
    if (typeof params.size === "number") result.size = params.size;
    if (params.sort) result.sort = params.sort;
    if (params.mime) result.mime = params.mime;
    if (params.q) result.q = params.q;
    return result;
};

const extractErrorMessage = (data: unknown): string | undefined => {
    if (!data || typeof data !== "object") {
        return undefined;
    }
    const payload = data as Record<string, unknown>;

    const messageCandidates = [payload["message"], payload["error"]].filter(
        (value): value is string =>
            typeof value === "string" && value.trim().length > 0
    );
    if (messageCandidates.length > 0) {
        return messageCandidates[0];
    }

    const errors = payload["errors"];
    if (Array.isArray(errors)) {
        for (const item of errors) {
            if (!item || typeof item !== "object") continue;
            const record = item as Record<string, unknown>;
            const candidate = record["defaultMessage"] ?? record["message"];
            if (typeof candidate === "string" && candidate.trim().length > 0) {
                return candidate;
            }
        }
    }

    return undefined;
};

export async function requestMediaUpload(
    payload: MediaPresignRequest
): Promise<MediaPresignResult> {
    try {
        const response = await api.post<MediaPresignResult>(
            `${API_BASE_URL}/api/admin/media/presign`,
            payload
        );
        return response.data;
    } catch (error) {
        if (isApiError(error) && error.response) {
            const { status, data } = error.response;
            if (status === 400 || status === 409) {
                const message =
                    extractErrorMessage(data) ?? DEFAULT_PRESIGN_ERROR_MESSAGE;
                throw new Error(message);
            }
        }
        throw error;
    }
}

export async function registerMedia(
    payload: MediaCreateRequest
): Promise<MediaResponse> {
    try {
        const response = await api.post<MediaResponse>(
            `${API_BASE_URL}/api/admin/media`,
            payload
        );
        return response.data;
    } catch (error) {
        if (isApiError(error) && error.response) {
            const { status, data } = error.response;
            if (status === 400 || status === 409) {
                const message =
                    extractErrorMessage(data) ?? DEFAULT_REGISTER_ERROR_MESSAGE;
                throw new Error(message);
            }
        }
        throw error;
    }
}

export async function uploadMediaObject(
    file: Blob,
    presign: MediaPresignResult,
    options: UploadMediaOptions = {}
): Promise<void> {
    if (typeof window === "undefined") {
        throw new Error(
            "uploadMediaObject はクライアント環境でのみ使用してください"
        );
    }

    const { signal, onProgress } = options;

    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.uploadUrl, true);
        xhr.responseType = "text";

        Object.entries(presign.headers ?? {}).forEach(([key, value]) => {
            try {
                xhr.setRequestHeader(key, value);
            } catch (error) {
                console.warn("Failed to set presigned header", key, error);
            }
        });

        if (signal) {
            if (signal.aborted) {
                reject(
                    signal.reason ?? new DOMException("Aborted", "AbortError")
                );
                return;
            }
            const abortHandler = () => {
                xhr.abort();
                reject(
                    signal.reason ?? new DOMException("Aborted", "AbortError")
                );
            };
            signal.addEventListener("abort", abortHandler, { once: true });
            xhr.addEventListener("loadend", () => {
                signal.removeEventListener("abort", abortHandler);
            });
        }

        if (typeof onProgress === "function") {
            xhr.upload.onprogress = (event) => {
                onProgress({
                    loaded: event.loaded,
                    total: event.lengthComputable ? event.total : undefined,
                });
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                const errorDetail = xhr.responseText
                    ? `: ${String(xhr.responseText).slice(0, 200)}`
                    : "";
                reject(
                    new Error(
                        `${DEFAULT_UPLOAD_ERROR_MESSAGE} (status: ${xhr.status})${errorDetail}`
                    )
                );
            }
        };

        xhr.onerror = () => {
            reject(new Error(DEFAULT_UPLOAD_ERROR_MESSAGE));
        };

        xhr.ontimeout = () => {
            reject(new Error(`${DEFAULT_UPLOAD_ERROR_MESSAGE} (timeout)`));
        };

        xhr.send(file);
    });
}

export async function fetchMediaList(
    params: MediaListParams = {}
): Promise<MediaListResponse> {
    const response = await api.get<MediaListResponse>(
        `${API_BASE_URL}/api/admin/media`,
        {
            params: buildListParams(params),
        }
    );
    return response.data;
}

export async function fetchMediaDownloadUrl(
    id: number
): Promise<MediaDownloadInfo> {
    const response = await api.get<MediaDownloadInfo>(
        `${API_BASE_URL}/api/admin/media/${id}/download`
    );
    return response.data;
}

export async function fetchMediaDetail(id: number): Promise<MediaResponse> {
    const response = await api.get<MediaResponse>(
        `${API_BASE_URL}/api/admin/media/${id}`
    );
    return response.data;
}

export async function deleteMedia(id: number): Promise<void> {
    await api.delete(`${API_BASE_URL}/api/admin/media/${id}`);
}
