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

import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
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
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {StatusPillComponent, StatusTone} from 'src/app/core/components/status-pill/status-pill.component';
import {EmptyStateComponent} from 'src/app/core/components/empty-state/empty-state.component';
import {RepoModule, Repository} from 'src/app/core/models/repositories';
import {ChangeRequestItem, ModulesChangeRequest} from 'src/app/core/models/modules';
import {mapModulesChangeResult, mapRepositoryRefreshResult} from 'src/app/core/models/job-result-view';
import {ChangeRequestDialogComponent} from '../../components/change-request-dialog/change-request-dialog.component';
import {RefreshReposDialogComponent} from '../../components/refresh-repos-dialog/refresh-repos-dialog.component';

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
    PageHeaderComponent,
    StatusPillComponent,
    EmptyStateComponent,
  ],
})
export class ManageComponent implements OnInit {
  dataSource = new MatTableDataSource<RepoModule>();
  ready = false;
  init = true;
  displayColumns = ['name', 'status', 'version', 'variant', 'action'];
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

  constructor(
    public dialog: MatDialog,
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    private errorService: ErrorService,
    private utilService: UtilService,
  ) {}

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
          this.ready = true;
        },
        error: (err) => {
          this.errorService.handleError(ManageComponent.name, 'load', err, 'Loading the module catalog failed');
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

  statusTone(module: RepoModule): StatusTone {
    if (!module.is_installed) {
      return 'idle';
    }
    return module.installed_variant.next_version ? 'warn' : 'ok';
  }

  statusLabel(module: RepoModule): string {
    if (!module.is_installed) {
      return 'Available';
    }
    return module.installed_variant.next_version ? 'Update available' : 'Installed';
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

  cartCount(): number {
    return Object.keys(this.cart).length;
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
          'Creating the change request failed',
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
          return this.utilService.checkJobStatus(job.id, 'Applying module changes', 'module-manager', 'modules-change');
        }),
      )
      .subscribe({
        next: (jobResult) => {
          // the job succeeds even if single modules failed
          if (jobResult?.result) {
            this.utilService.presentJobResult(
              'Module changes',
              mapModulesChangeResult(jobResult.result),
              'Module changes applied',
            );
          }
          this.pendingRequest = null;
          this.clearCart();
          this.load();
        },
        error: (err) => {
          this.errorService.handleError(
            ManageComponent.name,
            'executeRequest',
            err,
            'Applying the module changes failed',
          );
          this.ready = true;
        },
      });
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
          'Discarding the change request failed',
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
            'Refreshing repositories',
            'module-manager',
            'repositories-refresh',
          );
        }),
      )
      .subscribe({
        next: (jobResult) => {
          if (jobResult?.result) {
            this.utilService.presentJobResult(
              'Repository refresh',
              mapRepositoryRefreshResult(jobResult.result),
              'Repositories refreshed',
            );
          }
          // a refresh discards the pending change request
          this.pendingRequest = null;
          this.load();
        },
        error: (err) => {
          this.errorService.handleError(ManageComponent.name, 'runRefresh', err, 'Refreshing the repositories failed');
          this.ready = true;
        },
      });
  }
}
