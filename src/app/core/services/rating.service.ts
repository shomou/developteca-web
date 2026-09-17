import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { RatingResponse } from '../models/rating.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  constructor(private http: HttpClient) {}

  private apiUrl(articleId: number): string {
    return `http://localhost:8080/api/v1/articles/${articleId}/ratings`;
  }

  rate(articleId: number, value: number): Observable<ApiResponse<RatingResponse>> {
    return this.http.put<ApiResponse<RatingResponse>>(this.apiUrl(articleId), { value });
  }

  getMine(articleId: number): Observable<ApiResponse<RatingResponse>> {
    return this.http.get<ApiResponse<RatingResponse>>(`${this.apiUrl(articleId)}/me`);
  }
}