import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Comment, CommentCreateRequest, CommentStatus } from '../models/comment.model';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(private http: HttpClient) {}

  private apiUrl(articleId: number): string {
    return `${environment.apiUrl}/articles/${articleId}/comments`;
  }

  list(articleId: number, includeRejected = false): Observable<ApiResponse<Comment[]>> {
    const params = new HttpParams().set('includeRejected', includeRejected);
    return this.http.get<ApiResponse<Comment[]>>(this.apiUrl(articleId), { params });
  }

  create(articleId: number, request: CommentCreateRequest): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(this.apiUrl(articleId), request);
  }

  moderate(
    articleId: number,
    commentId: number,
    status: CommentStatus,
  ): Observable<ApiResponse<Comment>> {
    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl(articleId)}/${commentId}/moderate`, {
      status,
    });
  }

  delete(articleId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl(articleId)}/${commentId}`);
  }
}
