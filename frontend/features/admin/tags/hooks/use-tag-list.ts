import { useState, useEffect, useCallback } from "react";
import { fetchTags, Tag } from "@/lib/api/admin/tags";
import { toast } from "sonner";

/**
 * 管理画面のタグ一覧ページで使用する状態管理hook
 * 一覧取得、削除、モーダル状態をカプセル化
 */
export function useTagList() {
    // タグ一覧状態
    const [tags, setTags] = useState<Tag[]>([]);
    // 編集中のタグ
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    // ダイアログ開閉状態
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // ローディング状態
    const [loading, setLoading] = useState(true);
    // スケルトン表示時の行数保持（前回取得件数を記憶）
    const [lastCount, setLastCount] = useState<number>(5);

    // タグ一覧を取得
    const loadTags = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchTags();
            setTags(data);
            // 次回のスケルトン表示用にデータ件数を記憶
            setLastCount(Math.max(1, data.length));
        } catch {
            toast.error("タグの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    }, []);

    // 初回ロード
    useEffect(() => {
        loadTags();
    }, [loadTags]);

    // タグ編集クリックハンドラ
    const handleEdit = useCallback((tag: Tag) => {
        setEditingTag(tag);
        setIsDialogOpen(true);
    }, []);

    // 新規作成クリックハンドラ
    const handleCreate = useCallback(() => {
        setEditingTag(null);
        setIsDialogOpen(true);
    }, []);

    // フォーム送信成功時のハンドラ
    const handleFormSuccess = useCallback(() => {
        setIsDialogOpen(false);
        loadTags();
    }, [loadTags]);

    // ダイアログ閉じるハンドラ
    const handleCloseDialog = useCallback(() => {
        setIsDialogOpen(false);
    }, []);

    return {
        // データ
        tags,
        editingTag,
        // 状態
        loading,
        isDialogOpen,
        lastCount,
        // ハンドラ
        handleEdit,
        handleCreate,
        handleFormSuccess,
        handleCloseDialog,
        loadTags,
    };
}
