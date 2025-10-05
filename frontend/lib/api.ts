import axios, { AxiosError, AxiosRequestConfig } from "axios";
import {
    useAuthStore,
    getAccessTokenFromCookie,
    getRefreshTokenFromCookie,
} from "@/lib/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const isBrowser = typeof window !== "undefined";

type HeadersWithOptionalSet = {
    set?: (name: string, value: string) => void;
    [key: string]: unknown;
};

const applyAuthorizationHeader = (
    config: AxiosRequestConfig,
    token: string
) => {
    if (config.headers) {
        const headers = config.headers as HeadersWithOptionalSet;
        if (typeof headers.set === "function") {
            headers.set("Authorization", `Bearer ${token}`);
        } else {
            headers["Authorization"] = `Bearer ${token}`;
        }
    } else {
        config.headers = { Authorization: `Bearer ${token}` };
    }
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

api.interceptors.request.use((config) => {
    const token = getAccessTokenFromCookie();
    if (token) {
        applyAuthorizationHeader(config, token);
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config as
            | (AxiosRequestConfig & { _retry?: boolean })
            | undefined;
        const status = error.response?.status;
        const isRefreshCall = original?.url?.includes("/api/auth/refresh");

        if (status === 401 && original && !original._retry && !isRefreshCall) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push((token) => {
                        if (!token) {
                            reject(error);
                            return;
                        }
                        original._retry = true;
                        applyAuthorizationHeader(original, token);
                        resolve(api(original));
                    });
                });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = getRefreshTokenFromCookie();
                if (!refreshToken) throw new Error("no refresh token");

                const accessToken = await useAuthStore.getState().refresh();
                if (!accessToken) throw new Error("refresh failed");

                refreshQueue.forEach((cb) => cb(accessToken));
                refreshQueue = [];
                isRefreshing = false;

                applyAuthorizationHeader(original, accessToken);
                return api(original);
            } catch (e) {
                refreshQueue.forEach((cb) => cb(null));
                refreshQueue = [];
                isRefreshing = false;
                if (isBrowser) {
                    useAuthStore
                        .getState()
                        .logout({ redirect: true })
                        .catch(() => {
                            window.location.href = "/login";
                        });
                }
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

export const isApiError = (error: unknown): error is AxiosError =>
    axios.isAxiosError(error);
