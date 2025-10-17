import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserWithAvatar } from "@/features/admin/users/types";
import { buildMediaUrl } from "@/lib/media-url";
import { getUserStatusLabel, getUserRoleLabel } from "@/lib/user-utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil } from "lucide-react";

interface UserTableProps {
    users: UserWithAvatar[];
    loading: boolean;
    itemsPerPage: number;
    currentUserId: number | null;
}

// イニシャルを取得するヘルパー関数
function getInitials(displayName: string | null, email: string): string {
    if (displayName) {
        return displayName.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
}

/**
 * 管理画面ユーザー一覧テーブル
 */
export function UserTable({
    users,
    loading,
    itemsPerPage,
    currentUserId,
}: UserTableProps) {
    const router = useRouter();

    return (
        <div className="border rounded-lg">
            <Table className="min-w-[1000px] table-auto">
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap min-w-[60px]">
                            ID
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[80px]">
                            アバター
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[200px]">
                            メールアドレス
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[140px]">
                            表示名
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[100px]">
                            ロール
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[100px]">
                            ステータス
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[160px]">
                            最終ログイン
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        [...Array(itemsPerPage)].map((_, i) => (
                            <TableRow key={i} className="h-12">
                                <TableCell>
                                    <Skeleton className="h-4 w-2/3" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-2/3" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-2/3" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-2/3" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-2/3" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-2/3" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-2/3" />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center">
                                ユーザーが見つかりません
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow
                                key={user.id}
                                onClick={
                                    currentUserId === user.id
                                        ? undefined
                                        : () =>
                                              router.push(
                                                  `/admin/users/${user.id}/edit`
                                              )
                                }
                                className={
                                    currentUserId === user.id
                                        ? ""
                                        : "cursor-pointer hover:bg-muted/50"
                                }
                                aria-disabled={currentUserId === user.id}
                            >
                                <TableCell>{user.id}</TableCell>
                                <TableCell>
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage
                                            src={
                                                user.avatarStorageKey
                                                    ? buildMediaUrl(
                                                          user.avatarStorageKey
                                                      ) || undefined
                                                    : undefined
                                            }
                                            alt={user.displayName || user.email}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="text-xs">
                                            {getInitials(
                                                user.displayName,
                                                user.email
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.displayName || "-"}</TableCell>
                                <TableCell>
                                    {getUserRoleLabel(user.role)}
                                </TableCell>
                                <TableCell>
                                    {getUserStatusLabel(user.status)}
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        if (!user.lastLoginAt) return "-";
                                        const date = new Date(
                                            user.lastLoginAt + "Z"
                                        );
                                        if (isNaN(date.getTime())) return "-";
                                        return date.toLocaleString("ja-JP", {
                                            timeZone: "Asia/Tokyo",
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        });
                                    })()}
                                </TableCell>
                                <TableCell>
                                    {currentUserId === user.id ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled
                                        >
                                            <Pencil className="h-4 w-4" />
                                            編集
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link
                                                href={`/admin/users/${user.id}/edit`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                編集
                                            </Link>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
