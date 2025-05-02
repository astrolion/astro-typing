import { Injectable } from '@angular/core';
import { TypingGameService, TypingStats } from './typing-game.service';

export interface TypingSession {
  id: string;
  testId: number;
  date: string;
  timestamp: number;
  stats: TypingStats;
  difficulty: 'easy' | 'medium' | 'hard';
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly STORAGE_KEY = 'typingSessions';
  private readonly TEST_ID_KEY = 'typingTestIdCounter';
  private sessions: TypingSession[] = [];
  private testIdCounter: number = 1;

  constructor() {
    this.loadSessions();
    this.loadTestIdCounter();
  }

  private loadSessions() {
    const savedSessions = localStorage.getItem(this.STORAGE_KEY);
    if (savedSessions) {
      this.sessions = JSON.parse(savedSessions);
    }
  }

  private saveSessions() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessions));
    localStorage.setItem(this.TEST_ID_KEY, this.testIdCounter.toString());
  }

  private loadTestIdCounter() {
    const savedCounter = localStorage.getItem(this.TEST_ID_KEY);
    if (savedCounter) {
      this.testIdCounter = parseInt(savedCounter, 10) || 1;
    }
  }

  addSession(stats: TypingStats, difficulty: 'easy' | 'medium' | 'hard') {
    const session: TypingSession = {
      id: this.generateSessionId(),
      testId: this.testIdCounter++,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      stats,
      difficulty
    };
    
    this.sessions.unshift(session); // Add to beginning of array
    if (this.sessions.length > 10) {
      this.sessions = this.sessions.slice(0, 10); // Keep only last 10 sessions
    }
    
    this.saveSessions();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getLastSessions(count: number = 10): TypingSession[] {
    return this.sessions.slice(0, count);
  }

  getTodaySessions(): TypingSession[] {
    const today = new Date().toISOString().split('T')[0];
    return this.sessions.filter(session => 
      session.date.startsWith(today)
    );
  }

  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.sessions = [];
  }
} 