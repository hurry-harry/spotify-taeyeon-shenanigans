import { Injectable, WritableSignal, signal } from "@angular/core";
import { SPOTIFY_REDIRECT_URI, SPOTIFY_CLIENT_ID } from "../constants/spotify-auth.constants";
import { SPOTIFY_AUTHORIZE } from "../constants/spotify-url.constants";
import { UserService } from "./user.service";
import { SpotifyService } from "./spotify.service";
import { SpotifyAccessTokenResponse } from "../models/spotify-access-token-response.model";
import { Observable, Subject, catchError, concatMap, map, of } from "rxjs";
import { UserProfileResponse } from "../models/user-profile-response.model";
import { Router } from "@angular/router";

@Injectable({ providedIn: 'root' })
export class AuthenticationService {

  constructor(
    private router: Router,
    private spotifyService: SpotifyService,
    private userService: UserService) { }

  async login(): Promise<void> {
    const scope: string = "user-top-read";

    const codeVerifier: string = this.generateRandomString(64);
    localStorage.setItem('code_verifier', codeVerifier);

    const state: string = this.generateRandomString(16);
    localStorage.setItem('state', state);

    const hashed: ArrayBuffer = await this.hashToSha256(codeVerifier);
    const codeChallenge: string = this.encodeToBase64(hashed);

    const params: Record<string, string> = {
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: state
    };

    const authUrl: URL = new URL(SPOTIFY_AUTHORIZE);
    authUrl.search = new URLSearchParams(params).toString();

    window.location.href = authUrl.toString();
  }

  getAccessToken(isRefreshingToken: boolean, code: string, codeVerifier: string): Observable<boolean> {
    const refreshToken: string = localStorage.getItem('refresh_token')!;
    let isSuccess: Subject<boolean> = new Subject<boolean>();

    let params: Record<string, string> = {};
    if (isRefreshingToken) {
      params = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID
      };
    } else if (code.length > 0 && codeVerifier.length > 0) {
      params = {
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: codeVerifier,
      };
    }

    // return this.spotifyService.getAccessToken(params)
    //   .pipe(
    //     concatMap((response: SpotifyAccessTokenResponse) => {
    //       localStorage.setItem('access_token', response.access_token);
    //       localStorage.setItem('refresh_token', response.refresh_token);
    //       this.userService.spotifyTokenDetailsSignal.set(response);

    //       return this.spotifyService.getUserProfile(this.userService.spotifyTokenDetailsSignal().access_token);
    //     })
    //   ).subscribe((response: UserProfileResponse) => {
    //     this.userService.userSignal.set(response);

    //     // this.router.navigate(['./home']);

    //     return of(true);
    //   }, error => {
    //     return of(false);
    //   });

    this.spotifyService.getAccessToken(params)
      .pipe(
        concatMap((response: SpotifyAccessTokenResponse) => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          this.userService.spotifyTokenDetailsSignal.set(response);

          console.log('concatmap');

          return this.spotifyService.getUserProfile(this.userService.spotifyTokenDetailsSignal().access_token);
        })
      ).subscribe({
        next: (response) => {
          this.userService.userSignal.set(response);
        },
        complete: () => {
          isSuccess.next(true);
        },
        error: (error) => {
          console.log('Spotify AccessTokenError', error);
          isSuccess.next(false);
        }
      });

    return isSuccess.asObservable();
  }

  _refreshAccessToken(): boolean {
    const refreshToken: string = localStorage.getItem('refresh_token')!;

    const params: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SPOTIFY_CLIENT_ID
    };

    this.spotifyService.getAccessToken(params)
      .subscribe({
        complete: () => {
          (response: SpotifyAccessTokenResponse) => {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            this.userService.spotifyTokenDetailsSignal.set(response);

            return true;
          }
        },
        error: () => {
          // TODO: open error Toast saying access refresh failed, pls login again
          return false;
        }
      });

    return false;
  }

  isLoggedIn(): Observable<boolean> {
    console.log('isloggedin check');
    let isSuccess: Subject<boolean> = new Subject<boolean>();

    if (this.userService.userSignal().id && this.userService.spotifyTokenDetailsSignal().access_token) {
      isSuccess.next(true);
      console.log('islogged in');
    }
    else if (localStorage.getItem('refresh_token')) {
      console.log('refresh token');
      return this.getAccessToken(true, "", "");
    }

    return isSuccess.asObservable();
  }

  authError(error: Error | null): void {
    if (error)
      console.log('Spotify AuthError', error);

    this.router.navigate(['']);
  }

  //#region AuthUtils
  private generateRandomString(length: number): string {
    const possible: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values: Uint8Array = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }

  private async hashToSha256(code: string): Promise<ArrayBuffer> {
    const encoder: TextEncoder = new TextEncoder();
    const data: Uint8Array = encoder.encode(code);
    return window.crypto.subtle.digest('SHA-256', data);
  }

  private encodeToBase64(hash: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  //#endregion
}