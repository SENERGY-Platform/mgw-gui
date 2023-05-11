import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleManagerServiceService } from 'src/app/modules/module_management/services/module-manager/module-manager-service.service';
import { Deployment } from '../models/deployment_models';
import { ChangeDependenciesDialog } from './components/change-dependencies-dialog/change-dependencies-dialog';

@Component({
  selector: 'module-list',
  templateUrl: './module-list.component.html',
  styleUrls: ['./module-list.component.css']
})
export class ModuleListComponent implements OnInit{
  dataSource = new MatTableDataSource<Deployment>();
  selection = new SelectionModel<Deployment>(true, []);
  ready: Boolean = false;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['select', 'status', 'name', 'created', 'info', 'edit', 'start', 'stop', 'restart']
  
  constructor(public dialog: MatDialog, private moduleService: ModuleManagerServiceService, public utilsService: UtilService) {}

  ngOnInit(): void {
      this.loadDeployments();
  }

  ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = (row: Deployment, sortHeaderId: string) => {
      var value = (<any>row)[sortHeaderId];
      value = (typeof(value) === 'string') ? value.toUpperCase(): value;
      if(sortHeaderId == 'status') {
        value = row.stopped ? 0 : 1
      }
      return value
    };
    this.dataSource.sort = this.sort;
  }

  loadDeployments(): void {
    this.ready = false;
    this.moduleService.loadDeployments().subscribe(deployments => {
      this.dataSource.data = deployments;
      this.ready = true;
    })
  }

  askForDependencyAndSendControlRequest(deploymentID: string, status_change: string) {
    var dialogRef = this.dialog.open(ChangeDependenciesDialog, {data: {status_change: status_change}});
    dialogRef?.afterClosed().subscribe(result => {
      var changeDependency = result['changeDependency']

      if(status_change == "restart") {
        this.moduleService.controlDeployments(deploymentID, status_change, changeDependency).subscribe(result => {
          this.moduleService.controlDeployments(deploymentID, status_change, changeDependency).subscribe(result => {
            this.loadDeployments()
          })
        })
      } else {
        this.moduleService.controlDeployments(deploymentID, status_change, changeDependency).subscribe(result => {
          this.loadDeployments()
        })
      }
    
    })
  }

  restart(deploymentID: string) {
    this.askForDependencyAndSendControlRequest(deploymentID, "restart")
  }

  stop(deploymentID: string) {
    this.askForDependencyAndSendControlRequest(deploymentID, "stop")
  }

  start(deploymentID: string) {
    this.askForDependencyAndSendControlRequest(deploymentID, "start")
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSource.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
      if (this.isAllSelected()) {
          this.selectionClear();
      } else {
          this.dataSource.connect().value.forEach((row) => this.selection.select(row));
      }
  }

  selectionClear(): void {
      this.selection.clear();
  }

}
