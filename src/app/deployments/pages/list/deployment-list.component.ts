import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ChangeDependenciesDialog } from '../../components/change-dependencies-dialog/change-dependencies-dialog';
import { Deployment } from '../../models/deployment_models';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { JobResponse } from 'src/app/core/models/module.models';
import { JobLoaderModalComponent } from '../../../core/components/job-loader-modal/job-loader-modal.component';

@Component({
  selector: 'deployment-list',
  templateUrl: './deployment-list.component.html',
  styleUrls: ['./deployment-list.component.css']
})
export class DeploymentListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<Deployment>();
  selection = new SelectionModel<Deployment>(true, []);
  ready: Boolean = false;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['status', 'name', 'created', 'info', 'edit', 'start', 'stop', 'delete']
  
  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    public utilsService: UtilService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
      this.loadDeployments(false);
      this.interval = setInterval(() => { 
        this.loadDeployments(true); 
      }, 5000);
  }

  ngOnDestroy(): void {
      clearTimeout(this.interval)
  }

  ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = (row: Deployment, sortHeaderId: string) => {
      var value = (<any>row)[sortHeaderId];
      value = (typeof(value) === 'string') ? value.toUpperCase(): value;
      if(sortHeaderId == 'status') {
        value = row.stopped ? 0 : 1
      }
      return value
    };
    this.dataSource.sort = this.sort;
  }

  loadDeployments(background: boolean): void {
    if(!background) {
      this.ready = false;
    }

    this.moduleService.loadDeployments().subscribe(
      {
        next: (deployments) => {
          this.dataSource.data = deployments
          this.ready = true
        }, 
        error: (err) => {
          this.errorService.handleError(DeploymentListComponent.name, "loadDeployments", err)
          this.ready = true
        }
      }
    )
  }

  checkJobStatus(jobID: string, message: string) {
    var dialogRef = this.dialog.open(JobLoaderModalComponent, {data: {jobID: jobID, message: message}});
    
    dialogRef?.afterClosed().subscribe(jobIsCompleted => {
      if(jobIsCompleted) {
        this.loadDeployments(false)
      }
    });
  }

  stop(deploymentID: string) {
    var dialogRef = this.dialog.open(ChangeDependenciesDialog, {data: {status_change: 'stop'}});
    dialogRef?.afterClosed().subscribe(result => {
      var changeDependency = result['changeDependency']
      this.moduleService.stopDeployment(deploymentID, changeDependency).subscribe(
        {
          next: (jobID) => {
            // Stop results in a job which needs to be polled 
            var message = "Deployment deletion is running"
            this.checkJobStatus(jobID, message)
          },
          error: (err) => {
            this.errorService.handleError(DeploymentListComponent.name, "stopDeployment", err)
          }
        }
      )
    })
  }

  start(deploymentID: string) {
    this.ready = false
    this.moduleService.startDeployment(deploymentID).subscribe(
      {
        next: (_) => {
          this.loadDeployments(false)
        },
        error: (err) => {
          this.errorService.handleError(DeploymentListComponent.name, "start", err)
          this.ready = true
        }
      }
    )
  }

  delete(deploymentID: string) {
    this.ready = false
    this.moduleService.deleteDeployment(deploymentID).subscribe(
      {
        next: (_) => {
          this.loadDeployments(false)
        },
        error:(err) => {
          this.errorService.handleError(DeploymentListComponent.name, "delete", err)
          this.ready = true
        }
      }
    )
  }
}
