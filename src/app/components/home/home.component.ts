import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { HomeCardComponent } from '../home-card/home-card.component';
import { HomeCard } from '../../_shared/models/home-card.model';
import { AuthenticationService } from '../../_shared/services/authentication.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ NavBarComponent, HomeCardComponent ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  playCard: HomeCard;
  statsCard: HomeCard;
  dailyCard: HomeCard;

  constructor(private authService: AuthenticationService) {
      this.playCard = {
        imageSource: "/assets/headphones.png",
        title: "Play Heardle",
        description: "Test your knowledge on how well you know your fave songs!",
        url: "play"
      };

      this.statsCard = {
        imageSource: "/assets/medal.png",
        title: "View Stats",
        description: "Take a look at your most played songs or artists!",
        url: "stats"
      };

      this.dailyCard = {
        imageSource: "/assets/clock.png",
        title: "Daily Heardle",
        description: "Play the daily Taeyeon Heardle!",
        url: "daily"
      }
    }

  ngOnInit(): void {
    // const isLoggedIn = this.authService.isLoggedIn();
    this.authService.isLoggedIn()
      .subscribe({
        next: () => { },
        complete: () => { },
        error: () => {
          this.authService.authError();
        }
      });
  }
}
