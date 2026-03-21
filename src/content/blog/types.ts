export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: 'for-clients' | 'for-barbers' | 'industry';
  categoryLabel: string;
  publishedAt: string; // ISO date
  updatedAt?: string;
  readingTime: number; // minutes
  author: string;
  image?: string;
  imageAlt?: string;
}

export interface BlogPostWithContent extends BlogPost {
  content: string; // HTML content
}
