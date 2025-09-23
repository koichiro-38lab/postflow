import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Post {
    id: string;
    title: string;
    slug: string;
    publishedAt: string | null;
    // 必要に応じて他のフィールドも追加
}

export async function fetchPosts(accessToken?: string): Promise<Post[]> {
    const res = await axios.get(`${API_BASE_URL}/api/admin/posts`, {
        headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
    });
    return res.data.content || res.data;
}
