export interface Content {
    id: string;
    slug: string;
    title: string;
    body: string; // Markdown or HTML
    type: 'blog_post' | 'neighborhood_guide' | 'market_report';
    tags: string[];
    seoDescription: string;
    createdAt: Date;
    updatedAt: Date;
}
