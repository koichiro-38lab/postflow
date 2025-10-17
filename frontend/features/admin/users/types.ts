import { UserResponse } from "@/lib/api/admin/users";

export interface UsersFilterParams {
    page: number; // 0始まり（内部管理用）
    size: number;
    statusFilter: string;
    roleFilter: string;
}

export interface UserWithAvatar extends UserResponse {
    avatarStorageKey?: string | null;
}
