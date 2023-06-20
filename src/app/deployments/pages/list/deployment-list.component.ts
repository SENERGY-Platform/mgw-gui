import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ChangeDependenciesDialog } from '../../components/change-dependencies-dialog/change-dependencies-dialog';
import { Deployment } from '../../models/deployment_models';
import { ErrorService } from 'src/app/core/services/util/error.service';

@Component({
  selector: 'deployment-list',
  templateUrl: './deployment-list.component.html',
  styleUrls: ['./deployment-list.component.css']
})
export class DeploymentListComponent implements OnInit{
  dataSource = new MatTableDataSource<Deployment>();
  selection = new SelectionModel<Deployment>(true, []);
  ready: Boolean = false;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['status', 'name', 'created', 'info', 'edit', 'start', 'stop', 'delete']
  
  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    public utilsService: UtilService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
      this.loadDeployments();
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

  loadDeployments(): void {
    this.ready = false;
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

  askForDependencyAndSendControlRequest(deploymentID: string, status_change: string) {
    var dialogRef = this.dialog.open(ChangeDependenciesDialog, {data: {status_change: status_change}});
    dialogRef?.afterClosed().subscribe(result => {
      var changeDependency = result['changeDependency']
        this.moduleService.controlDeployment(deploymentID, status_change, changeDependency).subscribe(result => {
          this.loadDeployments()
        })
    })
  }

  stop(deploymentID: string) {
    this.askForDependencyAndSendControlRequest(deploymentID, "stop")
  }

  start(deploymentID: string) {
    this.moduleService.controlDeployment(deploymentID, "start", false).subscribe(result => {
      this.loadDeployments()
    })
  }

  delete(deploymentID: string) {
    this.moduleService.deleteDeployment(deploymentID).subscribe(_ => {
      this.loadDeployments()
    })
  }
}
