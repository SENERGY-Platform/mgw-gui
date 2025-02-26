import {AfterViewInit, Component, Inject, inject, OnInit, ViewChild} from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatSort, MatSortHeader, MatSortModule} from "@angular/material/sort";
import {AppResponse, HostManagerService} from "../../../../core/services/host-manager/host-manager.service";
import {ErrorService} from "../../../../core/services/util/error.service";
import {MatIcon} from "@angular/material/icon";
import {MatTooltip} from "@angular/material/tooltip";
import {AddDialogComponent, DialogData} from "./add-dialog/add-dialog.component";
import {MatIconButton} from "@angular/material/button";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-host-applications',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
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
    MatTooltip
  ],
  templateUrl: './host-applications.component.html',
  styleUrl: './host-applications.component.css'
})
export class HostApplicationsComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'path', 'delete'];
  dataSource = new MatTableDataSource<AppResponse>();

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
    this.getApplications()
  }

  getApplications(): void {
    this.hostManagerService.getApplications().subscribe({
      next: apps => {
        if (!apps) {
          this.dataSource.data = []
        } else {
          this.dataSource.data = apps
        }
      },
      error: err => {
        this.errorService.handleError(HostApplicationsComponent.name, "loadApplications", err)
      }
    })
  }

  removeApplication(id: string): void {
    this.hostManagerService.removeApplication(id).subscribe({
      next: res => {
        this.getApplications()
      },
      error: err => {
        this.errorService.handleError(HostApplicationsComponent.name, "removeApplication", err)
      }
    })
  }

  addApplication(): void {
    let addDialogRef: MatDialogRef<AddDialogComponent, DialogData> = this.dialog.open(AddDialogComponent);
    addDialogRef.afterClosed().subscribe(
      result => {
        if (result !== undefined && result !== null && result.name !== "" && result.socket !== "") {
          this.hostManagerService.addApplication(result).subscribe({
            next: res => {
              this.getApplications()
            },
            error: err => {
              this.errorService.handleError(HostApplicationsComponent.name, "addApplication", err)
            }
          })
        }
      }
    )
  }
}
