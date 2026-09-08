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

import {Component, Inject, inject, OnInit} from '@angular/core';
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
  MatTableDataSource,
} from '@angular/material/table';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {concatMap, of} from 'rxjs';

import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {EmptyStateComponent} from 'src/app/core/components/empty-state/empty-state.component';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {Repository} from 'src/app/core/models/repositories';
import {mapRepositoryRefreshResult} from 'src/app/core/models/job-result-view';
import {AddRepositoryDialogComponent} from '../../components/add-repository-dialog/add-repository-dialog.component';

@Component({
  selector: 'repositories',
  templateUrl: './repositories.component.html',
  styleUrls: ['./repositories.component.css'],
  imports: [
    SpinnerComponent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatButton,
    PageHeaderComponent,
    EmptyStateComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('modules')],
})
export class RepositoriesComponent implements OnInit {
  dataSource = new MatTableDataSource<Repository>();
  ready = false;
  init = true;
  displayColumns = ['source', 'priority', 'channels', 'actions'];

  // Field injection, not a constructor parameter: new dependencies follow
  // the prefer-inject rule; the parameters above predate it.
  private readonly transloco = inject(TranslocoService);

  constructor(
    public dialog: MatDialog,
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    private errorService: ErrorService,
    private utilService: UtilService,
  ) {}

  private translate(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate<string>(key, params);
  }

  ngOnInit(): void {
    this.load();
    this.init = false;
  }

  load() {
    this.ready = false;
    this.moduleService.getRepositories().subscribe({
      next: (repositories) => {
        this.dataSource.data = repositories || [];
        this.ready = true;
      },
      error: (err) => {
        this.errorService.handleError(
          RepositoriesComponent.name,
          'load',
          err,
          this.translate('modules.repositories.errors.loadFailed'),
        );
        this.ready = true;
      },
    });
  }

  channelNames(repository: Repository): string {
    return (repository.channels || []).map((channel) => channel.name).join(', ');
  }

  // The core sets read_only on the repositories it provides. The host-dir
  // fallback covers a core from before the flag, where the field is absent
  // and host-dir would otherwise offer a delete that only ever errors.
  isReadOnly(repository: Repository): boolean {
    return repository.read_only === true || repository.type === 'host-dir';
  }

  add() {
    this.dialog
      .open(AddRepositoryDialogComponent, {data: {}})
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        // The create call answers without naming the repository it made, so
        // the source is whatever the list gained. Refreshing all of them
        // instead would hit GitHub once per repository and run into its rate
        // limit on a gateway with a handful of them.
        const known = new Set(this.dataSource.data.map((repository) => repository.source));
        this.ready = false;
        this.moduleService
          .createRepository(result.type, result.definition)
          .pipe(
            concatMap((_) => this.moduleService.getRepositories()),
            concatMap((repositories) => {
              const added = (repositories || [])
                .map((repository) => repository.source)
                .filter((source) => !known.has(source));
              // no new source means the repository was already configured;
              // then there is nothing to single out and all of them refresh
              return this.moduleService.refreshRepositories(added.length > 0 ? added : undefined);
            }),
            concatMap((job) =>
              this.utilService.checkJobStatus(
                job.id,
                this.translate('modules.repositories.jobs.fetchingModules'),
                'module-manager',
                'repositories-refresh',
              ),
            ),
          )
          .subscribe({
            next: (jobResult) => {
              // the job itself succeeds even when a repository failed to
              // refresh, so its result decides whether there is an error
              if (jobResult?.result) {
                this.utilService.presentJobResult(
                  this.translate('modules.repositories.repositoryRefresh'),
                  mapRepositoryRefreshResult(jobResult.result),
                );
              }
              this.load();
            },
            error: (err) => {
              this.errorService.handleError(
                RepositoriesComponent.name,
                'add',
                err,
                this.translate('modules.repositories.errors.addFailed'),
              );
              this.load();
            },
          });
      });
  }

  delete(repository: Repository) {
    if (this.isReadOnly(repository)) {
      this.errorService.handleError(
        RepositoriesComponent.name,
        'delete',
        new Error(this.translate('modules.repositories.notRemovable')),
      );
      return;
    }
    this.utilService
      .askForConfirmation(this.translate('modules.repositories.confirmDelete', {source: repository.source}))
      .pipe(
        concatMap((confirmed) => {
          if (!confirmed) {
            return of(null);
          }
          return this.moduleService.deleteRepository(repository.source);
        }),
      )
      .subscribe({
        next: (result) => {
          if (result !== null) {
            this.load();
          }
        },
        error: (err) =>
          this.errorService.handleError(
            RepositoriesComponent.name,
            'delete',
            err,
            this.translate('modules.repositories.errors.deleteFailed'),
          ),
      });
  }
}
