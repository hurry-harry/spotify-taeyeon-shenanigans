import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { QuizResult } from "../../../models/result-modal.model";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  standalone: true,
  selector: 'app-quiz-answer-modal',
  templateUrl: './quiz-answer.modal.html',
  styleUrls: ['./quiz-answer.modal.scss'],
  imports: [CommonModule]
})
export class QuizAnswerModal implements OnInit {
  @Input() result!: QuizResult;

  activeModal: NgbActiveModal = this.activeModalRef;
  closeButtonText: string = "Close";
  resultMessage: string = "";

  constructor(
    private activeModalRef: NgbActiveModal,
    private router: Router) { }

  ngOnInit(): void {
    if (this.result.isCorrect)
      this.resultMessage = "You got it right!";
    else
      this.resultMessage = "The right answer is..."

    if (this.result.isLastQuestion)
      this.closeButtonText = "Home";
  }

  close(): void {
    if (this.result.isLastQuestion) 
      this.router.navigate(['./home']);
    else 
      this.activeModal.close('Close click')
  }
}