import { ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, OnInit, ViewChild, WritableSignal, signal } from '@angular/core';
import { Artist, TopArtistsByTrack, Track, UserTopItems, UserTopTracks } from '../../_shared/models/user-top-items-response.model';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { concatMap, finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { HARD_MODE_DURATION, HARD_MODE_TIMER, NORMAL_DURATION, NORMAL_TIMER, NUMBER_OF_SONGS, VOLUME_DECREMENTER, VOLUME_INCREMENTER } from '../../_shared/constants/settings.constants';
import { QuizSettings } from '../../_shared/models/quiz.model';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [NgSelectModule, CommonModule, FormsModule],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {
  @ViewChild("autocompleteContainer", { read: ElementRef }) autocompleteContainer?: ElementRef;
  @ViewChild("musicPlayer", { read: ElementRef }) musicPlayer!: ElementRef;

  timeRanges: string[] = [ "short_term", "medium_term", "long_term" ];

  isLoading: boolean = false;
  isPlaying: boolean = false;
  isFocused: boolean = false;
  isHardMode: boolean = false;
  isTrackPlaying: boolean = false;

  topTracksMap: Map<string, Track> = new Map<string, Track>();
  topArtistsByTrackMap: Map<string, TopArtistsByTrack> = new Map<string, TopArtistsByTrack>();

  specificArtist!: Artist;
  specificArtistSelection: Artist[] = [];

  quizSettings: QuizSettings = { trackDuration: NORMAL_DURATION, timer: NORMAL_TIMER };
  quizSelection: Track[] = [];
  quizSongs: Track[] = [];
  quizIndex: number = 0;

  filteredTracks: Track[] = [];
  filter: string = "";
  selectedAnswer: Track | null = null;
  
  hoverIndex: number = -1;

  volume: number = 0.3;

  hasFilteredTracksSignal: WritableSignal<boolean> = signal(false);
  isFocusedSignal: WritableSignal<boolean> = signal(this.isFocused);
  filteredTracksSignal: WritableSignal<Track[]> = signal([]);

  constructor(
    private spotifyService: SpotifyService,
    private userService: UserService) {
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[0], 0, "tracks")
      .pipe(
        concatMap((response: UserTopItems) => {
          this.appendTopTracks((response as UserTopTracks).items);
          
          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[0], 49, "tracks");
        }),
        concatMap((response: UserTopItems) => {
          this.appendTopTracks((response as UserTopTracks).items);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[1], 0, "tracks");
        }),
        concatMap((response: UserTopItems) => {
          this.appendTopTracks((response as UserTopTracks).items);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[1], 49, "tracks");
        }),
        concatMap((response: UserTopItems) => {
          this.appendTopTracks((response as UserTopTracks).items);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[2], 0, "tracks");
        }),
        concatMap((response: UserTopItems) => {
          this.appendTopTracks((response as UserTopTracks).items);

          return this.spotifyService.getTopItems(this.userService.authTokenSignal(), this.timeRanges[2], 49, "tracks");
        }),
        finalize(() => {
          this.getTopArtistsByTrack();
          this.isLoading = false;
        })
      ). subscribe((response: UserTopItems) => {
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
    if (this.isHardMode)
      this.quizSettings = { trackDuration: HARD_MODE_DURATION, timer: HARD_MODE_TIMER };

    this.getQuizSongs();
    this.quizIndex = 0;
    this.isPlaying = true;
  }

  getQuizSongs(): void {
    this.quizSelection = [];

    if (this.specificArtist) {
      this.quizSelection = [...this.topTracksMap.values()].filter((track: Track) => track.artists[0].id === this.specificArtist.id);
    } else {
      this.quizSelection = [...this.topTracksMap.values()];
    }

    this.quizSongs = this.getRandomSongs(this.quizSelection, NUMBER_OF_SONGS);
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

  selectAnswer(index: number): void {
    this.isFocused = false;
    this.isFocusedSignal.set(this.isFocused);
    this.selectedAnswer = this.filteredTracks[index];
    this.filter = `${this.filteredTracks[index].name} - ${this.filteredTracks[index].artists[0].name}`;
  }

  submitAnswer(): void {
    this.isTrackPlaying = false;
  }

  handleKeyUp(event: Event): void {
    const key: KeyboardEvent = event as KeyboardEvent;

    if (this.filter.length > 0 && this.selectedAnswer) {
      this.submitAnswer();
    } else {
      switch (key.key) {
        case "ArrowUp": 
          if (this.hoverIndex != 0) {
            this.hoverIndex--;
            this.scrollTo();
          }
          break;
        case "ArrowDown":
          if (this.hoverIndex < this.filteredTracks.length - 1) {
            this.hoverIndex++;
            this.scrollTo();
          }
          break;
        case "Enter":
          if (this.hoverIndex >= 0) {
            this.selectAnswer(this.hoverIndex);
          }
          break;
        default:
          this.selectedAnswer = null;
          this.filterTracks();
          break;
      }
    }
  }

  scrollTo() {
    if (this.hoverIndex != -1) {
      const scrollTo = document.getElementById('track-' + this.hoverIndex);
      if (scrollTo) {
        scrollTo.scrollIntoView(true);
      }
    }
  }

  filterTracks(): void {
    const filterTerms: string[] = this.filter.split(' ');

    if (this.filter === "" || this.filter === null) {
      this.filteredTracks = [];
    } else {
      this.isFocused = true;
      this.isFocusedSignal.set(this.isFocused);

      this.filteredTracks = this.quizSelection;
      for(let i: number = 0; i < filterTerms.length; i++) {
        const temp: Track[] = [];
        
        for(let j: number = 0; j < this.filteredTracks.length; j++) {
          if (this.filteredTracks[j].name.toLowerCase().includes(filterTerms[i]) || this.spotifyService.artistsToStr(this.filteredTracks[j].artists).includes(filterTerms[i]))
            temp.push(JSON.parse(JSON.stringify(this.filteredTracks[j])));
        }

        this.filteredTracks = temp;
      }
    }
  }

  compareArtistsOnTrack(artists: Artist[], term: string): boolean {
    let allArtists: string = "";

    artists.forEach((artist: Artist) => {
      allArtists = allArtists.concat(artist.name, " ");
    });

    if (allArtists.includes(term))
      return true;

    return false
  }

  toggleFocused(): void {
    this.isFocused = !this.isFocused;
    this.isFocusedSignal.set(this.isFocused);
  }

  @HostListener('document:click', ['$event.target'])
  documentClick(targetElement: any): void {
    const isInside: boolean = this.autocompleteContainer?.nativeElement.contains(targetElement);

    if (!isInside) {
      this.isFocused = false;
      this.isFocusedSignal.set(this.isFocused);
      this.hoverIndex = -1;
    }
  }

  toggleAudio(): void {
    this.isTrackPlaying = !this.isTrackPlaying;
    this.musicPlayer.nativeElement.load();

    const isReadyToPlay: boolean = !(this.musicPlayer.nativeElement.currentTime > 0 && !this.musicPlayer.nativeElement.paused
      && !this.musicPlayer.nativeElement.ended && this.musicPlayer.nativeElement.readyState > this.musicPlayer.nativeElement.HAVE_CURRENT_DATA);

    if (this.isTrackPlaying && isReadyToPlay) {
      this.musicPlayer.nativeElement.play();
      this.audioFadeIn();
      this.audioFadeOut();
    } else if (!this.isTrackPlaying) {
      this.audioFadeOut(true);
    }
  }

  audioFadeIn(): void {
    this.musicPlayer.nativeElement.volume = 0;

    const fadeIn = setInterval(() => {
      if (this.musicPlayer.nativeElement.currentTime >= 0.0 && this.musicPlayer.nativeElement.volume < this.volume) {
        try {
          this.musicPlayer.nativeElement.volume += VOLUME_INCREMENTER;
        } catch {
          clearInterval(fadeIn);
        }
      } else if (this.musicPlayer.nativeElement.volume >= this.volume) {
        clearInterval(fadeIn);
      }
    }, 100);
  }

  audioFadeOut(fromPause: boolean = false): void {
    const fadeOut = setInterval(() => {
      if (fromPause) {
        if (this.musicPlayer.nativeElement.volume > 0.0) {
          try {
            this.musicPlayer.nativeElement.volume -= VOLUME_DECREMENTER;
          } catch {
            clearInterval(fadeOut);
            this.musicPlayer.nativeElement.pause();
            this.musicPlayer.nativeElement.currentTime = 0;
          }
        } else if (this.musicPlayer.nativeElement.volume <= 0.0) {
          clearInterval(fadeOut);
        }
      } else {
        if (this.musicPlayer.nativeElement.currentTime >= this.quizSettings.trackDuration && this.musicPlayer.nativeElement.volume > 0) {
          try {
            this.musicPlayer.nativeElement.volume -= VOLUME_DECREMENTER;
          } catch {
            clearInterval(fadeOut);
            this.isTrackPlaying = false;
            this.musicPlayer.nativeElement.pause();
            this.musicPlayer.nativeElement.currentTime = 0;
          }
        }
      }
    }, 100);
  }
}


