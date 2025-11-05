const MEDIA_BASE_URL_RAW = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
const MEDIA_BUCKET_RAW = process.env.NEXT_PUBLIC_MEDIA_BUCKET;

if (!MEDIA_BASE_URL_RAW || MEDIA_BASE_URL_RAW.trim().length === 0) {
    throw new Error(
        "環境変数 NEXT_PUBLIC_MEDIA_BASE_URL が設定されていません。"
    );
}

if (!MEDIA_BUCKET_RAW || MEDIA_BUCKET_RAW.trim().length === 0) {
    throw new Error(
        "環境変数 NEXT_PUBLIC_MEDIA_BUCKET が設定されていません。"
    );
}

const trimSlashes = (value: string) => value.replace(/^\/+/, "").replace(/\/+$/, "");
const normalizeBase = (value: string) =>
    value.endsWith("/") ? value.slice(0, -1) : value;

export const MEDIA_BASE_URL = normalizeBase(MEDIA_BASE_URL_RAW.trim());
export const MEDIA_BUCKET = trimSlashes(MEDIA_BUCKET_RAW.trim());

export const VIEW_MODE_STORAGE_KEY = "admin-media-view-mode";

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
