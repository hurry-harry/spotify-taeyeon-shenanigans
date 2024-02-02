import { ChangeDetectorRef, Component, NgZone, OnInit, WritableSignal, signal } from '@angular/core';
import { Artist, TopArtistsByTrack, Track, UserTopItems, UserTopTracks } from '../../_shared/models/user-top-items-response.model';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { concatMap, finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { NUMBER_OF_SONGS } from '../../_shared/constants/settings.constants';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [NgSelectModule, CommonModule, FormsModule],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {
  timeRanges: string[] = [ "short_term", "medium_term", "long_term" ];

  isLoading: boolean = false;
  isPlaying: boolean = false;
  isFocused: boolean = false;
  isTrackCountEnough: boolean = true;
  isHardMode: boolean = false;
  isTrackPlaying: boolean = false;

  topTracksMap: Map<string, Track> = new Map<string, Track>();
  topArtistsByTrackMap: Map<string, TopArtistsByTrack> = new Map<string, TopArtistsByTrack>();

  specificArtist!: Artist;
  specificArtistSelection: Artist[] = [];

  quizSelection: Track[] = [];
  quizSongs: Track[] = [];
  quizIndex: number = 0;
  quizTimer: number = 0;

  filteredTracks: Track[] = [];
  filter: string = "";

  hasFilteredTracksSignal: WritableSignal<boolean> = signal(false);
  isFocusedSignal: WritableSignal<boolean> = signal(this.isFocused);
  filteredTracksSignal: WritableSignal<Track[]> = signal([]);

  constructor(
    private changeDetector: ChangeDetectorRef,
    private spotifyService: SpotifyService,
    private userService: UserService,
    private zone: NgZone) {
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

  toggleHardMode(event: Event): void {
    this.isHardMode = (event.target as HTMLInputElement).checked;
  }

  play(): void {
    this.getQuizSongs();
    this.quizIndex = 0;
    this.isPlaying = true;
    this.quizTimer = 20;
  }

  getQuizSongs(): void {
    this.quizSelection = [];

    if (this.specificArtist) {
      this.quizSelection = [...this.topTracksMap.values()].filter((track: Track) => track.artists[0].id === this.specificArtist.id);
    } else {
      this.quizSelection = [...this.topTracksMap.values()];
    }

    // for playing again
    // if (this.quizSongs.length > 0) {
    //   // remove songs already in this.quizSongs from quizSelection
    // }

    this.quizSongs = this.getRandomSongs(this.quizSelection, NUMBER_OF_SONGS);
  }

  getRandomSongs(tracks: Track[], size: number): Track[] {
    let result: Track[] = [];
    let taken: number[] = [];
    let length: number = tracks.length;

    while(size--) {
      const rand = Math.floor(Math.random() * length);
      result[size] = tracks[rand in taken ? taken[rand] : rand];
      taken[rand] = --length in taken ? taken[length] : length;
    }

    return result;
  }

  submitAnswer(): void {
    this.isTrackPlaying = false;
  }

  togglePlayTrack(): void {
    this.isTrackPlaying = !this.isTrackPlaying;
  }

  filterTracks(event: Event): void {

    const filterTerms: string[] = (event.target as HTMLInputElement).value.split(' ');

    filterTerms.forEach((term: string) => {
      const temp: Track[] = [];

      this.quizSelection.forEach((track: Track) => {
        if (track.name.toLocaleLowerCase().includes(term)) {
          temp.push(track);
        }
      });

      this.filteredTracks = temp;
    });

    if (this.filteredTracks. length > 0)
      this.hasFilteredTracksSignal.set(true);

    // this.filter = (event.target as HTMLInputElement).value;
    
    // let newFiltered: Track[] = this.quizSelection.filter((track: Track) => track.name.includes(this.filter));

    // let newArray: Track[] = newFiltered.map((track: Track) => Object.assign({}, track));
    // this.filteredTracksSignal.set(newArray);

    // this.filteredTracksSignal.set(this.quizSelection);
    // this.filteredTracksSignal.update((prev: Track[]) => [
    //   ...prev.filter((x: Track) => x.name.includes(this.filter))
    // ]);

    // this.zone.run(() => {
    //   this.filter = (event.target as HTMLInputElement).value;
    //   this.filteredTracks = [...this.quizSelection.filter((x: Track) => x.name.includes(this.filter))];
    //   this.filteredTracksSignal.set(this.filteredTracks);
    //   this.changeDetector.detectChanges();
    // });

    // this.filter = (event.target as HTMLInputElement).value;
    // this.filteredTracks = [...this.quizSelection.filter((x: Track) => x.name.includes(this.filter))];
    // this.filteredTracksSignal.set(this.filteredTracks);
  }

  toggleFocused(): void {
    this.isFocused = !this.isFocused;
    this.isFocusedSignal.set(this.isFocused);
  }
}
