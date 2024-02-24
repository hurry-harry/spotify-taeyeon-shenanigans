import { UserProfileResponse } from "./user-profile-response.model";

export interface DailyHeardleState {
  hasDoneTodaysHeardle: boolean;
  lastDateDone: Date | null;
  score: number;
  winStreak: number;
  user: UserProfileResponse;
}