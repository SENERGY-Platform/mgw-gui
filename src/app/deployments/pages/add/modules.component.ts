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

import {Component, Inject, OnInit, QueryList, ViewChildren, inject} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {concatMap, forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
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

// Create deployments: /deployment-request resolves the requested modules plus
// their dependencies, one form per module, submitted together as a batch.
@Component({
  selector: 'add-deployment',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css'],
  imports: [
    SpinnerComponent,
    MatButton,
    MatIcon,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    DeploymentFormComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('deployments')],
})
export class ModulesComponent implements OnInit {
  // Resolved directly rather than through the `transloco` pipe: these are
  // plain strings handed to the error snackbar and the job dialogs, neither
  // of which has a template binding a pipe could sit on.
  private readonly transloco = inject(TranslocoService);

  modules: DeploymentRequestModule[] = [];
  // how many modules the route asked for, which decides whether the extra
  // forms below are dependencies or the rest of the user's selection
  requestedCount = 0;
  hostResources: HostResource[] = [];
  secrets: Secret[] = [];
  globalConfigs: GlobalConfig[] = [];
  ready = false;
  submitting = false;
  @ViewChildren(DeploymentFormComponent) forms!: QueryList<DeploymentFormComponent>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    @Inject('HostManagerService') private hostService: HostManagerService,
    @Inject('SecretManagerService') private secretService: SecretManagerServiceService,
    private errorService: ErrorService,
    private utilService: UtilService,
  ) {}

  ngOnInit(): void {
    // one or more module IDs, each URI-encoded, joined by commas (batch deploy)
    const moduleIDs = String(this.route.snapshot.params['ids'])
      .split(',')
      .map((id) => decodeURIComponent(id));
    this.requestedCount = moduleIDs.length;
    forkJoin({
      modules: this.moduleService.loadDeploymentRequest(moduleIDs),
      hostResources: this.hostService.getHostResources().pipe(catchError(() => of([] as HostResource[]))),
      secrets: this.secretService.getSecrets().pipe(catchError(() => of([] as Secret[]))),
      globalConfigs: this.moduleService.getGlobalConfigs().pipe(catchError(() => of({}))),
    }).subscribe({
      next: (result) => {
        // already deployed dependencies need no new deployment
        this.modules = (result.modules || []).filter((module) => !module.is_deployed);
        this.hostResources = result.hostResources || [];
        this.secrets = result.secrets || [];
        this.globalConfigs = Object.values(result.globalConfigs || {});
        this.ready = true;
      },
      error: (err) => {
        this.errorService.handleError(
          ModulesComponent.name,
          'ngOnInit',
          err,
          this.transloco.translate<string>('deployments.addDeployment.loadFailed'),
        );
        this.ready = true;
      },
    });
  }

  submit() {
    const inputs: DeploymentUserInput[] = [];
    for (const form of this.forms.toArray()) {
      const input = form.collect();
      if (!input) {
        return; // per-field errors are shown inline
      }
      inputs.push(input);
    }
    if (inputs.length === 0) {
      this.router.navigateByUrl('/modules');
      return;
    }
    this.submitting = true;
    this.moduleService
      .createDeployments(inputs)
      .pipe(
        concatMap((job) =>
          this.utilService.checkJobStatus(
            job.id,
            this.transloco.translate<string>('deployments.addDeployment.creatingJob'),
            'module-manager',
            'deployments',
          ),
        ),
      )
      .subscribe({
        next: (jobResult) => {
          if (jobResult?.result) {
            this.utilService.presentJobResult(
              this.transloco.translate<string>('deployments.addDeployment.jobResultTitle'),
              mapDeploymentResults(jobResult.result),
              this.transloco.translate<string>('deployments.addDeployment.deploymentCreated'),
            );
          }
          this.router.navigateByUrl('/modules');
        },
        error: (err) => {
          this.errorService.handleError(
            ModulesComponent.name,
            'submit',
            err,
            this.transloco.translate<string>('deployments.addDeployment.createFailed'),
          );
          this.submitting = false;
        },
      });
  }

  // a translation key, not display text - the template applies the pipe
  descriptionKey(): string {
    return this.requestedCount > 1
      ? 'deployments.addDeployment.descriptionMultiple'
      : 'deployments.addDeployment.description';
  }

  // a translation key, not display text - the template applies the pipe
  noticeKey(): string {
    return this.requestedCount > 1
      ? 'deployments.addDeployment.selectionNotice'
      : 'deployments.addDeployment.dependenciesNotice';
  }

  // a translation key, not display text - the template applies the pipe
  nothingToDeployKey(): string {
    return this.requestedCount > 1
      ? 'deployments.addDeployment.allAlreadyDeployedMessage'
      : 'deployments.addDeployment.alreadyDeployedMessage';
  }

  cancel() {
    this.router.navigateByUrl('/modules');
  }
}
