import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from './_shared/services/user.service';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title: string = "spotify-taeyeon-shenanigans";
  authToken: string = "";
  urlRawParams: string = "";
  urlParams: string = "";

  constructor(
    private router: Router,
    private userService: UserService) { }


  ngOnInit(): void {
    const url = window.location.href;
    if (url.includes('?')) {
      this.checkUrl(url);
    }
  }

  checkUrl(url: string): void {
    this.urlRawParams = url.split('?')[1];
    this.urlParams = this.urlRawParams.split('#')[0];
    if (this.urlParams == 'authorized=true') {
      this.authToken = url.split('#')[1];
      sessionStorage.setItem('authToken', this.authToken);
      this.userService.authTokenSignal.set(this.authToken);
      this.router.navigate(['./home']);
    }
  }
}
