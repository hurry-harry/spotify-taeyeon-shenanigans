import { Injectable } from "@angular/core";
import { UserProfileResponse } from "../models/user-profile-response.model";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { SPOTIFY_MY_PROFILE } from "../constants/spotify-url.constants";

@Injectable({ providedIn: 'root' })
export class SpotifyService {
    constructor(private http: HttpClient) { }
    
    getUserProfile(authToken: string): Observable<UserProfileResponse> {
        return this.http.get<UserProfileResponse>(SPOTIFY_MY_PROFILE, { headers: { Authorization: 'Bearer ' + authToken } });
    }
}
