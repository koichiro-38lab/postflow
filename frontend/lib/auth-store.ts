"use client";

import axios from "axios";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getApiBaseUrl } from "@/lib/api-base-url";

type DecodedToken = {
    sub?: string | number;
    exp?: number; // seconds
    roles?: string[];
    username?: string;
    id?: number;
};

type User = {
    id: number;
    email: string;
    roles: string[];
};

type LogoutOptions = {
    redirect?: boolean;
};

type AuthState = {
    user: User | null;
    accessToken: string | null;
    isRefreshing: boolean;
    isLoading: boolean;
    error: string | null;
    setUser: (user: User | null) => void;
    setAccessToken: (token: string | null) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: (options?: LogoutOptions) => Promise<void>;
    refresh: () => Promise<string | null>;
};

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";
const ACCESS_COOKIE_TTL_DAYS = 1;
const REFRESH_COOKIE_TTL_DAYS = 7;

const API_BASE_URL = getApiBaseUrl();
const isBrowser = typeof window !== "undefined";

const authClient = axios.create({
    baseURL: API_BASE_URL || undefined,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

const setCookie = (name: string, value: string, days: number) => {
    if (!isBrowser) return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; samesite=strict`;
};

const deleteCookie = (name: string) => {
    if (!isBrowser) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
};

const getCookie = (name: string): string | null => {
    if (!isBrowser) return null;
    return (
        document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`))
            ?.split("=")[1] || null
    );
};

const decodeJwt = (token: string): DecodedToken | null => {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
        const json = atob(parts[1]);
        return JSON.parse(json) as DecodedToken;
    } catch {
        return null;
    }
};

const decodeUserFromAccess = (token: string): User | null => {
    const decoded = decodeJwt(token);
    if (!decoded) return null;
    const now = Math.floor(Date.now() / 1000);
    if (!decoded.exp || decoded.exp < now) return null;
    const id =
        typeof decoded.id === "number"
            ? decoded.id
            : parseInt(String(decoded.sub ?? 0), 10);
    const email = decoded.username ?? String(decoded.sub ?? "");
    const roles = decoded.roles ?? [];
    return { id: Number.isFinite(id) ? id : 0, email, roles };
};

let refreshPromise: Promise<string | null> | null = null;

export const useAuthStore = create<AuthState>()(
    devtools((set, get) => ({
        user: null,
        accessToken: null,
        isRefreshing: false,
        isLoading: false,
        error: null,

        setUser: (user) => set({ user }),
        setAccessToken: (token) => set({ accessToken: token }),

        login: async (email: string, password: string) => {
            set({ isLoading: true, error: null });
            try {
                const res = await authClient.post("/api/auth/login", {
                    email,
                    password,
                });
                const { accessToken, refreshToken } = res.data as {
                    accessToken: string;
                    refreshToken: string;
                };
                if (accessToken) {
                    setCookie(
                        ACCESS_COOKIE,
                        accessToken,
                        ACCESS_COOKIE_TTL_DAYS
                    );
                }
                if (refreshToken) {
                    setCookie(
                        REFRESH_COOKIE,
                        refreshToken,
                        REFRESH_COOKIE_TTL_DAYS
                    );
                }
                const user = decodeUserFromAccess(accessToken);
                set({ accessToken, user, isLoading: false, error: null });
            } catch (err: unknown) {
                let message = "ログインに失敗しました";
                if (axios.isAxiosError(err)) {
                    const data = err.response?.data as unknown;
                    if (
                        data &&
                        typeof data === "object" &&
                        "message" in (data as Record<string, unknown>) &&
                        typeof (data as Record<string, unknown>)["message"] ===
                            "string"
                    ) {
                        message = (data as Record<string, string>)["message"];
                    }
                }
                set({ isLoading: false, error: String(message) });
                throw err;
            }
        },

        logout: async (options?: LogoutOptions) => {
            const redirect = options?.redirect ?? true;
            deleteCookie(ACCESS_COOKIE);
            deleteCookie(REFRESH_COOKIE);
            refreshPromise = null;
            set({ user: null, accessToken: null, isRefreshing: false });
            if (redirect && isBrowser) {
                window.location.href = "/login";
            }
        },

        refresh: async () => {
            if (!isBrowser) return null;
            if (refreshPromise) return refreshPromise;

            const refreshToken = getCookie(REFRESH_COOKIE);
            if (!refreshToken) {
                return null;
            }

            const pending = (async () => {
                try {
                    set({ isRefreshing: true });
                    const res = await authClient.post("/api/auth/refresh", {
                        refreshToken,
                    });
                    const {
                        accessToken: newAccessToken,
                        refreshToken: newRefresh,
                    } = res.data as {
                        accessToken: string;
                        refreshToken?: string;
                    };

                    if (newAccessToken) {
                        setCookie(
                            ACCESS_COOKIE,
                            newAccessToken,
                            ACCESS_COOKIE_TTL_DAYS
                        );
                        const user = decodeUserFromAccess(newAccessToken);
                        set({ accessToken: newAccessToken, user });
                    }
                    if (newRefresh) {
                        setCookie(
                            REFRESH_COOKIE,
                            newRefresh,
                            REFRESH_COOKIE_TTL_DAYS
                        );
                    }
                    return newAccessToken ?? null;
                } catch (err) {
                    if (axios.isAxiosError(err)) {
                        const status = err.response?.status ?? 0;
                        if (status === 401 || status === 403) {
                            await get().logout({ redirect: true });
                            return null;
                        }
                    }
                    return null;
                } finally {
                    set({ isRefreshing: false });
                    refreshPromise = null;
                }
            })();

            refreshPromise = pending;
            return pending;
        },
    }))
);

if (isBrowser) {
    const existingToken = getCookie(ACCESS_COOKIE);
    const user = existingToken ? decodeUserFromAccess(existingToken) : null;
    if (user && existingToken) {
        useAuthStore.setState({ user, accessToken: existingToken });
    } else if (existingToken && !user) {
        deleteCookie(ACCESS_COOKIE);
    }
}

export const getAccessTokenFromCookie = () => getCookie(ACCESS_COOKIE);
export const getRefreshTokenFromCookie = () => getCookie(REFRESH_COOKIE);
