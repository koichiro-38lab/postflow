"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { isApiError } from "@/lib/api";
import { VIEW_MODE_STORAGE_KEY } from "@/lib/media-url";
import { fetchMediaList } from "@/lib/media-api";

import type {
    FailedMediaItem,
    MediaListItem,
    SucceededMediaItem,
    UploadingMediaItem,
    ViewMode,
} from "../types";

interface UseMediaLibraryOptions {
    pageSize?: number;
    loadDelayMs?: number;
    storageKey?: string;
    fetchList?: typeof fetchMediaList;
}

export interface UseMediaLibraryResult {
    items: MediaListItem[];
    setItems: Dispatch<SetStateAction<MediaListItem[]>>;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    succeededItems: SucceededMediaItem[];
    transientItems: Array<UploadingMediaItem | FailedMediaItem>;
    showInitialLoading: boolean;
    showLoadMoreSpinner: boolean;
    listError: string | null;
    setListError: Dispatch<SetStateAction<string | null>>;
    listContainerRef: RefObject<HTMLDivElement | null>;
    loadingList: boolean;
    initialLoading: boolean;
    hasMore: boolean;
    setHasMore: Dispatch<SetStateAction<boolean>>;
    loadMore: () => void;
    refresh: () => void;
}

export function useMediaLibrary(
    options: UseMediaLibraryOptions = {}
): UseMediaLibraryResult {
    const {
        pageSize = 20,
        loadDelayMs = 0,
        storageKey = VIEW_MODE_STORAGE_KEY,
        fetchList = fetchMediaList,
    } = options;

    // 一覧に表示するメディアアイテムや UI 状態を管理
    const [items, setItems] = useState<MediaListItem[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [loadingList, setLoadingList] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 表示済みデータを絞り込んで成功済み／アップロード中を集計
    const succeededItems = useMemo(
        () =>
            items.filter(
                (item): item is SucceededMediaItem =>
                    item.status === "succeeded"
            ),
        [items]
    );

    const transientItems = useMemo(
        () =>
            items.filter(
                (item): item is UploadingMediaItem | FailedMediaItem =>
                    item.status !== "succeeded"
            ),
        [items]
    );

    const showInitialLoading =
        initialLoading &&
        succeededItems.length === 0 &&
        transientItems.length === 0;

    const showLoadMoreSpinner =
        hasMore && succeededItems.length > 0 && loadingList;

    // ローカルストレージに保存された表示モードを読み込み・保存
    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(storageKey);
        if (stored === "grid" || stored === "list") {
            setViewMode(stored);
        }
    }, [storageKey]);

    // 表示モードが変更されたときにローカルストレージに保存
    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(storageKey, viewMode);
    }, [storageKey, viewMode]);

    // コンポーネントがアンマウントされるときにタイマーをクリア
    useEffect(() => {
        return () => {
            if (loadTimerRef.current) {
                clearTimeout(loadTimerRef.current);
            }
        };
    }, []);

    // API から一覧データを取得し、既存アイテムとマージ
    const loadPage = useCallback(
        async (pageToLoad: number, replace = false) => {
            setLoadingList(true);
            if (replace) {
                setListError(null);
            }
            try {
                const data = await fetchList({
                    page: pageToLoad,
                    size: pageSize,
                    sort: "createdAt,desc",
                });

                const fetched = (data.content ?? []).map((item) => ({
                    ...item,
                    status: "succeeded" as const,
                }));

                setItems((prev) => {
                    const transient = prev.filter(
                        (item): item is UploadingMediaItem | FailedMediaItem =>
                            item.status !== "succeeded"
                    );
                    if (replace) {
                        return [...transient, ...fetched];
                    }
                    const existingSucceeded = prev.filter(
                        (item): item is SucceededMediaItem =>
                            item.status === "succeeded"
                    );
                    const existingIds = new Set(
                        existingSucceeded.map((item) => item.id)
                    );
                    const mergedSucceeded = [
                        ...existingSucceeded,
                        ...fetched.filter((item) => !existingIds.has(item.id)),
                    ];
                    return [...transient, ...mergedSucceeded];
                });

                const totalPages = data.totalPages ?? 0;
                const currentNumber = data.number ?? pageToLoad;
                setHasMore(
                    totalPages === 0 ? false : currentNumber < totalPages - 1
                );
                setPage(pageToLoad + 1);
            } catch (error) {
                if (!(isApiError(error) && error.response?.status === 401)) {
                    setListError(
                        error instanceof Error
                            ? error.message
                            : "メディア一覧の取得に失敗しました"
                    );
                }
            } finally {
                setLoadingList(false);
                setInitialLoading(false);
            }
        },
        [fetchList, pageSize]
    );

    // 重い連続読み込みを抑制するため、ロードを一定時間遅延させる
    const scheduleLoad = useCallback(
        (pageToLoad: number, replace = false) => {
            if (loadTimerRef.current) {
                clearTimeout(loadTimerRef.current);
            }
            loadTimerRef.current = setTimeout(() => {
                loadTimerRef.current = null;
                void loadPage(pageToLoad, replace);
            }, loadDelayMs);
        },
        [loadDelayMs, loadPage]
    );

    // 一覧を最初のページから再取得
    const refresh = useCallback(() => {
        setInitialLoading(true);
        setHasMore(true);
        setPage(0);
        scheduleLoad(0, true);
    }, [scheduleLoad]);

    // 無限スクロールで次ページを要求
    const loadMore = useCallback(() => {
        if (loadingList || initialLoading || !hasMore) {
            return;
        }
        scheduleLoad(page);
    }, [hasMore, initialLoading, loadingList, page, scheduleLoad]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // スクロール位置が末尾に近づいたら追加ロードをトリガー
    useEffect(() => {
        const container = listContainerRef.current;
        if (!container) return;

        const handleScroll = (event: Event) => {
            if (
                loadingList ||
                initialLoading ||
                !hasMore ||
                loadTimerRef.current
            ) {
                return;
            }
            const target = event.currentTarget as HTMLDivElement | null;
            if (!target) return;
            const threshold = 80;
            if (
                target.scrollTop + target.clientHeight >=
                target.scrollHeight - threshold
            ) {
                loadMore();
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [hasMore, initialLoading, loadMore, loadingList]);

    return {
        items,
        setItems,
        viewMode,
        setViewMode,
        succeededItems,
        transientItems,
        showInitialLoading,
        showLoadMoreSpinner,
        listError,
        setListError,
        listContainerRef,
        loadingList,
        initialLoading,
        hasMore,
        setHasMore,
        loadMore,
        refresh,
    };
}
