const DEFAULT_MEDIA_BASE_URL = "http://localhost:3200";
const DEFAULT_MEDIA_BUCKET = "media";

const MEDIA_BASE_URL_RAW = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";
const MEDIA_BUCKET_RAW = process.env.NEXT_PUBLIC_MEDIA_BUCKET ?? "";

export const MEDIA_BASE_URL =
    MEDIA_BASE_URL_RAW.length > 0 ? MEDIA_BASE_URL_RAW : DEFAULT_MEDIA_BASE_URL;

export const MEDIA_BUCKET =
    MEDIA_BUCKET_RAW.length > 0 ? MEDIA_BUCKET_RAW : DEFAULT_MEDIA_BUCKET;

export const VIEW_MODE_STORAGE_KEY = "admin-media-view-mode";

const trimSlashes = (value: string) => value.replace(/^\/+/, "").replace(/\/+$/, "");

const buildUrlFromPath = (pathname: string) => {
    const base = MEDIA_BASE_URL.endsWith("/")
        ? MEDIA_BASE_URL.slice(0, -1)
        : MEDIA_BASE_URL;
    const bucket = trimSlashes(MEDIA_BUCKET);
    const normalizedPath = trimSlashes(pathname);

    if (normalizedPath.length === 0) {
        return `${base}/${bucket}`;
    }

    if (normalizedPath.startsWith(`${bucket}/`)) {
        return `${base}/${normalizedPath}`;
    }

    return `${base}/${bucket}/${normalizedPath}`;
};

export const normalizeMediaPublicUrl = (
    url?: string | null
): string | null => {
    if (!url) {
        return null;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return buildUrlFromPath(url);
    }
    try {
        const parsed = new URL(url);
        return buildUrlFromPath(parsed.pathname);
    } catch {
        return url;
    }
};

export function buildMediaUrl(storageKey?: string | null): string | null {
    if (!storageKey) {
        return null;
    }

    // 完全なURLの場合はMEDIA_BASE_URLに合わせて正規化
    if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
        try {
            const parsed = new URL(storageKey);
            return buildUrlFromPath(parsed.pathname);
        } catch {
            return storageKey;
        }
    }

    return buildUrlFromPath(storageKey);
}
