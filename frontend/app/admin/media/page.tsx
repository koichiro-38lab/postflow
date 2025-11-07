"use client";

import { MediaDetailDialog } from "@/components/admin/media/MediaDetailDialog";
import { MediaListSection } from "@/components/admin/media/MediaListSection";
import { MediaUploader } from "@/components/admin/media/MediaUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaDetail } from "@/features/admin/media/hooks/use-media-detail";
import { useMediaLibrary } from "@/features/admin/media/hooks/use-media-library";
import { useMediaUploader } from "@/features/admin/media/hooks/use-media-uploader";
import { buildMediaUrl } from "@/lib/media-url";

export default function AdminMediaPage() {
    const {
        items,
        setItems,
        viewMode,
        setViewMode,
        showInitialLoading,
        showLoadMoreSpinner,
        listError,
        setListError,
        listContainerRef,
        setHasMore,
        totalCount: mediaTotalCount,
        adjustTotalCount,
    } = useMediaLibrary();
    // メディア総件数
    const totalCount = mediaTotalCount ?? 0;

    const { handleFilesAccepted, handleRetry } = useMediaUploader({
        setItems,
        setListError,
        setHasMore,
        adjustTotalCount,
    });

    const {
        detailOpen,
        detailMedia,
        detailLoading,
        detailError,
        detailPublicUrl,
        previewAspectRatio,
        downloadLoading,
        deleteLoading,
        deleteConfirmOpen,
        openDetail,
        closeDetail,
        retryDetail,
        copyPublicUrl,
        downloadDetail,
        requestDeleteDetail,
        cancelDeleteDetail,
        confirmDeleteDetail,
    } = useMediaDetail({
        setItems,
        adjustTotalCount,
    });

    return (
        <>
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-bold">メディア</h1>
                </div>
                {/* 将来別コンポーネントに件数を渡す場合は props 拡張で対応 */}
                <div className="text-sm text-muted-foreground mb-4">
                    {showInitialLoading ? (
                        <Skeleton className="h-4 w-28" />
                    ) : (
                        `全 ${totalCount} 件`
                    )}
                </div>
                <Card className="overflow-hidden">
                    <CardContent className="space-y-6 py-6">
                        <MediaUploader
                            onFilesAccepted={handleFilesAccepted}
                            className="w-full"
                        />
                        <MediaListSection
                            items={items}
                            viewMode={viewMode}
                            onChangeViewMode={setViewMode}
                            listError={listError}
                            showInitialLoading={showInitialLoading}
                            showLoadMoreSpinner={showLoadMoreSpinner}
                            listContainerRef={listContainerRef}
                            buildMediaUrl={buildMediaUrl}
                            handleRetry={handleRetry}
                            onOpenDetail={openDetail}
                        />
                    </CardContent>
                </Card>
            </div>
            <MediaDetailDialog
                open={detailOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDetail();
                    }
                }}
                onClose={closeDetail}
                detailMedia={detailMedia}
                detailLoading={detailLoading}
                detailError={detailError}
                detailPublicUrl={detailPublicUrl}
                previewAspectRatio={previewAspectRatio}
                downloadLoading={downloadLoading}
                deleteLoading={deleteLoading}
                deleteConfirmOpen={deleteConfirmOpen}
                onRetry={retryDetail}
                onCopyUrl={copyPublicUrl}
                onDownload={downloadDetail}
                onRequestDelete={requestDeleteDetail}
                onCancelDelete={cancelDeleteDetail}
                onConfirmDelete={confirmDeleteDetail}
            />
        </>
    );
}
