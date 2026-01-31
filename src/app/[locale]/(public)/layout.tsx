import { AIChatWidget } from '@/components/public/AIChatWidget';
import { FloatingHeader } from '@/components/layout/FloatingHeader';
import { Footer } from '@/components/layout/Footer';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <FloatingHeader />
            {children}
            <AIChatWidget />
            <Footer />
        </>
    );
}
