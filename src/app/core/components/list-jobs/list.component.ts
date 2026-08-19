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
  MatTableDataSource
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
  error?: { message: string, code: number } | null;
  done: boolean;
}
import {DatePipe, NgIf} from '@angular/common';
import {SpinnerComponent} from '../spinner/spinner.component';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";

@Component({
    selector: 'list-job',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
    imports: [NgIf, SpinnerComponent, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatIconButton, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe, MatCard, MatCardContent, MatCardHeader, MatCardTitle]
})
export class ListJobTable implements OnInit, OnDestroy, AfterViewInit {
  dataSource = new MatTableDataSource<JobRow>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['id', 'description', 'created', 'started', 'completed', 'canceled', 'error', 'cancel']
  @Input() source?: string;

  constructor(
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
    @Inject("CoreManagerService") private coreService: CoreManagerService,
    private errorService: ErrorService,
  ) {
  }

  ngOnDestroy(): void {
    clearTimeout(this.interval)
  }


  loadJobs() {
    this.ready = false;
    if (this.source === 'module-manager') {
      // next-gen job model: only start/end, results live in /results endpoints
      this.moduleService.getJobs().subscribe({
        next: (jobs) => {
          this.dataSource.data = jobs.map(job => ({
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
          this.errorService.handleError(ListJobTable.name, "loadJobs", err)
          this.ready = true
        }
      })
      return
    }

    let obs: Observable<Job[]> = of()
    if (this.source === 'core-manager') {
      obs = this.coreService.getJobs()
    }

    obs.subscribe({
      next: (jobs) => {
        this.dataSource.data = jobs.map(job => ({
          ...job,
          done: !!job.completed || !!job.canceled,
        }));
        this.ready = true;
      },
      error: (err) => {
        this.errorService.handleError(ListJobTable.name, "loadJobs", err)
        this.ready = true
      }
    })
  }

  ngOnInit(): void {
    if (this.source === 'module-manager') {
      // canceled/error columns only exist in the old job model
      this.displayColumns = ['id', 'description', 'started', 'completed', 'cancel']
    }
    this.setupSorting();
    this.init = false
    this.loadJobs()
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

  ngAfterViewInit(): void {

  }

  cancelJob(jobID: string) {
    var obs = this.source === 'core-manager' ? this.coreService.stopJob(jobID) : this.moduleService.stopJob(jobID)
    obs.subscribe({
      next: (_) => {
        this.loadJobs()
      },
      error: (err) => {
        this.errorService.handleError(ListJobTable.name, "cancelJob", err)
        this.loadJobs()
      }
    })
  }

}
