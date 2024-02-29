/* eslint-disable @typescript-eslint/no-explicit-any */

import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, catchError, of, throwError } from "rxjs";
import { SPOTIFY_ACCESS_TOKEN } from "../constants/spotify-url.constants";
import { ToastService } from "../services/toast.service";
import { AuthenticationService } from "../services/authentication.service";

@Injectable()
export class SpotifyAuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private toastService: ToastService) { }

  private handleAuthError(err: HttpErrorResponse, req: HttpRequest<any>): Observable<any> {
    if (err.status === 401 && req.url === SPOTIFY_ACCESS_TOKEN) {
      // token refresh failed, display toaster 'login expired, pls login', navigate to Login
      this.toastService.show({ message: "Login expired, please login again.", classname: "bg-danger text-light", delay: 15000 });
      this.router.navigate(['./login']);

    } else if (err.status === 401 && (this.router.url !== '/login' && this.router.url !== '/callback')) {
      // try to refresh token
      this.authService.isLoggedIn()
        .subscribe({
          next: (response: boolean) => {
            if (response) {
              const url = window.location.pathname;
              this.router.navigateByUrl('./loading', { skipLocationChange: true }).then(() => {
                this.router.navigateByUrl(url);
              }); 
            }
            else 
              this.authService.authError();
          },
          complete: () => { },
          error: () => {
            this.authService.authError();
          }
        });

      return of(err.message);
    } else if (err.status === 401 && this.router.url === '/callback') {
      // error in login, display toaster 'error, retry login', navigate to Login
      this.toastService.show({ message: "Login error, please re-try.", classname: "bg-danger text-light", delay: 15000 });
      this.router.navigate(['./login']);
    }

    return throwError(() => err);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError(x => this.handleAuthError(x, req)));
  }
}