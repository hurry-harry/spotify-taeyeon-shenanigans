import { Component, Input } from '@angular/core';
import { HomeCard } from '../../_shared/models/home-card.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-card',
  standalone: true,
  imports: [],
  templateUrl: './home-card.component.html',
  styleUrl: './home-card.component.scss'
})
export class HomeCardComponent {
  @Input() card!: HomeCard;

  constructor(private router: Router) {}

  navigateTo(): void {
    this.router.navigate([this.card.url]);
  }
}
