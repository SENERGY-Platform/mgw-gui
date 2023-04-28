import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModuleManagerServiceService } from 'src/app/modules/module_management/services/module-manager/module-manager-service.service';
import { Deployment } from '../models/deployment_models';
import { ChangeDependenciesDialog } from './components/change-dependencies-dialog/change-dependencies-dialog';

@Component({
  selector: 'module-list',
  templateUrl: './module-list.component.html',
  styleUrls: ['./module-list.component.css']
})
export class ModuleListComponent implements OnInit{
  deployments: Deployment[] = []

  constructor(public dialog: MatDialog, private moduleService: ModuleManagerServiceService) {}

  ngOnInit(): void {
      this.moduleService.loadDeployments().subscribe(deployments => {
        this.deployments = deployments
      })
  }

  askForDependencyAndSendControlRequest(deploymentID: string, status_change: string) {
    var dialogRef = this.dialog.open(ChangeDependenciesDialog, {data: {status_change: status_change}});
    dialogRef?.afterClosed().subscribe(result => {
      var changeDependency = result['changeDependency']

      if(status_change == "restart") {
        this.moduleService.controlDeployments(deploymentID, status_change, changeDependency).subscribe(result => {
          this.moduleService.controlDeployments(deploymentID, status_change, changeDependency)
        })
      } else {
        this.moduleService.controlDeployments(deploymentID, status_change, changeDependency)
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
}
