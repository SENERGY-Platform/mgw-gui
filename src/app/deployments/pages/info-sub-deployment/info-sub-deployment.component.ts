import { Component, Inject } from '@angular/core';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';
import { ActivatedRoute } from '@angular/router';
import { concatMap, map } from 'rxjs';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { AuxDeployment } from '../../models/sub-deployments';

@Component({
  selector: 'app-info-sub-deployment',
  templateUrl: './info-sub-deployment.component.html',
  styleUrls: ['./info-sub-deployment.component.css']
})
export class InfoSubDeploymentComponent {
  deploymentID = ''
  subDeploymentID = ''
  subDeployment: AuxDeployment = {name: "", id: "", configs: {}, labels: {}, volumes: {}, dep_id: "", enabled: true, created: new Date(), updated: new Date(), container: {id: "", alias: "", info: {image_id: "", state: ""}}, run_config: {command: "", pseudo_tty: true}, image: "", ref: ""} 
  objectKeys = Object.keys 
  ready = false

  constructor(
    private route: ActivatedRoute,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
  ) {
    this.route.params.pipe(
      concatMap(params => {
        this.subDeploymentID = params['subDeploymentID']
        this.deploymentID = params['deploymentID']
        return this.loadDeployment()
      })
    ).subscribe({
      next: (_) => {
        this.ready = true;
      },
      error: (_) => {
        this.ready = true;
      }
    })
  }

  loadDeployment() {
    return this.moduleService.getSubDeployment(this.deploymentID, this.subDeploymentID).pipe(
      map(deployment => {
        this.subDeployment = deployment
      })
    )
  }
}
