import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ProgressService, TypingSession } from '../../services/progress.service';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSortModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Typing Progress</h2>
        <div class="header-actions">
          <button mat-icon-button (click)="clearHistory()" matTooltip="Clear History">
            <mat-icon>delete</mat-icon>
          </button>
          <button mat-icon-button (click)="onClose()" matTooltip="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      <div class="dialog-content">
        <div class="table-container mat-elevation-z8">
          <table mat-table [dataSource]="dataSource" matSort class="progress-table">
            <!-- Test ID Column -->
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                <div class="column-header">
                  <span>Test ID</span>
                  <mat-icon matTooltip="Unique Test Identifier" class="info-icon">info</mat-icon>
                </div>
              </th>
              <td mat-cell *matCellDef="let element">{{ element.testId }}</td>
            </ng-container>

            <!-- Timestamp Column -->
            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                <div class="column-header">
                  <span>Time Taken</span>
                  <mat-icon matTooltip="Time when test was completed" class="info-icon">info</mat-icon>
                </div>
              </th>
              <td mat-cell *matCellDef="let element">{{formatTimestamp(element.timestamp)}}</td>
            </ng-container>

            <!-- WPM Column -->
            <ng-container matColumnDef="wpm">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                <div class="column-header">
                  <span>WPM</span>
                  <mat-icon matTooltip="Words Per Minute" class="info-icon">info</mat-icon>
                </div>
              </th>
              <td mat-cell *matCellDef="let element">{{element.stats.wpm}}</td>
            </ng-container>

            <!-- CPM Column -->
            <ng-container matColumnDef="cpm">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                <div class="column-header">
                  <span>CPM</span>
                  <mat-icon matTooltip="Characters Per Minute" class="info-icon">info</mat-icon>
                </div>
              </th>
              <td mat-cell *matCellDef="let element">{{element.stats.cpm}}</td>
            </ng-container>

            <!-- Accuracy Column -->
            <ng-container matColumnDef="accuracy">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                <div class="column-header">
                  <span>Accuracy</span>
                  <mat-icon matTooltip="Typing Accuracy" class="info-icon">info</mat-icon>
                </div>
              </th>
              <td mat-cell *matCellDef="let element">{{element.stats.accuracy}}{{typeof element.stats.accuracy === 'number' ? '%' : ''}}</td>
            </ng-container>

            <!-- Errors Column -->
            <ng-container matColumnDef="errors">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                <div class="column-header">
                  <span>Errors</span>
                  <mat-icon matTooltip="Number of Errors" class="info-icon">info</mat-icon>
                </div>
              </th>
              <td mat-cell *matCellDef="let element">{{element.stats.errorCount}}</td>
            </ng-container>

            <!-- Time Column -->
            <ng-container matColumnDef="time">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                <div class="column-header">
                  <span>Duration</span>
                  <mat-icon matTooltip="Time Elapsed (seconds)" class="info-icon">info</mat-icon>
                </div>
              </th>
              <td mat-cell *matCellDef="let element">{{element.stats.elapsedTime}}s</td>
            </ng-container>

            <!-- Difficulty Column -->
            <ng-container matColumnDef="difficulty">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                <div class="column-header">
                  <span>Difficulty</span>
                  <mat-icon matTooltip="Text Difficulty Level" class="info-icon">info</mat-icon>
                </div>
              </th>
              <td mat-cell *matCellDef="let element">
                <span class="difficulty-badge" [class]="element.difficulty">{{element.difficulty}}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                [class.highlight]="row.stats.wpm > 50"
                [class.warning]="row.stats.accuracy < 90"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      padding: 24px;
      box-sizing: border-box;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .dialog-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .table-container {
      flex: 1;
      overflow: auto;
      border-radius: 8px;
      background: white;
    }
    .progress-table {
      width: 100%;
      min-width: 900px;
    }
    .column-header {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .info-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #666;
    }
    .difficulty-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }
    .difficulty-badge.easy {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .difficulty-badge.medium {
      background-color: #fff3e0;
      color: #e65100;
    }
    .difficulty-badge.hard {
      background-color: #ffebee;
      color: #c62828;
    }
    .highlight {
      background-color: #e8f5e9;
    }
    .warning {
      background-color: #fff3e0;
    }
    ::ng-deep .mat-sort-header-container {
      justify-content: center;
    }
    .timestamp {
      font-family: monospace;
      font-size: 14px;
    }
  `]
})
export class ProgressComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  sessions: TypingSession[] = [];
  dataSource = new MatTableDataSource<TypingSession>();
  displayedColumns: string[] = ['id', 'timestamp', 'wpm', 'cpm', 'accuracy', 'errors', 'time', 'difficulty'];

  constructor(
    private progressService: ProgressService,
    private dialogRef: MatDialogRef<ProgressComponent>,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadSessions();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'id':
          return item.id;
        case 'timestamp':
          return item.timestamp;
        case 'wpm':
          return item.stats.wpm;
        case 'cpm':
          return item.stats.cpm;
        case 'accuracy':
          return item.stats.accuracy === '-' ? -1 : item.stats.accuracy;
        case 'errors':
          return item.stats.errorCount;
        case 'time':
          return item.stats.elapsedTime;
        case 'difficulty':
          return item.difficulty;
        default:
          return '';
      }
    };
  }

  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  private loadSessions() {
    this.sessions = this.progressService.getLastSessions();
    this.dataSource.data = this.sessions;
  }

  clearHistory() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Clear History',
        message: 'Are you sure you want to clear all typing history? This action cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.progressService.clearHistory();
        this.loadSessions();
      }
    });
  }

  onClose() {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{data.title}}</h2>
    <mat-dialog-content>{{data.message}}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">No</button>
      <button mat-button color="warn" (click)="onYesClick()">Yes</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
} 