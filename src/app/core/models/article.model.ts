export type ArticleStatus = 'DRAFT'| 'PUBLISHED' | 'ARCHIVED';

export interface Author{
    id: number;
    firstName: string;
    lastName: string;
}

export interface Category{
    id: number;
    name: string;
    slug: string;
    description: string;
}

export interface ArticleImage{
    id: number;
    imageUrl: string;
    altText: string;
    isFeatured: boolean;
    orderIndex: number;
}

export interface ArticleSummary{
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    author: Author;
    category: Category;
    featuredImage: ArticleImage | null;
    averageRating: number;
    commentsCount: number;
    viewsCount: number;
    status: ArticleStatus;
    publishedAt: string | null;
}

export interface ArticleDetail{
    id: number;
    title: string;
    slug: string;
    content: string;
    author: Author;
    category: Category;
    images: ArticleImage[];
    averageRating: number;
    commentsCount: number;
    viewsCount: number;
    status: ArticleStatus;
    createdAt: string;
    publishedAt: string | null;
}

// Respuesta paginada de Spring Data (Page<T>)
export interface Page<T>{
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // página actual
    size: number;
}