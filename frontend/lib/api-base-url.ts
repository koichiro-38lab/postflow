const DEFAULT_SERVER_BASE_URL =
    process.env.NEXT_SERVER_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://host.docker.internal:8080";

// APIベースURLを取得する関数
const getBrowserDefault = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    if (typeof window !== "undefined") {
        const { protocol, hostname, port } = window.location;
        const normalizedPort =
            port && port.trim().length > 0 ? `:${port}` : ":8080";
        return `${protocol}//${hostname}${normalizedPort}`;
    }

    return "http://localhost:8080";
};

// APIベースURLを返す関数
export const getApiBaseUrl = () => {
    const isBrowser = typeof window !== "undefined";
    if (isBrowser) {
        return getBrowserDefault();
    }
    return DEFAULT_SERVER_BASE_URL;
};
