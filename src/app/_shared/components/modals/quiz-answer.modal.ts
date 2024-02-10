import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  standalone: true,
  selector: 'app-quiz-answer-modal',
  templateUrl: './quiz-answer.modal.html',
  styleUrls: ['./quiz-answer.modal.scss'],
})
export class QuizAnswerModal {
  activeModal: NgbActiveModal = this.activeModalRef;

  constructor(private activeModalRef: NgbActiveModal) { }
}