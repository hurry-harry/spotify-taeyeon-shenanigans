import { UserProfileResponse } from "../models/user-profile-response.model";
import { Injectable, WritableSignal, signal } from "@angular/core";
import { SpotifyAccessTokenResponse } from "../models/spotify-access-token-response.model";

@Injectable({ providedIn: 'root' })
export class UserService {
  private user: UserProfileResponse = { } as UserProfileResponse;
  private spotifyTokenDetails: SpotifyAccessTokenResponse = { } as SpotifyAccessTokenResponse;
  
  userSignal: WritableSignal<UserProfileResponse> = signal(this.user);
  spotifyTokenDetailsSignal: WritableSignal<SpotifyAccessTokenResponse> = signal(this.spotifyTokenDetails);

  constructor() { }

  getUser(): UserProfileResponse {
    return this.user;
  }

  setUser(user: UserProfileResponse): void {
    this.user = user;
  }

  getSpotifyTokenDetails(): SpotifyAccessTokenResponse {
    return this.spotifyTokenDetails;
  }

  setSpotifyTokenDetails(value: SpotifyAccessTokenResponse): void {
    this.spotifyTokenDetails = value;
  }

  getUserDailyStateId(): string {
    return `dailyHeardleState:${this.userSignal().id}`;
  }
}