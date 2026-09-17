import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import {
  ArticleCreateRequest,
  ArticleDetail,
  ArticleStatus,
  ArticleSummary,
  ArticleUpdateRequest,
  ArticleImage,
  Page,
} from '../models/article.model';

export interface ArticleListParams {
  page?: number;
  size?: number;
  category?: string;
  search?: string;
}

export interface ArticleManageParams {
  page?: number;
  size?: number;
  status?: ArticleStatus;
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

  listForManagement(
    params: ArticleManageParams = {},
  ): Observable<ApiResponse<Page<ArticleSummary>>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<ApiResponse<Page<ArticleSummary>>>(`${this.apiUrl}/manage`, {
      params: httpParams,
    });
  }

  create(request: ArticleCreateRequest): Observable<ApiResponse<ArticleDetail>> {
    return this.http.post<ApiResponse<ArticleDetail>>(this.apiUrl, request);
  }

  update(id: number, request: ArticleUpdateRequest): Observable<ApiResponse<ArticleDetail>> {
    return this.http.put<ApiResponse<ArticleDetail>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadImage(
    articleId: number,
    file: File,
    altText: string,
    isFeatured: boolean,
  ): Observable<ApiResponse<ArticleImage>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', altText);
    formData.append('isFeatured', String(isFeatured));

    return this.http.post<ApiResponse<ArticleImage>>(
      `${this.apiUrl}/${articleId}/images`,
      formData,
    );
  }

  deleteImage(articleId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${articleId}/images/${imageId}`);
  }

  getForEdit(id: number): Observable<ApiResponse<ArticleDetail>> {
    return this.http.get<ApiResponse<ArticleDetail>>(`${this.apiUrl}/manage/${id}`);
  }
}
