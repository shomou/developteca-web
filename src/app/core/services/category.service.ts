import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Category } from '../models/article.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/categories';

  constructor(private http: HttpClient) {}

  list(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl);
  }
}