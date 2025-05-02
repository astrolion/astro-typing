import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ProgressService, TypingSession } from '../../services/progress.service';
import { LineChartModule } from '@swimlane/ngx-charts';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import * as d3 from 'd3';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

type ChartParameter = 'wpm' | 'cpm' | 'accuracy' | 'errors' | 'timeElapsed';

@Component({
  selector: 'app-progress-charts',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    LineChartModule,
    FormsModule,
    MatSlideToggleModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Progress Chart</h2>
      <div class="header-actions">
        <mat-form-field>
          <mat-label>Chart Parameter</mat-label>
          <mat-select [(ngModel)]="selectedParameter" (selectionChange)="updateChartData()">
            <mat-option value="wpm">Words Per Minute (WPM)</mat-option>
            <mat-option value="cpm">Characters Per Minute (CPM)</mat-option>
            <mat-option value="accuracy">Accuracy (%)</mat-option>
            <mat-option value="errors">Error Count</mat-option>
            <mat-option value="timeElapsed">Time Elapsed (s)</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-icon-button (click)="onClose()" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    <mat-dialog-content style="width:100%;max-width:100vw;overflow-x:hidden;">
      <ngx-charts-line-chart
        [results]="chartData"
        [xAxis]="true"
        [yAxis]="true"
        [showXAxisLabel]="true"
        [showYAxisLabel]="true"
        [xAxisLabel]="'Test Number'"
        [yAxisLabel]="getYAxisLabel()"
        [autoScale]="true"
        [roundDomains]="true"
        [timeline]="true"
        [showDots]="true"
        [tooltipDisabled]="false"
        [tooltipTemplate]="tooltipTemplate"
        [scheme]="'cool'"
        [animations]="true"
        [gradient]="true"
        [showGridLines]="true"
        [curve]="curve"
        [legend]="false"
        style="width:100%;min-width:0;">
      </ngx-charts-line-chart>
    </mat-dialog-content>
  `,
  styles: [`
    :host {
      display: block;
      padding: 20px;
      width: 100%;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    ngx-charts-line-chart {
      height: 500px;
      width: 100%;
      min-width: 0;
    }
    mat-form-field {
      width: 250px;
    }
    ::ng-deep .ngx-charts {
      .tooltip-anchor {
        fill: #333;
      }
      .tooltip-box {
        fill: #333;
        stroke: #333;
      }
      .tooltip-label {
        fill: white;
        font-size: 12px;
      }
      .grid-panel {
        stroke: rgba(0, 0, 0, 0.1);
      }
      .tick {
        stroke: rgba(0, 0, 0, 0.1);
      }
      .tick text {
        fill: #666;
        font-size: 12px;
      }
      .axis-label {
        fill: #666;
        font-size: 12px;
      }
    }
  `]
})
export class ProgressChartsComponent implements OnInit {
  selectedParameter: ChartParameter = 'wpm';
  chartData: any[] = [];
  sessions: TypingSession[] = [];
  curve = d3.curveCardinal;

  constructor(
    private progressService: ProgressService,
    private dialogRef: MatDialogRef<ProgressChartsComponent>
  ) {}

  ngOnInit() {
    this.sessions = this.progressService.getLastSessions(10);
    this.updateChartData();
  }

  updateChartData() {
    this.chartData = [{
      name: this.getParameterName(),
      series: this.sessions.map((session, index) => ({
        name: `${index + 1}`,
        value: this.getParameterValue(session),
        extra: {
          wpm: session.stats.wpm,
          cpm: session.stats.cpm,
          accuracy: typeof session.stats.accuracy === 'number' ? session.stats.accuracy : 0,
          errors: session.stats.errorCount,
          timeElapsed: session.stats.elapsedTime,
          difficulty: session.difficulty
        }
      }))
    }];
  }

  private getParameterValue(session: TypingSession): number {
    switch (this.selectedParameter) {
      case 'wpm':
        return session.stats.wpm;
      case 'cpm':
        return session.stats.cpm;
      case 'accuracy':
        return typeof session.stats.accuracy === 'number' ? session.stats.accuracy : 0;
      case 'errors':
        return session.stats.errorCount;
      case 'timeElapsed':
        return session.stats.elapsedTime;
      default:
        return 0;
    }
  }

  private getParameterName(): string {
    switch (this.selectedParameter) {
      case 'wpm':
        return 'Words Per Minute';
      case 'cpm':
        return 'Characters Per Minute';
      case 'accuracy':
        return 'Accuracy';
      case 'errors':
        return 'Error Count';
      case 'timeElapsed':
        return 'Time Elapsed';
      default:
        return '';
    }
  }

  getYAxisLabel(): string {
    switch (this.selectedParameter) {
      case 'wpm':
        return 'WPM';
      case 'cpm':
        return 'CPM';
      case 'accuracy':
        return 'Accuracy (%)';
      case 'errors':
        return 'Errors';
      case 'timeElapsed':
        return 'Time (s)';
      default:
        return '';
    }
  }

  tooltipTemplate(data: any): string {
    const extra = data.extra;
    return `
      <div class="tooltip-container">
        <div class="tooltip-header">${data.name}</div>
        <div class="tooltip-content">
          <div class="tooltip-row">
            <span class="tooltip-label">WPM:</span>
            <span class="tooltip-value">${extra.wpm}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">CPM:</span>
            <span class="tooltip-value">${extra.cpm}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Accuracy:</span>
            <span class="tooltip-value">${extra.accuracy}%</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Errors:</span>
            <span class="tooltip-value">${extra.errors}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Time:</span>
            <span class="tooltip-value">${extra.timeElapsed}s</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Difficulty:</span>
            <span class="tooltip-value">${extra.difficulty}</span>
          </div>
        </div>
      </div>
    `;
  }

  onClose() {
    this.dialogRef.close();
  }
} 