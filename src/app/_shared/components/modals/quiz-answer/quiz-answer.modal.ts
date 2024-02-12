import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Track } from "../../../models/user-top-items-response.model";

@Component({
  standalone: true,
  selector: 'app-quiz-answer-modal',
  templateUrl: './quiz-answer.modal.html',
  styleUrls: ['./quiz-answer.modal.scss'],
})
export class QuizAnswerModal {
  @Input() track!: Track;

  activeModal: NgbActiveModal = this.activeModalRef;

  constructor(private activeModalRef: NgbActiveModal) { }
}