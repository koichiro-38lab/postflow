const DEFAULT_MEDIA_BASE_URL = "http://host.docker.internal:9000";
const DEFAULT_MEDIA_BUCKET = "media";

const MEDIA_BASE_URL_RAW = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";
const MEDIA_BUCKET_RAW = process.env.NEXT_PUBLIC_MEDIA_BUCKET ?? "";

export const MEDIA_BASE_URL = MEDIA_BASE_URL_RAW.length > 0
    ? MEDIA_BASE_URL_RAW
    : DEFAULT_MEDIA_BASE_URL;

export const MEDIA_BUCKET = MEDIA_BUCKET_RAW.length > 0
    ? MEDIA_BUCKET_RAW
    : DEFAULT_MEDIA_BUCKET;

export const VIEW_MODE_STORAGE_KEY = "admin-media-view-mode";

export function buildMediaUrl(storageKey?: string | null): string | null {
    if (!storageKey) {
        return null;
    }

    const base = MEDIA_BASE_URL.endsWith("/")
        ? MEDIA_BASE_URL.slice(0, -1)
        : MEDIA_BASE_URL;
    const bucket = MEDIA_BUCKET.replace(/^\/+/, "").replace(/\/+$/, "");

    return `${base}/${bucket}/${storageKey}`;
}
