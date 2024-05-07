import { Component, Inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Deployment, DeploymentResponse } from '../../models/deployment_models';
import { AuxDeploymentResponse, AuxDeployment } from '../../models/sub-deployments';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { catchError, concatMap, map, Observable, of, throwError} from 'rxjs';

@Component({
  selector: 'deployment-list',
  templateUrl: './deployment-list.component.html',
  styleUrls: ['./deployment-list.component.css']
})
export class DeploymentListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<Deployment|AuxDeployment>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns: string[] = []
  selection = new SelectionModel<string>(true, []);

  // Sub Deployments
  @Input() isSubDeployment = false;
  @Input() deploymentID = '';

  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    public utilsService: UtilService,
    private errorService: ErrorService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
      this.setupColumns()
      this.loadDeployments(false);
      this.startPeriodicRefresh()
      this.init = false
  }

  ngOnDestroy(): void {
    this.stopPeriodicRefresh()
  }

  setupColumns() {
    let columns = ['select']
    if(this.isSubDeployment === false) {
      columns.push("status_deployment")
    } else {
      columns.push("status_sub_deployment")
    }
    columns = columns.concat('name', 'start', 'stop', 'restart', 'delete', 'info')
    if(this.isSubDeployment === false) {
      columns.push("edit")
    } 
    this.displayColumns = columns;
  }

  startPeriodicRefresh() {
    this.stopPeriodicRefresh()
    this.interval = setInterval(() => { 
      this.loadDeployments(true);
    }, 5000);
  }

  stopPeriodicRefresh() {
    clearTimeout(this.interval)
  }

  ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = (row: Deployment|AuxDeployment, sortHeaderId: string) => {
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
    let obs: Observable<DeploymentResponse | AuxDeploymentResponse> = this.moduleService.loadDeployments(true);
    if(this.isSubDeployment === true) {
      obs = this.moduleService.getSubDeployments(this.deploymentID);
    };
    obs.subscribe(
      {
        next: (deployments) => {
          var deploymentsList: (Deployment | AuxDeployment) [] = []
          for (const [_, deployment] of Object.entries(deployments)) {
            deploymentsList.push(deployment)
          }
          this.dataSource.data = deploymentsList
          this.ready = true
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

  stop(deploymentID: string) {
    this.tryStop([deploymentID])
  }

  stopMultiple() {
    const ids: string[] = [];
    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });

    this.tryStop(ids)
  }

  private tryStop(ids: string[]) {
    this.ready = false;
    this.stopPeriodicRefresh()

    this.sendStop(ids, false).pipe(
      catchError((err, _1) => {
        // stopping did not succeed because deployment is required 
        return this.utilsService.askForConfirmation(err + "\n" + "Do you want to force stop?").pipe(
          concatMap((forceConfirmed: any) => {
            if(!forceConfirmed) {
              this.ready = true
              this.startPeriodicRefresh()
              return of(true)
            }
            
            return this.sendStop(ids, true)
          })
        )
      })
    ).subscribe({
      next: (_) => {
        this.loadDeployments(false)
        this.startPeriodicRefresh()
      },
      error: (error) => {
        this.errorService.handleError(DeploymentListComponent.name, "stopMultiple", error)
        this.startPeriodicRefresh()

      }
    })
  }

  sendStop(ids: string[], forceConfirmed: boolean) {
    var obs 
    if(ids.length == 1) {
      if(this.isSubDeployment === true) {
        obs = this.moduleService.stopSubDeployment(this.deploymentID, ids[0])
      } else {
        obs = this.moduleService.stopDeployment(ids[0], forceConfirmed)
      }
    } else {
      if(this.isSubDeployment === true) {
        obs = this.moduleService.stopSubDeployments(this.deploymentID, ids)
      } else {
        obs = this.moduleService.stopDeployments(ids, forceConfirmed)
      }
    }
    
    return obs.pipe(
      concatMap(jobID => {
        var message = "Deployments are stopping"
        return this.utilsService.checkJobStatus(jobID, message, "module-manager")
      }),
      concatMap(result => {
          if(!result.success && !forceConfirmed) {
            return throwError(() => new Error(result.error))
          }
          
          return of(true)
      })
    )
  }

  start(deploymentID: string) {
    this.tryStart([deploymentID])
  }

  startMultiple() {
    const ids: string[] = [];

    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });
            
    this.tryStart(ids)
  }

  private tryStart(ids: string[]) {
    this.ready = false;
    this.stopPeriodicRefresh()

    var obs = this.sendStart(ids);

    obs.pipe(
      concatMap(jobID => {
        var message = "Deployments are starting"
        return this.utilsService.checkJobStatus(jobID, message, "module-manager")
      })
    ).subscribe({
      next: (_) => {
        this.loadDeployments(false)
        this.startPeriodicRefresh()
      },
      error: (error) => {
        this.errorService.handleError(DeploymentListComponent.name, "startMultiple", error)
        this.ready = true
        this.startPeriodicRefresh()
      }
    })
  }

  private sendStart(ids: string[]) {
    var obs: Observable<string>
    if(ids.length == 1) {
      if(this.isSubDeployment === true) {
        obs = this.moduleService.startSubDeployment(this.deploymentID, ids[0])

      } else {
        obs = this.moduleService.startDeployment(ids[0], true)
      }
    } else {
      if(this.isSubDeployment === true) {
        obs = this.moduleService.startSubDeployments(this.deploymentID, ids)

      } else {
        obs = this.moduleService.startDeployments(ids, true)
      }
    }
    return obs;
  }

  restart(deploymentID: string) {
    this.tryRestart([deploymentID])
  }

  restartMultiple() {
    const ids: string[] = [];

    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });
            
    this.tryRestart(ids)
  }

  private tryRestart(ids: string[]) {
    this.ready = false;
    this.stopPeriodicRefresh()
    var obs = this.sendRestart(ids);
    
    obs.pipe(
      concatMap(jobID => {
        var message = "Deployments are restarting"
        return this.utilsService.checkJobStatus(jobID, message, "module-manager")
      }),
      concatMap(result => {
          if(!result.success) {
            return throwError(() => new Error(result.error))
          }
          return of(true)
      })
    ).subscribe({
      next: (_) => {
        this.loadDeployments(false)
        this.startPeriodicRefresh()
      },
      error: (error) => {
        this.errorService.handleError(DeploymentListComponent.name, "restartMultiple", error)
        this.ready = true
        this.startPeriodicRefresh()
      }
    })
  }

  private sendRestart(ids: string[]) {
    var obs: Observable<string>
    if(ids.length == 1) {
      if(this.isSubDeployment === true) {
        obs = this.moduleService.restartSubDeployment(this.deploymentID, ids[0])

      } else {
        obs = this.moduleService.restartDeployment(ids[0])
      }
    } else {
      if(this.isSubDeployment === true) {
        obs = this.moduleService.restartSubDeployments(this.deploymentID, ids)

      } else {
        obs = this.moduleService.restartDeployments(ids)
      }
    }
    return obs;
  }

  delete(deploymentID: string) {
    this._delete([deploymentID])
  }

  deleteMultiple() {
    const ids: string[] = [];
    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });
    this._delete(ids)
  }

  _delete(ids: string[]) {
    this.ready = false;
    this.stopPeriodicRefresh()

    this.tryDelete(ids, false).pipe(
      catchError((err, _1) => {
        // stopping did not succeed because deployment is required 
        return this.utilsService.askForConfirmation(err + "\nDo you want to force delete?").pipe(
          concatMap((forceConfirmed: any) => {
            if(!forceConfirmed) {
              this.ready = true
              this.startPeriodicRefresh()
              return of(true)
            }
            return this.tryDelete(ids, true)
          })
        )
      })
    ).subscribe({
      next: (_) => {
        this.loadDeployments(false)
        this.startPeriodicRefresh()
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(DeploymentListComponent.name, "_delete", err)
        this.startPeriodicRefresh()
        this.ready = true
      }
    })
  }

  tryDelete(ids: string[], forceConfirmed: boolean) {
    var obs = this.sendDelete(ids, forceConfirmed)
    return obs.pipe(
      concatMap(jobID => {
        var message = "Delete deployments"
        return this.utilsService.checkJobStatus(jobID, message, "module-manager")
      }),
      concatMap(result => {
          if(!result.success && !forceConfirmed) {
            return throwError(() => new Error(result.error))
          }

          // have to send some value so that the subscribe afterwards works
          return of(true)
      })
    )
  }

  private sendDelete(ids: string[], forceConfirmed: boolean) {
    var obs: Observable<string>
    if(ids.length == 1) {
      if(this.isSubDeployment === true) {
        obs = this.moduleService.deleteSubDeployment(this.deploymentID, ids[0], forceConfirmed)

      } else {
        obs = this.moduleService.deleteDeployment(ids[0], forceConfirmed)
      }
    } else {
      if(this.isSubDeployment === true) {
        obs = this.moduleService.deleteSubDeployments(this.deploymentID, ids, forceConfirmed)

      } else {
        obs = this.moduleService.deleteDeployments(ids, forceConfirmed)
      }
    }
    return obs;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSource.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
    if(this.isAllSelected()) {
      this.selectionClear();
    } else {
      this.selectionClear();
      this.dataSource.connect().value.forEach((row) => this.selection.select(row.id));
    }
  }

  selectionClear(): void {
      this.selection.clear();
  }

  info(deployment: Deployment | AuxDeployment) {
    if(this.isSubDeployment) {
      this.router.navigate(["/deployments/" + (deployment as AuxDeployment).dep_id + "/sub/" + deployment.id + "/info"])
    } else {
      this.router.navigate(["/deployments/" + deployment.id + "/info"])
    }
  }
}
