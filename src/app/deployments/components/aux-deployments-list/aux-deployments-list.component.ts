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

import {Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
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
  ],
})
export class AuxDeploymentsListComponent implements OnInit, OnDestroy {
  @Input() deploymentID = '';

  dataSource = new MatTableDataSource<AuxDeployment>();
  ready = false;
  interval: any;
  displayColumns = ['status', 'name', 'reference', 'image', 'updated'];

  constructor(
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    private errorService: ErrorService,
  ) {}

  ngOnInit(): void {
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
            'Loading the auxiliary deployments failed',
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
        return 'Running';
      case 'unhealthy':
        return 'Unhealthy';
      default:
        return 'Disabled';
    }
  }

  // the pill carries the coarse state, the tooltip the engine's own wording
  statusDetail(aux: AuxDeployment): string {
    if (!aux.enabled) {
      return 'Disabled';
    }
    return [aux.container?.state || 'container missing', aux.container?.health].filter(Boolean).join(' · ');
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
