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

import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {concatMap, forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {HostManagerService} from 'src/app/core/services/host-manager/host-manager.service';
import {SecretManagerServiceService} from 'src/app/core/services/secret-manager/secret-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {SpinnerComponent} from 'src/app/core/components/spinner/spinner.component';
import {DeploymentFormComponent} from '../../components/deployment-form/deployment-form.component';
import {DeploymentRequestModule} from 'src/app/core/models/deployment-request';
import {GlobalConfig} from 'src/app/core/models/global-configs';
import {HostResource} from 'src/app/host/models/models';
import {Secret} from 'src/app/secrets/models/secret_models';
import {DeploymentUpdateJobResult} from 'src/app/core/models/jobs';

// Edit (update) the deployment of a module: the form is prefilled from the
// embedded deployment and submitted via PUT /deployments. Also applies a
// pending module update to the deployment (deployed version lags installed).
@Component({
  selector: 'edit-deployment',
  templateUrl: './show-module-component.component.html',
  styleUrls: ['./show-module-component.component.css'],
  standalone: true,
  imports: [NgIf, SpinnerComponent, MatButton, DeploymentFormComponent]
})
export class ShowModuleComponentComponent implements OnInit {
  module?: DeploymentRequestModule
  hostResources: HostResource[] = []
  secrets: Secret[] = []
  globalConfigs: GlobalConfig[] = []
  ready: boolean = false
  submitting: boolean = false
  @ViewChild(DeploymentFormComponent) form?: DeploymentFormComponent

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
    @Inject("HostManagerService") private hostService: HostManagerService,
    @Inject("SecretManagerService") private secretService: SecretManagerServiceService,
    private errorService: ErrorService,
    private utilService: UtilService,
  ) {
  }

  ngOnInit(): void {
    var moduleID = decodeURIComponent(this.route.snapshot.params['id'])
    forkJoin({
      module: this.moduleService.loadModuleFull(moduleID),
      hostResources: this.hostService.getHostResources().pipe(catchError(() => of(<HostResource[]>[]))),
      secrets: this.secretService.getSecrets().pipe(catchError(() => of(<Secret[]>[]))),
      globalConfigs: this.moduleService.getGlobalConfigs().pipe(catchError(() => of({}))),
    }).subscribe({
      next: (result) => {
        this.module = result.module
        this.hostResources = result.hostResources || []
        this.secrets = result.secrets || []
        this.globalConfigs = Object.values(result.globalConfigs || {})
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(ShowModuleComponentComponent.name, "ngOnInit", err)
        this.ready = true
      }
    })
  }

  submit() {
    var input = this.form?.collect()
    if (!input) {
      return
    }
    this.submitting = true
    this.moduleService.updateDeployments([input]).pipe(
      concatMap(job => this.utilService.checkJobStatus(job.id, "Updating deployment", "module-manager", "deployments-update"))
    ).subscribe({
      next: (jobResult) => {
        this.reportPartialFailures(jobResult?.result)
        this.router.navigateByUrl("/modules")
      },
      error: (err) => {
        this.errorService.handleError(ShowModuleComponentComponent.name, "submit", err)
        this.submitting = false
      }
    })
  }

  private reportPartialFailures(result: DeploymentUpdateJobResult | undefined) {
    if (!result || !result.results_err_num) {
      return
    }
    var errors = (result.results || []).filter(r => r.has_error).map(r => r.module_id + ": " + r.error_msg)
    this.errorService.handleError(ShowModuleComponentComponent.name, "submit", new Error(result.results_err_num + " update(s) failed. " + errors.join("; ")))
  }

  updatePending(): boolean {
    return !!this.module && this.module.is_deployed && this.module.deployment.module_version !== this.module.version
  }

  cancel() {
    this.router.navigateByUrl("/modules")
  }
}
