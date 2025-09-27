"use client";

import { useCallback, useMemo } from "react";
import { Accept, FileRejection, useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadRequest {
    file: File;
}

export interface MediaUploaderProps {
    onFilesAccepted: (files: File[]) => void;
    accept?: Accept;
    maxSize?: number;
    className?: string;
}

export function MediaUploader({
    onFilesAccepted,
    accept,
    maxSize = DEFAULT_MAX_SIZE,
    className,
}: MediaUploaderProps) {
    // 許可するファイル種別と表示用最大サイズを計算
    const effectiveAccept = useMemo<Accept>(
        () => accept ?? { "image/*": [] },
        [accept]
    );
    const maxSizeInMb = useMemo(
        () => Math.round(maxSize / (1024 * 1024)),
        [maxSize]
    );

    // 採用されたファイルをコールバックに渡す
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (!acceptedFiles.length) return;
            onFilesAccepted(acceptedFiles);
        },
        [onFilesAccepted]
    );

    // 受け入れられなかったファイルのエラーをログ出力
    const onDropRejected = useCallback((rejections: FileRejection[]) => {
        rejections.forEach(({ file, errors }) => {
            const message = errors.map((err) => err.message).join("\n");
            console.error(`Failed to add file ${file.name}: ${message}`);
        });
    }, []);

    const { getRootProps, getInputProps, isFocused, isDragActive, open } =
        useDropzone({
            accept: effectiveAccept,
            maxSize,
            multiple: true,
            noClick: true,
            onDrop,
            onDropRejected,
        });

    return (
        <div
            {...getRootProps({
                className: cn(
                    "flex w-full flex-col gap-3 rounded-md border border-dashed bg-muted/60 p-4 text-center transition-colors sm:flex-row sm:items-center sm:justify-between sm:text-left",
                    isFocused || isDragActive
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-primary/30 hover:bg-muted",
                    className
                ),
            })}
        >
            <input {...getInputProps()} />
            <div className="flex flex-1 items-center justify-center gap-3 sm:justify-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-inner">
                    <UploadCloud
                        className="h-5 w-5 text-primary"
                        aria-hidden="true"
                    />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium">ファイルをドロップ</p>
                    <p className="text-xs text-muted-foreground">
                        またはボタンから選択できます（最大 {maxSizeInMb}MB）
                    </p>
                </div>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={open}>
                ファイルを選択
            </Button>
        </div>
    );
}
