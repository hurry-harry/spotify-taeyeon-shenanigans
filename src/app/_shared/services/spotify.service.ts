import { Injectable } from "@angular/core";
import { UserProfileResponse } from "../models/user-profile-response.model";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { SPOTIFY_MY_PROFILE, SPOTIFY_MY_TOP_ITEMS } from "../constants/spotify-url.constants";
import { Artist, UserTopItems } from "../models/user-top-items-response.model";

@Injectable({ providedIn: 'root' })
export class SpotifyService {
    constructor(private http: HttpClient) { }
    
    //#region Api calls
    getUserProfile(authToken: string): Observable<UserProfileResponse> {
        return this.http.get<UserProfileResponse>(SPOTIFY_MY_PROFILE, { headers: { Authorization: "Bearer " + authToken } });
    }

    getTopItems(authToken: string, timeRange: string, offset: number, topItem: string): Observable<UserTopItems> {
        const url = `${SPOTIFY_MY_TOP_ITEMS}/${topItem}?time_range=${timeRange}&limit=50&offset=${offset}`;

        return this.http.get<UserTopItems>(url, { headers: { Authorization: "Bearer " + authToken } })
    }
    //#endregion

    //#region Helpers
    artistsToStr(artists: Artist[]): string {
        let result: string = "";
    
        artists.forEach((artist: Artist) => {
          result = result.concat(artist.name, " ");
        });
    
        return result.toLowerCase();
    }

    buildTrackIdentifier(trackName: string, artistsStr: string): string {
        return trackName.concat(artistsStr).toLowerCase();
    }
    //#endregion
}
