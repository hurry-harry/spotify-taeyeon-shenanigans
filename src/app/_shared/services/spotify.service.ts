import { Injectable } from "@angular/core";
import { UserProfileResponse } from "../models/user-profile-response.model";
import { Observable } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams, HttpParamsOptions } from "@angular/common/http";
import { SPOTIFY_ACCESS_TOKEN, SPOTIFY_MY_PROFILE, SPOTIFY_MY_TOP_ITEMS, SPOTIFY_SEARCH } from "../constants/spotify-url.constants";
import { Artist, SpotifyBaseResponse } from "../models/spotify.model";
import { SpotifyAccessTokenResponse } from "../models/spotify-access-token-response.model";
import { SearchTrackResponse } from "../models/search-response.model";

@Injectable({ providedIn: 'root' })
export class SpotifyService {
    constructor(private http: HttpClient) { }
    
    //#region Api calls
    getUserProfile(authToken: string): Observable<UserProfileResponse> {
        return this.http.get<UserProfileResponse>(SPOTIFY_MY_PROFILE, { headers: { Authorization: "Bearer " + authToken } });
    }

    getTopItems(authToken: string, timeRange: string, offset: number, topItem: string): Observable<SpotifyBaseResponse> {
        const url = `${SPOTIFY_MY_TOP_ITEMS}/${topItem}?time_range=${timeRange}&limit=50&offset=${offset}`;

        return this.http.get<SpotifyBaseResponse>(url, { headers: { Authorization: "Bearer " + authToken } });
    }

    getAccessToken(paramsRecord: Record<string, string>): Observable<SpotifyAccessTokenResponse> {
        const headers: HttpHeaders = new HttpHeaders().append('Content-Type', 'application/x-www-form-urlencoded');
        const params: URLSearchParams = new URLSearchParams(paramsRecord);

        return this.http.post<SpotifyAccessTokenResponse>(SPOTIFY_ACCESS_TOKEN, params, { headers: headers });
    }

    searchTracksBy(authToken: string, artistName: string, offset: number): Observable<SearchTrackResponse> {
        const url = `${SPOTIFY_SEARCH}?q=artist:${artistName}&type=track&limit=50&offset=${offset}`;

        return this.http.get<SearchTrackResponse>(url, { headers: { Authorization: "Bearer " + authToken } });
    }
    //#endregion
}
