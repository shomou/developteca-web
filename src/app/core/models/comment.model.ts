import { Author } from './article.model';

export type CommentStatus = 'APPROVED' | 'REJECTED';

export interface Comment {
    id: number;
    content: string;
    author: Author;
    createdAt: string;
    status: CommentStatus;
    replies: Comment[];
}

export interface CommentCreateRequest {
    content: string;
    parentCommentId: number |  null;
}
