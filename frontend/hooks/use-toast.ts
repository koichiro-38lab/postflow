"use client";

import { useMemo } from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

export type ToastProps = {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
    duration?: number;
};

const variantClassNames: Record<
    NonNullable<ToastProps["variant"]>,
    ExternalToast["classNames"]
> = {
    default: {
        toast: "border border-border bg-background text-foreground",
        description: "text-muted-foreground",
    },
    destructive: {
        toast:
            "border border-destructive/60 bg-destructive text-destructive-foreground",
        description: "text-destructive-foreground/90",
    },
};

const showToast = ({
    title,
    description,
    variant = "default",
    duration,
}: ToastProps) => {
    const message = title ?? description ?? "";
    const details = title && description ? description : undefined;

    const options: ExternalToast = {
        description: details,
        duration,
        classNames: variantClassNames[variant],
    };

    return sonnerToast(message, options);
};

export function useToast() {
    return useMemo(
        () => ({
            toast: showToast,
            dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
        }),
        []
    );
}

export { showToast as toast };
