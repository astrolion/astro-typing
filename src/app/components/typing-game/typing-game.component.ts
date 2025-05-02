import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { TypingGameService, TypingStats, CharacterStatus } from '../../services/typing-game.service';
import { ProgressComponent } from '../progress/progress.component';
import { ProgressChartsComponent } from '../progress-charts/progress-charts.component';
import { Subscription, Observable } from 'rxjs';
import { ProgressService } from '../../services/progress.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-typing-game',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatGridListModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatListModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule
  ],
  templateUrl: './typing-game.component.html',
  styleUrls: ['./typing-game.component.css'],
  animations: [
    trigger('statsAnimation', [
      state('normal', style({
        transform: 'scale(1)',
        opacity: 1
      })),
      state('completed', style({
        transform: 'scale(1.1)',
        opacity: 1
      })),
      transition('normal => completed', [
        animate('0.3s ease-in-out')
      ])
    ])
  ]
})
export class TypingGameComponent implements OnInit, OnDestroy {
  text: string = '';
  characterStatuses: CharacterStatus[] = [];
  currentIndex: number = 0;
  startTime: number | null = null;
  stats: TypingStats = {
    wpm: 0,
    cpm: 0,
    accuracy: '-',
    errorCount: 0,
    elapsedTime: 0
  };
  isGameComplete: boolean = false;
  showProgressBar: boolean = true;
  showStats: boolean = true;
  autoLoadNewText: boolean = false;
  textDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  statsAnimationState: 'normal' | 'completed' = 'normal';

  private subscriptions: Subscription[] = [];

  constructor(
    private typingGameService: TypingGameService,
    private dialog: MatDialog,
    private progressService: ProgressService
  ) {}

  ngOnInit() {
    // Load saved settings
    const savedSettings = localStorage.getItem('typingGameSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.showProgressBar = settings.showProgressBar;
      this.showStats = settings.showStats;
      this.autoLoadNewText = settings.autoLoadNewText;
      this.textDifficulty = settings.textDifficulty as 'easy' | 'medium' | 'hard';
      this.typingGameService.setDifficulty(this.textDifficulty);
    }

    this.subscriptions.push(
      this.typingGameService.getCharacterStatuses().subscribe(statuses => {
        this.characterStatuses = statuses;
        this.text = statuses.map(s => s.char).join('');
      }),
      this.typingGameService.getCurrentIndex().subscribe(index => {
        this.currentIndex = index;
      }),
      this.typingGameService.getStats().subscribe(stats => {
        this.stats = stats;
      }),
      this.typingGameService.getIsGameComplete().subscribe(isComplete => {
        this.isGameComplete = isComplete;
        if (isComplete) {
          this.statsAnimationState = 'completed';
          if (this.autoLoadNewText) {
            setTimeout(() => {
              this.statsAnimationState = 'normal';
              this.resetGame();
            }, 3000);
          }
        } else {
        }
      })
    );

    this.loadNewText();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key.length === 1 || event.key === 'Backspace') {
      this.typingGameService.processInput(event.key);
    }
  }

  getProgressPercentage(): number {
    return (this.currentIndex / this.characterStatuses.length) * 100;
  }

  isCurrentChar(char: CharacterStatus): boolean {
    return this.characterStatuses.indexOf(char) === this.currentIndex;
  }

  getDisplayChar(char: CharacterStatus): string {
    return char.char === ' ' ? '␣' : char.char;
  }

  resetGame() {
    this.typingGameService.resetGame();
  }

  onSettingsChange() {
    // Save settings to localStorage for persistence
    localStorage.setItem('typingGameSettings', JSON.stringify({
      showProgressBar: this.showProgressBar,
      showStats: this.showStats,
      autoLoadNewText: this.autoLoadNewText,
      textDifficulty: this.textDifficulty
    }));
  }

  onDifficultyChange(difficulty: 'easy' | 'medium' | 'hard') {
    this.textDifficulty = difficulty;
    this.onSettingsChange();
    this.typingGameService.setDifficulty(difficulty);
    this.resetGame();
  }

  openProgressDialog() {
    this.dialog.open(ProgressComponent, {
      width: '1200px',
      maxHeight: '90vh',
      panelClass: 'progress-dialog'
    });
  }

  openProgressChartsDialog() {
    this.dialog.open(ProgressChartsComponent, {
      width: '1200px',
      maxHeight: '95vh',
      panelClass: 'progress-dialog'
    });
  }

  private initializeText(text: string) {
    this.text = text;
    this.currentIndex = 0;
    this.startTime = null;
    this.stats = {
      wpm: 0,
      cpm: 0,
      accuracy: '-',
      errorCount: 0,
      elapsedTime: 0
    };
    this.isGameComplete = false;
  }

  loadNewText() {
    this.typingGameService.getIsNewTextLoaded().subscribe(() => {
      this.typingGameService.getCharacterStatuses().subscribe(statuses => {
        this.initializeText(statuses.map(s => s.char).join(''));
      });
    });
  }
}

styles: [`
  .typing-area {
    padding: 20px;
    border-radius: 8px;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }
  .text-display {
    font-family: monospace;
    font-size: 24px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    letter-spacing: 0;
  }
  .char {
    display: inline;
    position: relative;
    letter-spacing: 0;
  }
  .char.correct {
    color: #4caf50;
  }
  .char.incorrect {
    color: #f44336;
    text-decoration: underline;
  }
  .char.current {
    background-color: rgba(33, 150, 243, 0.1);
  }
  .char:empty::before {
    content: ' ';
    white-space: pre;
  }
  .complete .char {
    color: #4caf50;
  }
  .stats-panel {
    margin-bottom: 20px;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .stat-label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #666;
    font-size: 14px;
  }
  .stat-value {
    font-size: 24px;
    font-weight: 500;
    color: #333;
  }
  .info-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    color: #999;
  }
  .settings-panel {
    margin-top: 20px;
  }
  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  .progress-bar {
    margin-bottom: 20px;
  }
  .completed .stat-value {
    color: #4caf50;
  }
`] 