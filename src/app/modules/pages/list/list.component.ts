/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, Inject, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
  MatTableDataSource,
} from '@angular/material/table';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {Router, RouterLink} from '@angular/router';
import {UtilService} from 'src/app/core/services/util/util.service';
import {SelectionModel} from '@angular/cdk/collections';
import {concatMap, Observable, of} from 'rxjs';

import {FormsModule} from '@angular/forms';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatDivider} from '@angular/material/divider';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {
  DEPLOYMENT_STATE_HEALTHY,
  DEPLOYMENT_STATE_UNHEALTHY,
  ModuleReduced,
  needsDeploymentUpdate,
} from 'src/app/core/models/modules';
import {JobResultKind} from 'src/app/core/components/job-loader-modal/job-loader-modal.component';
import {ErrorDialogComponent} from 'src/app/core/components/error-dialog/error-dialog.component';
import {mapDeploymentResults} from 'src/app/core/models/job-result-view';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {StatusPillComponent, StatusTone} from 'src/app/core/components/status-pill/status-pill.component';
import {EmptyStateComponent} from 'src/app/core/components/empty-state/empty-state.component';

/** Deployment state reduced to what the list has to distinguish. */
type ModuleStatus = 'healthy' | 'unhealthy' | 'disabled' | 'unknown' | 'none';

interface StatusFilter {
  key: ModuleStatus | 'all' | 'update';
  label: string;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  imports: [
    SpinnerComponent,
    FormsModule,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatCheckbox,
    MatIconButton,
    MatButton,
    MatTooltip,
    MatIcon,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    RouterLink,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatFormField,
    MatLabel,
    MatInput,
    MatSuffix,
    MatDivider,
    PageHeaderComponent,
    StatusPillComponent,
    EmptyStateComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('modules')],
})
export class ListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<ModuleReduced>();
  ready = false;
  init = true;
  // The table renders only once data has arrived, so ngAfterViewInit runs
  // before it exists and a plain @ViewChild stays undefined. A setter catches
  // the MatSort whenever the table appears; without it the rows keep the order
  // the API sent them, and that order is not stable between refreshes.
  @ViewChild(MatSort) set tableSort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }
  displayColumns = ['select', 'module', 'status', 'version', 'actions'];
  selection = new SelectionModel<string>(true, []);
  modulesById: Record<string, ModuleReduced> = {};
  interval: any;

  search = '';
  statusFilter: StatusFilter['key'] = 'all';
  // display text is translation keys, not display text - the template applies
  // the pipe where it renders each filter chip
  readonly statusFilters: StatusFilter[] = [
    {key: 'all', label: 'modules.list.filters.all'},
    {key: 'healthy', label: 'modules.list.filters.healthy'},
    {key: 'disabled', label: 'modules.list.filters.disabled'},
    {key: 'unhealthy', label: 'modules.list.filters.unhealthy'},
    {key: 'none', label: 'modules.list.filters.none'},
    {key: 'update', label: 'modules.list.filters.update'},
  ];

  needsDeploymentUpdate = needsDeploymentUpdate;

  // Field injection, not a constructor parameter: new dependencies follow
  // the prefer-inject rule; the parameters above predate it.
  private readonly transloco = inject(TranslocoService);

  constructor(
    public dialog: MatDialog,
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    private errorService: ErrorService,
    private router: Router,
    private utilService: UtilService,
  ) {}

  private translate(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate<string>(key, params);
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (module, _) => this.matchesFilters(module);
    this.dataSource.sortingDataAccessor = (row: ModuleReduced, sortHeaderId: string) => {
      // the visible columns are composites, so they need their own sort keys
      switch (sortHeaderId) {
        case 'module':
          return row.name.toUpperCase();
        case 'status':
          return this.statusOf(row);
        default:
          var value = (row as any)[sortHeaderId];
          return typeof value === 'string' ? value.toUpperCase() : value;
      }
    };
    this.loadModules(false);
    this.startPeriodicRefresh();
    this.init = false;
  }

  ngOnDestroy(): void {
    this.stopPeriodicRefresh();
  }

  startPeriodicRefresh() {
    this.stopPeriodicRefresh();
    this.interval = setInterval(() => {
      this.loadModules(true);
    }, 5000);
  }

  stopPeriodicRefresh() {
    clearTimeout(this.interval);
  }

  loadModules(background: boolean) {
    this.moduleService.loadModulesReduced().subscribe({
      next: (modules) => {
        modules = modules || [];
        this.modulesById = {};
        modules.forEach((module) => (this.modulesById[module.id] = module));
        this.dataSource.data = modules;
        this.applyFilters();
        this.ready = true;
      },
      error: (err) => {
        if (!background) {
          this.errorService.handleError(
            ListComponent.name,
            'loadModules',
            err,
            this.translate('modules.list.errors.loadFailed'),
          );
        }
        this.ready = true;
      },
    });
  }

  // MatTableDataSource only re-filters when the filter string changes, so the
  // current criteria are encoded into it; the predicate ignores the value.
  applyFilters() {
    this.dataSource.filter = this.statusFilter + '|' + this.search.trim().toLowerCase();
    this.pruneSelection();
  }

  // A bulk action reads the selection rather than the table, so a row the
  // filter just hid would still be acted on - and the master checkbox is the
  // quickest way into that state.
  private pruneSelection(): void {
    const hidden = this.selection.selected.filter((id) => {
      const module = this.modulesById[id];
      return !module || !this.matchesFilters(module);
    });
    if (hidden.length > 0) {
      this.selection.deselect(...hidden);
    }
  }

  setStatusFilter(key: StatusFilter['key']) {
    this.statusFilter = key;
    this.applyFilters();
  }

  countFor(key: StatusFilter['key']): number {
    return this.dataSource.data.filter((module) => this.matchesStatus(module, key)).length;
  }

  filteredCount(): number {
    return this.dataSource.filteredData.length;
  }

  hasActiveFilters(): boolean {
    return this.statusFilter !== 'all' || this.search.trim().length > 0;
  }

  clearFilters() {
    this.search = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  // disabled deployments have state 0, same as deployments with undetermined state
  statusOf(module: ModuleReduced): ModuleStatus {
    if (!module.is_deployed) {
      return 'none';
    }
    if (!module.deployment.enabled) {
      return 'disabled';
    }
    switch (module.deployment.state) {
      case DEPLOYMENT_STATE_HEALTHY:
        return 'healthy';
      case DEPLOYMENT_STATE_UNHEALTHY:
        return 'unhealthy';
      default:
        return 'unknown';
    }
  }

  statusTone(module: ModuleReduced): StatusTone {
    switch (this.statusOf(module)) {
      case 'healthy':
        return 'ok';
      case 'unhealthy':
        return 'danger';
      case 'unknown':
        return 'warn';
      default:
        return 'idle';
    }
  }

  // a translation key, not display text - the template applies the pipe
  statusLabel(module: ModuleReduced): string {
    switch (this.statusOf(module)) {
      case 'healthy':
        return 'modules.list.statuses.running';
      case 'unhealthy':
        return 'modules.list.statuses.unhealthy';
      case 'disabled':
        return 'modules.list.statuses.stopped';
      case 'unknown':
        return 'modules.list.statuses.unknown';
      default:
        return 'modules.list.statuses.notDeployed';
    }
  }

  // Start/Stop set the enabled flag synchronously, the runtime monitor
  // starts/stops the containers afterwards (picked up by the refresh)

  start(moduleID: string) {
    this.enable([moduleID]);
  }

  startMultiple() {
    this.enable(this.selectedDeployedIds());
  }

  private enable(moduleIDs: string[]) {
    if (moduleIDs.length === 0) {
      return;
    }
    this.runSync(this.moduleService.enableDeployments(moduleIDs), 'start');
  }

  stop(moduleID: string) {
    this.disable([moduleID]);
  }

  stopMultiple() {
    this.disable(this.selectedDeployedIds());
  }

  private disable(moduleIDs: string[]) {
    if (moduleIDs.length === 0) {
      return;
    }
    this.runSync(this.moduleService.disableDeployments(moduleIDs), 'stop');
  }

  private runSync(obs: Observable<string[]>, method: string) {
    this.ready = false;
    this.stopPeriodicRefresh();
    obs.subscribe({
      next: (_) => {
        this.selectionClear();
        this.loadModules(false);
        this.startPeriodicRefresh();
      },
      error: (err) => {
        this.errorService.handleError(
          ListComponent.name,
          method,
          err,
          method === 'start'
            ? this.translate('modules.list.errors.startFailed')
            : this.translate('modules.list.errors.stopFailed'),
        );
        this.ready = true;
        this.startPeriodicRefresh();
      },
    });
  }

  recreate(moduleID: string) {
    this.tryRecreate([moduleID]);
  }

  recreateMultiple() {
    this.tryRecreate(this.selectedDeployedIds());
  }

  private tryRecreate(moduleIDs: string[]) {
    if (moduleIDs.length === 0) {
      return;
    }
    this.runJob(
      this.moduleService.recreateDeployments(moduleIDs),
      this.translate('modules.list.jobs.recreating'),
      'deployments',
      'recreate',
      this.translate('modules.list.recreateContainers'),
      this.translate('modules.list.jobs.recreated'),
      this.translate('modules.list.errors.recreateFailed'),
    );
  }

  deleteDeployment(moduleID: string) {
    this.tryDelete([moduleID]);
  }

  deleteMultiple() {
    this.tryDelete(this.selectedDeployedIds());
  }

  private tryDelete(moduleIDs: string[]) {
    if (moduleIDs.length === 0) {
      return;
    }
    this.utilService
      .askForConfirmation(this.translate('modules.list.confirmDelete', {count: moduleIDs.length}))
      .pipe(
        concatMap((confirmed) => {
          if (!confirmed) {
            return of(null);
          }
          this.runJob(
            this.moduleService.removeDeployments(moduleIDs),
            this.translate('modules.list.jobs.deleting'),
            'deployments-delete',
            'delete',
            this.translate('modules.list.deleteDeployments'),
            this.translate('modules.list.jobs.deleted'),
            this.translate('modules.list.errors.deleteFailed'),
          );
          return of(true);
        }),
      )
      .subscribe();
  }

  private runJob(
    obs: Observable<any>,
    message: string,
    resultKind: JobResultKind,
    method: string,
    resultTitle: string,
    successMessage: string,
    errorContext: string,
  ) {
    this.ready = false;
    this.stopPeriodicRefresh();
    obs
      .pipe(
        concatMap((job) => {
          return this.utilService.checkJobStatus(job.id, message, 'module-manager', resultKind);
        }),
      )
      .subscribe({
        next: (jobResult) => {
          // the job succeeds even if single modules failed, per-module errors are in the result
          if (jobResult?.result) {
            this.utilService.presentJobResult(resultTitle, mapDeploymentResults(jobResult.result), successMessage);
          }
          this.selectionClear();
          this.loadModules(false);
          this.startPeriodicRefresh();
        },
        error: (err) => {
          this.errorService.handleError(ListComponent.name, method, err, errorContext);
          this.ready = true;
          this.startPeriodicRefresh();
        },
      });
  }

  // some models carry a partial error, e.g. when the deployment of a module
  // could not be retrieved completely
  showModuleError(module: ModuleReduced) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        context: this.translate('modules.list.moduleLoadedWithErrors'),
        source: module.id,
        detail: module.error_msg || module.deployment?.error_msg || '',
      },
    });
  }

  moduleHasError(module: ModuleReduced): boolean {
    return module.has_error || (module.is_deployed && module.deployment.has_error);
  }

  deploy(moduleID: string) {
    this.openDeployForm([moduleID]);
  }

  // batch deploy: whether a module already has a deployment is left to
  // /deployment-request, which drops those. Only a selected id the list no
  // longer knows is filtered out here - the refresh never prunes the
  // selection, and one id the module manager cannot resolve fails the whole
  // request rather than just its own entry.
  deployMultiple() {
    const ids = this.selection.selected.filter((id) => this.modulesById[id]);
    if (ids.length === 0) {
      return;
    }
    this.openDeployForm(ids);
  }

  private openDeployForm(moduleIDs: string[]) {
    this.router.navigateByUrl('/deployments/add/' + moduleIDs.map((id) => encodeURIComponent(id)).join(','));
  }

  edit(moduleID: string) {
    this.router.navigateByUrl('/deployments/edit/' + encodeURIComponent(moduleID));
  }

  // batch edit: one form per selected deployed module, saved as one job
  editMultiple() {
    const ids = this.selectedDeployedIds();
    if (ids.length === 0) {
      return;
    }
    this.router.navigateByUrl('/deployments/edit/' + ids.map((id) => encodeURIComponent(id)).join(','));
  }

  showModuleInfo(moduleID: string) {
    this.router.navigateByUrl('/modules/detail/' + encodeURIComponent(moduleID));
  }

  selectedDeployedIds(): string[] {
    return this.selection.selected.filter((id) => this.modulesById[id]?.is_deployed);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSource.filteredData.length;
    return currentViewed > 0 && numSelected === currentViewed;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selectionClear();
    } else {
      this.selectionClear();
      this.dataSource.filteredData.forEach((row) => this.selection.select(row.id));
    }
  }

  selectionClear(): void {
    this.selection.clear();
  }

  private matchesFilters(module: ModuleReduced): boolean {
    const term = this.search.trim().toLowerCase();
    if (term) {
      const haystack = (module.name + ' ' + module.id + ' ' + (module.description || '')).toLowerCase();
      if (!haystack.includes(term)) {
        return false;
      }
    }
    return this.matchesStatus(module, this.statusFilter);
  }

  private matchesStatus(module: ModuleReduced, key: StatusFilter['key']): boolean {
    if (key === 'all') {
      return true;
    }
    if (key === 'update') {
      return needsDeploymentUpdate(module);
    }
    return this.statusOf(module) === key;
  }
}
