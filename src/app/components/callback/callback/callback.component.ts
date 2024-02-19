import { Component, OnInit } from '@angular/core';
import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } from '../../../_shared/constants/spotify-auth.constants';
import { SPOTIFY_ACCESS_TOKEN } from '../../../_shared/constants/spotify-url.constants';
import { SpotifyService } from '../../../_shared/services/spotify.service';
import { SpotifyAccessTokenResponse } from '../../../_shared/models/spotify-access-token-response.model';
import { UserService } from '../../../_shared/services/user.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../_shared/services/toast.service';
import { concatMap } from 'rxjs';
import { UserProfileResponse } from '../../../_shared/models/user-profile-response.model';
import { AuthenticationService } from '../../../_shared/services/authentication.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private spotifyService: SpotifyService,
    private toastService: ToastService,
    private userService: UserService) { }

  ngOnInit(): void {
    const urlParams: URLSearchParams = new URLSearchParams(window.location.search);
    const codeVerifier = localStorage.getItem('code_verifier');

    let state: string | null = urlParams.get('state');
    let code: string | null = urlParams.get('code');
    let error: string | null = urlParams.get('error');

    const isStateValid: boolean = (state === localStorage.getItem('state'));

    if (code && codeVerifier && isStateValid) {
      this.authService.getAccessToken(false, code, codeVerifier)
        .subscribe((response: boolean) => {
          this.router.navigate(['./home']);
        });
    } else if (error || !codeVerifier) {
      // show a toast saying you rejected permissions or an error occurred during, try again then go back to login
      this.toastService.show({ message: "Login error, please re-try.", classname: "bg-danger text-light", delay: 15000 });
      this.router.navigate(['./login']);
    }
  }

  _getAccessToken(code: string, codeVerifier: string): void {
    const params: Record<string, string> = {
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      code_verifier: codeVerifier,
    };

    this.spotifyService.getAccessToken(params)
      .pipe(
        concatMap((response: SpotifyAccessTokenResponse) => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          this.userService.spotifyTokenDetailsSignal.set(response);
          
          return this.spotifyService.getUserProfile(this.userService.spotifyTokenDetailsSignal().access_token);
        })
      ).subscribe((response: UserProfileResponse) => {
        this.userService.userSignal.set(response);
        this.router.navigate(['./home']);
      });
  }
}
