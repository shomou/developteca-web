import { Component, OnInit, signal } from '@angular/core';
import { ArticleService } from '../../../core/services/article.service';
import { ArticleSummary } from '../../../core/models/article.model';
import { ArticleCard } from '../../../shared/components/article-card/article-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ArticleCard, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  featuredArticles = signal<ArticleSummary[]>([]);
  latestArticles = signal<ArticleSummary[]>([]);
  isLoading = signal(true);

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    // Destacados: los 3 con mejor rating
    this.articleService.list({ page: 0, size: 3 }).subscribe({
      next: (res) => {
        if (res.success) this.featuredArticles.set(res.data.content);
      }
    });

    // Últimos artículos
    this.articleService.list({ page: 0, size: 6 }).subscribe({
      next: (res) => {
        if (res.success) this.latestArticles.set(res.data.content);
        this.isLoading.set(false);
      }
    });
  }
}