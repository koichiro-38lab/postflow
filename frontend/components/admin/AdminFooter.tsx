export default function Footer() {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="bg-card border-t mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="text-center text-xs text-muted-foreground">
                    &copy; {currentYear} {process.env.NEXT_PUBLIC_SITE_NAME}.
                    All rights reserved.
                </div>
            </div>
        </footer>
    );
}
