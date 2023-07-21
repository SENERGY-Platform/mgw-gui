import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Deployment, DeploymentWithHealth } from '../../models/deployment_models';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Router } from '@angular/router';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'deployment-list',
  templateUrl: './deployment-list.component.html',
  styleUrls: ['./deployment-list.component.css']
})
export class DeploymentListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<Deployment>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['status', 'name', 'created', 'enabled', 'info', 'edit', 'delete', 'show']
  
  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    public utilsService: UtilService,
    private errorService: ErrorService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
      this.loadDeployments();
      this.interval = setInterval(() => { 
        this.loadDeployments(); 
      }, 5000);
      this.init = false
  }

  ngOnDestroy(): void {
      clearTimeout(this.interval)
  }

  ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = (row: Deployment, sortHeaderId: string) => {
      var value = (<any>row)[sortHeaderId];
      value = (typeof(value) === 'string') ? value.toUpperCase(): value;
      if(sortHeaderId == 'status') {
        value = row.enabled ? 0 : 1
      }
      return value
    };
    this.dataSource.sort = this.sort;
  }

  loadDeployments(): void {
    this.moduleService.loadDeployments().subscribe(
      {
        next: (deployments) => {
          this.loadDeploymentHealthStates(deployments)
        }, 
        error: (err) => {
          this.errorService.handleError(DeploymentListComponent.name, "loadDeployments", err)
          this.ready = true
        }
      }
    )
  }

  loadDeploymentHealthStates(deployments: Deployment[]) {
    this.moduleService.getDeploymentsHealth().subscribe(
      {
        next: (deploymentHealthStates) => {
          var deploymentsWithHealth: DeploymentWithHealth[] = []
          
          deployments.forEach(deployment => {
            var deploymentWithHealth = {
              ...deploymentHealthStates[deployment.id],
              ...deployment
            }
            deploymentsWithHealth.push(deploymentWithHealth)
          });

          this.dataSource.data = deploymentsWithHealth
          this.ready = true
          console.log(deploymentsWithHealth)
        },
        error: (err) => {
          this.errorService.handleError(DeploymentListComponent.name, "loadDeploymentHealthStates", err)
        }
      }
    )

  }

  stop(deploymentID: string) {
    this.moduleService.stopDeployment(deploymentID, false).subscribe(
      {
        next: (jobID) => {
          // Stop results in a job which needs to be polled 
          var message = "Deployment is stopping"
          var self = this
          this.utilsService.checkJobStatus(jobID, message, function() {
            self.loadDeployments()
          })
        },
        error: (err) => {
          this.errorService.handleError(DeploymentListComponent.name, "stop", err)
        }
      }
    )
  }

  start(deploymentID: string) {
    this.ready = false
    this.moduleService.startDeployment(deploymentID).subscribe(
      {
        next: (_) => {
          this.loadDeployments()
        },
        error: (err) => {
          this.errorService.handleError(DeploymentListComponent.name, "start", err)
          this.ready = true
        }
      }
    )
  }

  toggleState(event: MatSlideToggleChange, deploymentID: string) {
    if(event.checked) {
      this.start(deploymentID)
    } else {
      this.stop(deploymentID)
    }
  }

  delete(deploymentID: string) {
    this.ready = false
    this.moduleService.deleteDeployment(deploymentID).subscribe(
      {
        next: (_) => {
          this.loadDeployments()
        },
        error:(err) => {
          this.errorService.handleError(DeploymentListComponent.name, "delete", err)
          this.ready = true
        }
      }
    )
  }

  showInstances(deploymentID: string) {
    this.router.navigate(["/instances/" + deploymentID])
  }
}
