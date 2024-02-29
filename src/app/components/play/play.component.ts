import { Component, OnInit } from '@angular/core';
import { Artist, SpotifyBaseResponse, TopArtistsByTrack, Track, TracksResponse } from '../../_shared/models/spotify.model';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { concatMap, finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { HARD_MODE_DURATION, HARD_MODE_TIMER, NORMAL_DURATION, NORMAL_TIMER, NUMBER_OF_SONGS } from '../../_shared/constants/settings.constants';
import { QuizSettings } from '../../_shared/models/quiz.model';
import { LoadingSpinnerComponent } from '../../_shared/components/loading-spinner/loading-spinner/loading-spinner.component';
import { TracksService } from '../../_shared/services/tracks.service';
import { HeardleQuiz } from '../../_shared/models/heardle-quiz.model';
import { HeardleQuizComponent } from '../../_shared/components/heardle-quiz/heardle-quiz.component';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [NgSelectModule, CommonModule, FormsModule, LoadingSpinnerComponent, HeardleQuizComponent],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {
  timeRanges: string[] = [ "short_term", "medium_term", "long_term" ];

  isLoading: boolean = false;
  isPlaying: boolean = false;
  isHardMode: boolean = false;

  topTracksMap: Map<string, Track> = new Map<string, Track>();
  topArtistsByTrackMap: Map<string, TopArtistsByTrack> = new Map<string, TopArtistsByTrack>();

  specificArtist!: Artist;
  specificArtistSelection: Artist[] = [];

  quizSettings: QuizSettings = { trackDuration: NORMAL_DURATION, timer: NORMAL_TIMER, isDailyHeardle: false };
  quizSelection: Track[] = [];
  quizTracks: Track[] = [];
  quizIndex: number = 0;
  quizScore: number = 0;

  heardleQuiz!: HeardleQuiz;

  constructor(
    private spotifyService: SpotifyService,
    private tracksService: TracksService,
    private userService: UserService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.spotifyService.getTopItems(this.userService.spotifyTokenDetailsSignal().access_token, this.timeRanges[0], 0, "tracks")
      .pipe(
        concatMap((response: SpotifyBaseResponse) => {
          this.appendTopTracks((response as TracksResponse).items);
          
          return this.spotifyService.getTopItems(this.userService.spotifyTokenDetailsSignal().access_token, this.timeRanges[0], 49, "tracks");
        }),
        concatMap((response: SpotifyBaseResponse) => {
          this.appendTopTracks((response as TracksResponse).items);

          return this.spotifyService.getTopItems(this.userService.spotifyTokenDetailsSignal().access_token, this.timeRanges[1], 0, "tracks");
        }),
        concatMap((response: SpotifyBaseResponse) => {
          this.appendTopTracks((response as TracksResponse).items);

          return this.spotifyService.getTopItems(this.userService.spotifyTokenDetailsSignal().access_token, this.timeRanges[1], 49, "tracks");
        }),
        concatMap((response: SpotifyBaseResponse) => {
          this.appendTopTracks((response as TracksResponse).items);

          return this.spotifyService.getTopItems(this.userService.spotifyTokenDetailsSignal().access_token, this.timeRanges[2], 0, "tracks");
        }),
        concatMap((response: SpotifyBaseResponse) => {
          this.appendTopTracks((response as TracksResponse).items);

          return this.spotifyService.getTopItems(this.userService.spotifyTokenDetailsSignal().access_token, this.timeRanges[2], 49, "tracks");
        }),
        finalize(() => {
          this.getTopArtistsByTrack();
          this.isLoading = false;
        })
      ). subscribe((response: SpotifyBaseResponse) => {
        this.appendTopTracks((response as TracksResponse).items);
      });
  }

  appendTopTracks(topTracks: Track[]): void {
    topTracks.forEach((track: Track) => {

      const trackIdentifier: string = this.tracksService.buildTrackIdentifier(track.name, this.tracksService.artistNamesToString(track.artists));
      if (track.preview_url && !this.topTracksMap.has(trackIdentifier)) {
        this.topTracksMap.set(trackIdentifier, track);
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
    if (this.isHardMode)
      this.quizSettings = { trackDuration: HARD_MODE_DURATION, timer: HARD_MODE_TIMER, isDailyHeardle: false };

    this.getQuizSongs();
    this.quizIndex = 0;
    this.buildHeardleQuiz();
    this.isPlaying = true;
  }

  getQuizSongs(): void {
    this.quizSelection = [];

    if (this.specificArtist) {
      this.quizSelection = [...this.topTracksMap.values()].filter((track: Track) => track.artists[0].id === this.specificArtist.id);
    } else {
      this.quizSelection = [...this.topTracksMap.values()];
    }

    this.quizTracks = this.getRandomSongs(this.quizSelection, NUMBER_OF_SONGS);
  }

  getRandomSongs(tracks: Track[], size: number): Track[] {
    const result: Track[] = [];
    const taken: number[] = [];
    let length: number = tracks.length;

    while(size--) {
      const rand = Math.floor(Math.random() * length);
      result[size] = tracks[rand in taken ? taken[rand] : rand];
      taken[rand] = --length in taken ? taken[length] : length;
    }

    return result;
  }

  buildHeardleQuiz(): void {
    let timer: number = NORMAL_TIMER;
    let duration: number = NORMAL_DURATION;

    if (this.isHardMode) {
      timer = HARD_MODE_TIMER;
      duration = HARD_MODE_DURATION;
    }

    this.heardleQuiz = {
      quizIndex: 0,
      quizScore: 0,
      quizSelection: this.quizSelection,
      quizTracks: this.quizTracks,
      quizSettings: { isDailyHeardle: false, timer: timer, trackDuration: duration },
      utcDate: null,
      dailyHeardleState: null,
      dailyHeardleDayCount: null
    };
  }
}
