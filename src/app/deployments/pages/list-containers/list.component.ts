import {HttpErrorResponse} from '@angular/common/http';
import {Component, Inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {concatMap, map, of} from 'rxjs';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {Container, SubDeploymentContainer} from '../../../container/models/container';
import {NgIf} from '@angular/common';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'container-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [NgIf, SpinnerComponent, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatIconButton, MatTooltip, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
export class ListContainersComponent implements OnDestroy, OnInit {
  dataSource = new MatTableDataSource<Container | SubDeploymentContainer>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns: string[] = []
  @Input() deploymentID!: string
  @Input() subDeploymentID = ""
  @Input() fromSubDeployment = false;

  constructor(
    public dialog: MatDialog,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
    public utilsService: UtilService,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.startPeriodicLoad();
    this.setupColumns()
    this.loadContainers().subscribe({
      next: (_) => {
        this.ready = true
        this.init = false;
      },
      error: (_) => {
        this.ready = true
        this.init = false;
      }
    })
  }

  setupColumns() {
    const columns = ["status", "alias"]
    if (!this.fromSubDeployment) {
      columns.push("ref")
    }
    columns.push("state")
    columns.push("logs")
    this.displayColumns = columns;
  }

  startPeriodicLoad() {
    this.interval = setInterval(() => {
      this.loadContainers();
    }, 5000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.interval)
  }

  loadContainers() {
    if (this.fromSubDeployment) {
      return this.loadSubDeploymentContainer()
    } else {
      return this.loadParentContainers()
    }
  }

  loadParentContainers() {
    var obs = this.moduleService.loadDeployment(this.deploymentID, true, false)
    return obs.pipe(
      map((deployment) => {
        var containers = []
        if (!!deployment.containers) {
          for (const [_, container] of Object.entries(deployment.containers)) {
            containers.push(container)
          }
        }

        this.dataSource.data = containers
        return of(null);
      })
    )
  }

  loadSubDeploymentContainer() {
    var obs = this.moduleService.getSubDeployment(this.deploymentID, this.subDeploymentID)
    return obs.pipe(
      map((deployment) => {
        this.dataSource.data = [deployment.container]
        return of(null);
      })
    )
  }

  showLogs(containerID: string) {
    this.router.navigate(["/containers/" + containerID + "/logs"])
  }

}
