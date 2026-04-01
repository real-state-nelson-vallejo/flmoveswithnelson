import { Metadata } from 'next';
import { getPropertyBySlugAction } from '@/actions/property/actions';
import { formatPrice } from '@/lib/formatters';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const res = await getPropertyBySlugAction(slug);
    
    if (!res.success || !res.property) {
        return { title: 'Property Not Found | Nelson Vallejo Real Estate' };
    }
    
    const p = res.property;
    const priceFormatted = `$${formatPrice(p.ListPrice || 0)}`;
    const title = `${p.UnparsedAddress} - ${priceFormatted} | Nelson Vallejo`;
    const description = p.PublicRemarks ? p.PublicRemarks.slice(0, 150) + '...' : `Don't miss this ${p.BedroomsTotal} Bed, ${p.BathroomsTotalInteger} Bath home located in ${p.City}. Schedule a tour today!`;
    
    // Fallback image if Bridge media is empty
    const imageUrl = p.Media && p.Media.length > 0 ? p.Media[0] : '/images/default-hero.jpg';
    
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: p.UnparsedAddress
                }
            ],
            type: 'website',
            siteName: 'Nelson Vallejo - Central Florida Real Estate'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl]
        }
    };
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
