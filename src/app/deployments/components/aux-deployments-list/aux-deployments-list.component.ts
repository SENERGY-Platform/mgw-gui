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

import {Component, Inject, inject, Input, OnDestroy, OnInit} from '@angular/core';
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
import {DatePipe} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {SpinnerComponent} from 'src/app/core/components/spinner/spinner.component';
import {AuxDeployment} from 'src/app/core/models/aux-deployments';
import {StatusPillComponent, StatusTone} from 'src/app/core/components/status-pill/status-pill.component';

// Read-only list of the auxiliary deployments a running module has spawned.
// The management API deliberately has no write operations for them - those
// live under /restricted and belong to the modules themselves.
@Component({
  selector: 'aux-deployments-list',
  templateUrl: './aux-deployments-list.component.html',
  styleUrls: ['./aux-deployments-list.component.css'],
  imports: [
    DatePipe,
    SpinnerComponent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatTooltip,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    StatusPillComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('deployments')],
})
export class AuxDeploymentsListComponent implements OnInit, OnDestroy {
  @Input() deploymentID = '';

  dataSource = new MatTableDataSource<AuxDeployment>();
  ready = false;
  interval: any;
  displayColumns = ['status', 'name', 'reference', 'image', 'updated'];

  // Field injection, not a constructor parameter: new dependencies follow
  // the prefer-inject rule; the parameters above predate it.
  private readonly transloco = inject(TranslocoService);

  constructor(
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    private errorService: ErrorService,
  ) {}

  ngOnInit(): void {
    // A module that was never deployed carries an empty deployment id, and
    // the request would ask the gateway for /deployments//auxiliary/... -
    // a 404, repeated every five seconds. There is nothing to list either
    // way, so say so and stay quiet.
    if (!this.deploymentID) {
      this.ready = true;
      return;
    }
    this.load(false);
    this.interval = setInterval(() => this.load(true), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  load(background: boolean) {
    this.moduleService.getAuxDeployments(this.deploymentID).subscribe({
      next: (auxDeployments) => {
        this.dataSource.data = Object.values(auxDeployments || {});
        this.ready = true;
      },
      error: (err) => {
        if (!background) {
          this.errorService.handleError(
            AuxDeploymentsListComponent.name,
            'load',
            err,
            this.transloco.translate<string>('deployments.auxDeployments.loadFailed'),
          );
        }
        this.ready = true;
      },
    });
  }

  statusTone(aux: AuxDeployment): StatusTone {
    switch (this.statusOf(aux)) {
      case 'healthy':
        return 'ok';
      case 'unhealthy':
        return 'danger';
      default:
        return 'idle';
    }
  }

  statusLabel(aux: AuxDeployment): string {
    switch (this.statusOf(aux)) {
      case 'healthy':
        return 'deployments.auxDeployments.statuses.running';
      case 'unhealthy':
        return 'deployments.auxDeployments.statuses.unhealthy';
      default:
        return 'deployments.auxDeployments.statuses.disabled';
    }
  }

  // the pill carries the coarse state, the tooltip the engine's own wording
  statusDetail(aux: AuxDeployment): string {
    if (!aux.enabled) {
      return this.transloco.translate<string>('deployments.auxDeployments.statuses.disabled');
    }
    return [
      aux.container?.state || this.transloco.translate<string>('deployments.auxDeployments.containerMissing'),
      aux.container?.health,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  statusOf(aux: AuxDeployment): string {
    if (!aux.enabled) {
      return 'disabled';
    }
    if (aux.container?.state === 'running') {
      return aux.container?.health === 'unhealthy' ? 'unhealthy' : 'healthy';
    }
    return 'unhealthy';
  }
}
