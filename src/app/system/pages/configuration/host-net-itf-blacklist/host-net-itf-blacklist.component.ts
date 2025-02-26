import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {MatSort, MatSortHeader} from "@angular/material/sort";
import {MatTooltip} from "@angular/material/tooltip";
import {HostManagerService} from "../../../../core/services/host-manager/host-manager.service";
import {ErrorService} from "../../../../core/services/util/error.service";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {AddDialogComponent, DialogData} from "./add-dialog/add-dialog.component";

@Component({
  selector: 'app-host-net-itf-blacklist',
  standalone: true,
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
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle
  ],
  templateUrl: './host-net-itf-blacklist.component.html',
  styleUrl: './host-net-itf-blacklist.component.css'
})
export class HostNetItfBlacklistComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'delete'];
  dataSource = new MatTableDataSource<string>();

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private hostManagerService: HostManagerService,
    private errorService: ErrorService,
    private dialog: MatDialog
  ) {
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  ngOnInit(): void {
    this.getNetInterfaces()
  }

  getNetInterfaces(): void {
    this.hostManagerService.getBlacklistNetInterfaces().subscribe({
      next: items => {
        if (!items) {
          this.dataSource.data = []
        } else {
          this.dataSource.data = items
        }
      },
      error: err => {
        this.errorService.handleError(HostNetItfBlacklistComponent.name, "getNetInterfaces", err)
      }
    })
  }

  removeNetInterface(name: string): void {
    this.hostManagerService.removeBlacklistNetInterface(name).subscribe({
      next: res => {
        this.getNetInterfaces()
      },
      error: err => {
        this.errorService.handleError(HostNetItfBlacklistComponent.name, "removeNetInterface", err)
      }
    })
  }

  addNetInterface(): void {
    let addDialogRef: MatDialogRef<AddDialogComponent, DialogData> = this.dialog.open(AddDialogComponent);
    addDialogRef.afterClosed().subscribe(
      result => {
        if (result !== undefined && result !== null && result.name !== "") {
          this.hostManagerService.addBlacklistNetInterface(result.name).subscribe({
            next: res => {
              this.getNetInterfaces()
            },
            error: err => {
              this.errorService.handleError(HostNetItfBlacklistComponent.name, "addNetInterface", err)
            }
          })
        }
      }
    )
  }
}
