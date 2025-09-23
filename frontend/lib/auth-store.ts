import { create } from "zustand";
import axios, { AxiosError } from "axios";

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// クッキー保存時のsecure属性を環境に応じて切り替え
const isLocal =
    typeof window !== "undefined" && window.location.protocol === "http:";

// デバッグ用ログ
console.log("API_BASE_URL:", API_BASE_URL);

// axiosのデフォルト設定
axios.defaults.baseURL = API_BASE_URL;
// 開発環境ではwithCredentialsをtrueにしないとCookieが送信されない
// axios.defaults.withCredentials = true;

// リクエストインターセプターを設定
axios.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        // 認証が不要なエンドポイントをチェック（/api/auth/*は認証不要）
        const isAuthEndpoint = config.url?.includes("/api/auth/");

        if (!isAuthEndpoint) {
            const accessToken = document.cookie
                .split("; ")
                .find((row) => row.startsWith("accessToken="))
                ?.split("=")[1];

            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
    }
    return config;
});

// 401レスポンスでトークンリフレッシュを試みるインターセプター
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthEndpoint = originalRequest.url?.includes("/api/auth/");

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint // 認証エンドポイント自体の401はリフレッシュしない
        ) {
            originalRequest._retry = true;

            try {
                await useAuthStore.getState().refreshToken();
                // Retry the original request with new token
                return axios(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const useAuthStore = create<AuthState>((set, get) => {
    // 初期状態をクッキーから取得
    let initialUser: User | null = null;
    let initialAccessToken: string | null = null;

    if (typeof window !== "undefined") {
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split("=");
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        initialAccessToken = cookies.accessToken || null;
        if (initialAccessToken) {
            try {
                const payload = JSON.parse(
                    atob(initialAccessToken.split(".")[1])
                );
                initialUser = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                };
            } catch (error) {
                console.error("Failed to parse token:", error);
                initialAccessToken = null;
            }
        }
    }

    return {
        user: initialUser,
        accessToken: initialAccessToken,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
            console.log("Login attempt started for:", email);
            set({ isLoading: true, error: null });
            console.log("Set isLoading to true");
            console.log("API URL:", `${API_BASE_URL}/api/auth/login`);
            try {
                const response = await axios.post(
                    `${API_BASE_URL}/api/auth/login`,
                    {
                        email,
                        password,
                    },
                    {
                        withCredentials: true,
                    }
                );

                console.log("Login response received");
                const { accessToken, refreshToken } = response.data;

                // Store tokens in cookies (secure属性は本番のみ)
                document.cookie = `accessToken=${accessToken}; path=/; samesite=strict${
                    isLocal ? "" : "; secure"
                }`;
                document.cookie = `refreshToken=${refreshToken}; path=/; samesite=strict${
                    isLocal ? "" : "; secure"
                }`;

                // Decode user from token
                const payload = JSON.parse(atob(accessToken.split(".")[1]));
                const user: User = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                };

                set({ user, accessToken, isLoading: false });
                console.log("Login successful, set isLoading to false");
            } catch (error) {
                console.log("Login failed, setting isLoading to false");
                const message =
                    error instanceof AxiosError
                        ? error.response?.data?.message ||
                          "ログインに失敗しました"
                        : "ログインに失敗しました";
                set({ error: message, isLoading: false });
                throw error;
            }
        },

        logout: () => {
            // Clear cookies
            document.cookie =
                "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie =
                "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            set({ user: null, accessToken: null, error: null });
        },

        refreshToken: async () => {
            try {
                // Get refresh token from cookie
                const refreshToken = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("refreshToken="))
                    ?.split("=")[1];

                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                const response = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    { refreshToken } // Send refresh token in body
                );

                const { accessToken, refreshToken: newRefreshToken } =
                    response.data;

                // Update both tokens in cookies (secure属性は本番のみ)
                document.cookie = `accessToken=${accessToken}; path=/; samesite=strict${
                    isLocal ? "" : "; secure"
                }`;
                document.cookie = `refreshToken=${newRefreshToken}; path=/; samesite=strict${
                    isLocal ? "" : "; secure"
                }`;

                // Update user from new token
                const payload = JSON.parse(atob(accessToken.split(".")[1]));
                const user: User = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                };

                set({ user, accessToken });
            } catch (error) {
                // If refresh fails, logout
                get().logout();
                throw error;
            }
        },
    };
});

// Initialize auth state from cookies
if (typeof window !== "undefined") {
    const accessToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

    if (accessToken) {
        useAuthStore.setState({ accessToken });
    }
}
