import { Track } from "./spotify.model";

export interface QuizResult {
  isCorrect: boolean;
  isLastQuestion: boolean;

  track: Track;
  score: number;

  
}