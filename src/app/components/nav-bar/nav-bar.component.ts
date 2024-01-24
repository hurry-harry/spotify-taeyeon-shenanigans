import { Component, effect } from '@angular/core';
import { UserService } from '../../_shared/services/user.service';
import { UserProfileResponse } from '../../_shared/models/user-profile-response.model';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  protected user: UserProfileResponse = {} as UserProfileResponse;

  constructor(private userService: UserService) {
    effect(() => {
      this.user = this.userService.userSignal();
    });
  }
}
