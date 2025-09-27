"use client";

export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(1)} ${sizes[i]}`;
}

export function formatDateTime(iso: string): string {
    if (!iso) return "-";
    try {
        const date = new Date(iso);
        if (!Number.isFinite(date.getTime())) {
            return iso;
        }
        return new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(date);
    } catch {
        return iso;
    }
}

export function generateUploadId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getOptionalImageDimensions(file: File): Promise<{
    width: number | null;
    height: number | null;
}> {
    if (!file.type.startsWith("image/")) {
        return { width: null, height: null };
    }

    const objectUrl = URL.createObjectURL(file);
    try {
        const img = await loadImage(objectUrl);
        return {
            width: Number.isFinite(img.naturalWidth) ? img.naturalWidth : null,
            height: Number.isFinite(img.naturalHeight)
                ? img.naturalHeight
                : null,
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("画像メタ情報の取得に失敗しました"));
        img.src = src;
    });
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
    if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
    ) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    if (typeof document === "undefined") {
        return false;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let succeeded = false;
    try {
        succeeded = document.execCommand("copy");
    } catch {
        succeeded = false;
    } finally {
        document.body.removeChild(textarea);
    }

    return succeeded;
}
