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

import {Component, OnInit, ViewChild} from '@angular/core';
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
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MatTooltip} from '@angular/material/tooltip';
import {HostManagerService} from '../../../../core/services/host-manager/host-manager.service';
import {ErrorService} from '../../../../core/services/util/error.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {AddDialogComponent, DialogData} from './add-dialog/add-dialog.component';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';

@Component({
  selector: 'app-host-net-itf-blacklist',
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatRow,
    MatRowDef,
    MatSort,
    MatSortHeader,
    MatTable,
    MatTooltip,
    MatHeaderCellDef,
    MatButton,
    TranslocoPipe,
  ],
  templateUrl: './host-net-itf-blacklist.component.html',
  styleUrl: './host-net-itf-blacklist.component.css',
  providers: [provideTranslocoScope('system')],
})
export class HostNetItfBlacklistComponent implements OnInit {
  displayedColumns: string[] = ['name', 'actions'];
  dataSource = new MatTableDataSource<string>();

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
    this.getNetInterfaces();
  }

  getNetInterfaces(): void {
    this.hostManagerService.getBlacklistNetInterfaces().subscribe({
      next: (items) => {
        if (!items) {
          this.dataSource.data = [];
        } else {
          this.dataSource.data = items;
        }
      },
      error: (err) => {
        this.errorService.handleError(HostNetItfBlacklistComponent.name, 'getNetInterfaces', err);
      },
    });
  }

  removeNetInterface(name: string): void {
    this.hostManagerService.removeBlacklistNetInterface(name).subscribe({
      next: (res) => {
        this.getNetInterfaces();
      },
      error: (err) => {
        this.errorService.handleError(HostNetItfBlacklistComponent.name, 'removeNetInterface', err);
      },
    });
  }

  addNetInterface(): void {
    const addDialogRef: MatDialogRef<AddDialogComponent, DialogData> = this.dialog.open(AddDialogComponent);
    addDialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined && result !== null && result.name !== '') {
        this.hostManagerService.addBlacklistNetInterface(result.name).subscribe({
          next: (res) => {
            this.getNetInterfaces();
          },
          error: (err) => {
            this.errorService.handleError(HostNetItfBlacklistComponent.name, 'addNetInterface', err);
          },
        });
      }
    });
  }
}
