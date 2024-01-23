import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { UserTopItems } from '../../_shared/models/user-top-items-response.model';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  topItems!: UserTopItems;

  timeRange: string;
  offset: number;
  topItemMode: string;

  TimeRangeMap = {
    "4 weeks": "short_term",
    "6 weeks": "medium_term",
    Lifetime: "long_term"
  }

  TopItemModeMap = {
    Artists: "artists",
    Tracks: "tracks"
  }

  constructor(
    private spotifyService: SpotifyService,
    private userService: UserService) {
      this.timeRange = this.TimeRangeMap['4 weeks'];
      this.offset = 0;
      this.topItemMode = this.TopItemModeMap.Tracks;
  }

  ngOnInit(): void {
    this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRange, this.offset, this.topItemMode)
      .subscribe((response) => {
        this.topItems = response;
        console.log('total', this.topItems.total);
        console.log('first', this.topItems.items[0].name);
      });
  }
}
