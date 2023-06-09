import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Job } from '../models/job.model';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<Job>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['id', 'description', 'created', 'started', 'completed', 'canceled', 'error', 'cancel']

  constructor(
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private errorService: ErrorService,
  ) {
      this.loadJobs()
      this.interval = setInterval(() => { 
        this.loadJobs(); 
      }, 5000);
      this.init = false
  }

  ngOnDestroy(): void {
      clearTimeout(this.interval)
  }
  

  loadJobs() {
    this.moduleService.getJobs().subscribe({
      next: (jobs) => {
        this.dataSource.data = jobs
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(ListComponent.name, "loadJobs", err)
        this.ready = true
      }
    })
  }

  ngOnInit(): void {
      
  }

  ngAfterViewInit(): void {
      
  }

  cancelJob(jobID: string) {
    this.moduleService.stopJob(jobID).subscribe({
      next: (_) => {
        this.loadJobs()
      },
      error: (err) => {
        this.errorService.handleError(ListComponent.name, "cancelJob", err)
        this.loadJobs()
      }
    })
  }
  
}
