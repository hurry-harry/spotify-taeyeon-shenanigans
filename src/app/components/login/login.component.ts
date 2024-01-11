import { Component } from '@angular/core';
import { SpotifyService } from '../../_shared/services/spotify.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private spotifyService: SpotifyService) { }


}
