import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleSummary } from '../../../core/models/article.model';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './article-card.html',
  styleUrl: './article-card.scss',
})
export class ArticleCard {
  @Input({ required: true }) article!: ArticleSummary;
}
