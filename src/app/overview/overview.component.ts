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
import {RouterLink} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {ModuleManagerService} from '../core/services/module-manager/module-manager-service.service';
import {CoreManagerService} from '../core/services/core-manager/core-manager.service';
import {
  DEPLOYMENT_STATE_HEALTHY,
  DEPLOYMENT_STATE_UNHEALTHY,
  ModuleReduced,
  needsDeploymentUpdate,
} from '../core/models/modules';
import {Job, isJobDone} from '../core/models/jobs';
import {CoreService} from '../system/models/services';
import {PageHeaderComponent} from '../core/components/page-header/page-header.component';
import {StatusPillComponent, StatusTone} from '../core/components/status-pill/status-pill.component';
import {SpinnerComponent} from '../core/components/spinner/spinner.component';

/** One entry of the "needs attention" list. */
interface Attention {
  tone: StatusTone;
  icon: string;
  title: string;
  detail: string;
  // router link commands, not a URL: only the first command is split on "/",
  // so a module ID keeps its slashes and is encoded exactly once
  route: string[];
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
  imports: [
    RouterLink,
    MatIcon,
    MatButton,
    MatIconButton,
    MatTooltip,
    PageHeaderComponent,
    StatusPillComponent,
    SpinnerComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('overview')],
})
export class OverviewComponent implements OnInit, OnDestroy {
  ready = false;

  modules: ModuleReduced[] = [];
  running = 0;
  stopped = 0;
  unhealthy = 0;
  unknown = 0;
  notDeployed = 0;
  updatesAvailable = 0;
  activeJobs: Job[] = [];
  coreServices: CoreService[] = [];
  attention: Attention[] = [];

  private interval: any;

  // Field injection, not a constructor parameter: new dependencies follow
  // the prefer-inject rule; the parameters above predate it.
  private readonly transloco = inject(TranslocoService);

  constructor(
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    @Inject('CoreManagerService') private coreService: CoreManagerService,
  ) {}

  ngOnInit(): void {
    this.load();
    // the runtime monitor updates deployment state asynchronously, so the
    // overview polls at the same cadence as the module list
    this.interval = setInterval(() => this.load(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  load() {
    this.moduleService.loadModulesReduced().subscribe({
      next: (modules) => {
        this.modules = modules || [];
        this.recount();
        this.ready = true;
      },
      error: (_) => {
        this.ready = true;
      },
    });
    this.moduleService.getAvailableUpdatesCount().subscribe({
      next: (count) => {
        this.updatesAvailable = count || 0;
        this.recount();
      },
      error: (_) => {},
    });
    this.moduleService.getJobs().subscribe({
      next: (jobs) => (this.activeJobs = (jobs || []).filter((job) => !isJobDone(job))),
      error: (_) => (this.activeJobs = []),
    });
    this.coreService.getServices().subscribe({
      next: (services) => (this.coreServices = Object.values(services || {})),
      error: (_) => (this.coreServices = []),
    });
  }

  deployedCount(): number {
    return this.running + this.stopped + this.unhealthy + this.unknown;
  }

  serviceTone(service: CoreService): StatusTone {
    return service.container?.state === 'running' ? 'ok' : 'danger';
  }

  serviceLabel(service: CoreService): string {
    return service.container?.state || this.transloco.translate<string>('overview.services.unknownState');
  }

  private recount() {
    this.running = 0;
    this.stopped = 0;
    this.unhealthy = 0;
    this.unknown = 0;
    this.notDeployed = 0;
    const attention: Attention[] = [];

    for (const module of this.modules) {
      if (!module.is_deployed) {
        this.notDeployed++;
      } else if (!module.deployment.enabled) {
        this.stopped++;
      } else if (module.deployment.state === DEPLOYMENT_STATE_HEALTHY) {
        this.running++;
      } else if (module.deployment.state === DEPLOYMENT_STATE_UNHEALTHY) {
        this.unhealthy++;
        attention.push({
          tone: 'danger',
          icon: 'error',
          title: module.name,
          detail: this.transloco.translate<string>('overview.attention.unhealthy'),
          route: ['/modules/detail', module.id],
        });
      } else {
        this.unknown++;
      }

      if (module.has_error || (module.is_deployed && module.deployment.has_error)) {
        attention.push({
          tone: 'danger',
          icon: 'warning',
          title: module.name,
          detail:
            module.error_msg ||
            module.deployment?.error_msg ||
            this.transloco.translate<string>('overview.attention.moduleError'),
          route: ['/modules/detail', module.id],
        });
      }

      if (needsDeploymentUpdate(module)) {
        attention.push({
          tone: 'warn',
          icon: 'upgrade',
          title: module.name,
          detail: this.transloco.translate<string>('overview.attention.updateAvailable', {
            installed: module.version,
            deployed: module.deployment.module_version,
          }),
          route: ['/deployments/edit', module.id],
        });
      }
    }

    if (this.updatesAvailable > 0) {
      attention.push({
        tone: 'info',
        icon: 'download',
        title: this.transloco.translate<string>(
          `overview.attention.updatesAvailableTitle.${this.updatesAvailable === 1 ? 'one' : 'other'}`,
          {count: this.updatesAvailable},
        ),
        detail: this.transloco.translate<string>('overview.attention.newVersionsFound'),
        route: ['/modules/catalog'],
      });
    }

    this.attention = attention;
  }
}
