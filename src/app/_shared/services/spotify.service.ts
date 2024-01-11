import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class SpotifyService {
    constructor(
        private http: HttpClient) { }

    login(): Observable<any> {
        console.log('login triggered');
        return this.http.post(`${environment.apiUrl}/login`, {});
    }
}
