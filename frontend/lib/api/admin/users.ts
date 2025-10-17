import api from "@/lib/api";
import type {
    UserProfileResponse,
    UserResponse,
    UserRole,
    UserStatus,
    PageResponse,
} from "@/lib/types/common";

// Re-export types for convenience
export type {
    UserRole,
    UserStatus,
    UserProfileResponse,
    UserResponse,
    PageResponse,
} from "@/lib/types/common";

// ========== リクエスト型定義 ==========

export interface UserProfileUpdateRequest {
    displayName?: string | null;
    bio?: string | null;
    avatarMediaId?: number | null;
}

export interface CreateUserRequest {
    email?: string;
    displayName?: string;
    password?: string;
    avatarMediaId?: number | null;
    bio?: string | null;
    role?: UserRole;
    status?: UserStatus;
}

export interface UpdateUserByAdminRequest {
    email?: string;
    displayName?: string;
    password?: string;
    avatarMediaId?: number | null;
    bio?: string | null;
    role?: UserRole;
    status?: UserStatus;
}

// ========== プロフィール管理 API ==========

/**
 * 自分のプロフィールを取得
 */
export async function fetchMyProfile(): Promise<UserProfileResponse> {
    const response = await api.get("/api/admin/users/me");
    return response.data;
}

/**
 * 自分のプロフィールを更新
 */
export async function updateMyProfile(
    data: UserProfileUpdateRequest
): Promise<UserProfileResponse> {
    const response = await api.put("/api/admin/users/me", data);
    return response.data;
}

// ========== ユーザー管理 API（管理者専用） ==========

/**
 * 管理者による新規ユーザー作成
 */
export async function createUserByAdmin(
    data: CreateUserRequest
): Promise<UserResponse> {
    const response = await api.post("/api/admin/users", data);
    return response.data;
}

/**
 * ユーザー一覧を取得（ページング、ステータスフィルタ対応）
 */
export async function fetchUsers(params: {
    page?: number;
    size?: number;
    status?: UserStatus;
}): Promise<PageResponse<UserResponse>> {
    const response = await api.get("/api/admin/users", { params });
    return response.data;
}

/**
 * ユーザー詳細を取得
 */
export async function fetchUserById(id: number): Promise<UserResponse> {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
}

/**
 * ユーザーステータスを変更
 */
export async function updateUserStatus(
    id: number,
    status: UserStatus
): Promise<UserResponse> {
    const response = await api.patch(`/api/admin/users/${id}/status`, {
        status,
    });
    return response.data;
}

/**
 * ユーザーロールを変更
 */
export async function updateUserRole(
    id: number,
    role: UserRole
): Promise<UserResponse> {
    const response = await api.patch(`/api/admin/users/${id}/role`, { role });
    return response.data;
}

/**
 * 管理者によるユーザー情報更新
 */
export async function updateUserByAdmin(
    id: number,
    data: UpdateUserByAdminRequest
): Promise<UserResponse> {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data;
}
