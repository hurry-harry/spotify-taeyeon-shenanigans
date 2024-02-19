import { Injectable } from "@angular/core";
import { UserProfileResponse } from "../models/user-profile-response.model";
import { Observable } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams, HttpParamsOptions } from "@angular/common/http";
import { SPOTIFY_ACCESS_TOKEN, SPOTIFY_MY_PROFILE, SPOTIFY_MY_TOP_ITEMS } from "../constants/spotify-url.constants";
import { Artist, UserTopItems } from "../models/user-top-items-response.model";
import { SpotifyAccessTokenResponse } from "../models/spotify-access-token-response.model";

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

    getAccessToken(paramsRecord: Record<string, string>): Observable<SpotifyAccessTokenResponse> {
        const headers: HttpHeaders = new HttpHeaders().append('Content-Type', 'application/x-www-form-urlencoded');
        const params: URLSearchParams = new URLSearchParams(paramsRecord);

        return this.http.post<SpotifyAccessTokenResponse>(SPOTIFY_ACCESS_TOKEN, params, { headers: headers });
    }
    //#endregion

    //#region Helpers
    artistNamesToString(artists: Artist[]): string {
        let result: string = "";
    
        artists.forEach((artist: Artist) => {
          result = result.concat(artist.name, " ");
        });
    
        return result.toLocaleLowerCase();
    }

    buildTrackIdentifier(trackName: string, artistsStr: string): string {
        return trackName.concat(artistsStr).toLocaleLowerCase();
    }

    isIncludesFilter(filterTerm: string, trackName: string, artistNames: string): boolean {
        const sanitizedTrackName: string = trackName.toLocaleLowerCase().normalizeString();
        const sanitizedArtistNames: string = artistNames.toLocaleLowerCase().normalizeString();
        const sanitizedFilterTerm: string = filterTerm.toLocaleLowerCase().normalizeString();

        if (sanitizedTrackName.includes(sanitizedFilterTerm) || sanitizedArtistNames.includes(sanitizedFilterTerm))
            return true;

        return false;
    }
    //#endregion
}
