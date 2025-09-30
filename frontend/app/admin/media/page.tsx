"use client";

import { MediaDetailDialog } from "@/components/admin/media/MediaDetailDialog";
import { MediaListSection } from "@/components/admin/media/MediaListSection";
import { MediaUploader } from "@/components/MediaUploader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useMediaDetail } from "@/features/admin/media/hooks/use-media-detail";
import { useMediaLibrary } from "@/features/admin/media/hooks/use-media-library";
import { useMediaUploader } from "@/features/admin/media/hooks/use-media-uploader";
import { buildMediaUrl } from "@/lib/media-url";
import { useToast } from "@/hooks/use-toast";

export default function AdminMediaPage() {
    const { toast } = useToast();

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
    } = useMediaLibrary();

    const { handleFilesAccepted, handleRetry } = useMediaUploader({
        setItems,
        setListError,
        setHasMore,
        toast,
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
        toast,
    });

    return (
        <>
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/10">
                        <CardTitle>メディアライブラリ</CardTitle>
                        <CardDescription>
                            メディアファイルをアップロードし、公開・管理画面で利用できるようにします。
                        </CardDescription>
                    </CardHeader>
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
