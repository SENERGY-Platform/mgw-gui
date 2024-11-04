import {AfterViewInit, Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
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
import {Job} from 'src/app/mgw-core/models/job.model';
import {DatePipe, NgIf} from '@angular/common';
import {SpinnerComponent} from '../spinner/spinner.component';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'list-job',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [NgIf, SpinnerComponent, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatIconButton, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe]
})
export class ListJobTable implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<Job>();
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
    let obs: Observable<Job[]> = of()
    if (this.source === 'module-manager') {
      obs = this.moduleService.getJobs();
    } else if (this.source === 'core-manager') {
      obs = this.coreService.getJobs()
    }

    obs.subscribe({
      next: (jobs) => {
        this.dataSource.data = jobs;
        this.ready = true;
      },
      error: (err) => {
        this.errorService.handleError(ListJobTable.name, "loadJobs", err)
        this.ready = true
      }
    })
  }

  ngOnInit(): void {
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
          return new Date(item.created);
        default:
          return (item as any)[property];
      }
    };
  }

  ngAfterViewInit(): void {

  }

  cancelJob(jobID: string) {
    this.moduleService.stopJob(jobID).subscribe({
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
