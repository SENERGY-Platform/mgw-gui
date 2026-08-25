import {AfterViewInit, Component, Inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';
import {Observable, of} from 'rxjs';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {Job} from 'src/app/system/models/job.model';
import {isJobDone} from 'src/app/core/models/jobs';

// Display row shared by the old (core-manager) and next-gen (module-manager) job models.
interface JobRow {
  id: string;
  description: string;
  created?: string | Date;
  started?: string | Date;
  completed?: string | Date;
  canceled?: string | Date;
  error?: {message: string; code: number} | null;
  done: boolean;
}
import {DatePipe} from '@angular/common';
import {SpinnerComponent} from '../spinner/spinner.component';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {StatusPillComponent, StatusTone} from '../status-pill/status-pill.component';

@Component({
  selector: 'list-job',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  imports: [
    SpinnerComponent,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatIconButton,
    MatIcon,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    DatePipe,
    MatTooltip,
    StatusPillComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('core')],
})
export class ListJobTable implements OnInit, OnDestroy, AfterViewInit {
  // human-readable name of the service the jobs belong to - translation
  // keys, not display text; the template applies the `transloco` pipe.
  readonly sourceLabels: Record<string, string> = {
    'module-manager': 'core.listJobs.sources.moduleManager',
    'core-manager': 'core.listJobs.sources.coreManager',
  };

  dataSource = new MatTableDataSource<JobRow>();
  ready = false;
  init = true;
  interval: any;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['job', 'status', 'started', 'finished', 'actions'];
  @Input() source?: string;

  constructor(
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    @Inject('CoreManagerService') private coreService: CoreManagerService,
    private errorService: ErrorService,
  ) {}

  ngOnDestroy(): void {
    clearTimeout(this.interval);
  }

  sourceLabel(): string {
    return this.sourceLabels[this.source || ''] || this.source || 'core.listJobs.sources.fallback';
  }

  statusTone(job: JobRow): StatusTone {
    if (job.error) {
      return 'danger';
    }
    if (job.canceled) {
      return 'idle';
    }
    return job.done ? 'ok' : 'info';
  }

  statusLabel(job: JobRow): string {
    if (job.error) {
      return 'core.listJobs.statuses.failed';
    }
    if (job.canceled) {
      return 'core.listJobs.statuses.canceled';
    }
    return job.done ? 'core.listJobs.statuses.completed' : 'core.listJobs.statuses.running';
  }

  // the finish column shows whichever end state the job reached
  finishedAt(job: JobRow): string | Date | undefined {
    return job.completed || job.canceled;
  }

  loadJobs() {
    this.ready = false;
    if (this.source === 'module-manager') {
      // next-gen job model: only start/end, results live in /results endpoints
      this.moduleService.getJobs().subscribe({
        next: (jobs) => {
          this.dataSource.data = jobs.map((job) => ({
            id: job.id,
            description: job.description,
            created: job.start,
            started: job.start,
            completed: isJobDone(job) ? job.end : undefined,
            done: isJobDone(job),
          }));
          this.ready = true;
        },
        error: (err) => {
          this.errorService.handleError(ListJobTable.name, 'loadJobs', err);
          this.ready = true;
        },
      });
      return;
    }

    let obs: Observable<Job[]> = of();
    if (this.source === 'core-manager') {
      obs = this.coreService.getJobs();
    }

    obs.subscribe({
      next: (jobs) => {
        this.dataSource.data = jobs.map((job) => ({
          ...job,
          done: !!job.completed || !!job.canceled,
        }));
        this.ready = true;
      },
      error: (err) => {
        this.errorService.handleError(ListJobTable.name, 'loadJobs', err);
        this.ready = true;
      },
    });
  }

  ngOnInit(): void {
    if (this.source === 'module-manager') {
      // canceled/error columns only exist in the old job model
      this.displayColumns = ['job', 'status', 'started', 'finished', 'actions'];
    }
    this.setupSorting();
    this.init = false;
    this.loadJobs();
    this.interval = setInterval(() => {
      this.loadJobs();
    }, 1000);
  }

  setupSorting() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'created':
          return new Date(item.created ?? 0);
        default:
          return (item as any)[property];
      }
    };
  }

  ngAfterViewInit(): void {}

  cancelJob(jobID: string) {
    const obs = this.source === 'core-manager' ? this.coreService.stopJob(jobID) : this.moduleService.stopJob(jobID);
    obs.subscribe({
      next: (_) => {
        this.loadJobs();
      },
      error: (err) => {
        this.errorService.handleError(ListJobTable.name, 'cancelJob', err);
        this.loadJobs();
      },
    });
  }
}
