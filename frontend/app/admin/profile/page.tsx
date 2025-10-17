"use client";

import { useState, useEffect, useCallback } from "react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import {
    fetchMyProfile,
    updateMyProfile,
    UserProfileResponse,
    UserProfileUpdateRequest,
} from "@/lib/api/admin/users";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);

    // プロフィール取得処理
    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchMyProfile();
            setProfile(data);
        } catch (error) {
            console.error("Failed to load profile:", error);
            if (
                error instanceof AxiosError &&
                (error.response?.status === 401 ||
                    error.response?.status === 403)
            ) {
                router.push("/login");
            } else {
                toast.error("プロフィールの取得に失敗しました");
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    // プロフィール取得（マウント時のみ）
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // プロフィール更新処理
    const handleUpdateProfile = async (data: UserFormData) => {
        try {
            const updateData: UserProfileUpdateRequest = {
                displayName: data.displayName.trim() || null,
                bio: data.bio.trim() || null,
                avatarMediaId: data.avatarMediaId,
            };

            const updated = await updateMyProfile(updateData);
            setProfile(updated);
            toast.success("プロフィールが更新されました");
        } catch (error) {
            console.error("Failed to update profile:", error);
            throw new Error("プロフィールの更新に失敗しました");
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8"></div>;
    }

    if (!profile) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">プロフィールが見つかりません</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <UserForm
                mode="update"
                title="プロフィール編集"
                onSubmit={handleUpdateProfile}
                existingUser={profile}
                currentUserId={profile.id}
                defaultValues={{
                    displayName: profile.displayName || "",
                    email: profile.email,
                    bio: profile.bio || "",
                    avatarMediaId: profile.avatarMediaId,
                }}
                submitLabel="プロフィール更新"
                showCancel
                onCancel={() => router.back()}
            />
        </div>
    );
}
