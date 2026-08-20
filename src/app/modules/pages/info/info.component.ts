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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {DatePipe, KeyValuePipe} from '@angular/common';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {MatTabGroup, MatTab} from '@angular/material/tabs';
import {AuxDeploymentsListComponent} from 'src/app/deployments/components/aux-deployments-list/aux-deployments-list.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatDivider} from '@angular/material/divider';
import {concatMap, Observable, of} from 'rxjs';
import {DEPLOYMENT_STATE_HEALTHY, DEPLOYMENT_STATE_UNHEALTHY, ModuleInfo} from 'src/app/core/models/modules';
import {AuxContainer} from 'src/app/core/models/aux-deployments';
import {mapDeploymentResults} from 'src/app/core/models/job-result-view';
import {JobResultKind} from 'src/app/core/components/job-loader-modal/job-loader-modal.component';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {StatusPillComponent, StatusTone} from 'src/app/core/components/status-pill/status-pill.component';

@Component({
  selector: 'module-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css'],
  imports: [
    SpinnerComponent, DatePipe, KeyValuePipe, RouterLink, MatButton, MatIconButton, MatIcon, MatTooltip,
    MatChipSet, MatChip, MatTabGroup, MatTab, MatMenu, MatMenuItem, MatMenuTrigger, MatDivider,
    AuxDeploymentsListComponent, PageHeaderComponent, StatusPillComponent
  ]
})
export class InfoComponent implements OnInit, OnDestroy {
  module!: ModuleInfo;
  ready = false;
  moduleID = '';

  private interval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
    private errorService: ErrorService,
    private utilService: UtilService
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.moduleID = params['id'];
      this.ready = false;
      this.load(false);
    });
    // container state changes without a user action, same cadence as the list
    this.interval = setInterval(() => this.load(true), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  load(background: boolean) {
    if (!this.moduleID) {
      return;
    }
    this.moduleService.loadModule(this.moduleID).subscribe({
      next: (module) => {
        this.module = module;
        this.ready = true;
      },
      error: (err) => {
        if (!background) {
          this.errorService.handleError(InfoComponent.name, "load", err, "Loading the module failed");
        }
        this.ready = true;
      }
    });
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

  deploymentStateLabel(): string {
    if (!this.module.is_deployed) {
      return "Not deployed";
    }
    if (!this.module.deployment.enabled) {
      return "Stopped";
    }
    switch (this.module.deployment.state) {
      case DEPLOYMENT_STATE_HEALTHY:
        return "Running";
      case DEPLOYMENT_STATE_UNHEALTHY:
        return "Unhealthy";
      default:
        return "Unknown";
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

  containerLabel(container: AuxContainer): string {
    if (!container.state) {
      return 'missing';
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
    this.router.navigateByUrl("/deployments/add/" + encodeURIComponent(this.moduleID));
  }

  edit() {
    this.router.navigateByUrl("/deployments/edit/" + encodeURIComponent(this.moduleID));
  }

  start() {
    this.runSync(this.moduleService.enableDeployments([this.moduleID]), "start", "Starting the deployment failed");
  }

  stop() {
    this.runSync(this.moduleService.disableDeployments([this.moduleID]), "stop", "Stopping the deployment failed");
  }

  recreate() {
    this.runJob(this.moduleService.recreateDeployments([this.moduleID]), "Deployment is recreating", "deployments",
      "recreate", "Recreate containers", "Containers recreated", "Recreating the containers failed");
  }

  deleteDeployment() {
    this.utilService.askForConfirmation("Delete the deployment of " + this.module.name + "? Data stored in volumes will be removed.").pipe(
      concatMap(confirmed => {
        if (!confirmed) {
          return of(null);
        }
        this.runJob(this.moduleService.removeDeployments([this.moduleID]), "Deployment is being deleted",
          "deployments-delete", "delete", "Delete deployment", "Deployment deleted", "Deleting the deployment failed");
        return of(true);
      })
    ).subscribe();
  }

  private runSync(obs: Observable<string[]>, method: string, errorContext: string) {
    this.ready = false;
    obs.subscribe({
      next: (_) => this.load(false),
      error: (err) => {
        this.errorService.handleError(InfoComponent.name, method, err, errorContext);
        this.ready = true;
      }
    });
  }

  private runJob(obs: Observable<any>, message: string, resultKind: JobResultKind, method: string, resultTitle: string, successMessage: string, errorContext: string) {
    this.ready = false;
    obs.pipe(
      concatMap(job => this.utilService.checkJobStatus(job.id, message, "module-manager", resultKind))
    ).subscribe({
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
      }
    });
  }
}
