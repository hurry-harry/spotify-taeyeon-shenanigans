import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title: string = 'spotify-taeyeon-shenanigans';
  authToken: string = "";
  urlRawParams: string = "";
  urlParams: string = "";
  
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) protected platformId: object
  ) {}


  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const url = window.location.href;
      if (url.includes('?')) {
        this.checkUrl(url);
      }
    }
  }

  checkUrl(url: string): void {
    console.log("checkign url");
    this.urlRawParams = url.split('?')[1];
    this.urlParams = this.urlRawParams.split('#')[0];
    if (this.urlParams == 'authorized=true') {
      this.authToken = url.split('#')[1];
      sessionStorage.setItem('token', this.authToken);
      this.router.navigate(['./home']);
    }
  }
}
