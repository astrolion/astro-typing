import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { ProgressService } from './progress.service';

export interface TypingStats {
  wpm: number;
  cpm: number;
  accuracy: number | '-';
  errorCount: number;
  elapsedTime: number;
}

export interface CharacterStatus {
  char: string;
  status: 'correct' | 'incorrect' | 'upcoming' | 'current';
}

@Injectable({
  providedIn: 'root'
})
export class TypingGameService {
  private readonly easyTexts = [
    "The cat sat on the mat",
    "I like to play games",
    "The sun is bright today",
    "My dog runs fast",
    "We eat good food",
    "The book is on the table",
    "She walks to school",
    "He reads a book",
    "They play in the park",
    "I see a big tree"
  ];

  private readonly mediumTexts = [
    "The quick brown fox jumps over the lazy dog",
    "Learning to code requires practice and patience",
    "The computer processes information very quickly",
    "Programming languages help create applications",
    "The internet connects people around the world",
    "Technology changes how we live and work",
    "Digital devices store important information",
    "Software development needs careful planning",
    "Computer science teaches problem solving",
    "Modern technology makes life easier"
  ];

  private readonly hardTexts = [
    "The quick brown fox jumps over the lazy dog!",
    "Programming is the process of creating a set of instructions that tell a computer how to perform a task.",
    "The best way to predict the future is to invent it.",
    "Learning to code is learning to create and innovate.",
    "Practice makes perfect, especially in typing and programming.",
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The more you code, the better you become at solving problems.",
    "Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.",
    "The best error message is the one that never shows up.",
    "Complex algorithms require careful implementation and thorough testing.",
    "Debugging is twice as hard as writing the code in the first place.",
    "Premature optimization is the root of all evil in programming.",
    "The most disastrous thing that you can ever learn is your first programming language.",
    "The best way to learn programming is to write programs.",
    "Programming is not about typing, it's about thinking.",
    "The only way to learn a new programming language is by writing programs in it.",
    "The most important skill for a programmer is the ability to learn.",
    "Programming is the art of telling another human what one wants the computer to do.",
    "The best error message is the one that never shows up."
  ];

  private currentText = '';
  private characterStatusesSubject = new BehaviorSubject<CharacterStatus[]>([]);
  private currentIndexSubject = new BehaviorSubject<number>(0);
  private startTime?: number;
  private timerSubscription?: Subscription;
  private statsSubject = new BehaviorSubject<TypingStats>({
    wpm: 0,
    cpm: 0,
    accuracy: '-',
    errorCount: 0,
    elapsedTime: 0
  });
  private isGameCompleteSubject = new BehaviorSubject<boolean>(false);
  private isNewTextLoaded = new BehaviorSubject<boolean>(false);
  private correctCharacters = 0;
  private totalCharacters = 0;
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  constructor(private progressService: ProgressService) {
    this.resetGame();
  }

  resetGame() {
    this.characterStatusesSubject.next([]);
    this.currentIndexSubject.next(0);
    this.statsSubject.next({
      wpm: 0,
      cpm: 0,
      accuracy: '-',
      errorCount: 0,
      elapsedTime: 0
    });
    this.isGameCompleteSubject.next(false);
    this.timerSubscription?.unsubscribe();
    this.startTime = undefined;
    this.correctCharacters = 0;
    this.totalCharacters = 0;
    this.loadNewText();
  }

  setDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
    this.difficulty = difficulty;
    this.loadNewText();
  }

  private loadNewText() {
    let texts: string[];
    switch (this.difficulty) {
      case 'easy':
        texts = this.easyTexts;
        break;
      case 'medium':
        texts = this.mediumTexts;
        break;
      case 'hard':
        texts = this.hardTexts;
        break;
      default:
        texts = this.mediumTexts;
    }

    const randomIndex = Math.floor(Math.random() * texts.length);
    this.currentText = texts[randomIndex];
    const newStatuses: CharacterStatus[] = this.currentText.split('').map((char) => ({
      char,
      status: 'upcoming'
    }));
    this.characterStatusesSubject.next(newStatuses);
    this.currentIndexSubject.next(0);
    this.statsSubject.next({
      wpm: 0,
      cpm: 0,
      accuracy: '-',
      errorCount: 0,
      elapsedTime: 0
    });
    this.isGameCompleteSubject.next(false);
    this.isNewTextLoaded.next(true);
  }

  getCharacterStatuses(): Observable<CharacterStatus[]> {
    return this.characterStatusesSubject.asObservable();
  }

  getCurrentIndex(): Observable<number> {
    return this.currentIndexSubject.asObservable();
  }

  getStats(): Observable<TypingStats> {
    return this.statsSubject.asObservable();
  }

  getIsGameComplete(): Observable<boolean> {
    return this.isGameCompleteSubject.asObservable();
  }

  getIsNewTextLoaded(): Observable<boolean> {
    return this.isNewTextLoaded.asObservable();
  }

  processInput(inputChar: string): void {
    if (this.isGameCompleteSubject.value && this.isNewTextLoaded.value) {
      this.loadNewText();
      this.isNewTextLoaded.next(false);
      return;
    }

    if (this.currentIndexSubject.value === 0 && !this.startTime) {
      this.startTime = Date.now();
      this.startTimer();
    }

    const currentStatuses = this.characterStatusesSubject.value.slice();
    const currentIndex = this.currentIndexSubject.value;

    if (currentIndex < currentStatuses.length) {
      const currentChar = currentStatuses[currentIndex];
      if (inputChar === currentChar.char) {
        currentChar.status = 'correct';
      } else {
        currentChar.status = 'incorrect';
        const currentStats = this.statsSubject.value;
        this.statsSubject.next({
          ...currentStats,
          errorCount: currentStats.errorCount + 1
        });
      }
      this.characterStatusesSubject.next(currentStatuses);
      this.updateStats();

      // Move to next character
      this.currentIndexSubject.next(currentIndex + 1);

      // If finished
      if (currentIndex + 1 === currentStatuses.length) {
        this.completeGame();
      }
    }
  }

  private startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.startTime) {
        const currentStats = this.statsSubject.value;
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        this.statsSubject.next({
          ...currentStats,
          elapsedTime
        });
      }
    });
  }

  private updateStats(): void {
    if (!this.startTime) return;

    const elapsedTime = (Date.now() - this.startTime) / 1000 / 60; // in minutes
    const correctChars = this.characterStatusesSubject.value.filter(c => c.status === 'correct').length;
    
    // Calculate WPM and CPM with more precision
    const wpm = Math.round((correctChars / 5) / elapsedTime);
    const cpm = Math.round(correctChars / elapsedTime);
    
    // Calculate accuracy based on total characters and errors
    const totalChars = this.currentText.length;
    const errorCount = this.statsSubject.value.errorCount;
    
    // Calculate accuracy percentage: (totalChars - errorCount) / totalChars * 100
    const accuracy: number | '-' = totalChars > 0 
      ? Math.round(((totalChars - errorCount) / totalChars) * 100)
      : '-';

    const newStats: TypingStats = {
      wpm: isFinite(wpm) ? wpm : 0,
      cpm: isFinite(cpm) ? cpm : 0,
      accuracy,
      errorCount,
      elapsedTime: Math.floor((Date.now() - this.startTime) / 1000)
    };

    this.statsSubject.next(newStats);
  }

  private completeGame(): void {
    this.isGameCompleteSubject.next(true);
    this.timerSubscription?.unsubscribe();
    
    // Save the session to progress
    const stats = this.statsSubject.value;
    this.progressService.addSession(stats, this.difficulty);
  }
}