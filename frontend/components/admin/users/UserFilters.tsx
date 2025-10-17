import { USER_STATUS_LABELS, USER_ROLE_LABELS } from "@/lib/user-utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UserFiltersProps {
    statusFilter: string;
    roleFilter: string;
    itemsPerPage: number;
    onStatusChange: (status: string) => void;
    onRoleChange: (role: string) => void;
    onItemsPerPageChange: (size: string) => void;
}

/**
 * 管理画面ユーザー一覧のフィルタUI
 * ステータス・ロール・表示件数のセレクトボックスを提供
 */
export function UserFilters({
    statusFilter,
    roleFilter,
    itemsPerPage,
    onStatusChange,
    onRoleChange,
    onItemsPerPageChange,
}: UserFiltersProps) {
    return (
        <div className="mb-6 flex gap-4 flex-wrap">
            {/* ステータスフィルタ */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">ステータス:</label>
                <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">すべて</SelectItem>
                        <SelectItem value="ACTIVE">
                            {USER_STATUS_LABELS.ACTIVE}
                        </SelectItem>
                        <SelectItem value="INACTIVE">
                            {USER_STATUS_LABELS.INACTIVE}
                        </SelectItem>
                        <SelectItem value="SUSPENDED">
                            {USER_STATUS_LABELS.SUSPENDED}
                        </SelectItem>
                        <SelectItem value="DELETED">
                            {USER_STATUS_LABELS.DELETED}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ロールフィルタ */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">ロール:</label>
                <Select value={roleFilter} onValueChange={onRoleChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">すべて</SelectItem>
                        <SelectItem value="ADMIN">
                            {USER_ROLE_LABELS.ADMIN}
                        </SelectItem>
                        <SelectItem value="EDITOR">
                            {USER_ROLE_LABELS.EDITOR}
                        </SelectItem>
                        <SelectItem value="AUTHOR">
                            {USER_ROLE_LABELS.AUTHOR}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 表示件数フィルタ */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">表示件数:</label>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={onItemsPerPageChange}
                >
                    <SelectTrigger className="w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10件</SelectItem>
                        <SelectItem value="20">20件</SelectItem>
                        <SelectItem value="50">50件</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
