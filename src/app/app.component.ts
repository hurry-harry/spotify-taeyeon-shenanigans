import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { UserProfileResponse } from './_shared/models/user-profile-response.model';
import { SpotifyService } from './_shared/services/spotify.service';
import { UserService } from './_shared/services/user.service';
import { ToastContainerComponent } from './_shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavBarComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title: string = "spotify-taeyeon-shenanigans";

  constructor(
    private spotifyService: SpotifyService,
    private userService: UserService) {
    // effect(() => {
    //   this.userService.spotifyTokenDetailsSignal();

    //   this.spotifyService.getUserProfile(this.userService.spotifyTokenDetailsSignal().access_token).subscribe((response: UserProfileResponse) => {
    //     this.userService.userSignal.set(response);
    //   });
    // }, { allowSignalWrites: false });
  }
}
