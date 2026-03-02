import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/context/AuthContext';

import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!['en', 'es'].includes(locale)) {
        notFound();
    }

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body>
                <NextIntlClientProvider messages={messages}>
                    <AuthProvider>
                        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                            {children}
                            <Toaster position="top-center" richColors closeButton />
                        </ThemeProvider>
                    </AuthProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
