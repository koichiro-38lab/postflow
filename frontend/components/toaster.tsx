"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import type { ComponentProps } from "react";

export function Toaster() {
    const { theme = "system" } = useTheme();

    return (
        <SonnerToaster
            theme={theme as ComponentProps<typeof SonnerToaster>["theme"]}
            position="top-right"
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: "border border-border bg-background text-foreground",
                    description: "text-muted-foreground",
                    actionButton: "bg-primary text-primary-foreground",
                    cancelButton: "bg-muted text-muted-foreground",
                },
            }}
        />
    );
}
