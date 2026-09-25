import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { RatingResponse } from '../models/rating.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  constructor(private http: HttpClient) {}

  private apiUrl(articleId: number): string {
    return `${environment.apiUrl}/articles/${articleId}/ratings`;
  }

  rate(articleId: number, value: number): Observable<ApiResponse<RatingResponse>> {
    return this.http.put<ApiResponse<RatingResponse>>(this.apiUrl(articleId), { value });
  }

  getMine(articleId: number): Observable<ApiResponse<RatingResponse>> {
    return this.http.get<ApiResponse<RatingResponse>>(`${this.apiUrl(articleId)}/me`);
  }
}