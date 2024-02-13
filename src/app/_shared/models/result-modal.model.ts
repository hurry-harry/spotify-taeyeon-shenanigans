import { Track } from "./user-top-items-response.model";

export interface QuizResult {
  isCorrect: boolean;
  isLastQuestion: boolean;

  track: Track;
  score: number;
}