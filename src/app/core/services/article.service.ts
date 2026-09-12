import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { ArticleDetail, ArticleSummary, Page } from '../models/article.model';

export interface ArticleListParams {
  page?: number;
  size?: number;
  category?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/articles';

  constructor(private http: HttpClient) {}

  list(params: ArticleListParams = {}): Observable<ApiResponse<Page<ArticleSummary>>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<ApiResponse<Page<ArticleSummary>>>(this.apiUrl, { params: httpParams });
  }

  getBySlug(slug: string): Observable<ApiResponse<ArticleDetail>> {
    return this.http.get<ApiResponse<ArticleDetail>>(`${this.apiUrl}/${slug}`);
  }
}