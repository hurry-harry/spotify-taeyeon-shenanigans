import { Component, effect } from '@angular/core';
import { UserService } from '../../_shared/services/user.service';
import { UserProfileResponse } from '../../_shared/models/user-profile-response.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  protected user: UserProfileResponse = {} as UserProfileResponse;

  constructor(
    private router: Router,
    private userService: UserService) {
    
    effect(() => {
      this.user = this.userService.userSignal();
    });
  }

  goToHome(): void {
    this.router.navigate(['./home']);
  }
}
