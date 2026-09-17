import { Component, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RatingService } from '../../../core/services/rating.service';

@Component({
  selector: 'app-article-rating',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './article-rating.html',
  styleUrl: './article-rating.scss',
})
export class ArticleRating implements OnInit {
  @Input({ required: true }) articleId!: number;
  @Input({ required: true }) initialAverage!: number;

  readonly stars = [1, 2, 3, 4, 5];

  average = signal(0);
  myRating = signal<number | null>(null);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    public authService: AuthService,
    private ratingService: RatingService
  ) {}

  ngOnInit(): void {
    this.average.set(this.initialAverage);

    if (this.authService.isAuthenticated()) {
      this.ratingService.getMine(this.articleId).subscribe({
        next: (res) => {
          this.average.set(res.data.averageRating);
          this.myRating.set(res.data.myRating);
        },
        error: () => this.average.set(this.initialAverage)
      });
    }
  }

  rate(value: number): void{
    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.ratingService.rate(this.articleId, value).subscribe({
      next:(res) =>{
        this.average.set(res.data.averageRating);
        this.myRating.set(res.data.myRating);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set('Error occurred while saving rating.');
      }
    });
  }
}

