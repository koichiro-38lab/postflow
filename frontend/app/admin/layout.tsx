import AdminHeader from "@/components/admin/AdminHeader";
import AdminFooter from "@/components/admin/AdminFooter";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_SITE_NAME + " 管理画面" || "",
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

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <AdminHeader />
            <main className="flex-1">{children}</main>
            <AdminFooter />
        </div>
    );
}
