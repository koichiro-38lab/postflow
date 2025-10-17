"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import { createUserByAdmin } from "@/lib/api/admin/users";
import { isApiError } from "@/lib/api";

export default function CreateUserPage() {
    const router = useRouter();

    // ユーザー作成処理
    const handleCreateUser = async (data: UserFormData) => {
        try {
            // 作成モードではパスワードは必須なので型ガードで確認
            if (!data.password) {
                throw new Error("パスワードは必須です");
            }

            await createUserByAdmin({
                email: data.email,
                password: data.password,
                displayName: data.displayName,
                bio: data.bio || null,
                avatarMediaId: data.avatarMediaId || null,
                status: data.status || "ACTIVE",
                role: data.role || "AUTHOR",
            });

            // 成功通知
            toast.success("ユーザーが正常に作成されました");

            // ユーザー一覧へリダイレクト
            router.push("/admin/users");
        } catch (error) {
            // エラーハンドリング
            if (isApiError(error)) {
                if (error.response?.status === 409) {
                    throw new Error("このメールアドレスは既に使用されています");
                } else if (error.response?.status === 403) {
                    throw new Error("ユーザー作成権限がありません");
                }
            }
            throw new Error("ユーザーの作成に失敗しました");
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <UserForm
                mode="create"
                title="新規ユーザー作成"
                onSubmit={handleCreateUser}
                submitLabel="ユーザー作成"
                showCancel
                onCancel={() => router.back()}
            />
        </div>
    );
}
