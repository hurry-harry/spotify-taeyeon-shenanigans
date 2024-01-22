import { HttpClient } from "@angular/common/http";
import { UserProfileResponse } from "../models/user-profile-response.model";
import { Injectable, WritableSignal, signal } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class UserService {
  private authToken: string = "";
  private user: UserProfileResponse = {} as UserProfileResponse;
  
  userSignal: WritableSignal<UserProfileResponse> = signal(this.user);

  constructor(
    private http: HttpClient) { }

  getAuthToken(): string {
    return this.authToken;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  getUser(): UserProfileResponse {
    return this.user;
  }

  setUser(user: UserProfileResponse): void {
    this.user = user;
  }
}