import { Injectable } from "@angular/core";
import { CanActivate, CanActivateChild, CanLoad, Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad  {
  constructor(private router: Router) { }

  canActivate(): boolean {
    return this.checkAuth();
  }

  canActivateChild(): boolean {
    return this.checkAuth();
  }

  canLoad(): boolean {
    return this.checkAuth();
  }

  private checkAuth(): boolean {
    if (localStorage.getItem('access_token')) {
      return true;
    } else {
      // Redirect to the login page if the user is not authenticated
      this.router.navigate(['']);
      return false;
    }
  }
}
