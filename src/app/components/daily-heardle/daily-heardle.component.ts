import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { SpotifyService } from '../../_shared/services/spotify.service';
import { UserService } from '../../_shared/services/user.service';
import { firstValueFrom } from 'rxjs';
import { LoadingSpinnerComponent } from '../../_shared/components/loading-spinner/loading-spinner/loading-spinner.component';
import { Track } from '../../_shared/models/spotify.model';
import { DailyHeardleState } from '../../_shared/models/daily-heardle.model';
import { TracksService } from '../../_shared/services/tracks.service';
import { HeardleQuizComponent } from '../../_shared/components/heardle-quiz/heardle-quiz.component';
import { HeardleQuiz } from '../../_shared/models/heardle-quiz.model';
import { NORMAL_DURATION, NORMAL_TIMER } from '../../_shared/constants/settings.constants';
import { formatDate } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QuizAnswerModal } from '../../_shared/components/modals/quiz-answer/quiz-answer.modal';
import { QuizResult } from '../../_shared/models/result-modal.model';

@Component({
  selector: 'app-daily-heardle',
  standalone: true,
  imports: [ LoadingSpinnerComponent, HeardleQuizComponent ],
  templateUrl: './daily-heardle.component.html',
  styleUrl: './daily-heardle.component.scss'
})
export class DailyHeardleComponent implements OnInit {

  isLoading: boolean = false;
  isFinishedGettingTracks: boolean = false;
  hasPlayedToday: boolean = false;

  quizSelection: Track[] = [];
  quizTrack!: Track;
  tracksMap: Map<string, Track> = new Map<string, Track>();
  dailyTrackIndex!: number;

  state!: DailyHeardleState;
  heardleQuiz!: HeardleQuiz;
  utcDate: Date = new Date();

  constructor(
    private modalService: NgbModal,
    private spotifyService: SpotifyService,
    private tracksService: TracksService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.getDailyHeardleState();

    this.utcDate = new Date(this.utcDate.getUTCFullYear(),
      this.utcDate.getUTCMonth(),
      this.utcDate.getUTCDate(),
      this.utcDate.getUTCHours(),
      this.utcDate.getUTCMinutes(),
      this.utcDate.getUTCSeconds());

    this.hasPlayedToday = this.checkPlayedToday();

    this.searchAllTracksBy("TAEYEON")
      .finally(() => {
        this.sortTracks();
        this.getTodaysTrack();
        this.buildHeardleQuiz();

        if (!this.hasPlayedToday)
          this.isLoading = false;
        else 
          this.displayResultModal();
      });
  }

  async searchAllTracksBy(artistName: string): Promise<void> {
    let offset: number = 0;
    let isFinished: boolean = false;

    while(!isFinished) {
      const page = await firstValueFrom(this.spotifyService.searchTracksBy(this.userService.spotifyTokenDetailsSignal().access_token, artistName, offset));
      this.tracksMap = this.tracksService.appendTracksMap(this.tracksMap, page.tracks.items, "TAEYEON");
      isFinished = !(this.hasMoreResultPages(page.tracks.next));
      offset += 50;
    };
  }

  hasMoreResultPages(next: string): boolean {
    if (next)
      return true;

    return false;
  }

  sortTracks(): void {
    this.quizSelection = [...this.tracksMap.values()];

    this.quizSelection.sort((a: Track, b: Track): number => {
      const aTrack: string = a.id.toLocaleLowerCase();
      const bTrack: string = b.id.toLocaleLowerCase();

      return (aTrack < bTrack) ? -1 : (aTrack > bTrack) ? 1 : 0;
    });
  }

  getDailyHeardleState(): void {
    if (localStorage.getItem('dailyHeardleState'))
      this.state = JSON.parse(localStorage.getItem('dailyHeardleState')!);
    else
      this.buildState();
  }

  buildState(): void {
    this.state = {
      hasDoneTodaysHeardle: false,
      lastDateDone: null,
      score: 0,
      user: this.userService.userSignal(),
      winStreak: 0
    };
  }

  getTodaysTrack(): void {
    const numTracks: number = this.tracksMap.size;
    const currEpoch: number = Math.floor(this.utcDate.getTime()/1000.0);
    this.dailyTrackIndex = Math.floor((currEpoch/(24*60*60))%numTracks);
  }

  buildHeardleQuiz(): void {
    this.quizTrack = this.quizSelection[this.dailyTrackIndex];

    this.heardleQuiz = {
      quizIndex: 0,
      quizScore: 0,
      quizSelection: this.quizSelection,
      quizTracks: [this.quizTrack],
      quizSettings: { isDailyHeardle: true, timer: NORMAL_TIMER, trackDuration: NORMAL_DURATION },
      utcDate: this.utcDate,
      dailyHeardleState: this.state
    };
  }

  checkPlayedToday(): boolean {
    if (this.state.lastDateDone) {
      const formattedLastPlayed: string = formatDate(this.state.lastDateDone, "yyyy-MM-dd", "en_US");
      const formattedCurrDate: string = formatDate(this.utcDate, "yyyy-MM-dd", "en_US");

      if (formattedLastPlayed === formattedCurrDate)
        return true;
    }

    return false;
  }

  displayResultModal(): void {
    const isCorrect: boolean = this.state.winStreak > 0;
    
    let modalRef: NgbModalRef;
    modalRef = this.modalService.open(QuizAnswerModal, { backdrop: 'static', keyboard: false});

    if (isCorrect) {
      (modalRef.componentInstance.result as QuizResult) = { isCorrect: true, isLastQuestion: true,
        score: this.state.score, track: this.quizTrack};
    } else {
      (modalRef.componentInstance.result as QuizResult) = { isCorrect: false, isLastQuestion: true,
        score: this.state.score, track: this.quizTrack};
    }
  }
}
