import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <AdminHeader />
            <main className="flex-1">{children}</main>
        </div>
    );
}
