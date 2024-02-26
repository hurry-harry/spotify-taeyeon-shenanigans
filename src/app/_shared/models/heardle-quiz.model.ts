import { DailyHeardleState } from "./daily-heardle.model";
import { QuizSettings } from "./quiz.model";
import { Track } from "./spotify.model";

export interface HeardleQuiz {
  quizSettings: QuizSettings;
  quizSelection: Track[];
  quizTracks: Track[];
  quizIndex: number;
  quizScore: number;
  utcDate: Date | null;
  dailyHeardleState: DailyHeardleState | null;
  dailyHeardleDayCount: number | null;
}