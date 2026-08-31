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
