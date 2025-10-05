"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useAuthStore } from "@/lib/auth-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error } = useAuthStore();

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const { formState } = form;

    const onSubmit = async (data: LoginForm) => {
        console.log("onSubmit called with data:", data);
        console.log("Current isLoading:", isLoading);
        console.log("Current formState.isSubmitting:", formState.isSubmitting);
        try {
            await login(data.email, data.password);
            console.log("Login successful, redirecting to admin");
            router.push("/admin");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="flex-1 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>ログイン</CardTitle>
                        <CardDescription>
                            管理パネルにアクセスするための認証情報を入力してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="p-4 mb-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                メールアドレス
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="admin@example.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>パスワード</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="password123"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={
                                        isLoading || formState.isSubmitting
                                    }
                                >
                                    ログイン
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </div>
    );
}
