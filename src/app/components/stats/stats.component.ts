import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { Album, Artist, Item, TopAlbumItem, Track, ArtistsResponse, TracksResponse, SpotifyBaseResponse } from '../../_shared/models/spotify.model';
import { concatMap, finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SingleEpPipe } from '../../_shared/pipes/single-ep.pipe';
import { LoadingSpinnerComponent } from '../../_shared/components/loading-spinner/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [ CommonModule, FormsModule, SingleEpPipe, LoadingSpinnerComponent ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  isLoading: boolean = true;
  userTopItems!: SpotifyBaseResponse;
  topTracks: Track[] = [];
  topArtists: Artist[] = [];
  topAlbums: TopAlbumItem[] = [];

  timeRange: string;
  offset: number;
  topItemMode: string;

  timeRangeMap: Map<string, string> = new Map<string, string>();
  timeRangeSelection: string[] = [ "4 weeks", "6 months", "Lifetime" ];

  topItemModeMap: Map<string, string> = new Map<string, string>();
  topItemModeSelection: string[] = [ "Artists", "Albums", "Tracks" ];

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
    this.topItemModeMap.set("Albums", "tracks");
    this.topItemModeMap.set("Tracks", "tracks");
  }

  ngOnInit(): void {
    this.updateTopItems();
  }

  appendTopItems(response: SpotifyBaseResponse, isRemoveDuplicateFirstIndex: boolean = false): void {
    if (this.topItemMode == this.topItemModeSelection[0]) {
      if (isRemoveDuplicateFirstIndex)
        (response as ArtistsResponse).items.shift();

      this.topArtists.push(...(response as ArtistsResponse).items);
    } else {
      if (isRemoveDuplicateFirstIndex)
        (response as TracksResponse).items.shift();

      this.topTracks.push(...(response as TracksResponse).items);
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
    this.topAlbums = [];

    this.spotifyService.getTopItems(this.userService.spotifyTokenDetailsSignal().access_token, this.timeRangeMap.get(this.timeRange) || "medium_term", 0, this.topItemModeMap.get(this.topItemMode) || "tracks")
      .pipe( 
        concatMap((response: SpotifyBaseResponse) => {
          this.appendTopItems(response);

          return this.spotifyService.getTopItems(this.userService.spotifyTokenDetailsSignal().access_token, this.timeRangeMap.get(this.timeRange) || "medium_term", 49, this.topItemModeMap.get(this.topItemMode) || "tracks");
      }),
      finalize(() => {
        if (this.topItemMode === "Albums") {
          this.calculateTopAlbums();
        }

        this.isLoading = false;
      })
    ).subscribe((response: SpotifyBaseResponse) => {
      this.appendTopItems(response, true);
    });
  }

  changeItemMode(mode: string): void {
    if (this.topItemMode != mode) {
      this.topItemMode = mode;
      this.updateTopItems();
    }
  }

  openItemUrl(item: Item): void {
    window.open(item.external_urls.spotify, "_blank");
  }

  openAlbumUrl(album: Album): void {
    window.open(album.external_urls.spotify, "_blank");
  }

  calculateTopAlbums(): void {
    this.topTracks.forEach((track: Track) => {
      const albumIndex = this.topAlbums.findIndex(x => x.album.id === track.album.id);
      if (albumIndex === -1) {
        this.topAlbums.push({ album: track.album, count: 1 });
      } else {
        this.topAlbums[albumIndex].count++;
      }
    });

    this.topAlbums.sort((a, b) => b.count - a.count);
  }
}
