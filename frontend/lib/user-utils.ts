import { UserStatus, UserRole } from "./user-api";

// ユーザーステータスの日本語ラベル
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
    ACTIVE: "有効",
    INACTIVE: "無効",
    SUSPENDED: "停止中",
    DELETED: "削除済み",
};

// ユーザーロールの日本語ラベル
export const USER_ROLE_LABELS: Record<UserRole, string> = {
    ADMIN: "管理者",
    EDITOR: "編集者",
    AUTHOR: "投稿者",
};

// ステータスを日本語に変換
export function getUserStatusLabel(status: UserStatus): string {
    return USER_STATUS_LABELS[status] || status;
}

// ロールを日本語に変換
export function getUserRoleLabel(role: UserRole): string {
    return USER_ROLE_LABELS[role] || role;
}
