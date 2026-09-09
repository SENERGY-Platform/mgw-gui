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

import {Component, Inject, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {DatePipe, KeyValuePipe} from '@angular/common';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {MatTabGroup, MatTab, MatTabContent} from '@angular/material/tabs';
import {AuxDeploymentsListComponent} from 'src/app/deployments/components/aux-deployments-list/aux-deployments-list.component';
import {ListEndpointsComponent} from 'src/app/core/components/list-endpoints/list-endpoints.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatDivider} from '@angular/material/divider';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {concatMap, Observable, of} from 'rxjs';
import {DEPLOYMENT_STATE_HEALTHY, DEPLOYMENT_STATE_UNHEALTHY, ModuleInfo} from 'src/app/core/models/modules';
import {AuxContainer} from 'src/app/core/models/aux-deployments';
import {mapDeploymentResults} from 'src/app/core/models/job-result-view';
import {JobResultKind} from 'src/app/core/components/job-loader-modal/job-loader-modal.component';
import {formatConfigValue, GlobalConfig, InterfaceValue} from 'src/app/core/models/global-configs';
import {ModuleConfigValue, moduleInputGroupLabel} from 'src/app/core/models/deployment-request';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {StatusPillComponent, StatusTone} from 'src/app/core/components/status-pill/status-pill.component';

// One row of the configuration tab: what the module asks for, what the
// deployment answers, and which of the two the container actually sees.
export interface ConfigRow {
  ref: string;
  name: string;
  description: string;
  group: string;
  value: string;
  origin: ConfigOrigin;
  required: boolean;
}

// 'input' and 'global' come from the deployment, 'default' from the module.
// 'deprecated' is a value the deployment carries for a config the module no
// longer declares - after an update that dropped it.
export type ConfigOrigin = 'input' | 'global' | 'default' | 'deprecated';

@Component({
  selector: 'module-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css'],
  imports: [
    SpinnerComponent,
    DatePipe,
    KeyValuePipe,
    RouterLink,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip,
    MatChipSet,
    MatChip,
    MatTabGroup,
    MatTab,
    MatTabContent,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatDivider,
    AuxDeploymentsListComponent,
    ListEndpointsComponent,
    PageHeaderComponent,
    StatusPillComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('modules')],
})
export class InfoComponent implements OnInit, OnDestroy {
  module!: ModuleInfo;
  ready = false;
  moduleID = '';
  selectedTab = 0;
  configRows: ConfigRow[] = [];
  private globalConfigNames: Record<string, string> = {};

  // Tab order in the template. The query parameter carries the name rather
  // than the index, so reordering the tabs does not break existing links -
  // the logs page sends the reader back to 'containers'.
  private readonly tabs = ['overview', 'configs', 'containers', 'endpoints', 'auxDeployments'];

  private interval: any;

  // Field injection, not a constructor parameter: new dependencies follow
  // the prefer-inject rule; the parameters above predate it.
  private readonly transloco = inject(TranslocoService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    private errorService: ErrorService,
    private utilService: UtilService,
  ) {}

  private translate(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate<string>(key, params);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.moduleID = params['id'];
      this.ready = false;
      this.load(false);
    });
    this.route.queryParams.subscribe((params) => {
      const index = this.tabs.indexOf(params['tab']);
      this.selectedTab = index < 0 ? 0 : index;
    });
    // Only for the names behind the global config ids; a failure leaves the
    // id showing, which still identifies the config.
    this.moduleService.getGlobalConfigs().subscribe({
      next: (configs) => {
        this.globalConfigNames = {};
        Object.values(configs || {}).forEach(
          (config: GlobalConfig) => (this.globalConfigNames[config.id] = config.name),
        );
        this.buildConfigRows();
      },
      error: () => undefined,
    });
    // container state changes without a user action, same cadence as the list
    this.interval = setInterval(() => this.load(true), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    // replaceUrl: switching tabs is not a navigation step the back button
    // should have to walk through
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {tab: this.tabs[index]},
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  load(background: boolean) {
    if (!this.moduleID) {
      return;
    }
    this.moduleService.loadModule(this.moduleID).subscribe({
      next: (module) => {
        this.module = module;
        this.buildConfigRows();
        this.ready = true;
      },
      error: (err) => {
        if (!background) {
          this.errorService.handleError(
            InfoComponent.name,
            'load',
            err,
            this.translate('modules.info.errors.loadFailed'),
          );
        }
        this.ready = true;
      },
    });
  }

  // --- configuration -------------------------------------------------------

  // The module declares which configs exist, the deployment answers some of
  // them. A config the deployment does not mention keeps the module default,
  // which is what the container ends up with - so the default belongs in the
  // list rather than being left blank.
  private buildConfigRows() {
    if (!this.module) {
      return;
    }
    const declared = this.module.configs || {};
    const inputs = this.module.inputs?.configs || {};
    const deployment = this.module.is_deployed ? this.module.deployment : undefined;
    const values = deployment?.configs || {};
    const globals = deployment?.global_configs || {};

    const rows: ConfigRow[] = Object.entries(declared).map(([ref, config]) =>
      this.declaredRow(ref, config, inputs[ref], values[ref], globals[ref]),
    );
    // Anything the deployment answers that the module no longer asks about -
    // an update dropped the config, and the value is still sitting there.
    for (const ref of new Set([...Object.keys(values), ...Object.keys(globals)])) {
      if (!declared[ref]) {
        rows.push({
          ref: ref,
          name: ref,
          description: '',
          group: '',
          value: globals[ref] ? this.globalConfigLabel(globals[ref]) : formatConfigValue(values[ref]),
          origin: 'deprecated',
          required: false,
        });
      }
    }
    this.configRows = rows;
  }

  private declaredRow(
    ref: string,
    config: ModuleConfigValue,
    input: {name: string; description: string; group: string} | undefined,
    value: InterfaceValue | undefined,
    globalId: string | undefined,
  ): ConfigRow {
    let origin: ConfigOrigin = 'default';
    let rendered = this.defaultLabel(config);
    if (globalId) {
      origin = 'global';
      rendered = this.globalConfigLabel(globalId);
    } else if (value) {
      origin = 'input';
      rendered = formatConfigValue(value);
    }
    return {
      ref: ref,
      // a config without user input metadata is one the module sets itself;
      // its reference is the only name there is
      name: input?.name || ref,
      description: input?.description || '',
      group: moduleInputGroupLabel(this.module.inputs, input?.group || ''),
      value: rendered,
      origin: origin,
      required: config.required,
    };
  }

  private defaultLabel(config: ModuleConfigValue): string {
    if (config.default === null || config.default === undefined) {
      return '';
    }
    return config.is_slice && Array.isArray(config.default) ? config.default.join(', ') : String(config.default);
  }

  // Falls back to the id: a global config the user cannot see the name of is
  // still better identified than by an empty cell.
  private globalConfigLabel(globalId: string | undefined): string {
    if (!globalId) {
      return '';
    }
    return this.globalConfigNames[globalId] || globalId;
  }

  hasConfigs(): boolean {
    return this.configRows.length > 0;
  }

  // a translation key, not display text - the template applies the pipe
  originLabel(origin: ConfigOrigin): string {
    return 'modules.info.configs.origins.' + origin;
  }

  // --- state ---------------------------------------------------------------

  deploymentTone(): StatusTone {
    if (!this.module.is_deployed) {
      return 'idle';
    }
    if (!this.module.deployment.enabled) {
      return 'idle';
    }
    switch (this.module.deployment.state) {
      case DEPLOYMENT_STATE_HEALTHY:
        return 'ok';
      case DEPLOYMENT_STATE_UNHEALTHY:
        return 'danger';
      default:
        return 'warn';
    }
  }

  // a translation key, not display text - the template applies the pipe
  deploymentStateLabel(): string {
    if (!this.module.is_deployed) {
      return 'modules.info.statuses.notDeployed';
    }
    if (!this.module.deployment.enabled) {
      return 'modules.info.statuses.stopped';
    }
    switch (this.module.deployment.state) {
      case DEPLOYMENT_STATE_HEALTHY:
        return 'modules.info.statuses.running';
      case DEPLOYMENT_STATE_UNHEALTHY:
        return 'modules.info.statuses.unhealthy';
      default:
        return 'modules.info.statuses.unknown';
    }
  }

  containerTone(container: AuxContainer): StatusTone {
    if (container.health === 'unhealthy') {
      return 'danger';
    }
    if (container.state === 'running') {
      return 'ok';
    }
    return container.state ? 'idle' : 'danger';
  }

  // 'missing' is a translation key; the container state/health themselves are
  // raw backend values, not prose, so they pass through the pipe untranslated
  // (see ListJobTable.sourceLabel for the same fallback pattern)
  containerLabel(container: AuxContainer): string {
    if (!container.state) {
      return 'modules.info.containerMissing';
    }
    return container.health ? container.state + ' · ' + container.health : container.state;
  }

  containerCount(): number {
    return Object.keys(this.module?.deployment?.containers || {}).length;
  }

  hasError(): boolean {
    return this.module.has_error || (this.module.is_deployed && this.module.deployment.has_error);
  }

  errorMessage(): string {
    return this.module.error_msg || this.module.deployment?.error_msg || '';
  }

  // --- actions -------------------------------------------------------------

  deploy() {
    this.router.navigateByUrl('/deployments/add/' + encodeURIComponent(this.moduleID));
  }

  edit() {
    this.router.navigateByUrl('/deployments/edit/' + encodeURIComponent(this.moduleID));
  }

  start() {
    this.runSync(
      this.moduleService.enableDeployments([this.moduleID]),
      'start',
      this.translate('modules.info.errors.startFailed'),
    );
  }

  stop() {
    this.runSync(
      this.moduleService.disableDeployments([this.moduleID]),
      'stop',
      this.translate('modules.info.errors.stopFailed'),
    );
  }

  recreate() {
    this.runJob(
      this.moduleService.recreateDeployments([this.moduleID]),
      this.translate('modules.info.jobs.recreating'),
      'deployments',
      'recreate',
      this.translate('modules.info.recreateContainers'),
      this.translate('modules.info.jobs.recreated'),
      this.translate('modules.info.errors.recreateFailed'),
    );
  }

  deleteDeployment() {
    this.utilService
      .askForConfirmation(this.translate('modules.info.confirmDelete', {name: this.module.name}))
      .pipe(
        concatMap((confirmed) => {
          if (!confirmed) {
            return of(null);
          }
          this.runJob(
            this.moduleService.removeDeployments([this.moduleID]),
            this.translate('modules.info.jobs.deleting'),
            'deployments-delete',
            'delete',
            this.translate('modules.info.deleteDeployment'),
            this.translate('modules.info.jobs.deleted'),
            this.translate('modules.info.errors.deleteFailed'),
          );
          return of(true);
        }),
      )
      .subscribe();
  }

  private runSync(obs: Observable<string[]>, method: string, errorContext: string) {
    this.ready = false;
    obs.subscribe({
      next: (_) => this.load(false),
      error: (err) => {
        this.errorService.handleError(InfoComponent.name, method, err, errorContext);
        this.ready = true;
      },
    });
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
    obs
      .pipe(concatMap((job) => this.utilService.checkJobStatus(job.id, message, 'module-manager', resultKind)))
      .subscribe({
        next: (jobResult) => {
          if (jobResult?.result) {
            this.utilService.presentJobResult(resultTitle, mapDeploymentResults(jobResult.result), successMessage);
          }
          // the deployment is gone after a delete, so go back to the list
          if (method === 'delete') {
            this.router.navigateByUrl('/modules');
            return;
          }
          this.load(false);
        },
        error: (err) => {
          this.errorService.handleError(InfoComponent.name, method, err, errorContext);
          this.ready = true;
        },
      });
  }
}
