import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArticleService } from '../../../core/services/article.service';
import { ArticleStatus, ArticleSummary } from '../../../core/models/article.model';

@Component({
  selector: 'app-article-manage',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './article-manage.html',
  styleUrl: './article-manage.scss',
})
export class ArticleManage implements OnInit {
  articles = signal<ArticleSummary[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  currentPage = signal(0);
  totalPages = signal(0);
  pageSize = 10;

  selectedStatus = '';

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.articleService.listForManagement({
      page: this.currentPage(),
      size: this.pageSize,
      status: this.selectedStatus ? (this.selectedStatus as ArticleStatus) : undefined
    }).subscribe({
      next: (res) => {
        this.articles.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onStatusChange(): void {
    this.currentPage.set(0);
    this.loadArticles();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadArticles();
  }

  onDelete(article: ArticleSummary): void {
    const confirmed = confirm(
      `¿Eliminar "${article.title}"?\n\nSe borrarán también sus imágenes del servidor. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    this.articleService.delete(article.id).subscribe({
      next: () => this.loadArticles(),
      error: (err) => this.errorMessage.set(err.error?.message ?? 'No se pudo eliminar el artículo')
    });
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }
}