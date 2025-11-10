/**
 * 公開サイト共通レイアウト
 */

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Metadata } from "next";

export const metadata: Metadata = {
    icons: {
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [
            {
                url: "/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    },
};

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <PublicHeader />
            <main className="flex-1">{children}</main>
            <PublicFooter />
        </div>
    );
}
