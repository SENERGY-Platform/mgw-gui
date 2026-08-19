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

import {Component, Inject, OnInit, QueryList, ViewChildren} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {concatMap, forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {NgFor, NgIf} from '@angular/common';
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
import {mapDeploymentResults} from 'src/app/core/models/job-result-view';

// Edit (update) the deployment of a module: the form is prefilled from the
// embedded deployment and submitted via PUT /deployments. Also applies a
// pending module update to the deployment (deployed version lags installed).
@Component({
    selector: 'edit-deployment',
    templateUrl: './show-module-component.component.html',
    styleUrls: ['./show-module-component.component.css'],
    imports: [NgIf, NgFor, SpinnerComponent, MatButton, DeploymentFormComponent]
})
export class ShowModuleComponentComponent implements OnInit {
  modules: DeploymentRequestModule[] = []
  hostResources: HostResource[] = []
  secrets: Secret[] = []
  globalConfigs: GlobalConfig[] = []
  ready: boolean = false
  submitting: boolean = false
  @ViewChildren(DeploymentFormComponent) forms!: QueryList<DeploymentFormComponent>

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
    // one or more module IDs, each URI-encoded, joined by commas (batch edit)
    var moduleIDs = String(this.route.snapshot.params['ids']).split(',').map(id => decodeURIComponent(id))
    forkJoin({
      modules: this.moduleService.loadModulesFull(moduleIDs),
      hostResources: this.hostService.getHostResources().pipe(catchError(() => of(<HostResource[]>[]))),
      secrets: this.secretService.getSecrets().pipe(catchError(() => of(<Secret[]>[]))),
      globalConfigs: this.moduleService.getGlobalConfigs().pipe(catchError(() => of({}))),
    }).subscribe({
      next: (result) => {
        // only deployed modules can be edited; the list endpoint currently
        // reports is_deployed=false despite embedding the deployment, so a
        // populated deployment ID counts as deployed too
        this.modules = (result.modules || []).filter(module => module.is_deployed || !!module.deployment?.id)
        this.hostResources = result.hostResources || []
        this.secrets = result.secrets || []
        this.globalConfigs = Object.values(result.globalConfigs || {})
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(ShowModuleComponentComponent.name, "ngOnInit", err, "Loading the deployment failed")
        this.ready = true
      }
    })
  }

  submit() {
    var inputs = []
    for (const form of this.forms.toArray()) {
      var input = form.collect()
      if (!input) {
        return // per-field errors are shown inline
      }
      inputs.push(input)
    }
    if (inputs.length === 0) {
      this.router.navigateByUrl("/modules")
      return
    }
    this.submitting = true
    this.moduleService.updateDeployments(inputs).pipe(
      concatMap(job => this.utilService.checkJobStatus(job.id, "Updating deployment", "module-manager", "deployments-update"))
    ).subscribe({
      next: (jobResult) => {
        if (jobResult?.result) {
          this.utilService.presentJobResult("Update deployments", mapDeploymentResults(jobResult.result), "Deployment(s) updated")
        }
        this.router.navigateByUrl("/modules")
      },
      error: (err) => {
        this.errorService.handleError(ShowModuleComponentComponent.name, "submit", err, "Updating the deployment failed")
        this.submitting = false
      }
    })
  }

  updatePending(): boolean {
    return this.modules.some(module => module.deployment.module_version !== module.version)
  }

  cancel() {
    this.router.navigateByUrl("/modules")
  }
}
