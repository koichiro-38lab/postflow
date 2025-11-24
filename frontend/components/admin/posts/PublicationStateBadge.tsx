// filepath: frontend/features/admin/posts/components/PublicationStateBadge.tsx
import type { ElementType } from "react";
import { PublicationState } from "@/lib/types/common";
import { cn } from "@/lib/utils";
import { FileText, Eye, Archive, Clock } from "lucide-react";

interface PublicationStateBadgeProps {
    state: PublicationState;
    className?: string;
}

type StateConfig = {
    label: string;
    icon: ElementType;
    badgeClass: string;
    iconClass: string;
    textClass: string;
};

// バッジの基本スタイル
const BASE_BADGE_CLASS =
    "inline-flex items-center gap-1 rounded-md border text-xs px-2 py-1";

// 公開状態別のスタイル定義（ダーク/ライトモード対応）
const STATE_STYLES: Record<PublicationState, StateConfig> = {
    DRAFT: {
        label: "下書き",
        icon: FileText,
        badgeClass: "border-gray-400 dark:border-gray-600",
        iconClass: "text-gray-500 dark:text-gray-400",
        textClass: "text-gray-700 dark:text-gray-200",
    },
    PUBLISHED: {
        label: "公開済み",
        icon: Eye,
        badgeClass: "border-gray-400 dark:border-gray-600",
        iconClass: "text-green-700 dark:text-green-500",
        textClass: "text-gray-700 dark:text-gray-200",
    },
    SCHEDULED: {
        label: "予約公開",
        icon: Clock,
        badgeClass: "border-gray-400 dark:border-gray-600",
        iconClass: "text-amber-700 dark:text-amber-500",
        textClass: "text-gray-700 dark:text-gray-200",
    },
    ARCHIVED: {
        label: "アーカイブ",
        icon: Archive,
        badgeClass: "border-gray-400 dark:border-gray-600",
        iconClass: "text-orange-700 dark:text-orange-500",
        textClass: "text-gray-700 dark:text-gray-200",
    },
};

export function PublicationStateBadge({
    state,
    className,
}: PublicationStateBadgeProps) {
    const style = STATE_STYLES[state];
    const Icon = style.icon;

    return (
        <span className={cn(BASE_BADGE_CLASS, style.badgeClass, className)}>
            <Icon className={cn("h-4 w-4", style.iconClass)} />
            <span className={style.textClass}>{style.label}</span>
        </span>
    );
}
