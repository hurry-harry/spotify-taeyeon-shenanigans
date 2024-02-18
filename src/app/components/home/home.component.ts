import { Component, OnInit } from '@angular/core';
import { UserService } from '../../_shared/services/user.service';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserProfileResponse } from '../../_shared/models/user-profile-response.model';
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
    }

  ngOnInit(): void {
    // const isLoggedIn = this.authService.isLoggedIn();
    console.log('home init');
    this.authService.isLoggedIn()
      .subscribe({
        next: (response: boolean) => {
          console.log('home isloggedin next', response);
        },
        complete: () => {
          console.log('home isloggedin complete');
        },
        error: (error) => {
          console.log('home isloggedin error', error);
          this.authService.authError(error);
        }
      });
  }
}
