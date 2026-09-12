import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { ArticleService } from '../../../core/services/article.service'; 
import { ArticleSummary, Page } from '../../../core/models/article.model';
import { ArticleCard } from '../../../shared/components/article-card/article-card';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [ FormsModule, ArticleCard ],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss',
})
export class ArticleList implements OnInit{
  articles = signal<ArticleSummary[]>([]);
  isLoading = signal(true);

  currentPage = signal(0);
  totalPages = signal(0);
  pageSize = 9;

  searchTerm = '';
  selectedCategory = '';

  private searchTimeout: any;

  constructor(private articleService: ArticleService){}

  ngOnInit(): void{
    this.loadArticles();
  }

  loadArticles(): void{
    this.isLoading.set(true);

    this.articleService.list({
      page: this.currentPage(),
      size: this.pageSize,
      category: this.selectedCategory || undefined,
      search: this.searchTerm || undefined
    }).subscribe({
      next: (res) => {
        if(res.success){
          const page: Page<ArticleSummary> = res.data;
          this.articles.set(page.content);
          this.totalPages.set(page.totalPages);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearchChange():void {
    // Debounce simple: espera 40ms tras dejar de escribir antes de buscar
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(0);
      this.loadArticles();
    }, 400);
  }

  goToPage(page: number): void{
    if(page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadArticles();
    window.scrollTo({top: 0, behavior: 'smooth'})
  }

  get pageNumbers(): number[]{
    return Array.from({length: this.totalPages()}, (_,i) => i);
  }
}
