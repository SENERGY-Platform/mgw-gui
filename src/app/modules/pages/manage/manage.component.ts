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

import {Component, DestroyRef, Inject, inject, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
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
import {UtilService} from 'src/app/core/services/util/util.service';
import {concatMap} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {FormsModule} from '@angular/forms';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {StatusPillComponent, StatusTone} from 'src/app/core/components/status-pill/status-pill.component';
import {EmptyStateComponent} from 'src/app/core/components/empty-state/empty-state.component';
import {RepoModule, Repository} from 'src/app/core/models/repositories';
import {ChangeRequestItem, ModulesChangeRequest, needsDeploymentUpdate} from 'src/app/core/models/modules';
import {ChangeReportItem} from 'src/app/core/models/jobs';
import {DeploymentRequestModule, DeploymentUserInput} from 'src/app/core/models/deployment-request';
import {carryOverSetup} from 'src/app/core/models/deployment-carry-over';
import {
  mapDeploymentResults,
  mapModulesChangeResult,
  mapRepositoryRefreshResult,
} from 'src/app/core/models/job-result-view';
import {NotificationService} from 'src/app/core/services/util/notifications.service';
import {ChangeRequestDialogComponent} from '../../components/change-request-dialog/change-request-dialog.component';
import {SelectionModel} from '@angular/cdk/collections';
import {MatDivider} from '@angular/material/divider';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {RefreshReposDialogComponent} from '../../components/refresh-repos-dialog/refresh-repos-dialog.component';

// What an executed change request updates: the modules alone (today's
// two-step path, the default) or their setups along with them.
export type UpdateScope = 'modules' | 'modules-and-setups';

const UPDATE_SCOPE_KEY = 'mgw-update-scope';

// A blocked or throwing storage must not cost the page its update action, so
// anything but the stored opt-in falls back to the default scope.
function readUpdateScope(): UpdateScope {
  try {
    return localStorage.getItem(UPDATE_SCOPE_KEY) === 'modules-and-setups' ? 'modules-and-setups' : 'modules';
  } catch {
    return 'modules';
  }
}

interface VariantOption {
  key: string; // source|channel
  source: string;
  channel: string;
  version: string;
}

@Component({
  selector: 'manage-modules',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
  imports: [
    FormsModule,
    SpinnerComponent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatButton,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatInput,
    MatSelect,
    MatOption,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatCheckbox,
    MatDivider,
    MatButtonToggle,
    MatButtonToggleGroup,
    PageHeaderComponent,
    StatusPillComponent,
    EmptyStateComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('modules')],
})
export class ManageComponent implements OnInit {
  dataSource = new MatTableDataSource<RepoModule>();
  ready = false;
  init = true;
  displayColumns = ['select', 'name', 'status', 'version', 'variant', 'action'];
  selection = new SelectionModel<string>(true, []);
  nameFilter = '';
  // one chip instead of two independent checkboxes: the combination
  // "installed + updates" is just the updates scope, so it was never useful
  scope: 'all' | 'installed' | 'updates' = 'all';
  // repository source to restrict the catalog to, empty = all
  repoFilter = '';
  repositories: Repository[] = [];
  updatesCount = 0;
  // the user's collected intents, keyed by module ID ("shopping cart")
  cart: Record<string, ChangeRequestItem> = {};
  // selected variant per module ID, format source|channel
  selectedVariant: Record<string, string> = {};
  // precomputed per module ID: template bindings need stable identities,
  // recomputing arrays per change detection cycle loops the renderer
  variantOptionsById: Record<string, VariantOption[]> = {};
  pendingRequest: ModulesChangeRequest | null = null;
  // which of the two update paths an executed change request takes, kept per
  // browser; the two-step path stays the default
  updateScope: UpdateScope = readUpdateScope();
  // guards against a second follow-up starting while one is still running -
  // two update jobs over the same setups would race each other
  private setupFollowUpRunning = false;

  // Field injection, not a constructor parameter: new dependencies follow
  // the prefer-inject rule; the parameters above predate it.
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  // The follow-up opens dialogs and navigates. Left running past the page it
  // belongs to, it would do both on whatever page the user moved on to.
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public dialog: MatDialog,
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    private errorService: ErrorService,
    private utilService: UtilService,
  ) {}

  private translate(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate<string>(key, params);
  }

  ngOnInit(): void {
    this.load();
    this.checkPendingRequest();
    this.moduleService.getRepositories().subscribe({
      next: (repositories) => (this.repositories = repositories || []),
      error: (_) => {},
    });
    this.init = false;
  }

  load() {
    this.ready = false;
    this.moduleService
      .loadRepositoryModules({
        name: this.nameFilter || undefined,
        installed: this.scope === 'installed' || undefined,
        updateAvailable: this.scope === 'updates' || undefined,
        repositories: this.repoFilter ? [this.repoFilter] : undefined,
      })
      .subscribe({
        next: (modules) => {
          modules = modules || [];
          modules.forEach((module) => {
            this.variantOptionsById[module.id] = this.computeVariantOptions(module);
            if (!this.selectedVariant[module.id]) {
              this.selectedVariant[module.id] = this.defaultVariantKey(module);
            }
          });
          this.dataSource.data = modules;
          // a filter or a repository refresh can drop a selected module; the
          // selection would otherwise keep counting rows nobody can see
          this.pruneSelection();
          this.ready = true;
        },
        error: (err) => {
          this.errorService.handleError(
            ManageComponent.name,
            'load',
            err,
            this.translate('modules.manage.errors.loadFailed'),
          );
          this.ready = true;
        },
      });
    this.moduleService.getAvailableUpdatesCount().subscribe({
      next: (count) => (this.updatesCount = count || 0),
      error: (_) => {},
    });
  }

  // the change request survives on the module-manager until it is executed,
  // discarded or a repository refresh drops it - so one may be pending from
  // an earlier session
  checkPendingRequest() {
    this.moduleService.getModulesChangeRequest().subscribe({
      next: (request) => (this.pendingRequest = request),
      error: (_) => (this.pendingRequest = null), // 404: none pending
    });
  }

  setScope(scope: 'all' | 'installed' | 'updates') {
    this.scope = scope;
    this.load();
  }

  setUpdateScope(scope: UpdateScope) {
    this.updateScope = scope;
    try {
      localStorage.setItem(UPDATE_SCOPE_KEY, scope);
    } catch {
      // private mode or storage disabled: the choice just does not survive a reload
    }
  }

  statusTone(module: RepoModule): StatusTone {
    if (!module.is_installed) {
      return 'idle';
    }
    return module.installed_variant.next_version ? 'warn' : 'ok';
  }

  // a translation key, not display text - the template applies the pipe
  statusLabel(module: RepoModule): string {
    if (!module.is_installed) {
      return 'modules.manage.statuses.available';
    }
    return module.installed_variant.next_version
      ? 'modules.manage.statuses.updateAvailable'
      : 'modules.manage.statuses.installed';
  }

  // label of the button that applies the currently selected intent
  primaryAction(module: RepoModule): string {
    if (this.isVariantChange(module)) {
      return 'switch';
    }
    if (!module.is_installed) {
      return 'install';
    }
    if (module.installed_variant.next_version) {
      return 'update';
    }
    return '';
  }

  // applies whatever primaryAction() reports for this module
  applyPrimary(module: RepoModule) {
    switch (this.primaryAction(module)) {
      case 'install':
      case 'switch':
        this.install(module);
        break;
      case 'update':
        this.update(module);
        break;
    }
  }

  private computeVariantOptions(module: RepoModule): VariantOption[] {
    const options: VariantOption[] = [];
    for (const variant of module.repository_variants || []) {
      for (const channel of variant.channels || []) {
        options.push({
          key: variant.source + '|' + channel.name,
          source: variant.source,
          channel: channel.name,
          version: channel.version,
        });
      }
    }
    return options;
  }

  defaultVariantKey(module: RepoModule): string {
    if (module.is_installed) {
      return module.installed_variant.source + '|' + module.installed_variant.channel;
    }
    const options = this.variantOptionsById[module.id] || [];
    return options.length > 0 ? options[0].key : '';
  }

  // a variant differing from the installed one turns "install" into "change"
  isVariantChange(module: RepoModule): boolean {
    return module.is_installed && this.selectedVariant[module.id] !== this.defaultVariantKey(module);
  }

  install(module: RepoModule) {
    const [source, channel] = (this.selectedVariant[module.id] || '').split('|');
    this.cart[module.id] = {id: module.id, source: source, channel: channel};
  }

  update(module: RepoModule) {
    this.cart[module.id] = {id: module.id, update: true};
  }

  remove(module: RepoModule) {
    this.cart[module.id] = {id: module.id, remove: true};
  }

  undo(moduleID: string) {
    delete this.cart[moduleID];
  }

  // Selection and bulk staging. A change request already carries installs,
  // changes, updates and removals together - the cart collects them. What the
  // selection adds is staging one intent for many modules in a single step.

  private selectedModules(): RepoModule[] {
    return this.dataSource.data.filter((module) => this.selection.isSelected(module.id));
  }

  private pruneSelection() {
    const present = new Set(this.dataSource.data.map((module) => module.id));
    const gone = this.selection.selected.filter((id) => !present.has(id));
    if (gone.length > 0) {
      this.selection.deselect(...gone);
    }
  }

  isAllSelected(): boolean {
    return this.dataSource.data.length > 0 && this.selection.selected.length === this.dataSource.data.length;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selectionClear();
      return;
    }
    this.selection.select(...this.dataSource.data.map((module) => module.id));
  }

  selectionClear() {
    this.selection.clear();
  }

  // Modules a bulk action can stage something for. A module already in the
  // cart is left alone: the row replaces its buttons with the staged chip once
  // an intent is set, so undo is the only way back on that level, and a bulk
  // action silently replacing that intent would be the one path around it.
  private undecidedSelected(): RepoModule[] {
    return this.selectedModules().filter((module) => !this.cart[module.id]);
  }

  stageableSelected(): RepoModule[] {
    return this.undecidedSelected().filter((module) => this.primaryAction(module) !== '');
  }

  updatableSelected(): RepoModule[] {
    return this.undecidedSelected().filter((module) => module.is_installed && !!module.installed_variant.next_version);
  }

  removableSelected(): RepoModule[] {
    return this.undecidedSelected().filter((module) => module.is_installed);
  }

  // stages each module's own primary action - install, switch or update
  // depending on what it is; modules with nothing to do are skipped
  stageSelected() {
    this.stageableSelected().forEach((module) => this.applyPrimary(module));
    this.selectionClear();
  }

  stageUpdateForSelected() {
    this.updatableSelected().forEach((module) => this.update(module));
    this.selectionClear();
  }

  // staging is not the destructive step: the change request is reviewed in a
  // dialog and executed explicitly, so no confirmation belongs here
  stageRemoveForSelected() {
    this.removableSelected().forEach((module) => this.remove(module));
    this.selectionClear();
  }

  // the technical value: also drives the [attr.data-action] binding the CSS
  // selects on, so it stays an untranslated literal
  cartAction(moduleID: string): string {
    const item = this.cart[moduleID];
    if (!item) {
      return '';
    }
    if (item.remove) {
      return 'remove';
    }
    if (item.update) {
      return 'update';
    }
    return 'install';
  }

  // a translation key for the same intent, for display - the template
  // applies the pipe
  cartActionLabel(moduleID: string): string {
    switch (this.cartAction(moduleID)) {
      case 'remove':
        return 'modules.manage.cartActions.remove';
      case 'update':
        return 'modules.manage.cartActions.update';
      default:
        return 'modules.manage.cartActions.install';
    }
  }

  cartCount(): number {
    return Object.keys(this.cart).length;
  }

  // a translation key with a `.one`/`.other` form - see the README section on
  // plurals
  stagedCountKey(): string {
    return `modules.manage.staged.${this.cartCount() === 1 ? 'one' : 'other'}`;
  }

  clearCart() {
    this.cart = {};
  }

  reviewCart() {
    this.createAndReview(this.moduleService.createModulesChangeRequest(Object.values(this.cart)));
  }

  updateAll() {
    this.createAndReview(this.moduleService.createUpdateAllChangeRequest());
  }

  private createAndReview(obs: ReturnType<ModuleManagerService['createModulesChangeRequest']>) {
    obs.subscribe({
      next: (request) => {
        this.pendingRequest = request;
        this.openReviewDialog(request);
      },
      error: (err) => {
        this.errorService.handleError(
          ManageComponent.name,
          'createAndReview',
          err,
          this.translate('modules.manage.errors.createChangeRequestFailed'),
        );
      },
    });
  }

  openPendingRequest() {
    if (this.pendingRequest) {
      this.openReviewDialog(this.pendingRequest);
    }
  }

  private openReviewDialog(request: ModulesChangeRequest) {
    const dialogRef = this.dialog.open(ChangeRequestDialogComponent, {data: {request: request}});
    dialogRef.afterClosed().subscribe((action) => {
      if (action === 'execute') {
        this.executeRequest();
      } else if (action === 'discard') {
        this.discardRequest();
      }
      // undefined: keep the request pending
    });
  }

  private executeRequest() {
    this.ready = false;
    this.moduleService
      .executeModulesChangeRequest()
      .pipe(
        concatMap((job) => {
          return this.utilService.checkJobStatus(
            job.id,
            this.translate('modules.manage.jobs.applying'),
            'module-manager',
            'modules-change',
          );
        }),
      )
      .subscribe({
        next: (jobResult) => {
          // the job succeeds even if single modules failed
          if (jobResult?.result) {
            this.utilService.presentJobResult(
              this.translate('modules.manage.moduleChanges'),
              mapModulesChangeResult(jobResult.result),
              this.translate('modules.manage.jobs.applied'),
            );
          }
          this.pendingRequest = null;
          this.clearCart();
          this.selectionClear();
          this.load();
          // only now is the drift visible: the setups lag behind the versions
          // the job just installed
          if (this.updateScope === 'modules-and-setups') {
            this.updateDriftedSetups(
              ((jobResult?.result?.success || []) as ChangeReportItem[]).map((entry) => entry.id),
            );
          }
        },
        error: (err) => {
          this.errorService.handleError(
            ManageComponent.name,
            'executeRequest',
            err,
            this.translate('modules.manage.errors.applyFailed'),
          );
          this.ready = true;
        },
      });
  }

  // Second update path: bring the setups of the modules whose installed
  // version moved ahead onto that version, without a trip through the form -
  // for the ones that need no answer the user has not already given.
  private updateDriftedSetups(changedIds: string[]) {
    if (this.setupFollowUpRunning || changedIds.length === 0) {
      return;
    }
    this.setupFollowUpRunning = true;
    // Only the modules this job changed: a drift left over from an earlier
    // session must not have its containers recreated on the back of an
    // unrelated install.
    const changed = new Set(changedIds);
    // read from the reduced module list rather than the table: a RepoModule
    // carries the repository's view of a module, not its setup
    this.moduleService
      .loadModulesReduced()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (modules) => {
          const ids = (modules || [])
            .filter((module) => changed.has(module.id) && needsDeploymentUpdate(module))
            .map((module) => module.id);
          if (ids.length === 0) {
            this.setupFollowUpRunning = false;
            return;
          }
          // One request for both sides: /modules carries the new version's
          // declarations next to the deployment created for the old one.
          // Deliberately not /deployment-request - that one omits every module
          // that already has a deployment, which is all of these.
          this.moduleService
            .loadModulesFull(ids)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (loaded) => this.applyCarriedOverSetups(ids, loaded || []),
              error: (err) => this.failSetupFollowUp(err),
            });
        },
        error: (err) => this.failSetupFollowUp(err),
      });
  }

  private applyCarriedOverSetups(ids: string[], loaded: DeploymentRequestModule[]) {
    const byId = new Map(loaded.map((module) => [module.id, module]));
    const inputs: DeploymentUserInput[] = [];
    const needInput: string[] = [];
    for (const id of ids) {
      const input = carryOverSetup(byId.get(id));
      if (input) {
        inputs.push(input);
      } else {
        needInput.push(id);
      }
    }
    if (inputs.length === 0) {
      this.setupFollowUpRunning = false;
      if (needInput.length > 0) {
        this.offerSetupForm(needInput);
      }
      return;
    }
    this.moduleService
      .updateDeployments(inputs)
      .pipe(
        concatMap((job) => {
          return this.utilService.checkJobStatus(
            job.id,
            this.translate('modules.manage.setupUpdate.updating'),
            'module-manager',
            'deployments-update',
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (jobResult) => {
          this.setupFollowUpRunning = false;
          if (jobResult?.result) {
            this.utilService.presentJobResult(
              this.translate('modules.manage.setupUpdate.resultTitle'),
              mapDeploymentResults(jobResult.result),
              this.translate('modules.manage.setupUpdate.updated'),
            );
          }
          // A cancelled job closes the loader the same way a finished one with
          // nothing to report does, so an absent result is the only signal
          // that the user stopped this - and then dragging them into a form is
          // the last thing they asked for. The drift stays on the list.
          if (needInput.length > 0 && jobResult?.result) {
            this.offerSetupForm(needInput);
            return;
          }
          this.load();
        },
        error: (err) => this.failSetupFollowUp(err),
      });
  }

  // The setups the new version asks something new of are never skipped
  // silently: they go to the edit form, all of them in one navigation.
  private offerSetupForm(moduleIDs: string[]) {
    this.notifications.showInfo(
      this.translate(`modules.manage.setupUpdate.needsInput.${moduleIDs.length === 1 ? 'one' : 'other'}`, {
        count: moduleIDs.length,
      }),
    );
    this.router.navigateByUrl('/deployments/edit/' + moduleIDs.map((id) => encodeURIComponent(id)).join(','));
  }

  private failSetupFollowUp(err: unknown) {
    this.setupFollowUpRunning = false;
    this.errorService.handleError(
      ManageComponent.name,
      'updateDriftedSetups',
      err,
      this.translate('modules.manage.errors.setupUpdateFailed'),
    );
  }

  private discardRequest() {
    this.moduleService.discardModulesChangeRequest().subscribe({
      next: (_) => {
        this.pendingRequest = null;
      },
      error: (err) => {
        this.errorService.handleError(
          ManageComponent.name,
          'discardRequest',
          err,
          this.translate('modules.manage.errors.discardFailed'),
        );
      },
    });
  }

  refreshRepositories() {
    const dialogRef = this.dialog.open(RefreshReposDialogComponent, {
      data: {
        repositories: this.repositories,
        hasPendingChangeRequest: !!this.pendingRequest,
      },
    });
    dialogRef.afterClosed().subscribe((sources) => {
      if (sources === undefined) {
        return;
      }
      this.runRefresh(sources.length > 0 ? sources : undefined);
    });
  }

  private runRefresh(sources?: string[]) {
    this.ready = false;
    this.moduleService
      .refreshRepositories(sources)
      .pipe(
        concatMap((job) => {
          return this.utilService.checkJobStatus(
            job.id,
            this.translate('modules.manage.jobs.refreshing'),
            'module-manager',
            'repositories-refresh',
          );
        }),
      )
      .subscribe({
        next: (jobResult) => {
          if (jobResult?.result) {
            this.utilService.presentJobResult(
              this.translate('modules.manage.repositoryRefresh'),
              mapRepositoryRefreshResult(jobResult.result),
              this.translate('modules.manage.jobs.refreshed'),
            );
          }
          // a refresh discards the pending change request
          this.pendingRequest = null;
          this.load();
        },
        error: (err) => {
          this.errorService.handleError(
            ManageComponent.name,
            'runRefresh',
            err,
            this.translate('modules.manage.errors.refreshFailed'),
          );
          this.ready = true;
        },
      });
  }
}
