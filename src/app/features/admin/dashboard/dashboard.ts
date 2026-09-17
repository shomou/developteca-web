import { Component, OnInit, signal } from '@angular/core';
import { StatsService } from '../../../core/services/stats.service';
import { DashboardStats } from '../../../core/models/dashboard-stats.model';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  stats = signal<DashboardStats | null> (null);
  isLoading = signal(true);

  constructor(private statsService: StatsService){}

  ngOnInit(): void{
    this.statsService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}

