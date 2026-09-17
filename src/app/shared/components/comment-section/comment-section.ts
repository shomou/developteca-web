import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Comment, CommentStatus } from '../../../core/models/comment.model';
import { CommentItem } from '../comment-item/comment-item';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [FormsModule, RouterLink, CommentItem],
  templateUrl: './comment-section.html',
  styleUrl: './comment-section.scss',
})
export class CommentSection implements OnInit {
  @Input({ required: true }) articleId!: number;

  comments = signal<Comment[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  replyingTo = signal<Comment | null>(null);

  newComment = '';

  constructor(
    private commentService: CommentService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.isLoading.set(true);
    this.commentService.list(this.articleId, this.authService.isAdmin()).subscribe({
      next: (res) => {
        this.comments.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSubmit(): void {
    if (!this.newComment.trim()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.commentService.create(this.articleId, {
      content: this.newComment,
      parentCommentId: this.replyingTo()?.id ?? null
    }).subscribe({
      next: () => {
        this.newComment = '';
        this.replyingTo.set(null);
        this.isSubmitting.set(false);
        this.loadComments();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo publicar el comentario');
      }
    });
  }

  onReplyRequested(comment: Comment): void {
    this.replyingTo.set(comment);
  }

  cancelReply(): void {
    this.replyingTo.set(null);
  }

  onDeleteRequested(comment: Comment): void {
    this.commentService.delete(this.articleId, comment.id).subscribe({
      next: () => this.loadComments(),
      error: (err) => this.errorMessage.set(err.error?.message ?? 'No se pudo eliminar el comentario')
    });
  }

  onModerateRequested(comment: Comment): void {
    const newStatus: CommentStatus = comment.status === 'REJECTED' ? 'APPROVED' : 'REJECTED';

    this.commentService.moderate(this.articleId, comment.id, newStatus).subscribe({
      next: () => this.loadComments(),
      error: (err) => this.errorMessage.set(err.error?.message ?? 'No se pudo moderar el comentario')
    });
}
}