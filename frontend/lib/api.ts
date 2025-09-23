import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// トークンリフレッシュを試みるレスポンスインターセプター
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // トークンが無効な場合、リフレッシュを試みる
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                try {
                    const refreshResponse = await axios.post(
                        `${API_BASE_URL}/api/auth/refresh`,
                        {
                            refreshToken,
                        }
                    );
                    const { accessToken } = refreshResponse.data;
                    localStorage.setItem("accessToken", accessToken);
                    document.cookie = `accessToken=${accessToken}; path=/; max-age=86400`;

                    // 元のリクエストを新しいトークンで再試行
                    error.config.headers.Authorization = `Bearer ${accessToken}`;
                    return axios(error.config);
                } catch {
                    // リフレッシュに失敗した場合、ログアウト処理を実行
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    document.cookie = "accessToken=; path=/; max-age=0";
                    window.location.href = "/login";
                }
            } else {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
