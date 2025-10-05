import api from "./api";

// ユーザーステータスの型定義
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

// ユーザーロールの型定義
export type UserRole = "ADMIN" | "EDITOR" | "AUTHOR";

// プロフィールレスポンスの型定義
export interface UserProfileResponse {
    id: number;
    email: string;
    role: UserRole;
    displayName: string | null;
    bio: string | null;
    avatarMediaId: number | null;
    status: UserStatus;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// プロフィール更新リクエストの型定義
export interface UserProfileUpdateRequest {
    displayName?: string | null;
    bio?: string | null;
    avatarMediaId?: number | null;
}

// ユーザーレスポンスの型定義（管理画面用）
export interface UserResponse {
    id: number;
    email: string;
    role: UserRole;
    displayName: string | null;
    bio: string | null;
    avatarMediaId: number | null;
    status: UserStatus;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ページネーションレスポンスの型定義
export interface PageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            empty: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalElements: number;
    totalPages: number;
    last: boolean;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        empty: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

// 管理者による新規ユーザー作成リクエストの型定義
export interface CreateUserRequest {
    email?: string;
    displayName?: string;
    password?: string;
    avatarMediaId?: number | null;
    bio?: string | null;
    role?: UserRole;
    status?: UserStatus;
}

// 管理者によるユーザー更新リクエストの型定義
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

// 自分のプロフィール取得
export async function fetchMyProfile(): Promise<UserProfileResponse> {
    const response = await api.get("/api/admin/users/me");
    return response.data;
}

// 自分のプロフィール更新
export async function updateMyProfile(
    data: UserProfileUpdateRequest
): Promise<UserProfileResponse> {
    const response = await api.put("/api/admin/users/me", data);
    return response.data;
}

// ========== ユーザー管理 API（管理者専用） ==========

// 管理者による新規ユーザー作成
export async function createUserByAdmin(
    data: CreateUserRequest
): Promise<UserResponse> {
    const response = await api.post("/api/admin/users", data);
    return response.data;
}

// ユーザー一覧取得（ページング、ステータスフィルタ対応）
export async function fetchUsers(params: {
    page?: number;
    size?: number;
    status?: UserStatus;
}): Promise<PageResponse<UserResponse>> {
    const response = await api.get("/api/admin/users", { params });
    return response.data;
}

// ユーザー詳細取得
export async function fetchUserById(id: number): Promise<UserResponse> {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
}

// ユーザーステータス変更
export async function updateUserStatus(
    id: number,
    status: UserStatus
): Promise<UserResponse> {
    const response = await api.patch(`/api/admin/users/${id}/status`, {
        status,
    });
    return response.data;
}

// ユーザーロール変更
export async function updateUserRole(
    id: number,
    role: UserRole
): Promise<UserResponse> {
    const response = await api.patch(`/api/admin/users/${id}/role`, { role });
    return response.data;
}

// 管理者によるユーザー情報更新
export async function updateUserByAdmin(
    id: number,
    data: UpdateUserByAdminRequest
): Promise<UserResponse> {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data;
}
