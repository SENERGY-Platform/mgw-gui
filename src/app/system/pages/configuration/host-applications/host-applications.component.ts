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

import {Component, Inject, inject, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material/button';
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
import {MatSort, MatSortHeader, MatSortModule} from '@angular/material/sort';
import {AppResponse, HostManagerService} from '../../../../core/services/host-manager/host-manager.service';
import {ErrorService} from '../../../../core/services/util/error.service';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {AddDialogComponent, DialogData} from './add-dialog/add-dialog.component';
import {MatIconButton} from '@angular/material/button';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';

@Component({
  selector: 'app-host-applications',
  imports: [
    MatButton,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCell,
    MatSortHeader,
    MatSortModule,
    MatCell,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatIcon,
    MatIconButton,
    MatTooltip,
    TranslocoPipe,
  ],
  templateUrl: './host-applications.component.html',
  styleUrl: './host-applications.component.css',
  providers: [provideTranslocoScope('system')],
})
export class HostApplicationsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'path', 'actions'];
  dataSource = new MatTableDataSource<AppResponse>();

  // Set through a setter rather than in the view hook: the table renders
  // behind a condition, so that hook runs before it exists and @ViewChild
  // stays empty - which leaves the rows in whatever order the API sent.
  @ViewChild(MatSort) set tableSort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor(
    private hostManagerService: HostManagerService,
    private errorService: ErrorService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.getApplications();
  }

  getApplications(): void {
    this.hostManagerService.getApplications().subscribe({
      next: (apps) => {
        if (!apps) {
          this.dataSource.data = [];
        } else {
          this.dataSource.data = apps;
        }
      },
      error: (err) => {
        this.errorService.handleError(HostApplicationsComponent.name, 'loadApplications', err);
      },
    });
  }

  removeApplication(id: string): void {
    this.hostManagerService.removeApplication(id).subscribe({
      next: (res) => {
        this.getApplications();
      },
      error: (err) => {
        this.errorService.handleError(HostApplicationsComponent.name, 'removeApplication', err);
      },
    });
  }

  addApplication(): void {
    const addDialogRef: MatDialogRef<AddDialogComponent, DialogData> = this.dialog.open(AddDialogComponent);
    addDialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined && result !== null && result.name !== '' && result.socket !== '') {
        this.hostManagerService.addApplication(result).subscribe({
          next: (res) => {
            this.getApplications();
          },
          error: (err) => {
            this.errorService.handleError(HostApplicationsComponent.name, 'addApplication', err);
          },
        });
      }
    });
  }
}
