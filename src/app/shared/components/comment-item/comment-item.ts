import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Comment, CommentStatus } from '../../../core/models/comment.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [DatePipe, forwardRef(() => CommentItem)],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.scss',
})
export class CommentItem {
  @Input({ required: true }) comment!: Comment;

  @Output() replyRequested = new EventEmitter<Comment>();
  @Output() deleteRequested = new EventEmitter<Comment>();
  @Output() moderateRequested = new EventEmitter<{ comment: Comment; status: CommentStatus }>();

  constructor(public authService: AuthService) {}

  canDelete(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (this.authService.isAdmin()) return true;
    return this.comment.author !== null && user.id === this.comment.author.id;
  }

  isHidden(): boolean {
    return this.comment.status === 'REJECTED';
  }

  displayName(): string {
    if (this.comment.author) {
      return `${this.comment.author.firstName} ${this.comment.author.lastName}`;
    }
    return this.comment.authorName ?? 'Anónimo';
  }

  isAnonymous(): boolean {
    return this.comment.author === null;
  }

  isPending(): boolean {
    return this.comment.status === 'PENDING';
  }

  approve(): void {
    this.moderateRequested.emit({ comment: this.comment, status: 'APPROVED' });
  }

  reject(): void {
    this.moderateRequested.emit({ comment: this.comment, status: 'REJECTED' });
  }
}
