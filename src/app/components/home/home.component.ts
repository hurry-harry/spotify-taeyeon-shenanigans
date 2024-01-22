import { Component, OnInit } from '@angular/core';
import { UserService } from '../../_shared/services/user.service';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserProfileResponse } from '../../_shared/models/user-profile-response.model';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { HomeCardComponent } from '../home-card/home-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ NavBarComponent, HomeCardComponent ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  constructor(
    private spotifyService: SpotifyService,
    private userService: UserService) {}

  ngOnInit(): void {
    this.spotifyService.getUserProfile(this.userService.getAuthToken()).subscribe((response: UserProfileResponse) => {
      this.userService.userSignal.set(response);
      this.userService.setUser(response);
    });
  }
}
