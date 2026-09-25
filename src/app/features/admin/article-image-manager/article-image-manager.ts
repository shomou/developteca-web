import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../core/services/article.service';
import { ArticleImage } from '../../../core/models/article.model';
import { environment } from '../../../../environments/environment';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-article-image-manager',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './article-image-manager.html',
  styleUrl: './article-image-manager.scss',
})
export class ArticleImageManager implements OnInit {
  @Input({ required: true }) articleId!: number;

  readonly apiBase = environment.serverUrl;

  images = signal<ArticleImage[]>([]);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);

  selectedFile: File | null = null;
  altText = '';
  isFeatured = false;

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.loadImages();
  }

  loadImages(): void {
    this.articleService.getForEdit(this.articleId).subscribe({
      next: (res) => this.images.set(res.data.images)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage.set(null);

    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.errorMessage.set('Formato no permitido. Usa JPG, PNG o WebP.');
      this.selectedFile = null;
      input.value = '';
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.errorMessage.set('La imagen supera los 5MB.');
      this.selectedFile = null;
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  onUpload(fileInput: HTMLInputElement): void {
    if (!this.selectedFile) return;

    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.articleService
      .uploadImage(this.articleId, this.selectedFile, this.altText, this.isFeatured)
      .subscribe({
        next: () => {
          this.selectedFile = null;
          this.altText = '';
          this.isFeatured = false;
          fileInput.value = '';
          this.isUploading.set(false);
          this.loadImages();
        },
        error: (err) => {
          this.isUploading.set(false);
          this.errorMessage.set(err.error?.message ?? 'No se pudo subir la imagen');
        }
      });
  }

  onDelete(image: ArticleImage): void {
    if (!confirm('¿Eliminar esta imagen? Se borra del servidor.')) return;

    this.articleService.deleteImage(this.articleId, image.id).subscribe({
      next: () => this.loadImages(),
      error: (err) => this.errorMessage.set(err.error?.message ?? 'No se pudo eliminar la imagen')
    });
  }
}