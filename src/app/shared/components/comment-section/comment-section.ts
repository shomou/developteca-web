import { Component, Input, OnInit, signal, computed } from '@angular/core';
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
  authorName = '';
  authorEmail = '';
  website = ''; // honeypot: nunca se rellena por un humano

  pendingNotice = signal(false);

  pendingCount = computed(() => this.comments().filter((c) => c.status === 'PENDING').length);

  constructor(
    private commentService: CommentService,
    public authService: AuthService,
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
      error: () => this.isLoading.set(false),
    });
  }

  onSubmit(): void {
    if (!this.newComment.trim()) return;

    const anonimo = !this.authService.isAuthenticated();
    if (anonimo && !this.authorName.trim()) {
      this.errorMessage.set('Escribe tu nombre para comentar');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.pendingNotice.set(false);

    this.commentService
      .create(this.articleId, {
        content: this.newComment,
        parentCommentId: this.replyingTo()?.id ?? null,
        ...(anonimo && {
          authorName: this.authorName.trim(),
          authorEmail: this.authorEmail.trim() || undefined,
          website: this.website,
        }),
      })
      .subscribe({
        next: (res) => {
          this.newComment = '';
          this.replyingTo.set(null);
          this.isSubmitting.set(false);

          // Un comentario anónimo no aparece hasta que un admin lo aprueba:
          // sin este aviso, el usuario creería que su comentario se perdió.
          if (res.data.status === 'PENDING') {
            this.pendingNotice.set(true);
          }
          this.loadComments();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message ?? 'No se pudo publicar el comentario');
        },
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
      error: (err) =>
        this.errorMessage.set(err.error?.message ?? 'No se pudo eliminar el comentario'),
    });
  }

  onModerateRequested(event: { comment: Comment; status: CommentStatus }): void {
    this.commentService.moderate(this.articleId, event.comment.id, event.status).subscribe({
      next: () => this.loadComments(),
      error: (err) =>
        this.errorMessage.set(err.error?.message ?? 'No se pudo moderar el comentario'),
    });
  }
}
