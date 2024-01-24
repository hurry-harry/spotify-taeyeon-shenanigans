import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { Artist, Track, UserTopArtists, UserTopItems, UserTopTracks } from '../../_shared/models/user-top-items-response.model';
import { concatMap, finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  isLoading: boolean = true;
  userTopItems!: UserTopItems;
  topTracks: Track[] = [];
  topArtists: Artist[] = [];

  timeRange: string;
  offset: number;
  topItemMode: string;

  timeRangeMap: Map<string, string> = new Map<string, string>();
  timeRangeSelection: string[] = [ "4 weeks", "6 months", "Lifetime" ];

  topItemModeMap: Map<string, string> = new Map<string, string>();
  topItemModeSelection: string[] = [ "Tracks", "Artists" ];

  constructor(
    private spotifyService: SpotifyService,
    private userService: UserService) {

    this.offset = 0;
    this.timeRange = this.timeRangeSelection[0];
    this.timeRangeMap.set("4 weeks", "short_term");
    this.timeRangeMap.set("6 months", "medium_term");
    this.timeRangeMap.set("Lifetime", "long_term");

    this.topItemMode = this.topItemModeSelection[0];
    this.topItemModeMap.set("Artists", "artists");
    this.topItemModeMap.set("Tracks", "tracks");
  }

  ngOnInit(): void {
    this.updateTopItems();
  }

  appendTopItems(response: UserTopItems): void {
    if (this.topItemMode == this.topItemModeSelection[0]) {
      this.topTracks.push(...(response as UserTopTracks).items);
    } else {
      this.topArtists.push(...(response as UserTopArtists).items);
    }
  }

  changeTimeRange(event: Event): void {
    this.timeRange = (event.target as HTMLOptionElement).value;
    this.updateTopItems();
  }

  updateTopItems(): void {
    this.isLoading = true;
    this.topTracks = [];
    this.topArtists = [];

    this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRangeMap.get(this.timeRange) || "medium_term", 0, this.topItemModeMap.get(this.topItemMode) || "tracks")
      .pipe( 
        concatMap((response: UserTopItems) => {
          this.appendTopItems(response);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRangeMap.get(this.timeRange) || "medium_term", 49, this.topItemModeMap.get(this.topItemMode) || "tracks");
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response: UserTopItems) => {
      this.appendTopItems(response);
    });
  }

  changeItemMode(mode: string): void {
    if (this.topItemMode != mode) {
      console.log("new mode", mode);
      this.topItemMode = mode;
      this.updateTopItems();
    }
  }
}
