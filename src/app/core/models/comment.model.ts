import { Author } from './article.model';

export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Comment {
  id: number;
  content: string;
  author: Author | null;      // null cuando es anónimo
  authorName: string | null;  // solo viene cuando author es null
  createdAt: string;
  status: CommentStatus;
  replies: Comment[];
}

export interface CommentCreateRequest {
  content: string;
  parentCommentId: number | null;
  authorName?: string;
  authorEmail?: string;
  website?: string;   // honeypot: siempre se envía vacío
}