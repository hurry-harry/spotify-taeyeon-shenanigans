import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthorizedComponent } from './components/authorized/authorized.component';
import { StatsComponent } from './components/stats/stats.component';
import { PlayComponent } from './components/play/play.component';
import { AuthGuard } from './_shared/guards/auth.guard';
import { CallbackComponent } from './components/callback/callback/callback.component';
import { LoadingComponent } from './components/loading/loading.component';
import { DailyHeardleComponent } from './components/daily-heardle/daily-heardle.component';

export const routes: Routes = [
    { path: "", component: LoginComponent },
    { path: "callback", component: CallbackComponent },
    { path: "daily", component: DailyHeardleComponent },
    { path: "home", component: HomeComponent, canActivate: [AuthGuard] },
    { path: "authorized", component: AuthorizedComponent, canActivate: [AuthGuard] },
    { path: "stats", component: StatsComponent, canActivate: [AuthGuard] },
    { path: "play", component: PlayComponent, canActivate: [AuthGuard] },
    { path: "loading", component: LoadingComponent },
    { path: "**", redirectTo: "home" }
];
