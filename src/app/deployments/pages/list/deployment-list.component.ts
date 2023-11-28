import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Deployment } from '../../models/deployment_models';
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
  dataSource = new MatTableDataSource<Deployment>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['select', 'name', 'created', 'updated', 'status', 'start', 'stop', 'restart', 'info', 'edit', 'delete', 'show']
  selection = new SelectionModel<string>(true, []);

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
    }, 5000);
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
    this.moduleService.loadDeployments(true).subscribe(
      {
        next: (deployments) => {
          if(!deployments) {
            this.dataSource.data = []
            this.ready = true
          } else {
            var deploymentsList: Deployment[] = []
            for (const [_, deployment] of Object.entries(deployments)) {
              deploymentsList.push(deployment)
            }
            this.dataSource.data = deploymentsList
          }
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
    this._stop([deploymentID])
  }

  stopMultiple() {
    const ids: string[] = [];
    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });

    this._stop(ids)
  }

  _stop(ids: string[]) {
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
      obs = this.moduleService.stopDeployment(ids[0], forceConfirmed)
    } else {
      obs = this.moduleService.stopDeployments(ids, forceConfirmed)
    }
    
    return obs.pipe(
      concatMap(jobID => {
        var message = "Deployments are stopping"
        return this.utilsService.checkJobStatus(jobID, message)
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
    this._start([deploymentID])
  }

  startMultiple() {
    const ids: string[] = [];

    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });
            
    this._start(ids)
  }

  _start(ids: string[]) {
    this.ready = false;
    this.stopPeriodicRefresh()

    var obs
    if(ids.length == 1) {
      obs = this.moduleService.startDeployment(ids[0], true)
    } else {
      obs = this.moduleService.startDeployments(ids, true)
    }

    obs.pipe(
      concatMap(jobID => {
        var message = "Deployments are starting"
        return this.utilsService.checkJobStatus(jobID, message)
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

  restart(deploymentID: string) {
    this._restart([deploymentID])
  }

  restartMultiple() {
    const ids: string[] = [];

    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });
            
    this._restart(ids)
  }

  _restart(ids: string[]) {
    this.ready = false;
    this.stopPeriodicRefresh()

    var obs 
    if(ids.length == 1) {
      obs = this.moduleService.restartDeployment(ids[0])
    } else {
      obs = this.moduleService.restartDeployments(ids)
    }
    obs.pipe(
      concatMap(jobID => {
        var message = "Deployments are restarting"
        return this.utilsService.checkJobStatus(jobID, message)
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

    this.sendDelete(ids, false).pipe(
      catchError((err, _1) => {
        // stopping did not succeed because deployment is required 
        return this.utilsService.askForConfirmation(err + "\nDo you want to force delete?").pipe(
          concatMap((forceConfirmed: any) => {
            if(!forceConfirmed) {
              this.ready = true
              this.startPeriodicRefresh()
              return of(true)
            }
            return this.sendDelete(ids, true)
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

  sendDelete(ids: string[], forceConfirmed: boolean) {
    var obs 
    if (ids.length == 1) {
      obs = this.moduleService.deleteDeployment(ids[0], forceConfirmed)
    } else {
      obs = this.moduleService.deleteDeployments(ids, forceConfirmed)
    }
    return obs.pipe(
      concatMap(jobID => {
        var message = "Delete deployments"
        return this.utilsService.checkJobStatus(jobID, message)
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

  showInstances(deploymentID: string) {
    this.router.navigate(["/deployments/show/" + deploymentID])
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
}
