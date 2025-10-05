"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
    UserForm,
    type UpdateUserFormData,
} from "@/components/admin/user/UserForm";
import {
    fetchUserById,
    updateUserByAdmin,
    type UserResponse,
} from "@/lib/user-api";

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = Number(params.id);

    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // ユーザー情報の取得
    useEffect(() => {
        const loadUser = async () => {
            try {
                setLoading(true);
                const userData = await fetchUserById(userId);
                setUser(userData);
            } catch (error) {
                console.error("Failed to load user:", error);
                toast.error("ユーザー情報の取得に失敗しました");
                router.push("/admin/users");
            } finally {
                setLoading(false);
            }
        };

        if (userId && !isNaN(userId)) {
            loadUser();
        } else {
            toast.error("無効なユーザーIDです");
            router.push("/admin/users");
        }
    }, [userId, router]);

    // ユーザー情報更新処理
    const handleUpdateUser = async (data: UpdateUserFormData) => {
        try {
            // 更新データの準備
            const updateData = {
                displayName: data.displayName,
                email: data.email,
                avatarMediaId: data.avatarMediaId,
                bio: data.bio,
                role: data.role,
                status: data.status,
                // パスワードが入力されている場合のみ含める
                ...(data.password && data.password.trim() !== ""
                    ? { password: data.password }
                    : {}),
            };

            await updateUserByAdmin(userId, updateData);

            // 成功通知
            toast.success("ユーザー情報を更新しました");

            // ユーザー一覧へリダイレクト
            router.push("/admin/users");
        } catch (error) {
            console.error("Failed to update user:", error);
            throw new Error("ユーザー情報の更新に失敗しました");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center">
                    <div className="text-center">読み込み中...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">
                        ユーザーが見つかりません
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <UserForm
                mode="update"
                title={`ユーザー編集: ${user.displayName || user.email}`}
                existingUser={user}
                onSubmit={handleUpdateUser}
                submitLabel="ユーザー情報を更新"
                showCancel
                onCancel={() => router.back()}
            />
        </div>
    );
}
