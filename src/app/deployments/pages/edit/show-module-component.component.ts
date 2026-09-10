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
import {NotificationService} from 'src/app/core/services/util/notifications.service';
import {SpinnerComponent} from 'src/app/core/components/spinner/spinner.component';
import {DeploymentFormComponent} from '../../components/deployment-form/deployment-form.component';
import {DeploymentRequestModule, DeploymentUserInput} from 'src/app/core/models/deployment-request';
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
export class ShowModuleComponentComponent implements OnInit {
  // Resolved directly rather than through the `transloco` pipe: these are
  // plain strings handed to the error snackbar and the job dialogs, neither
  // of which has a template binding a pipe could sit on.
  private readonly transloco = inject(TranslocoService);
  private readonly notifications = inject(NotificationService);

  modules: DeploymentRequestModule[] = [];
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
    // one or more module IDs, each URI-encoded, joined by commas (batch edit)
    const moduleIDs = String(this.route.snapshot.params['ids'])
      .split(',')
      .map((id) => decodeURIComponent(id));
    forkJoin({
      modules: this.moduleService.loadModulesFull(moduleIDs),
      hostResources: this.hostService.getHostResources().pipe(catchError(() => of([] as HostResource[]))),
      secrets: this.secretService.getSecrets().pipe(catchError(() => of([] as Secret[]))),
      globalConfigs: this.moduleService.getGlobalConfigs().pipe(catchError(() => of({}))),
    }).subscribe({
      next: (result) => {
        // only deployed modules can be edited
        this.modules = (result.modules || []).filter((module) => module.is_deployed);
        this.hostResources = result.hostResources || [];
        this.secrets = result.secrets || [];
        this.globalConfigs = Object.values(result.globalConfigs || {});
        this.ready = true;
      },
      error: (err) => {
        this.errorService.handleError(
          ShowModuleComponentComponent.name,
          'ngOnInit',
          err,
          this.transloco.translate<string>('deployments.editDeployment.loadFailed'),
        );
        this.ready = true;
      },
    });
  }

  submit() {
    const inputs: DeploymentUserInput[] = [];
    let firstInvalid: DeploymentFormComponent | undefined;
    for (const form of this.forms.toArray()) {
      const input = form.collect();
      if (!input) {
        firstInvalid ??= form;
        continue;
      }
      inputs.push(input);
    }
    if (firstInvalid) {
      // the per-field error alone is easy to miss: on a long form the offending
      // field sits far above the button that was just pressed
      this.notifications.showError(this.transloco.translate<string>('deployments.form.errors.formIncomplete'));
      firstInvalid.revealFirstError();
      return;
    }
    if (inputs.length === 0) {
      this.router.navigateByUrl('/modules');
      return;
    }
    this.submitting = true;
    this.moduleService
      .updateDeployments(inputs)
      .pipe(
        concatMap((job) =>
          this.utilService.checkJobStatus(
            job.id,
            this.transloco.translate<string>('deployments.editDeployment.updatingJob'),
            'module-manager',
            'deployments-update',
          ),
        ),
      )
      .subscribe({
        next: (jobResult) => {
          if (jobResult?.result) {
            this.utilService.presentJobResult(
              this.transloco.translate<string>('deployments.editDeployment.jobResultTitle'),
              mapDeploymentResults(jobResult.result),
              this.transloco.translate<string>('deployments.editDeployment.deploymentUpdated'),
            );
          }
          this.router.navigateByUrl('/modules');
        },
        error: (err) => {
          this.errorService.handleError(
            ShowModuleComponentComponent.name,
            'submit',
            err,
            this.transloco.translate<string>('deployments.editDeployment.updateFailed'),
          );
          this.submitting = false;
        },
      });
  }

  updatePending(): boolean {
    return this.modules.some((module) => module.deployment.module_version !== module.version);
  }

  titleKey(): string {
    return `deployments.editDeployment.title.${this.modules.length === 1 ? 'one' : 'other'}`;
  }

  descriptionKey(): string {
    return `deployments.editDeployment.description.${this.modules.length === 1 ? 'one' : 'other'}`;
  }

  cancel() {
    this.router.navigateByUrl('/modules');
  }
}
