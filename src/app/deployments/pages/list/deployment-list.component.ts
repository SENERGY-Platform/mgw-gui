import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Deployment, DeploymentHealth, DeploymentWithHealth } from '../../models/deployment_models';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { catchError, map, of} from 'rxjs';

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
  displayColumns = ['select', 'name', 'created', 'updated', 'status', 'start', 'stop', 'restart', 'info', 'edit', 'delete', 'show']
  selection = new SelectionModel<Deployment>(true, []);

  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    public utilsService: UtilService,
    private errorService: ErrorService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
      this.loadDeployments(false);
      this.startPeriodicRefresh()
      this.init = false
  }

  ngOnDestroy(): void {
    this.stopPeriodicRefresh()
  }

  startPeriodicRefresh() {
    this.stopPeriodicRefresh()
    this.interval = setInterval(() => { 
      this.loadDeployments(true); 
      console.log(this.selection)
    }, 5000);
  }

  markRowsAsSelected() {

  }

  stopPeriodicRefresh() {
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

  loadDeployments(background: boolean): void {
    this.moduleService.loadDeployments().subscribe(
      {
        next: (deployments) => {
          if(!!deployments) {
            this.loadDeploymentHealthStates(deployments, background)
          } else {
            this.dataSource.data = []
            this.ready = true
          }
        }, 
        error: (err) => {
          if(!background) {
            this.errorService.handleError(DeploymentListComponent.name, "loadDeployments", err)
          }
          this.ready = true
        }
      }
    )
  }

  loadDeploymentHealthStates(deployments: Deployment[], background: boolean) {
    this.moduleService.getDeploymentsHealth().subscribe(
      {
        next: (deploymentHealthStates) => {
          var deploymentsWithHealth: DeploymentWithHealth[] = []
          
          deployments.forEach(deployment => {
            var deploymentHealth = deploymentHealthStates[deployment.id]

            var deploymentWithHealth = {
              ...deploymentHealth,
              ...deployment
            }
            deploymentsWithHealth.push(deploymentWithHealth)
          });

          this.dataSource.data = deploymentsWithHealth
          this.ready = true
        },
        error: (err) => {
          if(!background) {
            this.errorService.handleError(DeploymentListComponent.name, "loadDeploymentHealthStates", err)
          }

          var deploymentsWithHealth: DeploymentWithHealth[] = []
          
          deployments.forEach(deployment => {
            var deploymentHealth: DeploymentHealth = {"status": "unknown", containers: []}

            var deploymentWithHealth = {
              ...deploymentHealth,
              ...deployment
            }
            deploymentsWithHealth.push(deploymentWithHealth)
          });

          this.dataSource.data = deploymentsWithHealth
          this.ready = true
        }
      }
    )

  }

  stop(deploymentID: string) {
    this.ready = false;
    this.stopPeriodicRefresh()

    this.utilsService.askForConfirmation("Do you want to force stop?").subscribe(forceConfirmed => {
      this.moduleService.stopDeployment(deploymentID, forceConfirmed).subscribe(
        {
          next: (jobID) => {
            // Stop results in a job which needs to be polled 
            var message = "Deployment is stopping"
            var self = this
            this.utilsService.checkJobStatus(jobID, message, function() {
              self.loadDeployments(false)
              self.startPeriodicRefresh()
            })
          },
          error: (err) => {
            this.errorService.handleError(DeploymentListComponent.name, "stop", err)
            this.ready = true
          }
        }
      )
    })
  }

  stopMultiple() {
    this.ready = false;
    this.stopPeriodicRefresh()

    const ids: string[] = [];

    this.utilsService.askForConfirmation("Do you want to force stop?").subscribe(forceConfirmed => {
      this.selection.selected.forEach((deployment: Deployment) => {
        ids.push(deployment.id);
      });
              
      this.moduleService.stopDeployments(ids, forceConfirmed).pipe(
        map(jobID => {
          var message = "Deployments are stopping"
          var self = this
          this.utilsService.checkJobStatus(jobID, message, function() {
            self.loadDeployments(false)
            self.startPeriodicRefresh()
          })
        }),
        catchError(err => {
          this.errorService.handleError(DeploymentListComponent.name, "stopDeployments", err)
          this.ready = true
          return of()
        })
      ).subscribe()
    })
  }

  start(deploymentID: string) {
    this.ready = false
    this.stopPeriodicRefresh()

    this.moduleService.startDeployment(deploymentID, true).subscribe(
      {
        next: (_) => {
          this.loadDeployments(false)
          this.startPeriodicRefresh()
        },
        error: (err) => {
          this.errorService.handleError(DeploymentListComponent.name, "start", err)
          this.ready = true
        }
      }
    )
  }

  startMultiple() {
    this.ready = false;
    this.stopPeriodicRefresh()

    const ids: string[] = [];

    this.selection.selected.forEach((deployment: Deployment) => {
      ids.push(deployment.id);
    });
            
    this.moduleService.startDeployments(ids, true).pipe(
      map(_ => {
        this.loadDeployments(false)
        this.startPeriodicRefresh()
      }),
      catchError(err => {
        this.errorService.handleError(DeploymentListComponent.name, "startMultiple", err)
        this.ready = true
        return of()
      })
    ).subscribe()
  }

  restart(deploymentID: string) {
    this.stopPeriodicRefresh()
    this.moduleService.restartDeployment(deploymentID).subscribe(
      {
        next: (jobID) => {
          // Stop results in a job which needs to be polled 
          var message = "Deployment is restarting"
          var self = this
          this.utilsService.checkJobStatus(jobID, message, function() {
            self.loadDeployments(false)
            self.startPeriodicRefresh()
          })
        },
        error: (err) => {
          this.errorService.handleError(DeploymentListComponent.name, "restart", err)
          this.ready = true
        }
      }
    )
  }

  restartMultiple() {
    this.ready = false;
    this.stopPeriodicRefresh()

    const ids: string[] = [];

    this.selection.selected.forEach((deployment: Deployment) => {
      ids.push(deployment.id);
    });
            
    this.moduleService.restartDeployments(ids).pipe(
      map(jobID => {
        var message = "Deployments are restarting"
        var self = this
        this.utilsService.checkJobStatus(jobID, message, function() {
          self.loadDeployments(false)
          self.startPeriodicRefresh()
        })
      }),
      catchError(err => {
        this.errorService.handleError(DeploymentListComponent.name, "restartMultiple", err)
        this.ready = true
        return of()
      })
    ).subscribe()
  }

  delete(deploymentID: string) {
    this.ready = false
    this.stopPeriodicRefresh()

    this.utilsService.askForConfirmation("Do you want to force delete?").subscribe(forceConfirmed => {
      this.moduleService.deleteDeployment(deploymentID, forceConfirmed).subscribe(
        {
          next: (_) => {
            this.loadDeployments(false)
            this.startPeriodicRefresh()
          },
          error:(err) => {
            this.errorService.handleError(DeploymentListComponent.name, "delete", err)
            this.ready = true
          }
        }
      )
    })
  }

  deleteMultiple() {
    this.ready = false;
    this.stopPeriodicRefresh()

    const ids: string[] = [];

    this.utilsService.askForConfirmation("Do you want to force delete?").subscribe(forceConfirmed => {
      this.selection.selected.forEach((deployment: Deployment) => {
        ids.push(deployment.id);
      });
              
      this.moduleService.deleteDeployments(ids, forceConfirmed).pipe(
        map(_ => {
          this.loadDeployments(false)
          this.startPeriodicRefresh()
        }),
        catchError(err => {
          this.errorService.handleError(DeploymentListComponent.name, "deleteMultiple", err)
          this.ready = true
          return of()
        })
      ).subscribe()
    })
  }

  showInstances(deploymentID: string) {
    this.router.navigate(["/deployments/show/" + deploymentID])
  }


  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSource.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
      if (this.isAllSelected()) {
          this.selectionClear();
      } else {
          this.dataSource.connect().value.forEach((row) => this.selection.select(row));
      }
  }

  selectionClear(): void {
      this.selection.clear();
  }
}
