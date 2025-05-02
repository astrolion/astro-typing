import { Routes } from '@angular/router';
import { TypingGameComponent } from './components/typing-game/typing-game.component';
import { ProgressComponent } from './components/progress/progress.component';

export const routes: Routes = [
  { path: '', component: TypingGameComponent },
  { path: 'progress', component: ProgressComponent }
];
