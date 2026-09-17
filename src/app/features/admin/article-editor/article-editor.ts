import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleService } from '../../../core/services/article.service';
import { CategoryService } from '../../../core/services/category.service';
import { ArticleStatus, Category } from '../../../core/models/article.model';
import { ArticleImageManager } from '../article-image-manager/article-image-manager';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [FormsModule, RouterLink, ArticleImageManager],
  templateUrl: './article-editor.html',
  styleUrl: './article-editor.scss',
})
export class ArticleEditor implements OnInit {
  articleId = signal<number | null>(null);
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  title = '';
  content = '';
  categoryId: number | null = null;
  status: ArticleStatus = 'DRAFT';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (res) => this.categories.set(res.data)
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.articleId.set(Number(idParam));
      this.loadArticle(Number(idParam));
    }
  }

  isEditMode(): boolean {
    return this.articleId() !== null;
  }

  private loadArticle(id: number): void {
    this.isLoading.set(true);
    this.articleService.getForEdit(id).subscribe({
      next: (res) => {
        const article = res.data;
        this.title = article.title;
        this.content = article.content;
        this.categoryId = article.category.id;
        this.status = article.status;
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'No se pudo cargar el artículo');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.categoryId === null) {
      this.errorMessage.set('Selecciona una categoría');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const payload = {
      title: this.title,
      content: this.content,
      categoryId: this.categoryId,
      status: this.status
    };

    const request$ = this.isEditMode()
      ? this.articleService.update(this.articleId()!, payload)
      : this.articleService.create(payload);

    request$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (this.isEditMode()) {
          this.router.navigate(['/admin/articulos']);
        } else {
          this.router.navigate(['/admin/articulos/editar', res.data.id]);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo guardar el artículo');
      }
    });
  }
}