import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
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
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {Router, RouterLink} from '@angular/router';
import {UtilService} from 'src/app/core/services/util/util.service';
import {SelectionModel} from '@angular/cdk/collections';
import {concatMap, Observable, of} from 'rxjs';
import {NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatFabButton, MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {MatCheckbox} from '@angular/material/checkbox';
import {
  DEPLOYMENT_STATE_HEALTHY,
  DEPLOYMENT_STATE_UNHEALTHY,
  ModuleReduced,
  needsDeploymentUpdate
} from 'src/app/core/models/modules';
import {JobResultKind} from 'src/app/core/components/job-loader-modal/job-loader-modal.component';
import {ErrorDialogComponent} from 'src/app/core/components/error-dialog/error-dialog.component';
import {mapDeploymentResults} from 'src/app/core/models/job-result-view';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
    imports: [NgIf, NgSwitch, NgSwitchCase, SpinnerComponent, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatCheckbox, MatIconButton, MatTooltip, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFabButton, RouterLink]
})
export class ListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<ModuleReduced>();
  ready: Boolean = false;
  init: Boolean = true;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['select', 'status', 'name', 'version', 'deploy', 'start', 'stop', 'recreate', 'delete', 'info']
  selection = new SelectionModel<string>(true, []);
  modulesById: Record<string, ModuleReduced> = {}
  interval: any

  needsDeploymentUpdate = needsDeploymentUpdate

  constructor(
    public dialog: MatDialog,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
    private errorService: ErrorService,
    private router: Router,
    private utilService: UtilService
  ) {
  }

  ngOnInit(): void {
    this.loadModules(false)
    this.startPeriodicRefresh()
    this.init = false;
  }

  ngOnDestroy(): void {
    this.stopPeriodicRefresh()
  }

  startPeriodicRefresh() {
    this.stopPeriodicRefresh()
    this.interval = setInterval(() => {
      this.loadModules(true);
    }, 5000);
  }

  stopPeriodicRefresh() {
    clearTimeout(this.interval)
  }

  ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = (row: ModuleReduced, sortHeaderId: string) => {
      var value = (<any>row)[sortHeaderId];
      value = (typeof (value) === 'string') ? value.toUpperCase() : value;
      return value
    };
    this.dataSource.sort = this.sort;
  }

  loadModules(background: boolean) {
    this.moduleService.loadModulesReduced().subscribe({
      next: (modules) => {
        modules = modules || []
        this.modulesById = {}
        modules.forEach(module => this.modulesById[module.id] = module)
        this.dataSource.data = modules
        this.ready = true
      },
      error: (err) => {
        if (!background) {
          this.errorService.handleError(ListComponent.name, "loadModules", err, "Loading the modules failed")
        }
        this.ready = true
      }
    })
  }

  // disabled deployments have state 0, same as deployments with undetermined state
  statusOf(module: ModuleReduced): string {
    if (!module.is_deployed) {
      return "none"
    }
    if (!module.deployment.enabled) {
      return "disabled"
    }
    switch (module.deployment.state) {
      case DEPLOYMENT_STATE_HEALTHY:
        return "healthy"
      case DEPLOYMENT_STATE_UNHEALTHY:
        return "unhealthy"
      default:
        return "unknown"
    }
  }

  // Start/Stop set the enabled flag synchronously, the runtime monitor
  // starts/stops the containers afterwards (picked up by the refresh)

  start(moduleID: string) {
    this.enable([moduleID])
  }

  startMultiple() {
    this.enable(this.selectedDeployedIds())
  }

  private enable(moduleIDs: string[]) {
    if (moduleIDs.length === 0) {
      return
    }
    this.runSync(this.moduleService.enableDeployments(moduleIDs), "start")
  }

  stop(moduleID: string) {
    this.disable([moduleID])
  }

  stopMultiple() {
    this.disable(this.selectedDeployedIds())
  }

  private disable(moduleIDs: string[]) {
    if (moduleIDs.length === 0) {
      return
    }
    this.runSync(this.moduleService.disableDeployments(moduleIDs), "stop")
  }

  private runSync(obs: Observable<string[]>, method: string) {
    this.ready = false
    this.stopPeriodicRefresh()
    obs.subscribe({
      next: (_) => {
        this.selectionClear()
        this.loadModules(false)
        this.startPeriodicRefresh()
      },
      error: (err) => {
        this.errorService.handleError(ListComponent.name, method, err, method === "start" ? "Starting the deployments failed" : "Stopping the deployments failed")
        this.ready = true
        this.startPeriodicRefresh()
      }
    })
  }

  recreate(moduleID: string) {
    this.tryRecreate([moduleID])
  }

  recreateMultiple() {
    this.tryRecreate(this.selectedDeployedIds())
  }

  private tryRecreate(moduleIDs: string[]) {
    if (moduleIDs.length === 0) {
      return
    }
    this.runJob(this.moduleService.recreateDeployments(moduleIDs), "Deployments are recreating", "deployments", "recreate", "Recreate containers", "Containers recreated", "Recreating the containers failed")
  }

  deleteDeployment(moduleID: string) {
    this.tryDelete([moduleID])
  }

  deleteMultiple() {
    this.tryDelete(this.selectedDeployedIds())
  }

  private tryDelete(moduleIDs: string[]) {
    if (moduleIDs.length === 0) {
      return
    }
    this.utilService.askForConfirmation("Delete the deployment(s) of " + moduleIDs.length + " module(s)? Data stored in volumes will be removed.").pipe(
      concatMap(confirmed => {
        if (!confirmed) {
          return of(null)
        }
        this.runJob(this.moduleService.removeDeployments(moduleIDs), "Deployments are being deleted", "deployments-delete", "delete", "Delete deployments", "Deployments deleted", "Deleting the deployments failed")
        return of(true)
      })
    ).subscribe()
  }

  private runJob(obs: Observable<any>, message: string, resultKind: JobResultKind, method: string, resultTitle: string, successMessage: string, errorContext: string) {
    this.ready = false
    this.stopPeriodicRefresh()
    obs.pipe(
      concatMap(job => {
        return this.utilService.checkJobStatus(job.id, message, "module-manager", resultKind)
      })
    ).subscribe({
      next: (jobResult) => {
        // the job succeeds even if single modules failed, per-module errors are in the result
        if (jobResult?.result) {
          this.utilService.presentJobResult(resultTitle, mapDeploymentResults(jobResult.result), successMessage)
        }
        this.selectionClear()
        this.loadModules(false)
        this.startPeriodicRefresh()
      },
      error: (err) => {
        this.errorService.handleError(ListComponent.name, method, err, errorContext)
        this.ready = true
        this.startPeriodicRefresh()
      }
    })
  }

  // some models carry a partial error, e.g. when the deployment of a module
  // could not be retrieved completely
  showModuleError(module: ModuleReduced) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        context: "The module was loaded with errors",
        source: module.id,
        detail: module.error_msg || module.deployment?.error_msg || "",
      }
    })
  }

  moduleHasError(module: ModuleReduced): boolean {
    return module.has_error || (module.is_deployed && module.deployment.has_error)
  }

  deploy(moduleID: string) {
    this.router.navigateByUrl("/deployments/add/" + encodeURIComponent(moduleID))
  }

  edit(moduleID: string) {
    this.router.navigateByUrl("/deployments/edit/" + encodeURIComponent(moduleID))
  }

  // batch edit: one form per selected deployed module, saved as one job
  editMultiple() {
    var ids = this.selectedDeployedIds()
    if (ids.length === 0) {
      return
    }
    this.router.navigateByUrl("/deployments/edit/" + ids.map(id => encodeURIComponent(id)).join(","))
  }

  showModuleInfo(moduleID: string) {
    this.router.navigateByUrl("/modules/info/" + encodeURIComponent(moduleID))
  }

  selectedDeployedIds(): string[] {
    return this.selection.selected.filter(id => this.modulesById[id]?.is_deployed)
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
      this.selectionClear();
      this.dataSource.connect().value.forEach((row) => this.selection.select(row.id));
    }
  }

  selectionClear(): void {
    this.selection.clear();
  }
}
