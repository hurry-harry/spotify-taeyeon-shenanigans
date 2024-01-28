import { Component, OnInit } from '@angular/core';
import { Artist, TopArtistsByTrack, Track, UserTopItems, UserTopTracks } from '../../_shared/models/user-top-items-response.model';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { concatMap, finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [NgSelectModule, CommonModule, FormsModule],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {
  isLoading: boolean = false;

  isHardMode: boolean = false;
  specificArtist!: Artist;

  timeRanges: string[] = [ "short_term", "medium_term", "long_term" ];

  topTracksMap: Map<string, Track> = new Map<string, Track>();
  topArtistsByTrackMap: Map<string, TopArtistsByTrack> = new Map<string, TopArtistsByTrack>();

  specificArtistSelection: Artist[] = [];

  constructor(
    private spotifyService: SpotifyService,
    private userService: UserService) {
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[0], 0, "tracks")
      .pipe(
        concatMap((response: UserTopItems) => {
          // handle short term 1
          this.appendTopTracks((response as UserTopTracks).items);
          
          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[0], 49, "tracks");
        }),
        concatMap((response: UserTopItems) => {
          // handle short term 2
          this.appendTopTracks((response as UserTopTracks).items);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[1], 0, "tracks");
        }),
        concatMap((response: UserTopItems) => {
          // handle medium term 1
          this.appendTopTracks((response as UserTopTracks).items);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[1], 49, "tracks");
        }),
        concatMap((response: UserTopItems) => {
          // handle medium term 2
          this.appendTopTracks((response as UserTopTracks).items);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[2], 0, "tracks");
        }),
        concatMap((response: UserTopItems) => {
          // handle long term 1
          this.appendTopTracks((response as UserTopTracks).items);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[2], 49, "tracks");
        }),
        finalize(() => {
          // 
          this.getTopArtistsByTrack();
          this.isLoading = false;
        })
      ). subscribe((response: UserTopItems) => {
        // handle long term 2
        this.appendTopTracks((response as UserTopTracks).items);
      });
  }

  appendTopTracks(topTracks: Track[]): void {
    topTracks.forEach((track: Track) => {
      if (!this.topTracksMap.has(track.id)) {
        this.topTracksMap.set(track.id, track);
      }
    });
  }

  getTopArtistsByTrack(): void {
    this.topTracksMap.forEach((track: Track) => {
      if (this.topArtistsByTrackMap.has(track.artists[0].id)) {
        this.topArtistsByTrackMap.get(track.artists[0].id)!.count++;
      } else {
        this.topArtistsByTrackMap.set(track.artists[0].id, { artist: track.artists[0], count: 1 });
      }
    });

    this.topArtistsByTrackMap.forEach((artist: TopArtistsByTrack) => {
      if (artist.count >= 15) {
        this.specificArtistSelection.push(artist.artist);
      }
    });
  }

  play(): void {

  }
}
