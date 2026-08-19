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
import {MatDialog} from '@angular/material/dialog';
import {MatSort, MatSortHeader} from '@angular/material/sort';
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
  MatTableDataSource
} from '@angular/material/table';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {concatMap, of} from 'rxjs';
import {NgIf} from '@angular/common';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatFabButton, MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {
  DATA_TYPE_LABELS,
  formatConfigValue,
  GlobalConfig,
  GlobalConfigInput
} from 'src/app/core/models/global-configs';
import {GlobalConfigDialogComponent} from '../../components/global-config-dialog/global-config-dialog.component';

@Component({
  selector: 'global-configs',
  templateUrl: './global-configs.component.html',
  styleUrls: ['./global-configs.component.css'],
  standalone: true,
  imports: [NgIf, SpinnerComponent, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatIconButton, MatTooltip, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFabButton]
})
export class GlobalConfigsComponent implements OnInit {
  dataSource = new MatTableDataSource<GlobalConfig>();
  ready: Boolean = false;
  init: Boolean = true;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['name', 'type', 'value', 'id', 'edit', 'delete']

  constructor(
    public dialog: MatDialog,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
    private errorService: ErrorService,
    private utilService: UtilService
  ) {
  }

  ngOnInit(): void {
    this.load()
    this.init = false
  }

  ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = (row: GlobalConfig, sortHeaderId: string) => {
      var value = (<any>row)[sortHeaderId];
      value = (typeof (value) === 'string') ? value.toUpperCase() : value;
      return value
    };
    this.dataSource.sort = this.sort;
  }

  load() {
    this.ready = false
    this.moduleService.getGlobalConfigs().subscribe({
      next: (configs) => {
        this.dataSource.data = Object.values(configs || {})
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(GlobalConfigsComponent.name, "load", err, "Loading the global configs failed")
        this.ready = true
      }
    })
  }

  typeLabel(config: GlobalConfig): string {
    var label = DATA_TYPE_LABELS[config.data_type] || "unknown"
    return config.is_slice ? label + " list" : label
  }

  valuePreview(config: GlobalConfig): string {
    var value = formatConfigValue(config).replace(/\n/g, ", ")
    return value.length > 60 ? value.slice(0, 60) + "…" : value
  }

  add() {
    this.dialog.open(GlobalConfigDialogComponent, {data: {}}).afterClosed().subscribe((input: GlobalConfigInput | undefined) => {
      if (!input) {
        return
      }
      this.moduleService.createGlobalConfig(input).subscribe({
        next: (_) => this.load(),
        error: (err) => this.errorService.handleError(GlobalConfigsComponent.name, "add", err, "Creating the global config failed")
      })
    })
  }

  edit(config: GlobalConfig) {
    this.dialog.open(GlobalConfigDialogComponent, {data: {config: config}}).afterClosed().subscribe((input: GlobalConfigInput | undefined) => {
      if (!input) {
        return
      }
      this.moduleService.updateGlobalConfig(config.id, input).subscribe({
        next: (_) => this.load(),
        error: (err) => this.errorService.handleError(GlobalConfigsComponent.name, "edit", err, "Saving the global config failed")
      })
    })
  }

  delete(config: GlobalConfig) {
    this.utilService.askForConfirmation("Delete global config '" + config.name + "'? Deployments referencing it will lose the value.").pipe(
      concatMap(confirmed => {
        if (!confirmed) {
          return of(null)
        }
        return this.moduleService.deleteGlobalConfig(config.id)
      })
    ).subscribe({
      next: (result) => {
        if (result !== null) {
          this.load()
        }
      },
      error: (err) => this.errorService.handleError(GlobalConfigsComponent.name, "delete", err, "Deleting the global config failed")
    })
  }
}
