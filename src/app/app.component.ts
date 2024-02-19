import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { SpotifyService } from './_shared/services/spotify.service';
import { UserService } from './_shared/services/user.service';
import { ToastContainerComponent } from './_shared/components/toast-container/toast-container.component';
import { SharedModule } from './_shared/shared.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavBarComponent, ToastContainerComponent, SharedModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title: string = "spotify-taeyeon-shenanigans";

  constructor() { }
}
