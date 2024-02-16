import { Injectable } from "@angular/core";
import { SPOTIFY_REDIRECT_URI, SPOTIFY_CLIENT_ID } from "../constants/spotify-auth.constants";
import { SPOTIFY_AUTHORIZE } from "../constants/spotify-url.constants";
import { UserService } from "./user.service";
import { SpotifyService } from "./spotify.service";
import { SpotifyAccessTokenResponse } from "../models/spotify-access-token-response.model";

@Injectable({ providedIn: 'root' })
export class AuthenticationService {

  constructor(
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

  refreshAccessToken(): boolean {
    const refreshToken: string = this.userService.spotifyTokenDetailsSignal().refresh_token;

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

  isLoggedIn(): boolean {
    if (this.userService.userSignal().id && this.userService.spotifyTokenDetailsSignal().access_token)
      return true;
    else if (localStorage.getItem('refresh_token'))
      return this.refreshAccessToken();

    return false
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