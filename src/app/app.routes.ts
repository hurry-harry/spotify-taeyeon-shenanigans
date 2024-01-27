import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthorizedComponent } from './components/authorized/authorized.component';
import { StatsComponent } from './components/stats/stats.component';
import { PlayComponent } from './components/play/play.component';

export const routes: Routes = [
    { path: "", component: LoginComponent },
    { path: "home", component: HomeComponent },
    { path: "authorized", component: AuthorizedComponent },
    { path: "stats", component: StatsComponent },
    { path: "play", component: PlayComponent },
    { path: "**", redirectTo: "" }
];
