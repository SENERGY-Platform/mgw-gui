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
  selector: 'app-host-net-rng-blacklist',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
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
    MatHeaderCellDef
  ],
  templateUrl: './host-net-rng-blacklist.component.html',
  styleUrl: './host-net-rng-blacklist.component.css'
})
export class HostNetRngBlacklistComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['range', 'delete'];
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
    this.getNetRanges()
  }

  getNetRanges(): void {
    this.hostManagerService.getBlacklistNetRanges().subscribe({
      next: items => {
        if (!items) {
          this.dataSource.data = []
        } else {
          this.dataSource.data = items
        }
      },
      error: err => {
        this.errorService.handleError(HostNetRngBlacklistComponent.name, "getNetRanges", err)
      }
    })
  }

  removeNetRange(range: string): void {
    this.hostManagerService.removeBlacklistNetRange(range).subscribe({
      next: res => {
        this.getNetRanges()
      },
      error: err => {
        this.errorService.handleError(HostNetRngBlacklistComponent.name, "removeNetRange", err)
      }
    })
  }

  addNetInterface(): void {
    let addDialogRef: MatDialogRef<AddDialogComponent, DialogData> = this.dialog.open(AddDialogComponent);
    addDialogRef.afterClosed().subscribe(
      result => {
        if (result !== undefined && result !== null && result.range !== "") {
          this.hostManagerService.addBlacklistNetRanges(result.range).subscribe({
            next: res => {
              this.getNetRanges()
            },
            error: err => {
              this.errorService.handleError(HostNetRngBlacklistComponent.name, "addNetInterface", err)
            }
          })
        }
      }
    )
  }
}
