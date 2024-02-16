import { UserProfileResponse } from "../models/user-profile-response.model";
import { Injectable, OnInit, WritableSignal, effect, signal } from "@angular/core";
import { SpotifyAccessTokenResponse } from "../models/spotify-access-token-response.model";
import { SpotifyService } from "./spotify.service";

@Injectable({ providedIn: 'root' })
export class UserService implements OnInit {
  private user: UserProfileResponse = { } as UserProfileResponse;
  private spotifyTokenDetails: SpotifyAccessTokenResponse = { } as SpotifyAccessTokenResponse;
  
  userSignal: WritableSignal<UserProfileResponse> = signal(this.user);
  spotifyTokenDetailsSignal: WritableSignal<SpotifyAccessTokenResponse> = signal(this.spotifyTokenDetails);

  constructor(
    private spotifyService: SpotifyService
  ) { }

  ngOnInit(): void {

    effect(() => {
      console.log('userservice pre', this.spotifyTokenDetails);
      console.log('userservice priv pre', this.spotifyTokenDetails);
      const temp = this.spotifyTokenDetailsSignal();
      console.log('userservice temp post', temp);
      console.log('userservice post', this.spotifyTokenDetails);
      console.log('userservice priv post', this.spotifyTokenDetails);

      this.spotifyService.getUserProfile(this.spotifyTokenDetailsSignal().access_token).subscribe((response: UserProfileResponse) => {
        console.log('in effect');
        this.userSignal.set(response);
      });
    }, { allowSignalWrites: false });
  }

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
}