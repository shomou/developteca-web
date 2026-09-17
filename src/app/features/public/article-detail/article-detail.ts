import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArticleService } from '../../../core/services/article.service';
import { ArticleDetail as ArticleDetailModel } from '../../../core/models/article.model';
import { CommentSection } from '../../../shared/components/comment-section/comment-section';
import { ArticleRating } from '../../../shared/components/article-rating/article-rating';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink, CommentSection, ArticleRating, MarkdownPipe],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss',
})
export class ArticleDetail implements OnInit {
  article = signal<ArticleDetailModel | null>(null);
  isLoading = signal(true);
  notFound = signal(false);

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService
  ){}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug){
        this.loadArticle(slug)
      } 

    });

  }

  private loadArticle(slug: string): void {
    this.isLoading.set(true);
    this.notFound.set(false);

    this.articleService.getBySlug(slug).subscribe({
      next: (res) => {
        this.article.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      }
    });
  }
  
}
