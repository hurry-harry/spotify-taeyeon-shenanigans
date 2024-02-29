import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild, WritableSignal, signal } from '@angular/core';
import { HeardleQuiz } from '../../models/heardle-quiz.model';
import { Track } from '../../models/spotify.model';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QuizResult } from '../../models/result-modal.model';
import { QuizAnswerModalComponent } from '../modals/quiz-answer/quiz-answer.modal.component';
import { TracksService } from '../../services/tracks.service';
import { VOLUME_INCREMENTER, VOLUME_DECREMENTER } from '../../constants/settings.constants';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { DailyHeardleState } from '../../models/daily-heardle.model';

@Component({
  selector: 'app-heardle-quiz',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './heardle-quiz.component.html',
  styleUrl: './heardle-quiz.component.scss'
})
export class HeardleQuizComponent implements OnInit, OnDestroy {
  @Input() heardleQuiz!: HeardleQuiz;  

  @ViewChild("autocompleteContainer", { read: ElementRef }) autocompleteContainer?: ElementRef;
  @ViewChild("musicPlayer", { read: ElementRef }) musicPlayer!: ElementRef;

  dailyHeardleState!: DailyHeardleState;

  isLoading: boolean = false;
  isPlaying: boolean = false;
  isFocused: boolean = false;
  isTrackPlaying: boolean = false;
  isTimerStarted: boolean = false;

  filteredTracks: Track[] = [];
  filter: string | null = null;
  selectedAnswer: Track | null = null;

  timerInterval!: NodeJS.Timeout; // for the setInterval
  timeLeft: number = 0.0;
  volume: number = 0.3;

  hoverIndex: number = -1;

  hasFilteredTracksSignal: WritableSignal<boolean> = signal(false);
  isFocusedSignal: WritableSignal<boolean> = signal(this.isFocused);
  filteredTracksSignal: WritableSignal<Track[]> = signal([]);

  routerSubscription!: Subscription;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private tracksService: TracksService
  ) { }

  ngOnInit(): void {
    this.routerSubscription = this.router.events
      .subscribe(() => {
        clearInterval(this.timerInterval);
      });

    this.startTimer();
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  selectAnswer(index: number): void {
    this.isFocused = false;
    this.isFocusedSignal.set(this.isFocused);
    this.selectedAnswer = this.filteredTracks[index];
    this.filter = `${this.filteredTracks[index].name} - ${this.filteredTracks[index].artists[0].name}`;
  }

  
  submitAnswer(isTimeRanOut: boolean = false): void {
    let modalRef: NgbModalRef;
    this.isTrackPlaying = false;
    this.isTimerStarted = false;
    clearInterval(this.timerInterval);  

    this.musicPlayer.nativeElement.pause();
    this.musicPlayer.nativeElement.currentTime = 0;

    if (this.heardleQuiz.quizIndex === 4 || this.heardleQuiz.quizSettings.isDailyHeardle) 
      modalRef = this.modalService.open(QuizAnswerModalComponent, { backdrop: 'static', keyboard: false});
    else
      modalRef = this.modalService.open(QuizAnswerModalComponent);

    if (isTimeRanOut) {
      (modalRef.componentInstance.result as QuizResult) = { isCorrect: false, isLastQuestion: this.heardleQuiz.quizIndex === 4 || this.heardleQuiz.quizSettings.isDailyHeardle,
        score: this.heardleQuiz.quizScore, track: this.heardleQuiz.quizTracks[this.heardleQuiz.quizIndex]!};

      if (this.heardleQuiz.quizSettings.isDailyHeardle)
        this.updateDailyHeardleState(false);
    } else {
      const selectedAnswerStrId: string = this.tracksService.buildTrackIdentifier(this.selectedAnswer!.name,
        this.tracksService.artistNamesToString(this.selectedAnswer!.artists));
      const quizAnswerStrId: string = this.tracksService.buildTrackIdentifier(this.heardleQuiz.quizTracks[this.heardleQuiz.quizIndex]!.name,
        this.tracksService.artistNamesToString(this.heardleQuiz.quizTracks[this.heardleQuiz.quizIndex]!.artists));

      if (selectedAnswerStrId === quizAnswerStrId) {
        this.heardleQuiz.quizScore++;
        (modalRef.componentInstance.result as QuizResult) = { isCorrect: true, isLastQuestion: this.heardleQuiz.quizIndex === 4 || this.heardleQuiz.quizSettings.isDailyHeardle,
          score: this.heardleQuiz.quizScore, track: this.heardleQuiz.quizTracks[this.heardleQuiz.quizIndex]!};
        
        if (this.heardleQuiz.quizSettings.isDailyHeardle)
          this.updateDailyHeardleState(true);
      } else {
        (modalRef.componentInstance.result as QuizResult) = { isCorrect: false, isLastQuestion: this.heardleQuiz.quizIndex === 4 || this.heardleQuiz.quizSettings.isDailyHeardle,
          score: this.heardleQuiz.quizScore, track: this.heardleQuiz.quizTracks[this.heardleQuiz.quizIndex]!};
        
        if (this.heardleQuiz.quizSettings.isDailyHeardle)
          this.updateDailyHeardleState(false);
      }
    }

    modalRef.closed.subscribe(() => {
      this.selectedAnswer = null;
      this.filter = null;
      this.heardleQuiz.quizIndex++;

      if (this.heardleQuiz.quizTracks[this.heardleQuiz.quizIndex])
        this.startTimer();
    });

    modalRef.dismissed.subscribe(() => {
      modalRef.close();
    });
  }
  
  handleKeyUp(event: Event): void {
    const key: KeyboardEvent = event as KeyboardEvent;

    if (this.filter!.length > 0 && this.selectedAnswer) {
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
    const filterTerms: string[] = this.filter!.split(' ');

    if (this.filter === "" || this.filter === null) {
      this.filteredTracks = [];
    } else {
      this.isFocused = true;
      this.isFocusedSignal.set(this.isFocused);

      this.filteredTracks = this.heardleQuiz.quizSelection;
      for(let i: number = 0; i < filterTerms.length; i++) {
        const temp: Track[] = [];
        
        for(let j: number = 0; j < this.filteredTracks.length; j++) {
          const artistNames: string = this.tracksService.artistNamesToString(this.filteredTracks[j].artists);
          if (this.tracksService.isIncludesFilter(filterTerms[i], this.filteredTracks[j].name, artistNames))
            temp.push(JSON.parse(JSON.stringify(this.filteredTracks[j])));
        }

        this.filteredTracks = temp;
      }
    }
  }

  
  toggleFocused(): void {
    this.isFocused = !this.isFocused;
    this.isFocusedSignal.set(this.isFocused);
  }

  @HostListener('document:click', ['$event.target'])
  documentClick(targetElement: Node): void {
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
        if (this.musicPlayer.nativeElement.currentTime >= this.heardleQuiz.quizSettings.trackDuration && this.musicPlayer.nativeElement.volume > 0) {
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

  startTimer(): void {
    this.timeLeft = JSON.parse(JSON.stringify(this.heardleQuiz.quizSettings.timer));

    if (!this.isTimerStarted) {
      setTimeout(() => {
        this.isTimerStarted = true;
        
        this.timerInterval = setInterval(() => {
          if (this.isTimerStarted && this.timeLeft > 0.0)
            this.timeLeft--;
          else if (this.isTimerStarted && this.timeLeft <= 0) {
            clearInterval(this.timerInterval);
            this.submitAnswer(true);
          }
        }, 1000);
      }, 500);
    }
  }

  updateDailyHeardleState(isCorrect: boolean): void {
    this.heardleQuiz.dailyHeardleState!.hasDoneTodaysHeardle = true;
    this.heardleQuiz.dailyHeardleState!.lastDateDone = this.heardleQuiz.utcDate;

    if (isCorrect) {
      this.heardleQuiz.dailyHeardleState!.score++;
      this.heardleQuiz.dailyHeardleState!.winStreak++;
    } else {
      this.heardleQuiz.dailyHeardleState!.winStreak = 0;
    }

    localStorage.setItem("dailyHeardleState", JSON.stringify(this.heardleQuiz.dailyHeardleState));
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(): void {
    clearInterval(this.timerInterval);
  }

  @HostListener("window:beforeunload", ["$event"])
  unloadHandler() {
    clearInterval(this.timerInterval);
  }
}
