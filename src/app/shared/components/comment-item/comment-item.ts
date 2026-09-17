import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Comment } from '../../../core/models/comment.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [DatePipe, forwardRef(() => CommentItem)],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.scss',
})
export class CommentItem {
  @Input({required: true}) comment!: Comment;

  @Output() replyRequested = new EventEmitter<Comment>();
  @Output() deleteRequested = new EventEmitter<Comment>();
  @Output() moderateRequested = new EventEmitter<Comment>();

  constructor(public authService: AuthService){}

  canDelete(): boolean{
    const user = this.authService.currentUser();
    if (!user) return false;
    return user.id === this.comment.author.id || this.authService.isAdmin();
  }

  isHidden(): boolean{
    return this.comment.status === 'REJECTED';
  }
}
