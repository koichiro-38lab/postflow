import AdminHeader from "@/components/admin/AdminHeader";
import AdminFooter from "@/components/admin/AdminFooter";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_SITE_NAME + " 管理画面" || "",
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
