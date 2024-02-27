import { Component } from '@angular/core';
import { AuthenticationService } from '../../_shared/services/authentication.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private authService: AuthenticationService) { }

  login(): void {
    this.authService.login();
  }
}
