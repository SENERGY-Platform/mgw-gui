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

import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
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

import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatFabButton, MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {Repository} from 'src/app/core/models/repositories';
import {AddRepositoryDialogComponent} from '../../components/add-repository-dialog/add-repository-dialog.component';

@Component({
    selector: 'repositories',
    templateUrl: './repositories.component.html',
    styleUrls: ['./repositories.component.css'],
    imports: [SpinnerComponent, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatIconButton, MatTooltip, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFabButton]
})
export class RepositoriesComponent implements OnInit {
  dataSource = new MatTableDataSource<Repository>();
  ready: Boolean = false;
  init: Boolean = true;
  displayColumns = ['source', 'type', 'priority', 'channels', 'delete']

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

  load() {
    this.ready = false
    this.moduleService.getRepositories().subscribe({
      next: (repositories) => {
        this.dataSource.data = repositories || []
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(RepositoriesComponent.name, "load", err, "Loading the repositories failed")
        this.ready = true
      }
    })
  }

  channelNames(repository: Repository): string {
    return (repository.Channels || []).map(channel => channel.Name).join(", ")
  }

  add() {
    this.dialog.open(AddRepositoryDialogComponent, {data: {}}).afterClosed().subscribe(result => {
      if (!result) {
        return
      }
      this.ready = false
      this.moduleService.createRepository(result.type, result.definition).pipe(
        // fetch the new repository's modules right away, otherwise it stays empty
        concatMap((_) => this.moduleService.refreshRepositories()),
        concatMap(job => this.utilService.checkJobStatus(job.id, "Fetching repository modules", "module-manager", "repositories-refresh"))
      ).subscribe({
        next: (_) => this.load(),
        error: (err) => {
          this.errorService.handleError(RepositoriesComponent.name, "add", err, "Adding the repository failed")
          this.load()
        }
      })
    })
  }

  delete(repository: Repository) {
    if (repository.Type === "host-dir") {
      this.errorService.handleError(RepositoriesComponent.name, "delete", new Error("The host directory repository is part of the core installation and cannot be removed."))
      return
    }
    this.utilService.askForConfirmation("Delete repository '" + repository.Source + "'? Its modules can no longer be installed or updated.").pipe(
      concatMap(confirmed => {
        if (!confirmed) {
          return of(null)
        }
        return this.moduleService.deleteRepository(repository.Source)
      })
    ).subscribe({
      next: (result) => {
        if (result !== null) {
          this.load()
        }
      },
      error: (err) => this.errorService.handleError(RepositoriesComponent.name, "delete", err, "Deleting the repository failed")
    })
  }
}
