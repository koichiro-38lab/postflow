"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [isClient, setIsClient] = useState(false);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <header className="bg-card border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                    <Link href="/">
                        <span className="text-3xl font-bold text-foreground cursor-pointer">
                            PostFlow
                        </span>
                    </Link>
                    <div className="flex items-center gap-2">
                        {isClient && (
                            <>
                                {user ? (
                                    <>
                                        <span className="text-sm text-muted-foreground">
                                            ようこそ、{user.email}さん
                                        </span>
                                        <Button
                                            onClick={handleLogout}
                                            variant="outline"
                                        >
                                            ログアウト
                                        </Button>
                                    </>
                                ) : (
                                    pathname !== "/login" && (
                                        <Button
                                            onClick={() =>
                                                router.push("/login")
                                            }
                                        >
                                            ログイン
                                        </Button>
                                    )
                                )}
                            </>
                        )}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
