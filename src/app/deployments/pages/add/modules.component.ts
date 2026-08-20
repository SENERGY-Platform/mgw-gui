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
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {concatMap, forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {EmptyStateComponent} from 'src/app/core/components/empty-state/empty-state.component';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {HostManagerService} from 'src/app/core/services/host-manager/host-manager.service';
import {SecretManagerServiceService} from 'src/app/core/services/secret-manager/secret-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {SpinnerComponent} from 'src/app/core/components/spinner/spinner.component';
import {DeploymentFormComponent} from '../../components/deployment-form/deployment-form.component';
import {DeploymentRequestModule, DeploymentUserInput} from 'src/app/core/models/deployment-request';
import {GlobalConfig} from 'src/app/core/models/global-configs';
import {HostResource} from 'src/app/host/models/models';
import {Secret} from 'src/app/secrets/models/secret_models';
import {mapDeploymentResults} from 'src/app/core/models/job-result-view';

// Create deployments: /deployment-request resolves the requested module plus
// its dependencies, one form per module, submitted together as a batch.
@Component({
    selector: 'add-deployment',
    templateUrl: './modules.component.html',
    styleUrls: ['./modules.component.css'],
    imports: [SpinnerComponent, MatButton, MatIcon, RouterLink, PageHeaderComponent, EmptyStateComponent, DeploymentFormComponent]
})
export class ModulesComponent implements OnInit {
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
    var moduleID = decodeURIComponent(this.route.snapshot.params['id'])
    forkJoin({
      modules: this.moduleService.loadDeploymentRequest([moduleID]),
      hostResources: this.hostService.getHostResources().pipe(catchError(() => of(<HostResource[]>[]))),
      secrets: this.secretService.getSecrets().pipe(catchError(() => of(<Secret[]>[]))),
      globalConfigs: this.moduleService.getGlobalConfigs().pipe(catchError(() => of({}))),
    }).subscribe({
      next: (result) => {
        // already deployed dependencies need no new deployment
        this.modules = (result.modules || []).filter(module => !module.is_deployed)
        this.hostResources = result.hostResources || []
        this.secrets = result.secrets || []
        this.globalConfigs = Object.values(result.globalConfigs || {})
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(ModulesComponent.name, "ngOnInit", err, "Loading the deployment form failed")
        this.ready = true
      }
    })
  }

  submit() {
    var inputs: DeploymentUserInput[] = []
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
    this.moduleService.createDeployments(inputs).pipe(
      concatMap(job => this.utilService.checkJobStatus(job.id, "Creating deployments", "module-manager", "deployments"))
    ).subscribe({
      next: (jobResult) => {
        if (jobResult?.result) {
          this.utilService.presentJobResult("Create deployments", mapDeploymentResults(jobResult.result), "Deployment created")
        }
        this.router.navigateByUrl("/modules")
      },
      error: (err) => {
        this.errorService.handleError(ModulesComponent.name, "submit", err, "Creating the deployment failed")
        this.submitting = false
      }
    })
  }

  cancel() {
    this.router.navigateByUrl("/modules")
  }
}
