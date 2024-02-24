import { Component, ElementRef, HostListener, NgZone, OnInit, ViewChild, WritableSignal, signal } from '@angular/core';
import { Artist, SpotifyBaseResponse, TopArtistsByTrack, Track, TracksResponse } from '../../_shared/models/spotify.model';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { Observable, concatMap, finalize, map, takeWhile, timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { HARD_MODE_DURATION, HARD_MODE_TIMER, NORMAL_DURATION, NORMAL_TIMER, NUMBER_OF_SONGS, VOLUME_DECREMENTER, VOLUME_INCREMENTER } from '../../_shared/constants/settings.constants';
import { QuizSettings } from '../../_shared/models/quiz.model';
import { QuizResult } from '../../_shared/models/result-modal.model';
import { QuizAnswerModal } from '../../_shared/components/modals/quiz-answer/quiz-answer.modal';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NavigationStart, Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../_shared/components/loading-spinner/loading-spinner/loading-spinner.component';
import { TracksService } from '../../_shared/services/tracks.service';
import { HeardleQuiz } from '../../_shared/models/heardle-quiz.model';
import { HeardleQuizComponent } from '../../_shared/components/heardle-quiz/heardle-quiz.component';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [NgSelectModule, CommonModule, FormsModule, NgbModalModule, LoadingSpinnerComponent, HeardleQuizComponent],
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
  isTimerStarted: boolean = false;

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

  filteredTracks: Track[] = [];
  filter: string | null = null;
  selectedAnswer: Track | null = null;
  
  hoverIndex: number = -1;

  timerInterval: any; // for the setInterval
  timeLeft: number = 0.0;
  volume: number = 0.3;

  hasFilteredTracksSignal: WritableSignal<boolean> = signal(false);
  isFocusedSignal: WritableSignal<boolean> = signal(this.isFocused);
  filteredTracksSignal: WritableSignal<Track[]> = signal([]);

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private spotifyService: SpotifyService,
    private tracksService: TracksService,
    private userService: UserService) {
      this.router.events.forEach((event): void => {
        if(event instanceof NavigationStart) {
          clearInterval(this.timerInterval);
        }
      })
  }

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
    //this.startTimer();
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

  // selectAnswer(index: number): void {
  //   this.isFocused = false;
  //   this.isFocusedSignal.set(this.isFocused);
  //   this.selectedAnswer = this.filteredTracks[index];
  //   this.filter = `${this.filteredTracks[index].name} - ${this.filteredTracks[index].artists[0].name}`;
  // }

  // submitAnswer(isTimeRanOut: boolean = false): void {
  //   let modalRef: NgbModalRef;
  //   this.isTrackPlaying = false;
  //   this.isTimerStarted = false;
  //   clearInterval(this.timerInterval);

  //   this.musicPlayer.nativeElement.pause();
  //   this.musicPlayer.nativeElement.currentTime = 0;

  //   if (isTimeRanOut) {
  //     modalRef = this.modalService.open(QuizAnswerModal);
  //     (modalRef.componentInstance.result as QuizResult) = { isCorrect: false, isLastQuestion: (this.quizIndex === 4), score: this.quizScore, track: this.quizSongs[this.quizIndex]!};
  //   } else {
  //     const selectedAnswerStrId: string = this.tracksService.buildTrackIdentifier(this.selectedAnswer!.name, this.tracksService.artistNamesToString(this.selectedAnswer!.artists));
  //     const quizAnswerStrId: string = this.tracksService.buildTrackIdentifier(this.quizSongs[this.quizIndex]!.name, this.tracksService.artistNamesToString(this.quizSongs[this.quizIndex]!.artists));
    
  //     if (this.quizIndex === 4) 
  //       modalRef = this.modalService.open(QuizAnswerModal, { backdrop: 'static', keyboard: false});
  //     else 
  //       modalRef = this.modalService.open(QuizAnswerModal);
  
  //     if (selectedAnswerStrId === quizAnswerStrId) {
  //       this.quizScore++;
  //       (modalRef.componentInstance.result as QuizResult) = { isCorrect: true, isLastQuestion: (this.quizIndex === 4), score: this.quizScore, track: this.quizSongs[this.quizIndex]!};
  //     } else {
  //       (modalRef.componentInstance.result as QuizResult) = { isCorrect: false, isLastQuestion: (this.quizIndex === 4), score: this.quizScore, track: this.quizSongs[this.quizIndex]!};
  //     }
  //   }

  //   modalRef.closed.subscribe(() => {
  //     this.selectedAnswer = null;
  //     this.filter = null;
  //     this.quizIndex++;

  //     if (this.quizSongs[this.quizIndex])
  //       this.startTimer();
  //   });

  //   modalRef.dismissed.subscribe(() => {
  //     modalRef.close();
  //   })
  // }

  // handleKeyUp(event: Event): void {
  //   const key: KeyboardEvent = event as KeyboardEvent;

  //   if (this.filter!.length > 0 && this.selectedAnswer) {
  //     this.submitAnswer();
  //   } else {
  //     switch (key.key) {
  //       case "ArrowUp": 
  //         if (this.hoverIndex != 0) {
  //           this.hoverIndex--;
  //           this.scrollTo();
  //         }
  //         break;
  //       case "ArrowDown":
  //         if (this.hoverIndex < this.filteredTracks.length - 1) {
  //           this.hoverIndex++;
  //           this.scrollTo();
  //         }
  //         break;
  //       case "Enter":
  //         if (this.hoverIndex >= 0) {
  //           this.selectAnswer(this.hoverIndex);
  //         }
  //         break;
  //       default:
  //         this.selectedAnswer = null;
  //         this.filterTracks();
  //         break;
  //     }
  //   }
  // }

  // scrollTo() {
  //   if (this.hoverIndex != -1) {
  //     const scrollTo = document.getElementById('track-' + this.hoverIndex);
  //     if (scrollTo) {
  //       scrollTo.scrollIntoView(true);
  //     }
  //   }
  // }

  // filterTracks(): void {
  //   const filterTerms: string[] = this.filter!.split(' ');

  //   if (this.filter === "" || this.filter === null) {
  //     this.filteredTracks = [];
  //   } else {
  //     this.isFocused = true;
  //     this.isFocusedSignal.set(this.isFocused);

  //     this.filteredTracks = this.quizSelection;
  //     for(let i: number = 0; i < filterTerms.length; i++) {
  //       const temp: Track[] = [];
        
  //       for(let j: number = 0; j < this.filteredTracks.length; j++) {
  //         const artistNames: string = this.tracksService.artistNamesToString(this.filteredTracks[j].artists);
  //         if (this.tracksService.isIncludesFilter(filterTerms[i], this.filteredTracks[j].name, artistNames))
  //           temp.push(JSON.parse(JSON.stringify(this.filteredTracks[j])));
  //       }

  //       this.filteredTracks = temp;
  //     }
  //   }
  // }

  // compareArtistsOnTrack(artists: Artist[], term: string): boolean {
  //   let allArtists: string = "";

  //   artists.forEach((artist: Artist) => {
  //     allArtists = allArtists.concat(artist.name, " ");
  //   });

  //   if (allArtists.includes(term))
  //     return true;

  //   return false
  // }

  // toggleFocused(): void {
  //   this.isFocused = !this.isFocused;
  //   this.isFocusedSignal.set(this.isFocused);
  // }

  // @HostListener('document:click', ['$event.target'])
  // documentClick(targetElement: any): void {
  //   const isInside: boolean = this.autocompleteContainer?.nativeElement.contains(targetElement);

  //   if (!isInside) {
  //     this.isFocused = false;
  //     this.isFocusedSignal.set(this.isFocused);
  //     this.hoverIndex = -1;
  //   }
  // }

  // toggleAudio(): void {
  //   this.isTrackPlaying = !this.isTrackPlaying;
  //   this.musicPlayer.nativeElement.load();

  //   const isReadyToPlay: boolean = !(this.musicPlayer.nativeElement.currentTime > 0 && !this.musicPlayer.nativeElement.paused
  //     && !this.musicPlayer.nativeElement.ended && this.musicPlayer.nativeElement.readyState > this.musicPlayer.nativeElement.HAVE_CURRENT_DATA);

  //   if (this.isTrackPlaying && isReadyToPlay) {
  //     this.musicPlayer.nativeElement.play();
  //     this.audioFadeIn();
  //     this.audioFadeOut();
  //   } else if (!this.isTrackPlaying) {
  //     this.audioFadeOut(true);
  //   }
  // }

  // audioFadeIn(): void {
  //   this.musicPlayer.nativeElement.volume = 0;

  //   const fadeIn = setInterval(() => {
  //     if (this.musicPlayer.nativeElement.currentTime >= 0.0 && this.musicPlayer.nativeElement.volume < this.volume) {
  //       try {
  //         this.musicPlayer.nativeElement.volume += VOLUME_INCREMENTER;
  //       } catch {
  //         clearInterval(fadeIn);
  //       }
  //     } else if (this.musicPlayer.nativeElement.volume >= this.volume) {
  //       clearInterval(fadeIn);
  //     }
  //   }, 100);
  // }

  // audioFadeOut(fromPause: boolean = false): void {
  //   const fadeOut = setInterval(() => {
  //     if (fromPause) {
  //       if (this.musicPlayer.nativeElement.volume > 0.0) {
  //         try {
  //           this.musicPlayer.nativeElement.volume -= VOLUME_DECREMENTER;
  //         } catch {
  //           clearInterval(fadeOut);
  //           this.musicPlayer.nativeElement.pause();
  //           this.musicPlayer.nativeElement.currentTime = 0;
  //         }
  //       } else if (this.musicPlayer.nativeElement.volume <= 0.0) {
  //         clearInterval(fadeOut);
  //       }
  //     } else {
  //       if (this.musicPlayer.nativeElement.currentTime >= this.quizSettings.trackDuration && this.musicPlayer.nativeElement.volume > 0) {
  //         try {
  //           this.musicPlayer.nativeElement.volume -= VOLUME_DECREMENTER;
  //         } catch {
  //           clearInterval(fadeOut);
  //           this.isTrackPlaying = false;
  //           this.musicPlayer.nativeElement.pause();
  //           this.musicPlayer.nativeElement.currentTime = 0;
  //         }
  //       }
  //     }
  //   }, 100);
  // }

  // startTimer(): void {
  //   this.timeLeft = JSON.parse(JSON.stringify(this.quizSettings.timer));

  //   if (!this.isTimerStarted) {
  //     setTimeout(() => {
  //       this.isTimerStarted = true;
        
  //       this.timerInterval = setInterval(() => {
  //         if (this.isTimerStarted && this.timeLeft > 0.0)
  //           this.timeLeft--;
  //         else if (this.isTimerStarted && this.timeLeft <= 0) {
  //           clearInterval(this.timerInterval);
  //           this.submitAnswer(true);
  //         }
  //       }, 1000);
  //     }, 500);
  //   }
  // }

  // @HostListener('window:popstate', ['$event'])
  // onPopState(): void {
  //   clearInterval(this.timerInterval);
  // }

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
      dailyHeardleState: null,
      utcDate: null
    };
  }
}
